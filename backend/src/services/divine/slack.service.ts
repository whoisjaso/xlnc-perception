import { logger } from '../../utils/logger';
import env from '../../config/env';

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface SlackAlert {
  severity: AlertSeverity;
  title: string;
  message: string;
  fields?: { name: string; value: string; inline?: boolean }[];
  clientId?: string;
  callId?: string;
}

const SEVERITY_COLORS: Record<AlertSeverity, string> = {
  info: '#36a64f',
  warning: '#ffcc00',
  error: '#ff6600',
  critical: '#ff0000',
};

const SEVERITY_EMOJI: Record<AlertSeverity, string> = {
  info: ':information_source:',
  warning: ':warning:',
  error: ':x:',
  critical: ':rotating_light:',
};

export class SlackAlertService {
  private readonly webhookUrl: string | null;
  private readonly enabled: boolean;

  constructor(webhookUrl?: string) {
    this.webhookUrl = webhookUrl || env.SLACK_WEBHOOK_URL || null;
    this.enabled = Boolean(this.webhookUrl);

    if (!this.enabled) {
      logger.warn('Slack alerts disabled - no webhook URL configured');
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async send(alert: SlackAlert): Promise<boolean> {
    if (!this.enabled || !this.webhookUrl) {
      logger.debug({ alert }, 'Slack alert skipped (disabled)');
      return false;
    }

    const payload = this.buildPayload(alert);

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        logger.error({ status: response.status, severity: alert.severity }, 'Failed to send Slack alert');
        return false;
      }

      logger.debug({ severity: alert.severity, title: alert.title }, 'Slack alert sent');
      return true;
    } catch (error) {
      logger.error({ error: error instanceof Error ? error.message : 'Unknown error' }, 'Slack alert exception');
      return false;
    }
  }

  async sendError(
    title: string,
    message: string,
    context?: { clientId?: string; callId?: string; error?: Error }
  ): Promise<boolean> {
    const fields: { name: string; value: string; inline?: boolean }[] = [];

    if (context?.clientId) {
      fields.push({ name: 'Client', value: context.clientId, inline: true });
    }
    if (context?.callId) {
      fields.push({ name: 'Call ID', value: context.callId, inline: true });
    }
    if (context?.error?.stack) {
      fields.push({
        name: 'Stack Trace',
        value: '```' + context.error.stack.slice(0, 500) + '```',
      });
    }

    return this.send({
      severity: 'error',
      title,
      message,
      fields,
      clientId: context?.clientId,
      callId: context?.callId,
    });
  }

  async sendCritical(
    title: string,
    message: string,
    context?: { clientId?: string; callId?: string }
  ): Promise<boolean> {
    return this.send({
      severity: 'critical',
      title: `CRITICAL: ${title}`,
      message,
      clientId: context?.clientId,
      callId: context?.callId,
    });
  }

  async sendWarning(title: string, message: string, context?: { clientId?: string }): Promise<boolean> {
    return this.send({
      severity: 'warning',
      title,
      message,
      clientId: context?.clientId,
    });
  }

  async sendInfo(title: string, message: string): Promise<boolean> {
    return this.send({
      severity: 'info',
      title,
      message,
    });
  }

  private buildPayload(alert: SlackAlert): Record<string, unknown> {
    const blocks: Record<string, unknown>[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${SEVERITY_EMOJI[alert.severity]} ${alert.title}`,
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: alert.message,
        },
      },
    ];

    if (alert.fields && alert.fields.length > 0) {
      const fieldElements = alert.fields.map((f) => ({
        type: 'mrkdwn',
        text: `*${f.name}:*\n${f.value}`,
      }));

      blocks.push({
        type: 'section',
        fields: fieldElements.slice(0, 10),
      });
    }

    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `*Time:* ${new Date().toISOString()} | *Environment:* ${env.NODE_ENV}`,
        },
      ],
    });

    return {
      attachments: [
        {
          color: SEVERITY_COLORS[alert.severity],
          blocks,
        },
      ],
    };
  }
}

export const slackService = new SlackAlertService();
