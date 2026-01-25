/**
 * Multi-Channel Alerting Service
 * Routes alerts to Slack, email, and SMS based on severity and configuration.
 * Per CONTEXT.md: Multi-channel alerts with smart throttling.
 */
import { logger } from '../../utils/logger';
import { slackService, AlertSeverity } from './slack.service';
import { emailService } from './email.service';
import { smsService } from './sms.service';
import env from '../../config/env';

// Re-export AlertSeverity for convenience
export { AlertSeverity };

export interface Alert {
  severity: AlertSeverity;
  title: string;
  message: string;
  clientId?: string;
  callId?: string;
  error?: Error;
  metadata?: Record<string, unknown>;
}

interface AlertThrottleEntry {
  count: number;
  firstSeen: Date;
  lastSeen: Date;
}

/**
 * Alerting service that routes to multiple channels based on severity.
 *
 * Severity routing:
 * - info: Slack only
 * - warning: Slack only
 * - error: Slack + email
 * - critical: Slack + email + SMS
 */
export class AlertingService {
  private throttleMap: Map<string, AlertThrottleEntry> = new Map();
  private readonly throttleMinutes: number;
  private readonly emailEnabled: boolean;
  private readonly smsEnabled: boolean;
  private readonly emailRecipients: string[];
  private readonly smsRecipients: string[];

  constructor() {
    // Parse env config
    this.throttleMinutes = parseInt(String(env.ALERT_THROTTLE_MINUTES) || '15');

    this.emailEnabled = env.ALERT_EMAIL_ENABLED === 'true';
    this.smsEnabled = env.ALERT_SMS_ENABLED === 'true';

    this.emailRecipients = String(env.ALERT_EMAIL_RECIPIENTS || '')
      .split(',')
      .map(e => e.trim())
      .filter(Boolean);

    this.smsRecipients = String(env.ALERT_SMS_RECIPIENTS || '')
      .split(',')
      .map(p => p.trim())
      .filter(Boolean);

    logger.info({
      emailEnabled: this.emailEnabled,
      smsEnabled: this.smsEnabled,
      emailRecipients: this.emailRecipients.length,
      smsRecipients: this.smsRecipients.length,
      throttleMinutes: this.throttleMinutes,
    }, 'AlertingService initialized');
  }

  /**
   * Send an alert to appropriate channels based on severity.
   */
  async send(alert: Alert): Promise<void> {
    const { severity, title, message, clientId, callId, error } = alert;

    // Check throttling
    const throttleKey = this.getThrottleKey(alert);
    const shouldSend = this.checkThrottle(throttleKey, severity);

    if (!shouldSend.immediate) {
      logger.debug({ throttleKey, count: shouldSend.count }, 'Alert throttled');
      return;
    }

    const promises: Promise<boolean>[] = [];

    // Slack: always send for all severities
    promises.push(
      slackService.send({
        severity,
        title: shouldSend.count > 1
          ? `${title} (${shouldSend.count} occurrences)`
          : title,
        message,
        clientId,
        callId,
        fields: error?.stack ? [{
          name: 'Stack Trace',
          value: '```' + error.stack.slice(0, 500) + '```',
        }] : undefined,
      })
    );

    // Email: send for error and critical
    if ((severity === 'error' || severity === 'critical') && this.emailEnabled) {
      promises.push(this.sendEmailAlert(alert, shouldSend.count));
    }

    // SMS: send for critical only
    if (severity === 'critical' && this.smsEnabled) {
      promises.push(this.sendSMSAlert(alert));
    }

    try {
      await Promise.all(promises);
    } catch (err) {
      logger.error({ error: err }, 'Failed to send some alerts');
    }
  }

  /**
   * Convenience method for critical alerts.
   */
  async critical(
    title: string,
    message: string,
    context?: { clientId?: string; callId?: string; error?: Error }
  ): Promise<void> {
    await this.send({
      severity: 'critical',
      title,
      message,
      ...context,
    });
  }

  /**
   * Convenience method for error alerts.
   */
  async error(
    title: string,
    message: string,
    context?: { clientId?: string; callId?: string; error?: Error }
  ): Promise<void> {
    await this.send({
      severity: 'error',
      title,
      message,
      ...context,
    });
  }

  /**
   * Convenience method for warning alerts.
   */
  async warning(
    title: string,
    message: string,
    context?: { clientId?: string }
  ): Promise<void> {
    await this.send({
      severity: 'warning',
      title,
      message,
      ...context,
    });
  }

  /**
   * Convenience method for info alerts.
   */
  async info(title: string, message: string): Promise<void> {
    await this.send({
      severity: 'info',
      title,
      message,
    });
  }

