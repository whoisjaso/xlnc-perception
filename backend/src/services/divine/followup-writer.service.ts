// Divine Agentic Intelligence System - Follow-up Writer Service
// AI-powered personalized follow-up message generation

import { logger } from '../../utils/logger';
import { claudeService } from './claude.service';
import { prismService } from './prism.service';
import { GeneratedMessage, IntentCategory, PRISMNeed, CustomerContext } from '../../types';

export interface FollowUpContext {
  customerName?: string;
  customerPhone: string;
  businessName: string;
  intent: IntentCategory;
  summary: string;
  appointmentBooked?: boolean;
  appointmentTime?: string;
  dominantNeed?: PRISMNeed;
  topics?: string[];
  agentCommitments?: string[];
}

const SMS_FOLLOW_UP_PROMPT = `You are writing a follow-up SMS message for a business after a customer call.

Context:
- Business: {{businessName}}
- Customer: {{customerName}}
- Call Intent: {{intent}}
- Call Summary: {{summary}}
{{#if appointmentBooked}}
- Appointment: {{appointmentTime}}
{{/if}}
{{#if dominantNeed}}
- Customer psychological profile: {{dominantNeed}}
{{/if}}

Write a brief, personalized SMS (max 160 characters) that:
1. Thanks them for calling
2. Reinforces next steps
3. Matches their communication style based on psychological profile
4. Uses natural, human language (no corporate speak)
5. Does NOT include "Hi" or greeting - just the message

Return ONLY the SMS text, nothing else.`;

const EMAIL_FOLLOW_UP_PROMPT = `You are writing a follow-up email for a business after a customer call.

Context:
- Business: {{businessName}}
- Customer: {{customerName}}
- Call Intent: {{intent}}
- Call Summary: {{summary}}
{{#if appointmentBooked}}
- Appointment Scheduled: {{appointmentTime}}
{{/if}}
{{#if dominantNeed}}
- Customer Communication Style: {{needDescription}}
{{/if}}
{{#if topics}}
- Topics Discussed: {{topics}}
{{/if}}
{{#if agentCommitments}}
- Promises Made: {{agentCommitments}}
{{/if}}

Write a personalized follow-up email that:
1. Has a compelling subject line (max 50 chars)
2. Opens warmly but not generically
3. Summarizes key points from the conversation
4. Reinforces any commitments made
5. Provides clear next steps
6. Matches their psychological profile
7. Is professional but human (not corporate)
8. Is 3-5 paragraphs max

Respond in JSON format:
{
  "subject": "Subject line here",
  "body": "Full email body in HTML format"
}`;

const NEED_DESCRIPTIONS: Record<string, string> = {
  significance: 'Values recognition and feeling important - use language that validates their uniqueness',
  acceptance: 'Values belonging and connection - use inclusive language, mention community',
  approval: 'Seeks reassurance - affirm their decisions and choices',
  intelligence: 'Values being knowledgeable - be specific and data-driven',
  pity: 'Has experienced challenges - show empathy and understanding',
  power: 'Values control - give them options and emphasize their choice',
};

export class FollowUpWriterService {
  async generateSMSFollowUp(context: FollowUpContext): Promise<GeneratedMessage> {
    // If Claude not configured, use templates
    if (!claudeService.isConfigured()) {
      return this.generateTemplateSMS(context);
    }

    try {
      const prompt = this.buildPrompt(SMS_FOLLOW_UP_PROMPT, context);

      const response = await claudeService.complete(
        'You are a professional business communication writer.',
        [{ role: 'user', content: prompt }],
        { temperature: 0.7, maxTokens: 200 }
      );

      // Clean up and truncate if needed
      let body = response.content.trim();
      if (body.length > 160) {
        body = body.substring(0, 157) + '...';
      }

      logger.debug({ intent: context.intent }, 'Generated AI SMS follow-up');

      return {
        channel: 'sms',
        body,
        personalized: true,
        aiGenerated: true,
      };
    } catch (error) {
      logger.error({ error }, 'AI SMS generation failed, using template');
      return this.generateTemplateSMS(context);
    }
  }

