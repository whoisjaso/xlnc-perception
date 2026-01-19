import { pgTable, uuid, varchar, text, timestamp, jsonb, boolean } from 'drizzle-orm/pg-core';
import { users } from './users';

export const errorLogs = pgTable('error_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: varchar('client_id', { length: 255 }),
  userId: uuid('user_id').references(() => users.id),

  // Service info
  service: varchar('service', { length: 100 }).notNull(),
  operation: varchar('operation', { length: 255 }).notNull(),

  // Error details
  errorType: varchar('error_type', { length: 100 }),
  errorMessage: text('error_message').notNull(),
  stackTrace: text('stack_trace'),

  // Context
  context: jsonb('context'),

  // Severity and status
  severity: varchar('severity', { length: 20 }).default('info'), // info, warning, error, critical
  notified: boolean('notified').default(false),
  resolved: boolean('resolved').default(false),
  resolvedAt: timestamp('resolved_at'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type ErrorLog = typeof errorLogs.$inferSelect;
export type NewErrorLog = typeof errorLogs.$inferInsert;
