// Divine Agentic Intelligence System - Real-time Queue Processor
// Processes SMS and email messages with Socket.IO notifications

import { db } from '../../config/database';
import { messageQueue, MessageQueueItem, NewMessageQueueItem } from '../../db/schema/messageQueue';
import { eq, and, lte, desc, sql } from 'drizzle-orm';
import { logger } from '../../utils/logger';
import { smsService } from './sms.service';
import { emailService } from './email.service';
import { slackService } from './slack.service';
import { Server as SocketServer } from 'socket.io';

export interface QueueStats {
  pending: number;
  processing: number;
  sent: number;
  failed: number;
  deadLetter: number;
  avgProcessingTimeMs: number;
}

export interface ProcessingResult {
  messageId: string;
  success: boolean;
  providerId?: string;
  error?: string;
  processingTimeMs: number;
}

export class QueueProcessorService {
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private io: SocketServer | null = null;
  private readonly BATCH_SIZE = 50;
  private readonly PROCESSING_INTERVAL_MS = 5000; // Check every 5 seconds

  setSocketServer(io: SocketServer): void {
    this.io = io;
    logger.info('Socket.IO server attached to queue processor');
  }

  start(): void {
    if (this.processingInterval) {
      logger.warn('Queue processor already running');
      return;
    }

    logger.info('Starting queue processor');
    this.processingInterval = setInterval(
      () => this.processQueue(),
      this.PROCESSING_INTERVAL_MS
    );

    // Process immediately on start
    this.processQueue();
  }

  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      logger.info('Queue processor stopped');
    }
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      // Get pending messages that are due
      const messages = await db
        .select()
        .from(messageQueue)
        .where(
          and(
            eq(messageQueue.status, 'pending'),
            lte(messageQueue.scheduledFor, new Date())
          )
        )
        .orderBy(messageQueue.scheduledFor)
        .limit(this.BATCH_SIZE);

      if (messages.length === 0) {
        this.isProcessing = false;
        return;
      }

      logger.info({ count: messages.length }, 'Processing queued messages');

      // Process in parallel with concurrency limit
      const results = await Promise.allSettled(
        messages.map((msg) => this.processMessage(msg))
      );

      // Emit stats via WebSocket
      if (this.io) {
        const stats = await this.getStats();
        this.io.emit('queue:stats', stats);
      }

      // Log results
      const successful = results.filter((r) => r.status === 'fulfilled' && r.value.success).length;
      const failed = results.filter((r) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length;

      logger.info({ successful, failed }, 'Queue batch processed');
    } catch (error) {
      logger.error({ error }, 'Queue processing error');
    } finally {
      this.isProcessing = false;
    }
  }

  async processMessage(message: MessageQueueItem): Promise<ProcessingResult> {
    const startTime = Date.now();

    // Mark as processing
    await this.updateStatus(message.id, 'processing');

    // Emit real-time update
    if (this.io) {
      this.io.emit('queue:message:processing', {
        messageId: message.id,
        channel: message.channel,
        recipient: message.recipient,
      });
    }

    try {
      let providerId: string | undefined;
      let providerUsed: string | undefined;

      if (message.channel === 'sms') {
        // SMS service has built-in failover (TXT180 -> Twilio or vice versa)
        const result = await smsService.send(message.recipient, message.body);
        if (result.success) {
          providerId = result.messageId;
          providerUsed = result.provider; // Captures which provider actually sent
        } else {
          throw new Error(result.error || 'SMS send failed on all providers');
        }
      } else if (message.channel === 'email') {
        // Email service has built-in failover (Zoho SMTP -> SendGrid)
        const result = await emailService.send({
          to: message.recipient,
          subject: message.subject || 'Message from our team',
          body: message.body,
        });
        if (result.success) {
          providerId = result.messageId;
          providerUsed = 'sendgrid'; // Email service doesn't expose provider, defaulting
        } else {
          throw new Error(result.error || 'Email send failed on all providers');
        }
      } else {
        throw new Error(`Unknown channel: ${message.channel}`);
      }

      const processingTimeMs = Date.now() - startTime;

      // Calculate cost based on channel and message length
      // SMS: ~0.75 cents per 160-char segment (Twilio rate)
      // Email: ~0.1 cents per email (SendGrid rate)
      const costCents = message.channel === 'sms'
        ? Math.ceil(message.body.length / 160) * 0.75
        : 0.1;

      // Mark as sent with provider and cost tracking
      await db
        .update(messageQueue)
        .set({
          status: 'sent',
          providerId,
          providerUsed,
          providerStatus: 'delivered',
          costCents,
          processedAt: new Date(),
          lastAttemptAt: new Date(),
        })
        .where(eq(messageQueue.id, message.id));

      // Emit success
      if (this.io) {
        this.io.emit('queue:message:sent', {
          messageId: message.id,
          channel: message.channel,
          recipient: message.recipient,
          processingTimeMs,
        });
      }

      logger.info(
        {
          messageId: message.id,
          channel: message.channel,
          processingTimeMs,
        },
        'Message sent successfully'
      );

      return {
        messageId: message.id,
        success: true,
        providerId,
        processingTimeMs,
      };
    } catch (error) {
      const processingTimeMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      return this.handleFailure(message, errorMessage, processingTimeMs);
    }
  }

  private async handleFailure(
    message: MessageQueueItem,
    errorMessage: string,
    processingTimeMs: number
  ): Promise<ProcessingResult> {
    const attempts = (message.attempts || 0) + 1;
    const maxAttempts = message.maxAttempts || 3;

    if (attempts >= maxAttempts) {
      // Move to dead letter queue - permanently failed
      const now = new Date();
      await db
        .update(messageQueue)
        .set({
          status: 'dead_letter',
          attempts,
          lastAttemptAt: now,
          lastError: errorMessage,
          deadLetterAt: now,
          deadLetterReason: `Failed after ${attempts} attempts: ${errorMessage}`,
        })
        .where(eq(messageQueue.id, message.id));

      // Send Slack alert
      await slackService.sendError(
        'Message Moved to Dead Letter Queue',
        `${message.channel.toUpperCase()} to ${message.recipient} (messageId: ${message.id}, attempts: ${attempts})`,
        {
          clientId: message.clientId,
          error: new Error(errorMessage),
        }
      );

      // Emit dead letter event
      if (this.io) {
        this.io.emit('queue:message:dead_letter', {
          messageId: message.id,
          channel: message.channel,
          recipient: message.recipient,
          error: errorMessage,
          attempts,
          deadLetterAt: now.toISOString(),
        });
      }

      logger.error(
        {
          messageId: message.id,
          attempts,
          error: errorMessage,
        },
        'Message moved to dead letter queue'
      );

      return {
        messageId: message.id,
        success: false,
        error: errorMessage,
        processingTimeMs,
      };
    }

    // Fixed 1-minute retry intervals (per CONTEXT.md requirements)
    const retryDelayMs = 60 * 1000; // 60 seconds
    const nextRetry = new Date(Date.now() + retryDelayMs);

    await db
      .update(messageQueue)
      .set({
        status: 'pending',
        attempts,
        lastAttemptAt: new Date(),
        lastError: errorMessage,
        scheduledFor: nextRetry,
      })
      .where(eq(messageQueue.id, message.id));

    // Emit retry scheduled
    if (this.io) {
      this.io.emit('queue:message:retry', {
        messageId: message.id,
        channel: message.channel,
        recipient: message.recipient,
        attempts,
        nextRetry: nextRetry.toISOString(),
      });
    }

    logger.warn(
      {
        messageId: message.id,
        attempts,
        nextRetry,
        error: errorMessage,
      },
      'Message retry scheduled'
    );

    return {
      messageId: message.id,
      success: false,
      error: errorMessage,
      processingTimeMs,
    };
  }

  private async updateStatus(id: string, status: string): Promise<void> {
    await db
      .update(messageQueue)
      .set({ status })
      .where(eq(messageQueue.id, id));
  }

  async getStats(): Promise<QueueStats> {
    const counts = await db
      .select({
        status: messageQueue.status,
        count: sql<number>`count(*)::int`,
      })
      .from(messageQueue)
      .groupBy(messageQueue.status);

    const stats: QueueStats = {
      pending: 0,
      processing: 0,
      sent: 0,
      failed: 0,
      deadLetter: 0,
      avgProcessingTimeMs: 0,
    };

    for (const row of counts) {
      if (row.status === 'pending') stats.pending = row.count;
      else if (row.status === 'processing') stats.processing = row.count;
      else if (row.status === 'sent') stats.sent = row.count;
      else if (row.status === 'failed') stats.failed = row.count;
      else if (row.status === 'dead_letter') stats.deadLetter = row.count;
    }

    return stats;
  }

  async getRecentMessages(
    clientId?: string,
    limit: number = 50
  ): Promise<MessageQueueItem[]> {
    const query = db
      .select()
      .from(messageQueue)
      .orderBy(desc(messageQueue.createdAt))
      .limit(limit);

    if (clientId) {
      return query.where(eq(messageQueue.clientId, clientId));
    }

    return query;
  }

  async getFailedMessages(clientId?: string): Promise<MessageQueueItem[]> {
    if (clientId) {
      return db
        .select()
        .from(messageQueue)
        .where(and(eq(messageQueue.status, 'failed'), eq(messageQueue.clientId, clientId)))
        .orderBy(desc(messageQueue.createdAt));
    }

    return db
      .select()
      .from(messageQueue)
      .where(eq(messageQueue.status, 'failed'))
      .orderBy(desc(messageQueue.createdAt));
  }

  async retryMessage(messageId: string): Promise<boolean> {
    const [message] = await db
      .select()
      .from(messageQueue)
      .where(eq(messageQueue.id, messageId))
      .limit(1);

    // Allow retry for both failed and dead_letter messages
    if (!message || (message.status !== 'failed' && message.status !== 'dead_letter')) {
      return false;
    }

    await db
      .update(messageQueue)
      .set({
        status: 'pending',
        attempts: 0,
        scheduledFor: new Date(),
        lastError: null,
        deadLetterAt: null,
        deadLetterReason: null,
      })
      .where(eq(messageQueue.id, messageId));

    logger.info({ messageId, previousStatus: message.status }, 'Message queued for retry');

    // Trigger immediate processing
    this.processQueue();

    return true;
  }

  async cancelMessage(messageId: string): Promise<boolean> {
    const [message] = await db
      .select()
      .from(messageQueue)
      .where(eq(messageQueue.id, messageId))
      .limit(1);

    if (!message || message.status === 'sent') {
      return false;
    }

    await db
      .update(messageQueue)
      .set({ status: 'cancelled' })
      .where(eq(messageQueue.id, messageId));

    logger.info({ messageId }, 'Message cancelled');

    return true;
  }

  async getDeadLetterMessages(clientId?: string): Promise<MessageQueueItem[]> {
    if (clientId) {
      return db
        .select()
        .from(messageQueue)
        .where(and(eq(messageQueue.status, 'dead_letter'), eq(messageQueue.clientId, clientId)))
        .orderBy(desc(messageQueue.deadLetterAt));
    }

    return db
      .select()
      .from(messageQueue)
      .where(eq(messageQueue.status, 'dead_letter'))
      .orderBy(desc(messageQueue.deadLetterAt));
  }
}

export const queueProcessorService = new QueueProcessorService();
