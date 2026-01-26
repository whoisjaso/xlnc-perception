import { db } from '../../config/database';
import { messageQueue } from '../../db/schema/messageQueue';
import { messageQueueService } from './message-queue.service';
import { logger } from '../../utils/logger';
import { subHours } from 'date-fns';
import { eq, and, inArray } from 'drizzle-orm';

interface AppointmentDetails {
  clientId: string;
  customerId: string;
  customerPhone: string;
  customerEmail?: string;
  customerName?: string;
  appointmentTime: Date;
  appointmentId: string;  // Required for cancellation tracking
  appointmentType?: string;
  businessName: string;
  bookingLink?: string;
  portalLink?: string;
}

export class ReminderSchedulerService {
  private readonly BOOKING_LINK = 'https://smarttaxnation.com/book';
  private readonly PORTAL_LINK = 'https://smarttaxnation.com/portal';

  /**
   * Schedule both 24h and 1h reminders for an appointment
   */
  async scheduleAppointmentReminders(appointment: AppointmentDetails): Promise<void> {
    const { appointmentTime, customerPhone, customerEmail, customerName, businessName, clientId, customerId, appointmentType, appointmentId } = appointment;

    const reminder24h = subHours(appointmentTime, 24);
    const reminder1h = subHours(appointmentTime, 1);

    const bookingLink = appointment.bookingLink || this.BOOKING_LINK;
    const portalLink = appointment.portalLink || this.PORTAL_LINK;

    // Format appointment time for display
    const timeStr = appointmentTime.toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    const now = new Date();

    // 24h SMS reminder
    if (reminder24h > now) {
      const sms24h = this.build24hSMSReminder(customerName, businessName, timeStr, bookingLink);
      await messageQueueService.enqueueSMS(clientId, customerPhone, sms24h, {
        customerId,
        scheduledFor: reminder24h,
        messageType: 'reminder_24h',
        metadata: { appointmentTime: appointmentTime.toISOString(), appointmentId, type: appointmentType }
      });
      logger.info({ clientId, customerId, appointmentId, scheduledFor: reminder24h }, '24h SMS reminder scheduled');
    }

    // 1h SMS reminder
    if (reminder1h > now) {
      const sms1h = this.build1hSMSReminder(customerName, businessName, timeStr);
      await messageQueueService.enqueueSMS(clientId, customerPhone, sms1h, {
        customerId,
        scheduledFor: reminder1h,
        messageType: 'reminder_1h',
        metadata: { appointmentTime: appointmentTime.toISOString(), appointmentId, type: appointmentType }
      });
      logger.info({ clientId, customerId, appointmentId, scheduledFor: reminder1h }, '1h SMS reminder scheduled');
    }

    // Email reminders if email available
    if (customerEmail) {
      if (reminder24h > now) {
        const { subject, body } = this.build24hEmailReminder(customerName, businessName, timeStr, bookingLink, portalLink);
        await messageQueueService.enqueueEmail(clientId, customerEmail, subject, body, {
          customerId,
          scheduledFor: reminder24h,
          messageType: 'reminder_24h',
          metadata: { appointmentTime: appointmentTime.toISOString(), appointmentId, type: appointmentType }
        });
      }

      if (reminder1h > now) {
        const { subject, body } = this.build1hEmailReminder(customerName, businessName, timeStr);
        await messageQueueService.enqueueEmail(clientId, customerEmail, subject, body, {
          customerId,
          scheduledFor: reminder1h,
          messageType: 'reminder_1h',
          metadata: { appointmentTime: appointmentTime.toISOString(), appointmentId, type: appointmentType }
        });
      }
    }
  }

