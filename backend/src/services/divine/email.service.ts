import { logger } from '../../utils/logger';
import env from '../../config/env';
import * as nodemailer from 'nodemailer';

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailOptions {
  to: string;
  subject: string;
  body: string;
  html?: string;
  from?: string;
  replyTo?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private readonly defaultFrom: string;

  constructor() {
    this.defaultFrom = env.ZOHO_SMTP_FROM || env.SENDGRID_FROM_EMAIL || '';
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    // Try Zoho SMTP first
    if (env.ZOHO_SMTP_HOST && env.ZOHO_SMTP_USER && env.ZOHO_SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: env.ZOHO_SMTP_HOST,
        port: env.ZOHO_SMTP_PORT || 587,
        secure: env.ZOHO_SMTP_PORT === 465,
        auth: {
          user: env.ZOHO_SMTP_USER,
          pass: env.ZOHO_SMTP_PASS,
        },
      });
      logger.info('Email service initialized with Zoho SMTP');
      return;
    }

    // Fallback to SendGrid if configured
    if (env.SENDGRID_API_KEY) {
      this.transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        auth: {
          user: 'apikey',
          pass: env.SENDGRID_API_KEY,
        },
      });
      logger.info('Email service initialized with SendGrid');
      return;
    }

    logger.warn('Email service not configured - no SMTP credentials found');
  }

  isConfigured(): boolean {
    return this.transporter !== null;
  }

  async send(options: EmailOptions): Promise<SendEmailResult> {
    if (!this.transporter) {
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const result = await this.transporter.sendMail({
        from: options.from || this.defaultFrom,
        to: options.to,
        subject: options.subject,
        text: options.body,
        html: options.html,
        replyTo: options.replyTo,
      });

      logger.info({ messageId: result.messageId, to: options.to }, 'Email sent successfully');

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error({ error: errorMessage, to: options.to }, 'Email send failed');

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async sendFollowUp(
    to: string,
    subject: string,
    body: string,
    customerName?: string
  ): Promise<SendEmailResult> {
    const greeting = customerName ? `Hi ${customerName},` : 'Hi,';
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <p>${greeting}</p>
        <p>${body.replace(/\n/g, '</p><p>')}</p>
        <p style="margin-top: 20px;">Best regards,<br>The Team</p>
      </div>
    `;

    return this.send({
      to,
      subject,
      body: `${greeting}\n\n${body}\n\nBest regards,\nThe Team`,
      html: htmlBody,
    });
  }
}

export const emailService = new EmailService();
