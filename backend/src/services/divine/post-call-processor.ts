import { logger } from '../../utils/logger';
import { customerService } from './customer.service';
import { conversationService, TranscriptEntry } from './conversation.service';
import { claudeService } from './claude.service';
import { prismService, PRISMAnalysis } from './prism.service';
import { messageQueueService } from './message-queue.service';
import { zohoCRMService } from './zoho-crm.service';
import { slackService } from './slack.service';
import { reminderSchedulerService } from './reminder-scheduler.service';
import { nurtureSequenceService } from './nurture-sequence.service';
import { alertingService } from './alerting.service';

export interface PostCallData {
  callId: string;
  clientId: string;
  phone: string;
  transcript: TranscriptEntry[];
  summary?: string;
  durationMs?: number;
  callStatus: string;
  callOutcome?: string;
  businessName?: string;
}

export class PostCallProcessor {
  async process(data: PostCallData): Promise<void> {
    const startTime = Date.now();
    logger.info({ callId: data.callId, clientId: data.clientId }, 'Starting post-call processing');

    try {
      // 1. Get or create customer
      const customer = await customerService.getOrCreate(data.clientId, data.phone);

      // 2. Build transcript text
      const transcriptText = data.transcript
        .map((t) => `${t.role === 'agent' ? 'AI' : 'Customer'}: ${t.content}`)
        .join('\n');

      // 3. Analyze with Claude AI (intent classification)
      let intent = 'other';
      let entities: Record<string, string> = {};

      if (claudeService.isConfigured() && transcriptText) {
        try {
          const classification = await claudeService.classifyIntent(transcriptText);
          intent = classification.intent;
          entities = classification.entities;
        } catch (error) {
          logger.error({ error, callId: data.callId }, 'Intent classification failed');
        }
      }

      // 4. PRISM behavioral analysis
      const prismAnalysis = prismService.analyzeTranscript(transcriptText);

      // 5. Update customer PRISM scores
      await customerService.updatePRISMScores(customer.id, prismAnalysis.scores);
      await customerService.incrementCallCount(customer.id);

      // 6. Update conversation record
      await conversationService.endConversation(data.callId, {
        status: data.callStatus,
        durationMs: data.durationMs,
        transcript: data.transcript,
        summary: data.summary,
        intent,
        sentiment: this.determineSentiment(transcriptText),
        extractedData: { entities },
      });

      // 7. Sync to CRM if configured
      if (zohoCRMService.isConfigured()) {
        try {
          await this.syncToCRM(data, customer, intent, entities, prismAnalysis);
        } catch (error) {
          logger.error({ error, callId: data.callId }, 'CRM sync failed');

          // Alert via multi-channel alerting service
          await alertingService.error(
            'CRM Sync Failed',
            `Lead sync failed for call ${data.callId}. Customer: ${data.phone}`,
            {
              clientId: data.clientId,
              callId: data.callId,
              error: error instanceof Error ? error : new Error(String(error)),
            }
          );

          // Continue processing - graceful degradation per REQ-006
        }
      }

      // 8. Determine follow-up based on booking status and intent
      const appointmentBooked = this.detectAppointmentBooked(entities, data.summary);

      if (appointmentBooked && entities['appointment_time']) {
        // Booking confirmed - schedule reminders and send confirmation
        const appointmentTime = this.parseAppointmentTime(entities['appointment_time']);
        if (appointmentTime) {
          // Generate appointment ID from callId for tracking
          const appointmentId = `${data.callId}-appt`;

          await reminderSchedulerService.scheduleAppointmentReminders({
            clientId: data.clientId,
            customerId: customer.id,
            customerPhone: data.phone,
            customerEmail: customer.email || undefined,
            customerName: customer.name || undefined,
            appointmentTime,
            appointmentId,
            appointmentType: entities['appointment_type'],
            businessName: data.businessName || 'Our team',
          });

          // Send immediate confirmation SMS (24/7, no business hours check)
          await this.sendBookingConfirmation(data, customer.id, customer.name || undefined);
          logger.info({ callId: data.callId, appointmentTime }, 'Booking confirmed, reminders scheduled');
        }
      } else if (this.shouldSendNurture(intent)) {
        // Non-booking but interested caller - schedule nurture sequence
        await nurtureSequenceService.scheduleNurtureSequence({
          clientId: data.clientId,
          customerId: customer.id,
          customerPhone: data.phone,
          customerEmail: customer.email || undefined,
          customerName: customer.name || undefined,
          callSummary: data.summary || '',
          intent,
          businessName: data.businessName || 'Our team',
          dominantNeed: prismAnalysis.dominantNeeds?.[0],
        });
        logger.info({ callId: data.callId, intent }, 'Non-booking call, nurture sequence scheduled');
      } else if (this.shouldSendFollowUp(intent, data.callOutcome)) {
        // Generic follow-up for other intents
        await this.queueFollowUp(data, customer.id, customer.email || undefined, customer.name || undefined);
      }

      const processingTime = Date.now() - startTime;
      logger.info(
        { callId: data.callId, processingTime, intent },
        'Post-call processing completed'
      );
    } catch (error) {
      logger.error({ error, callId: data.callId }, 'Post-call processing failed');

      await slackService.sendError('Post-Call Processing Failed', `Call ID: ${data.callId}`, {
        clientId: data.clientId,
        callId: data.callId,
        error: error instanceof Error ? error : new Error('Unknown error'),
      });
    }
  }

