/**
 * Webhook Idempotency Service
 * Prevents duplicate webhook processing using call_id + event_type combination.
 */
import { db } from '../../config/database';
import { webhookEvents, generateIdempotencyKey } from '../../db/schema/webhookEvents';
import { eq } from 'drizzle-orm';
import { logger } from '../../utils/logger';

export interface IdempotencyCheckResult {
  isDuplicate: boolean;
  existingEventId?: string;
  processedAt?: Date;
}

export class WebhookIdempotencyService {
  /**
   * Check if a webhook event has already been processed.
   * Returns isDuplicate: true if this event was already handled.
   */
  async check(
    clientId: string,
    callId: string,
    eventType: string
  ): Promise<IdempotencyCheckResult> {
    const idempotencyKey = generateIdempotencyKey(clientId, callId, eventType);

    try {
      const existing = await db
        .select({
          id: webhookEvents.id,
          processed: webhookEvents.processed,
          processedAt: webhookEvents.processedAt,
        })
        .from(webhookEvents)
        .where(eq(webhookEvents.idempotencyKey, idempotencyKey))
        .limit(1);

      if (existing.length > 0) {
        logger.info({
          idempotencyKey,
          existingEventId: existing[0].id,
          wasProcessed: existing[0].processed,
        }, 'Duplicate webhook detected');

        return {
          isDuplicate: true,
          existingEventId: existing[0].id,
          processedAt: existing[0].processedAt || undefined,
        };
      }

      return { isDuplicate: false };
    } catch (error) {
      // On error, allow processing (fail open) to avoid blocking legitimate events
      logger.error({ error, idempotencyKey }, 'Idempotency check failed, allowing event');
      return { isDuplicate: false };
    }
  }

  /**
   * Record a webhook event with its idempotency key.
   * Call this BEFORE processing to claim the event.
   */
  async record(
    clientId: string,
    callId: string,
    eventType: string,
    payload: unknown
  ): Promise<string> {
    const idempotencyKey = generateIdempotencyKey(clientId, callId, eventType);

    try {
      const [event] = await db
        .insert(webhookEvents)
        .values({
          eventType,
          retellCallId: callId,
          clientId,
          idempotencyKey,
          payload,
          processed: false,
        })
        .returning({ id: webhookEvents.id });

      return event.id;
    } catch (error: any) {
      // Check for unique constraint violation (duplicate)
      if (error.code === '23505' || error.message?.includes('unique constraint')) {
        logger.info({ idempotencyKey }, 'Concurrent duplicate detected via constraint');
        throw new DuplicateWebhookError(idempotencyKey);
      }
      throw error;
    }
  }

  /**
   * Mark a webhook event as processed.
   */
  async markProcessed(eventId: string): Promise<void> {
    await db
      .update(webhookEvents)
      .set({
        processed: true,
        processedAt: new Date(),
      })
      .where(eq(webhookEvents.id, eventId));
  }

  /**
   * Combined check-and-record operation.
   * Returns the event ID if new, throws DuplicateWebhookError if duplicate.
   */
  async checkAndRecord(
    clientId: string,
    callId: string,
    eventType: string,
    payload: unknown
  ): Promise<{ eventId: string; isDuplicate: false } | { isDuplicate: true }> {
    // First check if exists
    const checkResult = await this.check(clientId, callId, eventType);
    if (checkResult.isDuplicate) {
      return { isDuplicate: true };
    }

    // Try to record (handles race conditions via unique constraint)
    try {
      const eventId = await this.record(clientId, callId, eventType, payload);
      return { eventId, isDuplicate: false };
    } catch (error) {
      if (error instanceof DuplicateWebhookError) {
        return { isDuplicate: true };
      }
      throw error;
    }
  }
}

/**
 * Error thrown when a duplicate webhook is detected.
 */
export class DuplicateWebhookError extends Error {
  constructor(public idempotencyKey: string) {
    super(`Duplicate webhook: ${idempotencyKey}`);
    this.name = 'DuplicateWebhookError';
  }
}

export const webhookIdempotencyService = new WebhookIdempotencyService();
