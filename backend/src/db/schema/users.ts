import { pgTable, uuid, varchar, boolean, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  plan: varchar('plan', { length: 50 }).notNull().default('INITIATE'), // INITIATE | SOVEREIGN | EMPIRE
  isAdmin: boolean('is_admin').notNull().default(false),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  retellApiKeyEncrypted: varchar('retell_api_key_encrypted', { length: 500 }),
  retellAgentId: varchar('retell_agent_id', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
