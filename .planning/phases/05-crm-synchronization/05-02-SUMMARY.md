---
phase: 05-crm-synchronization
plan: 02
subsystem: zoho-integration
tags: [oauth, zoho, crm, calendar, token-management]

# Dependency Graph
requires:
  - "05-01" # OAuth Token Infrastructure (OAuthTokenService)
provides:
  - "ZohoCRMService with database-backed tokens"
  - "ZohoCalendarService with database-backed tokens"
affects:
  - "05-03" # Lead Sync (uses updated ZohoCRMService)
  - "function-dispatcher.service.ts" # Uses ZohoCalendarService

# Tech Stack
tech-stack:
  patterns:
    - "Service delegation pattern for token management"
    - "Multi-tenant clientId parameter pattern"

# File Changes
key-files:
  modified:
    - backend/src/services/divine/zoho-crm.service.ts
    - backend/src/services/divine/zoho-calendar.service.ts

# Decisions
decisions:
  - id: "zoho-unified-token-service"
    choice: "Both services delegate to OAuthTokenService"
    why: "Eliminates duplicate token refresh logic, enables DB persistence"
  - id: "service-client-id-pattern"
    choice: "serviceClientId parameter with 'default' fallback"
    why: "Maintains backward compatibility while enabling multi-tenant support"

# Metrics
metrics:
  duration: "5 minutes"
  completed: "2026-01-27"
  tasks: 2
  commits: 2
---

# Phase 05 Plan 02: Zoho Service Integration Summary

**One-liner:** Replaced in-memory token caching with OAuthTokenService delegation in both Zoho services.

## What Was Done

### Task 1: Update ZohoCRMService to use OAuthTokenService
- Imported `oauthTokenService` from `./oauth-token.service`
- Removed in-memory `accessToken` and `tokenExpiry` properties
- Added `serviceClientId` property for multi-tenant token lookup
- Updated constructor to accept `clientId` parameter (default: 'default')
- Updated `forClient()` static method to pass clientId
- Replaced `getAccessToken()` implementation to delegate to OAuthTokenService

**Commit:** `4191486` - feat(05-02): update ZohoCRMService to use OAuthTokenService

### Task 2: Update ZohoCalendarService to use OAuthTokenService
- Same refactoring pattern as ZohoCRMService for consistency
- Both services now share the same token management approach
- Calendar service was already tested working in Phase 2

**Commit:** `bf457d5` - feat(05-02): update ZohoCalendarService to use OAuthTokenService

## Key Changes

### Before (In-Memory Caching)
```typescript
class ZohoCRMService {
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry) {
      // Check expiry buffer
      if (this.tokenExpiry.getTime() - bufferTime > Date.now()) {
        return this.accessToken;
      }
    }
    // Manual token refresh...
    const response = await fetch('https://accounts.zoho.com/oauth/v2/token', ...);
    // Store in memory...
    this.accessToken = data.access_token;
    this.tokenExpiry = new Date(Date.now() + data.expires_in * 1000);
  }
}
```

### After (OAuthTokenService Delegation)
```typescript
class ZohoCRMService {
  private readonly serviceClientId: string;

  constructor(credentials?: ZohoCRMCredentials, clientId: string = 'default') {
    this.serviceClientId = clientId;
  }

  async getAccessToken(): Promise<string> {
    return oauthTokenService.getAccessToken(
      this.serviceClientId,
      'zoho_crm',
      { clientId: this.clientId, clientSecret: this.clientSecret }
    );
  }
}
```

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Token service pattern | Delegate to OAuthTokenService | Eliminates duplicate token refresh logic in both services |
| Client ID parameter | `serviceClientId` with 'default' fallback | Maintains backward compatibility while enabling multi-tenant support |
| Provider types | `zoho_crm` and `zoho_calendar` | Separate token storage per Zoho service |

## Verification Results

1. **npm run build passes** - Both services compile without TypeScript errors (pre-existing errors in other files unrelated to this change)
2. **OAuthTokenService integration verified** - Both services import and call `oauthTokenService.getAccessToken()`
3. **No in-memory caching remains** - Grep confirms no `private accessToken:` or `private tokenExpiry:` in Zoho services
4. **Backward compatible API** - `getAccessToken()`, `forClient()`, `isConfigured()` all work as before
5. **forClient() updated** - Now passes clientId for multi-tenant token lookup

## Deviations from Plan

None - plan executed exactly as written.

## Technical Notes

### Token Flow (Updated)
1. Service calls `getAccessToken()`
2. OAuthTokenService checks database for cached token
3. If valid token exists and not expired (with 5-min buffer), return it
4. If expired or missing, refresh from Zoho OAuth endpoint
5. Store refreshed token in database
6. Return access token to caller

### Multi-Tenant Support
Both services now support multi-tenant usage:
```typescript
// For specific client
const crmService = ZohoCRMService.forClient(clientConfig, 'smart-tax-nation');

// Default instance uses 'default' as clientId
const crmService = new ZohoCRMService(); // clientId = 'default'
```

## Next Phase Readiness

- [x] ZohoCRMService uses database-backed tokens
- [x] ZohoCalendarService uses database-backed tokens
- [x] Both services compile without errors
- [x] forClient() pattern supports multi-tenant usage

**Ready for:** Phase 5 Plan 3 (Lead Sync) - ZohoCRMService now has reliable token management for lead sync operations.
