// Tool endpoints for Retell Conversation Flow integration
// These endpoints accept the simplified parameter format from conversation flow tools

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { ZohoCalendarService } from '../services/divine/zoho-calendar.service';
import { clientConfigService } from '../services/divine/client-config.service';
import { customerService } from '../services/divine/customer.service';
import { messageQueueService } from '../services/divine/message-queue.service';
import {
  addDays,
  startOfDay,
  endOfDay,
  format,
  parseISO,
  isToday,
  isTomorrow,
  nextMonday,
  addWeeks,
  getDay,
} from 'date-fns';

const router = Router();

// Default client for now - can be extended to support multiple clients via header/param
const DEFAULT_CLIENT_ID = 'smart-tax-nation';

/**
 * Helper to get calendar service for a client
 */
async function getCalendarService(clientId: string = DEFAULT_CLIENT_ID) {
  const clientConfig = await clientConfigService.getConfig(clientId);
  if (!clientConfig) {
    throw new Error(`Client config not found: ${clientId}`);
  }

  // Use client-specific credentials if available, otherwise env vars
  if (clientConfig.zoho_client_id && clientConfig.zoho_client_secret && clientConfig.zoho_refresh_token) {
    return { service: ZohoCalendarService.forClient(clientConfig), config: clientConfig };
  }

  return { service: new ZohoCalendarService(), config: clientConfig };
}

/**
 * Parse date preference into actual dates
 */
function parseDatePreference(preference: string): { start: Date; end: Date } {
  const today = new Date();
  const dayOfWeek = getDay(today); // 0 = Sunday, 1 = Monday, etc.

  switch (preference) {
    case 'today':
      return { start: startOfDay(today), end: endOfDay(today) };

    case 'tomorrow':
      const tomorrow = addDays(today, 1);
      return { start: startOfDay(tomorrow), end: endOfDay(tomorrow) };

    case 'this_week': {
      // Remaining days of current week (until Friday)
      const start = startOfDay(today);
      // Find Friday of this week
      const daysUntilFriday = dayOfWeek <= 5 ? 5 - dayOfWeek : 0;
      const friday = addDays(today, daysUntilFriday);
      return { start, end: endOfDay(friday) };
    }

    case 'next_week': {
      // Monday to Friday of next week
      const nextMon = nextMonday(today);
      const nextFri = addDays(nextMon, 4);
      return { start: startOfDay(nextMon), end: endOfDay(nextFri) };
    }

    default:
      // Default to this week
      return { start: startOfDay(today), end: endOfDay(addDays(today, 7)) };
  }
}

/**
 * Filter slots by time preference
 */
function filterByTimePreference(
  slots: Array<{ start: Date; end: Date; formatted: string }>,
  preference?: string
): Array<{ start: Date; end: Date; formatted: string }> {
  if (!preference || preference === 'any') return slots;

  return slots.filter((slot) => {
    const hour = slot.start.getHours();

    switch (preference) {
      case 'morning':
        return hour >= 9 && hour < 12;
      case 'afternoon':
        return hour >= 12 && hour < 17;
      default:
        return true;
    }
  });
}

/**
 * POST /api/tools/check-availability
 * Check calendar availability for booking appointments
 *
 * Body: {
 *   date_preference: "today" | "tomorrow" | "this_week" | "next_week",
 *   time_preference?: "morning" | "afternoon" | "any",
 *   duration_minutes?: number
 * }
 */
