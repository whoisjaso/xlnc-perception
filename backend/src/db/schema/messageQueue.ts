import { pgTable, uuid, varchar, text, timestamp, jsonb, integer, boolean, real } from 'drizzle-orm/pg-core';
import { customers } from './customers';
import { conversations } from './conversations';

export const messageQueue = pgTable('message_queue', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: varchar('client_id', { length: 255 }).notNull(),
  customerId: uuid('customer_id').references(() => customers.id),
  conversationId: uuid('conversation_id').references(() => conversations.id),

  // Message details
  channel: varchar('channel', { length: 20 }).notNull(), // 'sms' | 'email'
  recipient: varchar('recipient', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 500 }), // For emails
  body: text('body').notNull(),

  // Message type categorization
  messageType: varchar('message_type', { length: 50 }), // 'confirmation', 'reminder_24h', 'reminder_1h', 'nurture_day1', 'nurture_day4', 'post_call_followup', 'manual'

  // Scheduling
  scheduledFor: timestamp('scheduled_for').notNull().defaultNow(),

  // Processing status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled' | 'dead_letter'
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  attempts: integer('attempts').default(0),
  maxAttempts: integer('max_attempts').default(3),
  lastAttemptAt: timestamp('last_attempt_at'),
  lastError: text('last_error'),

  // Dead letter handling
  deadLetterAt: timestamp('dead_letter_at'),
  deadLetterReason: text('dead_letter_reason'),

  // Provider response
  providerId: varchar('provider_id', { length: 255 }), // Message ID from provider
  providerStatus: varchar('provider_status', { length: 50 }),
  providerUsed: varchar('provider_used', { length: 50 }), // Which provider actually sent (for failover tracking)

  // Cost tracking
  costCents: real('cost_cents'), // Per-message cost in cents (e.g., 0.75 for SMS segment)

  // Metadata
  metadata: jsonb('metadata'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  processedAt: timestamp('processed_at'),
});

export type MessageQueueItem = typeof messageQueue.$inferSelect;
export type NewMessageQueueItem = typeof messageQueue.$inferInsert;

// Message type literals for type safety
export type MessageType =
  | 'confirmation'
  | 'reminder_24h'
  | 'reminder_1h'
  | 'nurture_day1'
  | 'nurture_day4'
  | 'post_call_followup'
  | 'manual';
