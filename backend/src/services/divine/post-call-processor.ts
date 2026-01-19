import { logger } from '../../utils/logger';
import { customerService } from './customer.service';
import { conversationService, TranscriptEntry } from './conversation.service';
import { claudeService } from './claude.service';
import { prismService } from './prism.service';
import { messageQueueService } from './message-queue.service';
import { zohoCRMService } from './zoho-crm.service';
import { slackService } from './slack.service';

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
          const lead = await zohoCRMService.getOrCreateByPhone(data.phone, {
            leadSource: 'Voice AI',
            description: `Last call: ${data.summary || 'No summary'}`,
          });

          await zohoCRMService.addNote(
            lead.id,
            `Call Summary:\n${data.summary || 'No summary'}\n\nIntent: ${intent}\n\nDuration: ${Math.round((data.durationMs || 0) / 1000)}s`,
            `Voice AI Call - ${new Date().toLocaleDateString()}`
          );

          // Update customer with CRM ID
          if (!customer.crmId) {
            await customerService.update(customer.id, {
              crmId: lead.id,
              crmProvider: 'zoho',
            });
          }
        } catch (error) {
          logger.error({ error, callId: data.callId }, 'CRM sync failed');
        }
      }

      // 8. Queue follow-up message if appropriate
      if (this.shouldSendFollowUp(intent, data.callOutcome)) {
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
}

export const postCallProcessor = new PostCallProcessor();
