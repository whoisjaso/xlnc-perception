import { pgTable, uuid, varchar, text, integer, decimal, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';

export const callLogs = pgTable('call_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  retellCallId: varchar('retell_call_id', { length: 255 }).notNull().unique(),
  agentId: varchar('agent_id', { length: 255 }),
  fromNumber: varchar('from_number', { length: 50 }),
  toNumber: varchar('to_number', { length: 50 }),
  callStatus: varchar('call_status', { length: 50 }),
  callOutcome: varchar('call_outcome', { length: 100 }),
  callSummary: text('call_summary'),
  userSentiment: decimal('user_sentiment', { precision: 3, scale: 2 }), // -1.00 to 1.00
  durationMs: integer('duration_ms'),
  costCents: integer('cost_cents'), // Store in cents to avoid float issues
  recordingUrl: text('recording_url'),
  transcript: jsonb('transcript'), // Array of {speaker, text, time}
  metadata: jsonb('metadata'), // Additional Retell metadata
  startTimestamp: timestamp('start_timestamp'),
  endTimestamp: timestamp('end_timestamp'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type CallLog = typeof callLogs.$inferSelect;
export type NewCallLog = typeof callLogs.$inferInsert;
