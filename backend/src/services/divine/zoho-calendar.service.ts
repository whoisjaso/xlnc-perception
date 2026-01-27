import { logger } from '../../utils/logger';
import env from '../../config/env';
import { oauthTokenService } from './oauth-token.service';

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  attendees?: string[];
  description?: string;
  location?: string;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  formatted: string;
}

export interface ZohoCalendarCredentials {
  clientId?: string | null;
  clientSecret?: string | null;
  refreshToken?: string | null;
  calendarId?: string | null;
}

export class ZohoCalendarService {
  private readonly baseUrl = 'https://calendar.zoho.com/api/v1';

  private readonly serviceClientId: string; // For multi-tenant token lookup
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly refreshToken: string;
  private readonly calendarId: string;

  constructor(credentials?: ZohoCalendarCredentials, clientId: string = 'default') {
    this.serviceClientId = clientId;
    // Use provided credentials, fall back to env vars
    this.clientId = credentials?.clientId || env.ZOHO_CLIENT_ID || env.ZOHO_CALENDAR_CLIENT_ID || '';
    this.clientSecret = credentials?.clientSecret || env.ZOHO_CLIENT_SECRET || env.ZOHO_CALENDAR_CLIENT_SECRET || '';
    this.refreshToken = credentials?.refreshToken || env.ZOHO_REFRESH_TOKEN || env.ZOHO_CALENDAR_REFRESH_TOKEN || '';
    this.calendarId = credentials?.calendarId || env.ZOHO_CALENDAR_ID || '';
  }

  /**
   * Create a service instance for a specific client config
   */
  static forClient(clientConfig: {
    zoho_client_id?: string | null;
    zoho_client_secret?: string | null;
    zoho_refresh_token?: string | null;
    zoho_calendar_id?: string | null;
  }, clientId: string = 'default'): ZohoCalendarService {
    return new ZohoCalendarService({
      clientId: clientConfig.zoho_client_id,
      clientSecret: clientConfig.zoho_client_secret,
      refreshToken: clientConfig.zoho_refresh_token,
      calendarId: clientConfig.zoho_calendar_id,
    }, clientId);
  }

  isConfigured(): boolean {
    return Boolean(this.clientId && this.clientSecret && this.refreshToken && this.calendarId);
  }

  async getAccessToken(): Promise<string> {
    // Use OAuthTokenService for database-backed tokens
    return oauthTokenService.getAccessToken(
      this.serviceClientId,
      'zoho_calendar',
      { clientId: this.clientId, clientSecret: this.clientSecret }
    );
  }

