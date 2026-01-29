# Database-Backed OAuth Token Storage

**Created:** 2026-01-20
**Source:** Phase 02-03 execution - discovered need during Zoho token refresh

## Problem

Currently, Zoho OAuth tokens are stored in environment variables:
- `ZOHO_REFRESH_TOKEN` in Railway env vars
- Requires manual update when tokens expire
- Not scalable for multi-client architecture
- No automatic token refresh persistence

## Proposed Solution

### 1. Database Schema Addition

Add `oauth_tokens` table:

```sql
CREATE TABLE oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id VARCHAR(255) NOT NULL REFERENCES clients(id),
  provider VARCHAR(50) NOT NULL, -- 'zoho', 'google', etc.
  access_token TEXT,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMP,
  scopes TEXT[], -- Array of granted scopes
  metadata JSONB, -- Provider-specific data (api_domain, etc.)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(client_id, provider)
);
```

### 2. Token Service

Create `backend/src/services/divine/oauth-token.service.ts`:

```typescript
class OAuthTokenService {
  // Get token for client, auto-refresh if expired
  async getAccessToken(clientId: string, provider: string): Promise<string>

  // Store new tokens (called after OAuth flow)
  async storeTokens(clientId: string, provider: string, tokens: TokenData): Promise<void>

  // Update refresh token if provider returns new one
  async updateRefreshToken(clientId: string, provider: string, newToken: string): Promise<void>

  // Check if token needs refresh
  async needsRefresh(clientId: string, provider: string): Promise<boolean>
}
```

### 3. Auto-Refresh on Use

Modify `zoho-calendar.service.ts` to:
1. Check `oauth_tokens` table first
2. Use stored refresh token
3. If Zoho returns new refresh token, save it automatically
4. Fall back to env vars if no DB token (backward compatibility)

### 4. Admin UI for Re-Authorization

Add endpoint and UI for:
- Viewing token status per client
- Triggering re-authorization flow
- Slack/email alert when token refresh fails

## Benefits

- **Multi-client ready**: Each client has their own tokens
- **Self-healing**: Auto-saves new refresh tokens
- **Observable**: Know when tokens expire before they fail
- **Secure**: Tokens in encrypted DB, not plain env vars

## Implementation Estimate

- Database schema: 1 task
- Token service: 2-3 tasks
- Zoho service integration: 1 task
- Admin UI: 2 tasks
- Testing: 1 task

**Suggested Phase:** Add as Phase 8 or integrate into existing Phase 5 (CRM Synchronization)

## References

- Current OAuth flow: `backend/oauth-test.ts`
- Zoho calendar service: `backend/src/services/divine/zoho-calendar.service.ts`
- Client config service: `backend/src/services/divine/client-config.service.ts`
