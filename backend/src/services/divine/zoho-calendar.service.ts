import { logger } from '../../utils/logger';
import env from '../../config/env';

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
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private readonly baseUrl = 'https://calendar.zoho.com/api/v1';

  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly refreshToken: string;
  private readonly calendarId: string;

  constructor(credentials?: ZohoCalendarCredentials) {
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
  }): ZohoCalendarService {
    return new ZohoCalendarService({
      clientId: clientConfig.zoho_client_id,
      clientSecret: clientConfig.zoho_client_secret,
      refreshToken: clientConfig.zoho_refresh_token,
      calendarId: clientConfig.zoho_calendar_id,
    });
  }

  isConfigured(): boolean {
    return Boolean(this.clientId && this.clientSecret && this.refreshToken && this.calendarId);
  }

  async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry) {
      const bufferTime = 5 * 60 * 1000;
      if (this.tokenExpiry.getTime() - bufferTime > Date.now()) {
        return this.accessToken;
      }
    }

    logger.debug('Refreshing Zoho Calendar access token');

    const response = await fetch('https://accounts.zoho.com/oauth/v2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: this.refreshToken,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({ status: response.status, error: errorText }, 'Failed to refresh Zoho Calendar access token');
      throw new Error(`Failed to refresh Zoho Calendar access token: ${response.status}`);
    }

    const data = (await response.json()) as { access_token: string; expires_in: number };

    this.accessToken = data.access_token;
    this.tokenExpiry = new Date(Date.now() + data.expires_in * 1000);

    return this.accessToken!;
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
      startTime: new Date(event.dateandtime?.start),
      endTime: new Date(event.dateandtime?.end),
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

    const response = await fetch(`${this.baseUrl}/calendars/${this.calendarId}/events`, {
      method: 'POST',
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventdata: {
          title: event.title,
          dateandtime: {
            start: event.startTime.toISOString(),
            end: event.endTime.toISOString(),
            timezone: timezone,
          },
          attendees: event.attendees?.map((email) => ({ email })),
          description: event.description,
          location: event.location,
        },
      }),
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