  /**
   * Cancel scheduled reminders for an appointment (e.g., if cancelled/rescheduled)
   * Deletes or marks as cancelled all pending reminders matching the appointmentId
   */
  async cancelAppointmentReminders(appointmentId: string): Promise<number> {
    logger.info({ appointmentId }, 'Cancelling appointment reminders');

    // Find all pending reminder messages for this appointment
    // The appointmentId is stored in metadata.appointmentId
    // We need to query by JSON field - use raw SQL for JSONB query
    const pendingReminders = await db
      .select({ id: messageQueue.id })
      .from(messageQueue)
      .where(
        and(
          eq(messageQueue.status, 'pending'),
          inArray(messageQueue.messageType, ['reminder_24h', 'reminder_1h'])
        )
      );

    // Filter by appointmentId in metadata (Drizzle doesn't have great JSONB support)
    const toCancel: string[] = [];
    for (const reminder of pendingReminders) {
      const [full] = await db
        .select()
        .from(messageQueue)
        .where(eq(messageQueue.id, reminder.id));

      if (full?.metadata && typeof full.metadata === 'object' && 'appointmentId' in full.metadata) {
        if ((full.metadata as Record<string, unknown>).appointmentId === appointmentId) {
          toCancel.push(reminder.id);
        }
      }
    }

    if (toCancel.length === 0) {
      logger.info({ appointmentId }, 'No pending reminders found to cancel');
      return 0;
    }

    // Update status to cancelled for all matching reminders
    await db
      .update(messageQueue)
      .set({ status: 'cancelled' })
      .where(inArray(messageQueue.id, toCancel));

    logger.info({ appointmentId, cancelledCount: toCancel.length }, 'Appointment reminders cancelled');
    return toCancel.length;
  }

  private build24hSMSReminder(name: string | undefined, business: string, timeStr: string, bookingLink: string): string {
    const greeting = name ? `Hi ${name}! ` : '';
    return `${greeting}Reminder: Your appointment with ${business} is tomorrow at ${timeStr.split(',').pop()?.trim()}. Need to reschedule? ${bookingLink}`;
  }

  private build1hSMSReminder(name: string | undefined, business: string, timeStr: string): string {
    const greeting = name ? `Hi ${name}! ` : '';
    return `${greeting}Your ${business} appointment is in 1 hour! We're looking forward to seeing you.`;
  }

  private build24hEmailReminder(
    name: string | undefined,
    business: string,
    timeStr: string,
    bookingLink: string,
    portalLink: string
  ): { subject: string; body: string } {
    const greeting = name ? `Hi ${name}` : 'Hi there';
    return {
      subject: `Reminder: Your ${business} appointment is tomorrow`,
      body: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .highlight { background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0; }
    .btn { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin-right: 10px; margin-bottom: 10px; }
    .btn-secondary { background-color: #6c757d; }
    .footer { margin-top: 30px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <p>${greeting},</p>

    <p>This is a friendly reminder about your upcoming appointment with <strong>${business}</strong>.</p>

    <div class="highlight">
      <strong>Appointment Details:</strong><br>
      ${timeStr}
    </div>

    <p>If you need to make any changes, please let us know as soon as possible.</p>

    <p>
      <a href="${bookingLink}" class="btn">Reschedule Appointment</a>
      <a href="${portalLink}" class="btn btn-secondary">Upload Documents</a>
    </p>

    <p>We're looking forward to seeing you!</p>

    <div class="footer">
      <p>Best regards,<br>The ${business} Team</p>
    </div>
  </div>
</body>
</html>`
    };
  }

  private build1hEmailReminder(name: string | undefined, business: string, timeStr: string): { subject: string; body: string } {
    const greeting = name ? `Hi ${name}` : 'Hi there';
    return {
      subject: `Your ${business} appointment is in 1 hour`,
      body: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .highlight { background-color: #e8f5e9; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0; }
    .footer { margin-top: 30px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <p>${greeting},</p>

    <div class="highlight">
      <strong>Your appointment is coming up in 1 hour!</strong><br>
      ${timeStr}
    </div>

    <p>We're excited to see you soon. If you have any last-minute questions, feel free to give us a call.</p>

    <div class="footer">
      <p>See you soon!<br>The ${business} Team</p>
    </div>
  </div>
</body>
</html>`
    };
  }
}

export const reminderSchedulerService = new ReminderSchedulerService();
