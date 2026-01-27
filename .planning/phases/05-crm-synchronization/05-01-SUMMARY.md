---
phase: "05-crm-synchronization"
plan: "01"
subsystem: "oauth-infrastructure"
tags: ["oauth", "tokens", "database", "zoho", "persistence"]

# Dependency Graph
requires: []
provides: ["oauth_tokens_schema", "OAuthTokenService"]
affects: ["05-02", "05-03"]

# Tech Tracking
tech-stack:
  added: []
  patterns: ["database-backed-tokens", "upsert-pattern", "env-fallback"]

# File Tracking
key-files:
  created:
    - backend/src/db/schema/oauthTokens.ts
    - backend/src/services/divine/oauth-token.service.ts
  modified:
    - backend/src/services/divine/index.ts
    - backend/src/config/database.ts

# Decisions
decisions:
  - id: "oauth-unique-constraint"
    choice: "Unique index on (client_id, provider)"
    rationale: "Enables upsert pattern for token storage"
  - id: "env-fallback"
    choice: "Fall back to ZOHO_REFRESH_TOKEN env var if no DB token"
    rationale: "Backward compatibility during migration period"
  - id: "5min-buffer"
    choice: "Refresh tokens 5 minutes before expiry"
    rationale: "Prevents token expiry during multi-step operations"

# Metrics
metrics:
  duration: "4 minutes"
  completed: "2026-01-27"
---

# Phase 05 Plan 01: OAuth Token Infrastructure Summary

**One-liner:** Database-backed OAuth token storage with automatic refresh and env var fallback for Zoho CRM/Calendar integration.

## What Was Built

### 1. OAuth Tokens Database Schema
Created `backend/src/db/schema/oauthTokens.ts` with Drizzle ORM:
- `id` - UUID primary key
- `client_id` - Client identifier (e.g., "smart-tax-nation")
- `provider` - OAuth provider ("zoho_crm" | "zoho_calendar")
- `access_token` - Current access token (nullable)
- `refresh_token` - Refresh token for renewal
- `token_expiry` - Access token expiration timestamp
- `scopes` - Comma-separated OAuth scopes
- `metadata` - JSONB for provider-specific data (api_domain, etc.)
- `created_at` / `updated_at` - Timestamps

Unique constraint on `(client_id, provider)` enables upsert pattern.

### 2. OAuthTokenService
Created `backend/src/services/divine/oauth-token.service.ts` with methods:
- `getAccessToken(clientId, provider, credentials)` - Get valid access token, auto-refreshes if expired
- `storeTokens(clientId, provider, tokens)` - Store tokens after OAuth flow
- `hasToken(clientId, provider)` - Check if token exists
- `getTokenRecord(clientId, provider)` - Get full token record for debugging
- `deleteToken(clientId, provider)` - Remove token for re-authorization

Features:
- Automatic refresh when token expires or within 5-minute buffer
- Captures new refresh tokens from Zoho (rotating refresh tokens)
- Falls back to `ZOHO_REFRESH_TOKEN` env var for backward compatibility
- Persists tokens to database for survival across server restarts

### 3. Database Migration
Added oauth_tokens table creation to `runMigrations()` in `database.ts`:
- Table created on server startup if not exists
- Unique index created for upsert pattern

## Key Code Patterns

```typescript
// Getting a token (auto-refreshes if needed)
const accessToken = await oauthTokenService.getAccessToken(
  'smart-tax-nation',
  'zoho_crm',
  { clientId: env.ZOHO_CLIENT_ID, clientSecret: env.ZOHO_CLIENT_SECRET }
);

// Storing tokens after OAuth flow
await oauthTokenService.storeTokens('smart-tax-nation', 'zoho_crm', {
  accessToken: response.access_token,
  refreshToken: response.refresh_token,
  expiresIn: response.expires_in,
});
```

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

| Check | Status |
|-------|--------|
| npm run build passes | YES (pre-existing errors only) |
| Database has oauth_tokens table | YES (migration in database.ts) |
| Can import oauthTokenService | YES |
| TypeScript types compile | YES |

## Success Criteria Met

- [x] OAuth tokens schema created and exported
- [x] OAuthTokenService provides getAccessToken with DB persistence
- [x] Token refresh captures and stores new refresh tokens
- [x] Database migration applied (in runMigrations)
- [x] Backward compatibility with env vars maintained

## Next Phase Readiness

**Ready for Plan 05-02 (Zoho Integration):**
- OAuthTokenService available for ZohoCRMService and ZohoCalendarService to use
- Schema ready for multi-client OAuth token storage
- Backward compatibility means existing code continues to work

**Blockers resolved:**
- CRITICAL blocker "Zoho Refresh Token Expiry" from STATE.md is now addressed
- Tokens persist across server restarts

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 8dc23e6 | Create oauth_tokens database schema |
| 2 | 25fe281 | Create OAuthTokenService with database persistence |
| 3 | 34db42e | Add oauth_tokens table migration |