  async generateEmailFollowUp(context: FollowUpContext): Promise<GeneratedMessage> {
    // If Claude not configured, use templates
    if (!claudeService.isConfigured()) {
      return this.generateTemplateEmail(context);
    }

    try {
      const needDescription = context.dominantNeed
        ? NEED_DESCRIPTIONS[context.dominantNeed]
        : undefined;

      const prompt = this.buildPrompt(EMAIL_FOLLOW_UP_PROMPT, {
        ...context,
        needDescription,
      });

      const response = await claudeService.complete(
        'You are a professional business communication writer who creates compelling follow-up emails.',
        [{ role: 'user', content: prompt }],
        { temperature: 0.7, maxTokens: 1000 }
      );

      const parsed = JSON.parse(response.content);

      logger.debug({ intent: context.intent }, 'Generated AI email follow-up');

      return {
        channel: 'email',
        subject: parsed.subject || `Following up on your call with ${context.businessName}`,
        body: parsed.body,
        personalized: true,
        aiGenerated: true,
      };
    } catch (error) {
      logger.error({ error }, 'AI email generation failed, using template');
      return this.generateTemplateEmail(context);
    }
  }

  async generateBothFollowUps(
    context: FollowUpContext
  ): Promise<{ sms: GeneratedMessage; email: GeneratedMessage }> {
    const [sms, email] = await Promise.all([
      this.generateSMSFollowUp(context),
      this.generateEmailFollowUp(context),
    ]);

    return { sms, email };
  }

  // ============================================
  // TEMPLATE FALLBACKS
  // ============================================

  private generateTemplateSMS(context: FollowUpContext): GeneratedMessage {
    const templates: Record<IntentCategory, string> = {
      booking_request: context.appointmentBooked
        ? `Thanks for calling ${context.businessName}! Your appointment on ${context.appointmentTime} is confirmed. See you then!`
        : `Thanks for calling ${context.businessName}! We'd love to help you book an appointment. Call us back anytime!`,
      information_inquiry: `Thanks for calling ${context.businessName}! Hope we answered your questions. Feel free to reach out anytime.`,
      pricing_question: `Thanks for your interest in ${context.businessName}! Let us know if you have any other pricing questions.`,
      callback_request: `Thanks for calling ${context.businessName}! Someone from our team will call you back shortly.`,
      complaint: `Thank you for bringing this to our attention. We're working on resolving your concern and will follow up soon.`,
      compliment: `Thank you for the kind words! We appreciate your support and look forward to serving you again.`,
      transfer_request: `Thanks for calling ${context.businessName}! Hope your conversation with our team was helpful.`,
      cancellation: `We've processed your request. If you change your mind, we're always here to help!`,
      general_inquiry: `Thanks for calling ${context.businessName}! Don't hesitate to reach out if you need anything else.`,
      sales_opportunity: `Great chatting with you! Let us know when you're ready to move forward. We're here to help!`,
      support_request: `Thanks for reaching out to ${context.businessName}! We're here to help with any support needs.`,
      other: `Thanks for calling ${context.businessName}! Feel free to call back anytime.`,
    };

    let body = templates[context.intent] || templates.other;

    // Personalize with name if available
    if (context.customerName) {
      body = `Hi ${context.customerName}! ` + body.charAt(0).toLowerCase() + body.slice(1);
    }

    // Truncate if needed
    if (body.length > 160) {
      body = body.substring(0, 157) + '...';
    }

    return {
      channel: 'sms',
      body,
      personalized: !!context.customerName,
      aiGenerated: false,
    };
  }

