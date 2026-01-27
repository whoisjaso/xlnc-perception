import { pgTable, uuid, varchar, text, timestamp, jsonb, uniqueIndex } from 'drizzle-orm/pg-core';

export const oauthTokens = pgTable('oauth_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: varchar('client_id', { length: 255 }).notNull(),
  provider: varchar('provider', { length: 50 }).notNull(), // 'zoho_crm', 'zoho_calendar'

  // Token data
  accessToken: text('access_token'),
  refreshToken: text('refresh_token').notNull(),
  tokenExpiry: timestamp('token_expiry'),

  // Scope tracking
  scopes: text('scopes'), // Comma-separated scopes

  // Provider-specific metadata (api_domain, etc.)
  metadata: jsonb('metadata'),

  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  // Unique constraint on clientId + provider for upsert pattern
  clientProviderUnique: uniqueIndex('oauth_tokens_client_provider_unique').on(table.clientId, table.provider),
}));

export type OAuthToken = typeof oauthTokens.$inferSelect;
export type NewOAuthToken = typeof oauthTokens.$inferInsert;

// Provider type literals for type safety
export type OAuthProvider = 'zoho_crm' | 'zoho_calendar';