  /**
   * Send email alert using the email service.
   */
  private async sendEmailAlert(alert: Alert, occurrenceCount: number): Promise<boolean> {
    if (this.emailRecipients.length === 0) {
      logger.debug('No email recipients configured');
      return false;
    }

    if (!emailService.isConfigured()) {
      logger.debug('Email service not configured');
      return false;
    }

    try {
      const subject = `[${alert.severity.toUpperCase()}] ${alert.title}`;
      const body = this.formatEmailBody(alert, occurrenceCount);

      let allSucceeded = true;
      for (const recipient of this.emailRecipients) {
        const result = await emailService.send({
          to: recipient,
          subject,
          body,
          html: `<pre style="font-family: monospace; white-space: pre-wrap;">${body}</pre>`,
        });
        if (!result.success) {
          allSucceeded = false;
        }
      }

      logger.debug({ recipients: this.emailRecipients.length }, 'Email alerts sent');
      return allSucceeded;
    } catch (error) {
      logger.error({ error }, 'Failed to send email alert');
      return false;
    }
  }

  /**
   * Send SMS alert using the SMS service.
   */
  private async sendSMSAlert(alert: Alert): Promise<boolean> {
    if (this.smsRecipients.length === 0) {
      logger.debug('No SMS recipients configured');
      return false;
    }

    if (!smsService.isConfigured()) {
      logger.debug('SMS service not configured');
      return false;
    }

    try {
      // SMS should be short and actionable
      const message = `CRITICAL: ${alert.title}\n${alert.message.slice(0, 100)}${alert.message.length > 100 ? '...' : ''}`;

      let allSucceeded = true;
      for (const recipient of this.smsRecipients) {
        const result = await smsService.send(recipient, message);
        if (!result.success) {
          allSucceeded = false;
        }
      }

      logger.debug({ recipients: this.smsRecipients.length }, 'SMS alerts sent');
      return allSucceeded;
    } catch (error) {
      logger.error({ error }, 'Failed to send SMS alert');
      return false;
    }
  }

  /**
   * Format email body for alerts.
   */
  private formatEmailBody(alert: Alert, occurrenceCount: number): string {
    const lines = [
      `Severity: ${alert.severity.toUpperCase()}`,
      `Title: ${alert.title}`,
      occurrenceCount > 1 ? `Occurrences: ${occurrenceCount}` : '',
      '',
      'Message:',
      alert.message,
      '',
    ];

    if (alert.clientId) lines.push(`Client ID: ${alert.clientId}`);
    if (alert.callId) lines.push(`Call ID: ${alert.callId}`);

    if (alert.error?.stack) {
      lines.push('', 'Stack Trace:', alert.error.stack);
    }

    lines.push('', `Time: ${new Date().toISOString()}`);
    lines.push(`Environment: ${env.NODE_ENV}`);

    return lines.filter(line => line !== '').join('\n');
  }

  /**
   * Generate a throttle key for an alert.
   */
  private getThrottleKey(alert: Alert): string {
    // Group by title + clientId for throttling
    return `${alert.title}:${alert.clientId || 'global'}`;
  }

  /**
   * Check if an alert should be sent based on throttling rules.
   *
   * Per CONTEXT.md: Smart throttling - first occurrence immediate,
   * then digest every 15 min.
   */
  private checkThrottle(
    key: string,
    severity: AlertSeverity
  ): { immediate: boolean; count: number } {
    const now = new Date();
    const existing = this.throttleMap.get(key);

    // Critical alerts always send immediately
    if (severity === 'critical') {
      this.throttleMap.set(key, {
        count: 1,
        firstSeen: now,
        lastSeen: now,
      });
      return { immediate: true, count: 1 };
    }

    if (!existing) {
      // First occurrence - send immediately
      this.throttleMap.set(key, {
        count: 1,
        firstSeen: now,
        lastSeen: now,
      });
      return { immediate: true, count: 1 };
    }

    // Check if throttle window has passed
    const minutesSinceFirst = (now.getTime() - existing.firstSeen.getTime()) / 1000 / 60;

    if (minutesSinceFirst >= this.throttleMinutes) {
      // Throttle window passed - send digest with count
      const count = existing.count + 1;
      this.throttleMap.set(key, {
        count: 1,
        firstSeen: now,
        lastSeen: now,
      });
      return { immediate: true, count };
    }

    // Within throttle window - increment count, don't send
    this.throttleMap.set(key, {
      count: existing.count + 1,
      firstSeen: existing.firstSeen,
      lastSeen: now,
    });
    return { immediate: false, count: existing.count + 1 };
  }

  /**
   * Clear throttle state (useful for testing).
   */
  clearThrottle(): void {
    this.throttleMap.clear();
  }
}

export const alertingService = new AlertingService();

// Convenience function for quick alerts
export async function sendAlert(alert: Alert): Promise<void> {
  return alertingService.send(alert);
}
