import { pgTable, uuid, varchar, boolean, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const alertConfigs = pgTable('alert_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  triggerSentimentNegative: boolean('trigger_sentiment_negative').notNull().default(false),
  triggerConversionSuccess: boolean('trigger_conversion_success').notNull().default(false),
  triggerHandoffRequested: boolean('trigger_handoff_requested').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type AlertConfig = typeof alertConfigs.$inferSelect;
export type NewAlertConfig = typeof alertConfigs.$inferInsert;