  /**
   * Parse Zoho date format to JavaScript Date
   * Zoho returns: 20260121T040000-0600 (with timezone offset)
   * Or: 20260121T090000Z (UTC)
   */
  private parseZohoDate(zohoDate: string): Date {
    if (!zohoDate) return new Date(NaN);

    // Format with timezone offset: 20260121T040000-0600 or 20260121T040000+0530
    const matchWithOffset = zohoDate.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})([+-])(\d{2})(\d{2})$/);
    if (matchWithOffset) {
      const [, year, month, day, hour, min, sec, sign, tzHour, tzMin] = matchWithOffset;
      // Convert to ISO format with proper offset: 2026-01-21T04:00:00-06:00
      return new Date(`${year}-${month}-${day}T${hour}:${min}:${sec}${sign}${tzHour}:${tzMin}`);
    }

    // Format with Z (UTC): 20260121T090000Z
    const matchUTC = zohoDate.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
    if (matchUTC) {
      const [, year, month, day, hour, min, sec] = matchUTC;
      return new Date(`${year}-${month}-${day}T${hour}:${min}:${sec}Z`);
    }

    // Fallback: try direct parsing
    return new Date(zohoDate);
  }

  async getEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    if (!this.isConfigured()) return [];

    const token = await this.getAccessToken();

    // Zoho requires format: yyyyMMdd'T'HHmmssZ
    const formatZohoDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

    const range = JSON.stringify({
      start: formatZohoDate(startDate),
      end: formatZohoDate(endDate),
    });

    const response = await fetch(
      `${this.baseUrl}/calendars/${this.calendarId}/events?range=${encodeURIComponent(range)}`,
      { headers: { Authorization: `Zoho-oauthtoken ${token}` } }
    );

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({ status: response.status, error: errorText }, 'Failed to get calendar events');
      throw new Error(`Failed to get calendar events: ${response.status}`);
    }

    const data = (await response.json()) as { events?: any[] };

    return (data.events || []).map((event: any) => ({
      id: event.uid,
      title: event.title,
      startTime: this.parseZohoDate(event.dateandtime?.start),
      endTime: this.parseZohoDate(event.dateandtime?.end),
      attendees: event.attendees?.map((a: any) => a.email) || [],
      description: event.description,
      location: event.location,
    }));
  }

  async createEvent(
    event: Omit<CalendarEvent, 'id'>,
    timezone: string = 'America/New_York'
  ): Promise<CalendarEvent> {
    const token = await this.getAccessToken();

    // Zoho expects date format: yyyyMMdd'T'HHmmssZ (e.g., "20260120T140000Z")
    const formatZohoDateTime = (d: Date): string => {
      return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };

    const eventData = {
      title: event.title,
      dateandtime: {
        start: formatZohoDateTime(event.startTime),
        end: formatZohoDateTime(event.endTime),
        timezone: timezone,
      },
      ...(event.attendees && event.attendees.length > 0 && {
        attendees: event.attendees.map((email) => ({ email })),
      }),
      ...(event.description && { description: event.description }),
      ...(event.location && { location: event.location }),
    };

    // Zoho Calendar API expects 'eventdata' as a form field with JSON value
    const formData = new URLSearchParams();
    formData.append('eventdata', JSON.stringify(eventData));

    logger.debug({ eventData }, 'Creating Zoho calendar event');

    const response = await fetch(`${this.baseUrl}/calendars/${this.calendarId}/events`, {
      method: 'POST',
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({ status: response.status, error: errorText }, 'Failed to create calendar event');
      throw new Error(`Failed to create calendar event: ${response.status}`);
    }

    const data = (await response.json()) as { events?: any[] };
    const created = data.events?.[0];

    logger.info({ eventId: created?.uid, title: event.title }, 'Calendar event created');

    return {
      id: created?.uid,
      title: event.title,
      startTime: event.startTime,
      endTime: event.endTime,
      attendees: event.attendees,
      description: event.description,
      location: event.location,
    };
  }

  async getAvailableSlots(
    date: Date,
    durationMinutes: number = 30,
    businessHours: { start: number; end: number } = { start: 9, end: 17 }
  ): Promise<TimeSlot[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(businessHours.start, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(businessHours.end, 0, 0, 0);

    const events = await this.getEvents(startOfDay, endOfDay);
    const busyTimes = events.map((e) => ({ start: e.startTime, end: e.endTime }));

    const slots: TimeSlot[] = [];
    let current = new Date(startOfDay);

    while (current.getTime() + durationMinutes * 60 * 1000 <= endOfDay.getTime()) {
      const slotEnd = new Date(current.getTime() + durationMinutes * 60 * 1000);

      const isAvailable = !busyTimes.some(
        (busy) => current < busy.end && slotEnd > busy.start
      );

      if (isAvailable) {
        slots.push({
          start: new Date(current),
          end: slotEnd,
          formatted: this.formatTimeSlot(current, slotEnd),
        });
      }

      current = new Date(current.getTime() + 30 * 60 * 1000); // 30-minute intervals
    }

    return slots;
  }

  private formatTimeSlot(start: Date, end: Date): string {
    const formatTime = (d: Date) => {
      const hours = d.getHours();
      const minutes = d.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const hour12 = hours % 12 || 12;
      return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    };

    return `${formatTime(start)} - ${formatTime(end)}`;
  }

  formatSlotsForSpeech(slots: TimeSlot[], maxSlots: number = 3): string {
    if (slots.length === 0) {
      return "I don't have any available slots for that day.";
    }

    const selected = slots.slice(0, maxSlots);
    const times = selected.map((s) => s.formatted);

    if (times.length === 1) {
      return `I have ${times[0]} available.`;
    }

    const lastTime = times.pop();
    return `I have ${times.join(', ')}, or ${lastTime} available.`;
  }
}

export const zohoCalendarService = new ZohoCalendarService();
