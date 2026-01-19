import { pgTable, uuid, varchar, text, timestamp, jsonb, decimal, integer, boolean } from 'drizzle-orm/pg-core';

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: varchar('client_id', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }).notNull(),
  email: varchar('email', { length: 255 }),
  name: varchar('name', { length: 255 }),

  // PRISM behavioral scores (0-100)
  prismCertainty: integer('prism_certainty').default(50),
  prismVariety: integer('prism_variety').default(50),
  prismSignificance: integer('prism_significance').default(50),
  prismConnection: integer('prism_connection').default(50),
  prismGrowth: integer('prism_growth').default(50),
  prismContribution: integer('prism_contribution').default(50),

  // Aggregated data
  totalCalls: integer('total_calls').default(0),
  lastCallAt: timestamp('last_call_at'),

  // CRM integration
  crmId: varchar('crm_id', { length: 255 }),
  crmProvider: varchar('crm_provider', { length: 50 }), // 'zoho' | 'salesforce' | 'hubspot'

  // Custom metadata
  metadata: jsonb('metadata'),
  tags: jsonb('tags'), // string[]

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Unique constraint on clientId + phone
export const customersClientPhoneIdx = 'customers_client_phone_idx';

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
