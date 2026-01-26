/**
 * Divine Agentic Intelligence System - Nurture Sequence Service
 * Handles nurture sequences for non-booking callers with business-hours-aware scheduling.
 *
 * Per CONTEXT.md:
 * - Nurture sequence: 1-2 follow-up attempts for non-bookers
 * - Nurture spacing: Day 1 (first follow-up), Day 4 (second follow-up)
 * - Marketing messages only during business hours
 */

import { messageQueueService } from './message-queue.service';
import { clientConfigService } from './client-config.service';
import { isWithinBusinessHours, getNextBusinessHour, BusinessHours } from '../../utils/business-hours';
import { logger } from '../../utils/logger';
import { addDays } from 'date-fns';

export interface NurtureContext {
  clientId: string;
  customerId: string;
  customerPhone: string;
  customerEmail?: string;
  customerName?: string;
  callSummary: string;
  intent: string;
  businessName: string;
  dominantNeed?: string;
}

export class NurtureSequenceService {
  private readonly BOOKING_LINK = 'https://smarttaxnation.com/book';
  private readonly PORTAL_LINK = 'https://smarttaxnation.com/portal';

  /**
   * Schedule nurture sequence for a non-booking caller
   * Day 1: First follow-up (24h after call)
   * Day 4: Second follow-up (96h after call)
   */
  async scheduleNurtureSequence(context: NurtureContext): Promise<void> {
    const {
      clientId,
      customerId,
      customerPhone,
      customerEmail,
      customerName,
      callSummary,
      businessName,
      intent,
    } = context;

    // Get client config for business hours
    const config = await clientConfigService.getConfig(clientId);
    if (!config) {
      logger.warn({ clientId }, 'No client config found for nurture sequence');
      return;
    }

    const timezone = config.timezone || 'America/New_York';
    // Cast to BusinessHours type from business-hours utility (compatible structure)
    const businessHours = config.business_hours as BusinessHours;

    // Calculate nurture send times (respecting business hours)
    const now = new Date();
    let day1Send = addDays(now, 1); // 24 hours later
    let day4Send = addDays(now, 4); // 96 hours later

    // If day1Send is outside business hours, push to next business hour
    if (businessHours && !isWithinBusinessHours(day1Send, businessHours, timezone)) {
      day1Send = getNextBusinessHour(day1Send, businessHours, timezone);
    }

    if (businessHours && !isWithinBusinessHours(day4Send, businessHours, timezone)) {
      day4Send = getNextBusinessHour(day4Send, businessHours, timezone);
    }

    // Day 1 SMS - Reference the original call
    const day1SMS = this.buildNurtureSMS(customerName, businessName, 'day1');
    await messageQueueService.enqueueSMS(clientId, customerPhone, day1SMS, {
      customerId,
      scheduledFor: day1Send,
      messageType: 'nurture_day1',
      metadata: { intent, originalCallDate: now.toISOString() },
    });
    logger.info({ clientId, customerId, scheduledFor: day1Send }, 'Day 1 nurture SMS scheduled');

    // Day 4 SMS - Second follow-up
    const day4SMS = this.buildNurtureSMS(customerName, businessName, 'day4');
    await messageQueueService.enqueueSMS(clientId, customerPhone, day4SMS, {
      customerId,
      scheduledFor: day4Send,
      messageType: 'nurture_day4',
      metadata: { intent, originalCallDate: now.toISOString() },
    });
    logger.info({ clientId, customerId, scheduledFor: day4Send }, 'Day 4 nurture SMS scheduled');

    // Email nurture if email available
    if (customerEmail) {
      const day1Email = this.buildNurtureEmail(customerName, businessName, callSummary, 'day1');
      await messageQueueService.enqueueEmail(
        clientId,
        customerEmail,
        day1Email.subject,
        day1Email.body,
        {
          customerId,
          scheduledFor: day1Send,
          messageType: 'nurture_day1',
          metadata: { intent, originalCallDate: now.toISOString() },
        }
      );

      const day4Email = this.buildNurtureEmail(customerName, businessName, callSummary, 'day4');
      await messageQueueService.enqueueEmail(
        clientId,
        customerEmail,
        day4Email.subject,
        day4Email.body,
        {
          customerId,
          scheduledFor: day4Send,
          messageType: 'nurture_day4',
          metadata: { intent, originalCallDate: now.toISOString() },
        }
      );
    }
  }

  private buildNurtureSMS(
    name: string | undefined,
    business: string,
    day: 'day1' | 'day4'
  ): string {
    const greeting = name ? `Hi ${name}! ` : '';

    if (day === 'day1') {
      return `${greeting}Following up on our chat about your tax needs. Ready to book your consultation with ${business}? ${this.BOOKING_LINK}`;
    } else {
      return `${greeting}Still thinking about ${business}? We'd love to help you with your tax questions. Book anytime: ${this.BOOKING_LINK}`;
    }
  }

  private buildNurtureEmail(
    name: string | undefined,
    business: string,
    callSummary: string,
    day: 'day1' | 'day4'
  ): { subject: string; body: string } {
    const greeting = name ? `Hi ${name}` : 'Hi there';

    if (day === 'day1') {
      return {
        subject: `Following up on our conversation - ${business}`,
        body: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .btn { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin-right: 10px; }
    .footer { margin-top: 30px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <p>${greeting},</p>

    <p>It was great chatting with you! I wanted to follow up on our conversation about your tax needs.</p>

    <p>${callSummary ? `As we discussed: ${callSummary}` : "We'd love to help you with your tax questions and planning."}</p>

    <p>When you're ready to take the next step, we're here to help!</p>

    <p>
      <a href="${this.BOOKING_LINK}" class="btn">Schedule Your Consultation</a>
    </p>

    <p>You can also use our <a href="${this.PORTAL_LINK}">secure portal</a> to upload any documents you'd like us to review.</p>

    <div class="footer">
      <p>Best regards,<br>The ${business} Team</p>
    </div>
  </div>
</body>
</html>`,
      };
    } else {
      return {
        subject: `We're still here to help - ${business}`,
        body: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .btn { display: inline-block; padding: 12px 24px; background-color: #28a745; color: white; text-decoration: none; border-radius: 4px; }
    .footer { margin-top: 30px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <p>${greeting},</p>

    <p>I hope you're doing well! I wanted to reach out one more time about your tax consultation.</p>

    <p>Our team at ${business} is ready to help you navigate your tax questions and find the best solutions for your situation.</p>

    <p>
      <a href="${this.BOOKING_LINK}" class="btn">Book Your Free Consultation</a>
    </p>

    <p>If you have any questions before booking, feel free to give us a call or reply to this email.</p>

    <div class="footer">
      <p>Looking forward to hearing from you,<br>The ${business} Team</p>
    </div>
  </div>
</body>
</html>`,
      };
    }
  }
}

export const nurtureSequenceService = new NurtureSequenceService();