router.post(
  '/check-availability',
  asyncHandler(async (req: Request, res: Response) => {
    const { date_preference, time_preference, duration_minutes = 60 } = req.body;

    logger.info({ date_preference, time_preference, duration_minutes }, 'Check availability request');

    if (!date_preference) {
      return res.status(400).json({
        success: false,
        error: 'date_preference is required',
        available_slots: [],
      });
    }

    try {
      const { service, config } = await getCalendarService();

      if (!service.isConfigured()) {
        logger.warn('Calendar service not configured');
        return res.json({
          success: false,
          error: 'Calendar not configured',
          available_slots: [],
          message: "I'm having trouble accessing the calendar right now. Can I have someone call you back to schedule?",
        });
      }

      const { start, end } = parseDatePreference(date_preference);
      const allSlots: Array<{ start: Date; end: Date; formatted: string; date: string }> = [];

      // Get business hours from client config
      const businessHours = config.business_hours || {
        monday: { start: '09:00', end: '17:00' },
        tuesday: { start: '09:00', end: '17:00' },
        wednesday: { start: '09:00', end: '17:00' },
        thursday: { start: '09:00', end: '17:00' },
        friday: { start: '09:00', end: '17:00' },
        saturday: { start: '10:00', end: '14:00', closed: false },
        sunday: { closed: true },
      };

      // Iterate through each day in the range
      let currentDate = new Date(start);
      while (currentDate <= end) {
        const dayName = format(currentDate, 'EEEE').toLowerCase() as keyof typeof businessHours;
        const dayHours = businessHours[dayName];

        if (dayHours && !dayHours.closed) {
          const startHour = parseInt(dayHours.start?.split(':')[0] || '9');
          const endHour = parseInt(dayHours.end?.split(':')[0] || '17');

          const slots = await service.getAvailableSlots(currentDate, duration_minutes, {
            start: startHour,
            end: endHour,
          });

          const filteredSlots = filterByTimePreference(slots, time_preference);

          filteredSlots.forEach((slot) => {
            allSlots.push({
              ...slot,
              date: format(currentDate, 'yyyy-MM-dd'),
            });
          });
        }

        currentDate = addDays(currentDate, 1);
      }

      // Format response for voice agent
      const slotsForResponse = allSlots.slice(0, 6).map((slot) => ({
        start: slot.start.toISOString(),
        end: slot.end.toISOString(),
        formatted: slot.formatted,
        date: slot.date,
        display: `${format(slot.start, 'EEEE')} at ${slot.formatted.split(' - ')[0]}`,
      }));

      // Build speech-friendly response
      let message: string;
      if (slotsForResponse.length === 0) {
        message = `I don't have any ${time_preference === 'any' ? '' : time_preference + ' '}availability for ${date_preference.replace('_', ' ')}. Would you like me to check ${date_preference === 'this_week' ? 'next week' : 'a different time'}?`;
      } else if (slotsForResponse.length === 1) {
        message = `I have ${slotsForResponse[0].display} available. Does that work for you?`;
      } else {
        const firstTwo = slotsForResponse.slice(0, 2).map((s) => s.display);
        message = `I have ${firstTwo[0]} or ${firstTwo[1]} available. Which works better for you?`;
      }

      logger.info({ slotCount: slotsForResponse.length }, 'Availability check complete');

      res.json({
        success: true,
        has_availability: slotsForResponse.length > 0,
        available_slots: slotsForResponse,
        slot_count: slotsForResponse.length,
        message,
        date_range: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
      });
    } catch (error) {
      logger.error({ error }, 'Failed to check availability');
      res.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        available_slots: [],
        message: "I'm having trouble accessing the calendar. Let me have someone call you back to schedule.",
      });
    }
  })
);

/**
 * POST /api/tools/book-appointment
 * Book an appointment on the calendar
 *
 * Body: {
 *   lead_name: string,
 *   lead_phone: string,
 *   lead_email?: string,
 *   appointment_datetime: string (ISO 8601),
 *   service_type: string,
 *   notes?: string,
 *   duration_minutes?: number,
 *   language?: "english" | "spanish"
 * }
 */
