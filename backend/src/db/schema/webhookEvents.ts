import { pgTable, uuid, varchar, boolean, timestamp, jsonb, uniqueIndex } from 'drizzle-orm/pg-core';

export const webhookEvents = pgTable('webhook_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventType: varchar('event_type', { length: 100 }),
  retellCallId: varchar('retell_call_id', { length: 255 }),
  clientId: varchar('client_id', { length: 100 }),
  idempotencyKey: varchar('idempotency_key', { length: 400 }),
  payload: jsonb('payload'),
  processed: boolean('processed').notNull().default(false),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  // Unique index on idempotency key to prevent duplicates
  idempotencyKeyIdx: uniqueIndex('webhook_events_idempotency_key_idx').on(table.idempotencyKey),
}));

export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type NewWebhookEvent = typeof webhookEvents.$inferInsert;

/**
 * Generate an idempotency key for a webhook event.
 * Format: {clientId}:{callId}:{eventType}
 */
export function generateIdempotencyKey(
  clientId: string,
  callId: string,
  eventType: string
): string {
  return `${clientId}:${callId}:${eventType}`;
}
