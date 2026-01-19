import { pgTable, uuid, varchar, text, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';

export const voiceAgents = pgTable('voice_agents', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  retellAgentId: varchar('retell_agent_id', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  industry: varchar('industry', { length: 100 }),
  tone: varchar('tone', { length: 50 }), // AGGRESSIVE | AUTHORITATIVE | EXCLUSIVE | URGENT
  goal: text('goal'),
  traits: text('traits'),
  systemPrompt: text('system_prompt'), // Generated Gemini prompt
  voiceConfig: jsonb('voice_config'), // Retell voice settings
  isActive: boolean('is_active').notNull().default(true),
  deployedAt: timestamp('deployed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type VoiceAgent = typeof voiceAgents.$inferSelect;
export type NewVoiceAgent = typeof voiceAgents.$inferInsert;