router.post(
  '/book-appointment',
  asyncHandler(async (req: Request, res: Response) => {
    const {
      lead_name,
      lead_phone,
      lead_email,
      appointment_datetime,
      service_type,
      notes,
      duration_minutes = 60,
      language = 'english',
    } = req.body;

    logger.info(
      { lead_name, lead_phone, appointment_datetime, service_type },
      'Book appointment request'
    );

    // Validate required fields
    if (!lead_name || !lead_phone || !appointment_datetime || !service_type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: lead_name, lead_phone, appointment_datetime, service_type',
        message: "I'm missing some information. Can you give me your name and phone number?",
      });
    }

    try {
      const { service, config } = await getCalendarService();

      if (!service.isConfigured()) {
        logger.warn('Calendar service not configured');
        return res.json({
          success: false,
          error: 'Calendar not configured',
          message: "I'm having trouble with the calendar. Let me have someone call you to confirm the appointment.",
        });
      }

      const appointmentTime = parseISO(appointment_datetime);
      const appointmentEnd = new Date(appointmentTime.getTime() + duration_minutes * 60 * 1000);

      // Create calendar event
      const event = await service.createEvent(
        {
          title: `${lead_name} - ${service_type}`,
          startTime: appointmentTime,
          endTime: appointmentEnd,
          description: `Service: ${service_type}\nPhone: ${lead_phone}\nEmail: ${lead_email || 'Not provided'}\nLanguage: ${language}\nNotes: ${notes || 'None'}\n\nBooked via AI Voice Agent`,
          attendees: lead_email ? [lead_email] : [],
          location: config.address || 'Smart Tax Nation Office',
        },
        config.timezone || 'America/New_York'
      );

      // Create/update customer record (graceful failure if DB not set up)
      let customerId: string | null = null;
      try {
        const customer = await customerService.getOrCreate(config.client_id, lead_phone);
        customerId = customer.id;

        if (lead_name) {
          await customerService.update(customer.id, { name: lead_name });
        }
        if (lead_email) {
          await customerService.update(customer.id, { email: lead_email });
        }
      } catch (dbError) {
        logger.warn({ error: dbError }, 'Customer record creation skipped (DB may not be set up)');
      }

      // Queue confirmation SMS (graceful failure if message_queue table missing)
      let smsSent = false;
      if (config.sms_enabled) {
        try {
          const smsMessage =
            language === 'spanish'
              ? `Su cita en ${config.business_name} está confirmada para ${format(appointmentTime, "EEEE, MMMM do 'a las' h:mm a")}. Ubicación: ${config.address}. Responda CANCELAR para cancelar.`
              : `Your appointment at ${config.business_name} is confirmed for ${format(appointmentTime, "EEEE, MMMM do 'at' h:mm a")}. Location: ${config.address}. Reply CANCEL to cancel.`;

          await messageQueueService.enqueueSMS(config.client_id, lead_phone, smsMessage, {
            customerId: customerId || undefined,
            metadata: {
              type: 'appointment_confirmation',
              eventId: event.id,
              appointmentTime: appointment_datetime,
            },
          });
          smsSent = true;
        } catch (smsError) {
          logger.warn({ error: smsError }, 'SMS queuing skipped (message_queue table may not exist)');
        }
      }

      // Queue confirmation email (graceful failure if message_queue table missing)
      let emailSent = false;
      if (config.email_enabled && lead_email) {
        try {
          const emailSubject =
            language === 'spanish'
              ? `Cita Confirmada - ${config.business_name}`
              : `Appointment Confirmed - ${config.business_name}`;

          const emailBody =
            language === 'spanish'
              ? `
Hola ${lead_name},

¡Su cita ha sido confirmada!

Fecha: ${format(appointmentTime, 'EEEE, MMMM do, yyyy')}
Hora: ${format(appointmentTime, 'h:mm a')}
Ubicación: ${config.address || 'Por confirmar'}
Tipo de Servicio: ${service_type}

Si necesita reprogramar o cancelar, por favor llámenos o responda a este correo.

¡Gracias por elegir ${config.business_name}!

Atentamente,
Equipo de ${config.business_name}
              `.trim()
              : `
Hello ${lead_name},

Your appointment has been confirmed!

Date: ${format(appointmentTime, 'EEEE, MMMM do, yyyy')}
Time: ${format(appointmentTime, 'h:mm a')}
Location: ${config.address || 'To be confirmed'}
Service Type: ${service_type}

If you need to reschedule or cancel, please call us or reply to this email.

Thank you for choosing ${config.business_name}!

Best regards,
${config.business_name} Team
              `.trim();

          await messageQueueService.enqueueEmail(config.client_id, lead_email, emailSubject, emailBody, {
            customerId: customerId || undefined,
            metadata: {
              type: 'appointment_confirmation',
              eventId: event.id,
              appointmentTime: appointment_datetime,
            },
          });
          emailSent = true;
        } catch (emailError) {
          logger.warn({ error: emailError }, 'Email queuing skipped (message_queue table may not exist)');
        }
      }

      const formattedTime = format(appointmentTime, "EEEE, MMMM do 'at' h:mm a");

      logger.info(
        { eventId: event.id, lead_name, appointmentTime: formattedTime },
        'Appointment booked successfully'
      );

      res.json({
        success: true,
        event_id: event.id,
        confirmed_datetime: appointment_datetime,
        formatted_datetime: formattedTime,
        confirmation_sent: smsSent,
        email_sent: emailSent,
        message: `Perfect! Your appointment is confirmed for ${formattedTime}. You'll receive a confirmation text shortly.`,
      });
    } catch (error) {
      logger.error({ error }, 'Failed to book appointment');
      res.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: "I wasn't able to complete the booking. Let me have someone call you to confirm.",
      });
    }
  })
);

/**
 * GET /api/tools/health
 * Health check for tools endpoints
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const { service, config } = await getCalendarService();

    res.json({
      success: true,
      status: 'operational',
      calendar_configured: service.isConfigured(),
      client: config.client_id,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.json({
      success: false,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/tools/debug-events
 * Debug endpoint to see what events are on the calendar
 */
router.get('/debug-events', async (req: Request, res: Response) => {
  try {
    const { service } = await getCalendarService();

    // Get events for the next 7 days
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    const events = await (service as any).getEvents(startDate, endDate);

    res.json({
      success: true,
      event_count: events.length,
      events: events.map((e: any) => ({
        id: e.id,
        title: e.title,
        startTime: e.startTime,
        endTime: e.endTime,
        startISO: e.startTime?.toISOString?.(),
        endISO: e.endTime?.toISOString?.(),
      })),
      query: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });
  } catch (error) {
    res.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
