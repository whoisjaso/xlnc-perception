import { pgTable, uuid, varchar, text, timestamp, jsonb, integer, boolean } from 'drizzle-orm/pg-core';
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

  // Scheduling
  scheduledFor: timestamp('scheduled_for').notNull().defaultNow(),

  // Processing status
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  attempts: integer('attempts').default(0),
  maxAttempts: integer('max_attempts').default(3),
  lastAttemptAt: timestamp('last_attempt_at'),
  lastError: text('last_error'),

  // Provider response
  providerId: varchar('provider_id', { length: 255 }), // Message ID from provider
  providerStatus: varchar('provider_status', { length: 50 }),

  // Metadata
  metadata: jsonb('metadata'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  processedAt: timestamp('processed_at'),
});

export type MessageQueueItem = typeof messageQueue.$inferSelect;
export type NewMessageQueueItem = typeof messageQueue.$inferInsert;
