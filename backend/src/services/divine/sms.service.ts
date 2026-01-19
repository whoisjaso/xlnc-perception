import { logger } from '../../utils/logger';
import env from '../../config/env';

export interface SendSMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: 'txt180' | 'twilio';
}

function normalizePhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  if (!phone.startsWith('+')) {
    return `+${digits}`;
  }
  return phone;
}

class TXT180Provider {
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.apiUrl = 'https://api.txt180.com/v1'; // Text180 API endpoint
    this.apiKey = env.TEXT180_AUTH_KEY || '';
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async send(to: string, body: string, from?: string): Promise<SendSMSResult> {
    const normalizedTo = normalizePhoneNumber(to);

    try {
      const response = await fetch(`${this.apiUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          to: normalizedTo,
          body,
          ...(from && { from }),
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
        const errorMessage = errorData.error?.message || `HTTP ${response.status}`;

        logger.error({ status: response.status, error: errorMessage, to: normalizedTo.slice(-4) }, 'TXT180 send failed');

        return { success: false, error: errorMessage, provider: 'txt180' };
      }

      const data = (await response.json()) as { id: string };

      logger.info({ messageId: data.id, to: normalizedTo.slice(-4) }, 'SMS sent via TXT180');

      return { success: true, messageId: data.id, provider: 'txt180' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error({ error: errorMessage, to: normalizedTo.slice(-4) }, 'TXT180 send exception');
      return { success: false, error: errorMessage, provider: 'txt180' };
    }
  }
}

class TwilioProvider {
  private readonly baseUrl: string;
  private readonly authHeader: string;
  private readonly accountSid: string;
  private readonly fromNumber: string;

  constructor() {
    this.accountSid = env.TWILIO_ACCOUNT_SID || '';
    const authToken = env.TWILIO_AUTH_TOKEN || '';
    this.fromNumber = env.TWILIO_FROM_NUMBER || '';
    this.baseUrl = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}`;
    this.authHeader = `Basic ${Buffer.from(`${this.accountSid}:${authToken}`).toString('base64')}`;
  }

  isConfigured(): boolean {
    return Boolean(this.accountSid && env.TWILIO_AUTH_TOKEN);
  }

  async send(to: string, body: string, from?: string): Promise<SendSMSResult> {
    const normalizedTo = normalizePhoneNumber(to);
    const normalizedFrom = normalizePhoneNumber(from || this.fromNumber);

    try {
      const response = await fetch(`${this.baseUrl}/Messages.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: this.authHeader,
        },
        body: new URLSearchParams({
          To: normalizedTo,
          From: normalizedFrom,
          Body: body,
        }),
      });

      const data = (await response.json()) as { sid?: string; message?: string };

      if (!response.ok) {
        const errorMessage = data.message || `HTTP ${response.status}`;
        logger.error({ status: response.status, error: errorMessage, to: normalizedTo.slice(-4) }, 'Twilio send failed');
        return { success: false, error: errorMessage, provider: 'twilio' };
      }

      logger.info({ messageId: data.sid, to: normalizedTo.slice(-4) }, 'SMS sent via Twilio');

      return { success: true, messageId: data.sid, provider: 'twilio' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error({ error: errorMessage, to: normalizedTo.slice(-4) }, 'Twilio send exception');
      return { success: false, error: errorMessage, provider: 'twilio' };
    }
  }
}

export class SMSService {
  private readonly txt180: TXT180Provider;
  private readonly twilio: TwilioProvider;
  private readonly preferredProvider: 'txt180' | 'twilio';

  constructor(preferredProvider: 'txt180' | 'twilio' = 'txt180') {
    this.txt180 = new TXT180Provider();
    this.twilio = new TwilioProvider();
    this.preferredProvider = preferredProvider;
  }

  isConfigured(): boolean {
    return this.txt180.isConfigured() || this.twilio.isConfigured();
  }

  async send(to: string, body: string, from?: string): Promise<SendSMSResult> {
    // Try preferred provider first
    if (this.preferredProvider === 'txt180' && this.txt180.isConfigured()) {
      const result = await this.txt180.send(to, body, from);
      if (result.success) return result;

      // Fallback to Twilio
      if (this.twilio.isConfigured()) {
        logger.warn('TXT180 failed, falling back to Twilio');
        return this.twilio.send(to, body, from);
      }
      return result;
    }

    if (this.preferredProvider === 'twilio' && this.twilio.isConfigured()) {
      const result = await this.twilio.send(to, body, from);
      if (result.success) return result;

      // Fallback to TXT180
      if (this.txt180.isConfigured()) {
        logger.warn('Twilio failed, falling back to TXT180');
        return this.txt180.send(to, body, from);
      }
      return result;
    }

    // Use whatever is available
    if (this.txt180.isConfigured()) {
      return this.txt180.send(to, body, from);
    }

    if (this.twilio.isConfigured()) {
      return this.twilio.send(to, body, from);
    }

    return {
      success: false,
      error: 'No SMS provider configured',
      provider: 'txt180',
    };
  }
}

export const smsService = new SMSService();
