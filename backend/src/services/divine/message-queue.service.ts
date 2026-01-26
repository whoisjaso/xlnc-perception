import { db } from '../../config/database';
import { messageQueue, MessageQueueItem, NewMessageQueueItem, MessageType } from '../../db/schema/messageQueue';
import { eq, and, lte, gte, asc, sql } from 'drizzle-orm';
import { logger } from '../../utils/logger';
import { smsService } from './sms.service';
import { emailService } from './email.service';
import { addHours } from 'date-fns';

export class MessageQueueService {
  private processingInterval: NodeJS.Timeout | null = null;

  async enqueue(message: NewMessageQueueItem): Promise<MessageQueueItem> {
    const [queued] = await db.insert(messageQueue).values(message).returning();

    logger.info(
      { messageId: queued.id, channel: message.channel, recipient: message.recipient.slice(-4) },
      'Message queued'
    );

    return queued;
  }

  async enqueueSMS(
    clientId: string,
    recipient: string,
    body: string,
    options?: {
      customerId?: string;
      conversationId?: string;
      scheduledFor?: Date;
      metadata?: Record<string, unknown>;
      messageType?: MessageType;
    }
  ): Promise<MessageQueueItem> {
    return this.enqueue({
      clientId,
      customerId: options?.customerId,
      conversationId: options?.conversationId,
      channel: 'sms',
      recipient,
      body,
      scheduledFor: options?.scheduledFor || new Date(),
      metadata: options?.metadata,
      messageType: options?.messageType,
    });
  }

  async enqueueEmail(
    clientId: string,
    recipient: string,
    subject: string,
    body: string,
    options?: {
      customerId?: string;
      conversationId?: string;
      scheduledFor?: Date;
      metadata?: Record<string, unknown>;
      messageType?: MessageType;
    }
  ): Promise<MessageQueueItem> {
    return this.enqueue({
      clientId,
      customerId: options?.customerId,
      conversationId: options?.conversationId,
      channel: 'email',
      recipient,
      subject,
      body,
      scheduledFor: options?.scheduledFor || new Date(),
      metadata: options?.metadata,
      messageType: options?.messageType,
    });
  }

  async processQueue(): Promise<number> {
    const now = new Date();

    // Get pending messages that are due
    const pending = await db
      .select()
      .from(messageQueue)
      .where(
        and(
          eq(messageQueue.status, 'pending'),
          lte(messageQueue.scheduledFor, now),
          sql`${messageQueue.attempts} < ${messageQueue.maxAttempts}`
        )
      )
      .orderBy(messageQueue.scheduledFor)
      .limit(50);

    let processed = 0;

    for (const message of pending) {
      try {
        await this.processMessage(message);
        processed++;
      } catch (error) {
        logger.error(
          { messageId: message.id, error: error instanceof Error ? error.message : 'Unknown' },
          'Failed to process message'
        );
      }
    }

    if (processed > 0) {
      logger.info({ processed }, 'Message queue batch processed');
    }

    return processed;
  }

  private async processMessage(message: MessageQueueItem): Promise<void> {
    // Mark as processing
    await db
      .update(messageQueue)
      .set({
        attempts: (message.attempts || 0) + 1,
        lastAttemptAt: new Date(),
      })
      .where(eq(messageQueue.id, message.id));

    let result: { success: boolean; messageId?: string; error?: string };

    if (message.channel === 'sms') {
      result = await smsService.send(message.recipient, message.body);
    } else if (message.channel === 'email') {
      result = await emailService.send({
        to: message.recipient,
        subject: message.subject || 'Message',
        body: message.body,
      });
    } else {
      result = { success: false, error: `Unknown channel: ${message.channel}` };
    }

    if (result.success) {
      await db
        .update(messageQueue)
        .set({
          status: 'sent',
          providerId: result.messageId,
          processedAt: new Date(),
        })
        .where(eq(messageQueue.id, message.id));

      logger.info({ messageId: message.id, providerId: result.messageId }, 'Message sent successfully');
    } else {
      const attempts = (message.attempts || 0) + 1;
      const maxAttempts = message.maxAttempts || 3;

      await db
        .update(messageQueue)
        .set({
          status: attempts >= maxAttempts ? 'failed' : 'pending',
          lastError: result.error,
        })
        .where(eq(messageQueue.id, message.id));

      if (attempts >= maxAttempts) {
        logger.error({ messageId: message.id, error: result.error }, 'Message permanently failed');
      }
    }
  }

  startProcessing(intervalMs: number = 10000): void {
    if (this.processingInterval) {
      return;
    }

    this.processingInterval = setInterval(() => {
      this.processQueue().catch((err) => {
        logger.error({ error: err instanceof Error ? err.message : 'Unknown' }, 'Queue processing error');
      });
    }, intervalMs);

    logger.info({ intervalMs }, 'Message queue processing started');
  }

  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
      logger.info('Message queue processing stopped');
    }
  }

  async getQueueStats(clientId?: string): Promise<{
    pending: number;
    sent: number;
    failed: number;
  }> {
    const baseWhere = clientId ? eq(messageQueue.clientId, clientId) : undefined;

    const [pendingResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messageQueue)
      .where(baseWhere ? and(baseWhere, eq(messageQueue.status, 'pending')) : eq(messageQueue.status, 'pending'));

    const [sentResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messageQueue)
      .where(baseWhere ? and(baseWhere, eq(messageQueue.status, 'sent')) : eq(messageQueue.status, 'sent'));

    const [failedResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messageQueue)
      .where(baseWhere ? and(baseWhere, eq(messageQueue.status, 'failed')) : eq(messageQueue.status, 'failed'));

    return {
      pending: Number(pendingResult?.count || 0),
      sent: Number(sentResult?.count || 0),
      failed: Number(failedResult?.count || 0),
    };
  }

  /**
   * Get scheduled messages for the next N hours
   * Returns pending messages where scheduledFor is between now and now + hoursAhead
   */
  async getScheduledMessages(
    hoursAhead: number = 48,
    clientId?: string
  ): Promise<MessageQueueItem[]> {
    const now = new Date();
    const futureLimit = addHours(now, hoursAhead);

    const conditions = [
      eq(messageQueue.status, 'pending'),
      gte(messageQueue.scheduledFor, now),
      lte(messageQueue.scheduledFor, futureLimit),
    ];

    if (clientId) {
      conditions.push(eq(messageQueue.clientId, clientId));
    }

    const messages = await db
      .select()
      .from(messageQueue)
      .where(and(...conditions))
      .orderBy(asc(messageQueue.scheduledFor));

    logger.info(
      { hoursAhead, clientId, count: messages.length },
      'Retrieved scheduled messages'
    );

    return messages;
  }
}

export const messageQueueService = new MessageQueueService();