  private shouldSendFollowUp(intent: string, outcome?: string): boolean {
    const followUpIntents = [
      'booking_request',
      'information_inquiry',
      'pricing_question',
      'callback_request',
    ];

    return followUpIntents.includes(intent) || outcome === 'interested';
  }

  private async queueFollowUp(
    data: PostCallData,
    customerId: string,
    email?: string,
    customerName?: string
  ): Promise<void> {
    if (!claudeService.isConfigured()) {
      return;
    }

    try {
      // Generate follow-up message
      const smsContent = await claudeService.generateFollowUp(
        {
          customerName,
          intent: 'follow_up',
          summary: data.summary || 'Thank you for your call',
          businessName: data.businessName || 'Our team',
        },
        'sms'
      );

      await messageQueueService.enqueueSMS(data.clientId, data.phone, smsContent.body, {
        customerId,
        metadata: { callId: data.callId, type: 'post_call_followup' },
      });

      // Also send email if available
      if (email) {
        const emailContent = await claudeService.generateFollowUp(
          {
            customerName,
            intent: 'follow_up',
            summary: data.summary || 'Thank you for your call',
            businessName: data.businessName || 'Our team',
          },
          'email'
        );

        await messageQueueService.enqueueEmail(
          data.clientId,
          email,
          emailContent.subject || 'Following up on your call',
          emailContent.body,
          {
            customerId,
            metadata: { callId: data.callId, type: 'post_call_followup' },
          }
        );
      }

      logger.info({ callId: data.callId }, 'Follow-up messages queued');
    } catch (error) {
      logger.error({ error, callId: data.callId }, 'Failed to queue follow-up');
    }
  }

  private determineSentiment(transcript: string): string {
    const lower = transcript.toLowerCase();

    const positiveWords = ['thank', 'great', 'perfect', 'excellent', 'happy', 'love', 'appreciate'];
    const negativeWords = ['angry', 'upset', 'frustrated', 'terrible', 'horrible', 'hate', 'awful'];

    let positiveCount = 0;
    let negativeCount = 0;

    for (const word of positiveWords) {
      if (lower.includes(word)) positiveCount++;
    }

    for (const word of negativeWords) {
      if (lower.includes(word)) negativeCount++;
    }

    if (positiveCount > negativeCount + 1) return 'positive';
    if (negativeCount > positiveCount + 1) return 'negative';
    return 'neutral';
  }

