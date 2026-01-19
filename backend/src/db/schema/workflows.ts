import { pgTable, uuid, varchar, text, boolean, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';

export const workflowTriggers = pgTable('workflow_triggers', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  n8nWebhookUrl: text('n8n_webhook_url').notNull(),
  triggerEvent: varchar('trigger_event', { length: 100 }), // call_completed | call_booked | high_sentiment
  filterCriteria: jsonb('filter_criteria'), // Conditions to trigger
  isActive: boolean('is_active').notNull().default(true),
  executionCount: integer('execution_count').notNull().default(0),
  lastTriggeredAt: timestamp('last_triggered_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type WorkflowTrigger = typeof workflowTriggers.$inferSelect;
export type NewWorkflowTrigger = typeof workflowTriggers.$inferInsert;
