import { pgTable, uuid, varchar, text, timestamp, jsonb, integer, boolean } from 'drizzle-orm/pg-core';
import { customers } from './customers';

export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  clientId: varchar('client_id', { length: 255 }).notNull(),
  callId: varchar('call_id', { length: 255 }).notNull().unique(),

  // Call metadata
  direction: varchar('direction', { length: 20 }), // 'inbound' | 'outbound'
  status: varchar('status', { length: 50 }).notNull().default('in_progress'),
  durationMs: integer('duration_ms'),

  // AI analysis
  intent: varchar('intent', { length: 100 }),
  sentiment: varchar('sentiment', { length: 50 }),
  summary: text('summary'),

  // Transcript
  transcript: jsonb('transcript'), // Array of {role, content, timestamp}

  // Extracted data
  extractedData: jsonb('extracted_data'), // bookings, appointments, preferences

  // Follow-up tracking
  followUpScheduled: boolean('follow_up_scheduled').default(false),
  followUpSentAt: timestamp('follow_up_sent_at'),

  // Timestamps
  startedAt: timestamp('started_at').notNull().defaultNow(),
  endedAt: timestamp('ended_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