  /**
   * Sync customer and call data to CRM with enhanced field mapping.
   * Per 05-RESEARCH.md: Include appointment data, customer details, PRISM scores.
   */
  private async syncToCRM(
    data: PostCallData,
    customer: { id: string; name?: string | null; email?: string | null; crmId?: string | null },
    intent: string,
    entities: Record<string, string>,
    prismAnalysis: PRISMAnalysis
  ): Promise<void> {
    // Build lead data with customer details
    const leadData: {
      leadSource: string;
      description: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      customFields?: Record<string, unknown>;
    } = {
      leadSource: 'Voice AI',
      description: `Last call: ${data.summary || 'No summary'}`,
    };

    // Add customer name if available
    if (customer.name) {
      const nameParts = customer.name.split(' ');
      leadData.firstName = nameParts[0];
      if (nameParts.length > 1) {
        leadData.lastName = nameParts.slice(1).join(' ');
      }
    }

    // Add email if available
    if (customer.email) {
      leadData.email = customer.email;
    }

    // Add custom fields for CRM
    leadData.customFields = {
      Last_Intent: intent,
      Total_Calls: (customer as { totalCalls?: number }).totalCalls || 1,
    };

    // Add dominant PRISM need if detected
    if (prismAnalysis.dominantNeeds && prismAnalysis.dominantNeeds.length > 0) {
      leadData.customFields.PRISM_Dominant = prismAnalysis.dominantNeeds[0];
    }

    // Get or create lead
    const lead = await zohoCRMService.getOrCreateByPhone(data.phone, leadData);

    // Build comprehensive note content
    const noteContent: string[] = [
      `Call Summary:`,
      data.summary || 'No summary available',
      '',
      `Intent: ${intent}`,
      `Duration: ${Math.round((data.durationMs || 0) / 1000)}s`,
    ];

    // Add appointment info if booked
    if (entities['appointment_time']) {
      noteContent.push('');
      noteContent.push('--- Appointment Details ---');
      noteContent.push(`Scheduled: ${entities['appointment_time']}`);
      if (entities['appointment_type']) {
        noteContent.push(`Type: ${entities['appointment_type']}`);
      }
    }

    // Add PRISM behavioral insights
    if (prismAnalysis.dominantNeeds && prismAnalysis.dominantNeeds.length > 0) {
      noteContent.push('');
      noteContent.push('--- Behavioral Insights ---');
      noteContent.push(`Dominant needs: ${prismAnalysis.dominantNeeds.join(', ')}`);
    }

    await zohoCRMService.addNote(
      lead.id,
      noteContent.join('\n'),
      `Voice AI Call - ${new Date().toLocaleDateString()}`
    );

    // Update customer with CRM ID if not already linked
    if (!customer.crmId) {
      await customerService.update(customer.id, {
        crmId: lead.id,
        crmProvider: 'zoho',
      });
    }

    logger.info({ callId: data.callId, leadId: lead.id }, 'CRM sync completed');
  }

  /**
   * Detect if an appointment was booked during the call
   * Checks entities for appointment_time and summary for booking phrases
   */
  private detectAppointmentBooked(entities: Record<string, string>, summary?: string): boolean {
    // Check if appointment_time entity was extracted
    if (entities['appointment_time']) {
      return true;
    }

    // Check summary for booking confirmation phrases
    if (summary) {
      const lower = summary.toLowerCase();
      const bookingPhrases = [
        'appointment booked',
        'booked for',
        'scheduled for',
        'appointment confirmed',
        'booking confirmed',
        'see you on',
        'appointment is set',
      ];

      return bookingPhrases.some((phrase) => lower.includes(phrase));
    }

    return false;
  }

  /**
   * Determine if a non-booking call should receive nurture sequence
   * Nurture is for potentially interested callers who didn't book
   */
  private shouldSendNurture(intent: string): boolean {
    const nurtureIntents = [
      'booking_request',     // Asked about booking but didn't complete
      'pricing_question',    // Interested enough to ask about price
      'information_inquiry', // Researching, might convert later
      'sales_opportunity',   // Clearly interested but not ready
    ];

    return nurtureIntents.includes(intent);
  }

  /**
   * Send immediate booking confirmation SMS (24/7, no business hours restriction)
   * Per CONTEXT.md: Confirmations send anytime 24/7
   */
  private async sendBookingConfirmation(
    data: PostCallData,
    customerId: string,
    customerName?: string
  ): Promise<void> {
    const bookingLink = 'https://smarttaxnation.com/book';
    const portalLink = 'https://smarttaxnation.com/portal';

    const greeting = customerName ? `Hi ${customerName}! ` : '';
    const confirmationSMS = `${greeting}Your appointment with ${data.businessName || 'us'} is confirmed! Need to reschedule? ${bookingLink}. Upload docs: ${portalLink}`;

    await messageQueueService.enqueueSMS(data.clientId, data.phone, confirmationSMS, {
      customerId,
      messageType: 'confirmation',
      metadata: { callId: data.callId, type: 'booking_confirmation' },
    });

    logger.info({ callId: data.callId, customerId }, 'Booking confirmation SMS queued');
  }

  /**
   * Parse appointment time from various string formats
   */
  private parseAppointmentTime(timeString: string): Date | null {
    // Try direct ISO parse first
    const parsed = new Date(timeString);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }

    // Try common formats
    // Format: "Monday, January 27th at 2:00 PM"
    // Format: "2024-01-27T14:00:00"
    // Format: "January 27, 2024 2:00 PM"

    try {
      // Attempt to parse natural language date with Date.parse fallback
      const attempt = Date.parse(timeString);
      if (!isNaN(attempt)) {
        return new Date(attempt);
      }
    } catch {
      // Parsing failed
    }

    logger.warn({ timeString }, 'Could not parse appointment time');
    return null;
  }
}

export const postCallProcessor = new PostCallProcessor();