  private generateTemplateEmail(context: FollowUpContext): GeneratedMessage {
    const greeting = context.customerName ? `Hi ${context.customerName}` : 'Hi there';
    const calibration = context.dominantNeed
      ? prismService.getResponseCalibration(context.dominantNeed)
      : null;

    const opener = calibration?.opener || 'Thank you for reaching out';

    let subject = `Following up on your call with ${context.businessName}`;
    let body = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { margin-bottom: 20px; }
    .content { margin-bottom: 20px; }
    .footer { margin-top: 30px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <p>${greeting},</p>
    </div>
    <div class="content">
      <p>${opener}! We enjoyed speaking with you today.</p>
      <p>${this.getSummaryParagraph(context)}</p>
      ${this.getNextStepsParagraph(context)}
      <p>If you have any questions or need anything else, don't hesitate to reach out. We're here to help!</p>
    </div>
    <div class="footer">
      <p>Best regards,<br>The ${context.businessName} Team</p>
    </div>
  </div>
</body>
</html>`;

    // Customize subject based on intent
    if (context.appointmentBooked) {
      subject = `Your appointment with ${context.businessName} is confirmed!`;
    } else if (context.intent === 'complaint') {
      subject = `We're working on your concern`;
    } else if (context.intent === 'sales_opportunity') {
      subject = `Great speaking with you about ${context.topics?.[0] || 'your needs'}`;
    }

    return {
      channel: 'email',
      subject,
      body,
      personalized: !!context.customerName || !!context.dominantNeed,
      aiGenerated: false,
    };
  }

  private getSummaryParagraph(context: FollowUpContext): string {
    if (context.summary) {
      return `Here's a quick recap of what we discussed: ${context.summary}`;
    }

    const intentSummaries: Partial<Record<IntentCategory, string>> = {
      booking_request: "We discussed scheduling an appointment that works for you.",
      pricing_question: "We covered our pricing and service options.",
      information_inquiry: "We provided information about our services.",
      support_request: "We addressed your support needs.",
      sales_opportunity: "We explored how our services might help you.",
    };

    return intentSummaries[context.intent] || "Thank you for taking the time to speak with us.";
  }

  private getNextStepsParagraph(context: FollowUpContext): string {
    if (context.appointmentBooked && context.appointmentTime) {
      return `<p><strong>Your appointment is confirmed for ${context.appointmentTime}.</strong> We look forward to seeing you then! If you need to reschedule, just give us a call.</p>`;
    }

    const nextSteps: Partial<Record<IntentCategory, string>> = {
      booking_request: `<p>When you're ready to schedule, give us a call or reply to this email. We'll find a time that works perfectly for you.</p>`,
      callback_request: `<p>One of our team members will be calling you back shortly. Keep an eye out for our call!</p>`,
      pricing_question: `<p>If you have any more questions about pricing or would like to discuss options, we're happy to chat further.</p>`,
      sales_opportunity: `<p>When you're ready to take the next step, we're here to help. Just let us know!</p>`,
    };

    return nextSteps[context.intent] || '';
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private buildPrompt(template: string, context: FollowUpContext & { needDescription?: string }): string {
    let result = template;

    // Replace simple placeholders
    result = result.replace(/\{\{businessName\}\}/g, context.businessName);
    result = result.replace(/\{\{customerName\}\}/g, context.customerName || 'valued customer');
    result = result.replace(/\{\{intent\}\}/g, context.intent.replace(/_/g, ' '));
    result = result.replace(/\{\{summary\}\}/g, context.summary);
    result = result.replace(/\{\{dominantNeed\}\}/g, context.dominantNeed || '');
    result = result.replace(/\{\{needDescription\}\}/g, context.needDescription || '');
    result = result.replace(/\{\{topics\}\}/g, context.topics?.join(', ') || '');
    result = result.replace(/\{\{agentCommitments\}\}/g, context.agentCommitments?.join(', ') || '');

    if (context.appointmentTime) {
      result = result.replace(/\{\{appointmentTime\}\}/g, context.appointmentTime);
    }

    // Handle conditional blocks
    result = this.handleConditionals(result, context);

    return result;
  }

  private handleConditionals(template: string, context: Record<string, unknown>): string {
    // Simple conditional handling: {{#if field}}...{{/if}}
    const conditionalRegex = /\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;

    return template.replace(conditionalRegex, (_, field, content) => {
      return context[field] ? content : '';
    });
  }
}

export const followUpWriterService = new FollowUpWriterService();
