# Phase 5: CRM Synchronization - Research

**Researched:** 2026-01-27
**Domain:** Zoho CRM API Integration, OAuth Token Management
**Confidence:** HIGH

## Summary

The CRM synchronization infrastructure is **already substantially built**. The `zoho-crm.service.ts` provides a complete, working service with methods for lead creation, updates, phone-based lookup, and note attachment. The `post-call-processor.ts` already integrates CRM sync at step 7 of its processing pipeline. The customer table has `crmId` and `crmProvider` fields ready for tracking sync status.

The primary work remaining is:
1. **OAuth Token Management** - Current implementation uses in-memory token caching that expires on server restart; need database-backed tokens per the existing `db-backed-oauth-tokens.md` TODO
2. **Smart Tax Nation Configuration** - Client config has `zoho_crm_enabled: true` but credentials are null (commented as "testing with XLNC dev account")
3. **Enhanced Sync Logic** - Add appointment data sync, more comprehensive lead field mapping
4. **Error Monitoring** - Leverage existing error monitor service for CRM-specific alerts

**Primary recommendation:** Focus on database-backed OAuth tokens first (blocker), then configure Smart Tax Nation credentials, then add appointment sync to existing CRM integration.

## Existing Infrastructure

### Zoho CRM Service (`zoho-crm.service.ts`)

**Status:** FULLY IMPLEMENTED and in use

| Method | Purpose | Status |
|--------|---------|--------|
| `isConfigured()` | Check if credentials exist | Working |
| `getAccessToken()` | OAuth token refresh with 5-min buffer | Working, in-memory only |
| `findByPhone(phone)` | Search leads by phone | Working |
| `createLead(leadData)` | Create new CRM lead | Working |
| `updateLead(id, leadData)` | Update existing lead | Working |
| `getById(id)` | Get lead by ID | Working |
| `addNote(leadId, content, title)` | Add note to lead | Working |
| `getOrCreateByPhone(phone, defaults)` | Find or create lead | Working |
| `forClient(config)` | Create client-specific instance | Working |

**LeadData Interface:**
```typescript
interface LeadData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone: string;
  company?: string;
  leadSource?: string;
  description?: string;
  customFields?: Record<string, unknown>;
}
```

### Post-Call Processor Integration

**Location:** `post-call-processor.ts`, lines 70-94

**Current Flow:**
```
1. Get/create customer
2. Build transcript text
3. Classify intent with Claude AI
4. PRISM behavioral analysis
5. Update customer PRISM scores
6. Update conversation record
7. >>> SYNC TO CRM <<< (if configured)
8. Determine follow-up (booking/nurture)
```

**Current CRM Sync Logic (step 7):**
```typescript
if (zohoCRMService.isConfigured()) {
  try {
    const lead = await zohoCRMService.getOrCreateByPhone(data.phone, {
      leadSource: 'Voice AI',
      description: `Last call: ${data.summary || 'No summary'}`,
    });

    await zohoCRMService.addNote(
      lead.id,
      `Call Summary:\n${data.summary}\n\nIntent: ${intent}\n\nDuration: ${Math.round(durationMs / 1000)}s`,
      `Voice AI Call - ${new Date().toLocaleDateString()}`
    );

    // Update customer with CRM ID
    if (!customer.crmId) {
      await customerService.update(customer.id, {
        crmId: lead.id,
        crmProvider: 'zoho',
      });
    }
  } catch (error) {
    logger.error({ error, callId }, 'CRM sync failed');
  }
}
```

**Assessment:** Working but minimal - needs enhanced field mapping and appointment sync.

### Zoho Calendar Service Pattern (`zoho-calendar.service.ts`)

Uses identical OAuth pattern as CRM service:
- Same token endpoint: `https://accounts.zoho.com/oauth/v2/token`
- Same refresh flow with grant_type: 'refresh_token'
- Same in-memory caching with 5-minute buffer before expiry
- Same `forClient()` pattern for multi-tenant support

Can share OAuth infrastructure between Calendar and CRM services.

## Data Model Analysis

### Customer Table Schema

| Field | Type | Purpose | CRM-Relevant |
|-------|------|---------|--------------|
| `id` | UUID | Primary key | No |
| `clientId` | VARCHAR(255) | Multi-tenant identifier | Yes - scope filter |
| `phone` | VARCHAR(50) | Customer phone | Yes - CRM lookup key |
| `email` | VARCHAR(255) | Customer email | Yes - sync to CRM |
| `name` | VARCHAR(255) | Customer name | Yes - sync to CRM |
| `prism_*` | INTEGER (x6) | PRISM scores | Yes - custom fields |
| `totalCalls` | INTEGER | Call count | Yes - custom field |
| `lastCallAt` | TIMESTAMP | Last contact | Yes - custom field |
| `crmId` | VARCHAR(255) | Zoho Lead ID | Yes - sync tracking |
| `crmProvider` | VARCHAR(50) | 'zoho'/'salesforce'/etc | Yes - provider indicator |
| `metadata` | JSONB | Extra data | Optional |
| `tags` | JSONB | Customer tags | Yes - CRM tags |

**No dedicated CRM sync tracking table exists.** The `crmId` field on customers is the only sync tracking mechanism.

### Conversation Table (call data to sync)

| Field | CRM Sync Candidate |
|-------|-------------------|
| `intent` | Lead custom field |
| `sentiment` | Lead custom field |
| `summary` | Note content |
| `extractedData` | Appointment details, preferences |

### Types Already Defined

From `divine.types.ts`:
- `PostCallActionSchema` includes `'crm_sync'` as valid type
- `CustomerContextSchema` includes `crmId`, `crmProvider`, `leadScore`, `lifetimeValue`
- `ClientMetricsSchema` includes `crmMetrics: { leadsCreated, leadsUpdated, syncErrors }`

## OAuth Pattern

### Current Implementation

Both `zoho-calendar.service.ts` and `zoho-crm.service.ts` use:

```typescript
private accessToken: string | null = null;
private tokenExpiry: Date | null = null;

async getAccessToken(): Promise<string> {
  // Check if token is valid with 5-min buffer
  if (this.accessToken && this.tokenExpiry) {
    const bufferTime = 5 * 60 * 1000;
    if (this.tokenExpiry.getTime() - bufferTime > Date.now()) {
      return this.accessToken;
    }
  }

  // Refresh token
  const response = await fetch('https://accounts.zoho.com/oauth/v2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: this.refreshToken,
    }),
  });

  // Parse and cache
  this.accessToken = data.access_token;
  this.tokenExpiry = new Date(Date.now() + data.expires_in * 1000);
}
```

### Known Issues

1. **In-Memory Only:** Tokens lost on server restart/redeploy
2. **No Persistence:** Cannot proactively refresh before expiry
3. **Single-Instance:** Won't work in multi-instance deployment
4. **No Refresh Token Rotation:** Zoho may return new refresh_token which is not captured

### Proposed Solution (from `db-backed-oauth-tokens.md`)

```sql
CREATE TABLE oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id VARCHAR(255) NOT NULL,
  provider VARCHAR(50) NOT NULL, -- 'zoho_crm', 'zoho_calendar'
  access_token TEXT,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMP,
  scopes TEXT[],
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(client_id, provider)
);
```

## Smart Tax Nation Configuration

**File:** `backend/config/clients/smart-tax-nation.json`

```json
{
  "client_id": "smart-tax-nation",
  "zoho_calendar_id": "c349f76861954b919e182591808d02b9",
  "zoho_client_id": null,        // <-- Needs configuration
  "zoho_client_secret": null,    // <-- Needs configuration
  "zoho_refresh_token": null,    // <-- Needs configuration
  "zoho_crm_enabled": true       // <-- Flag is set
}
```

**Comment in config:** "TESTING: Using XLNC dev account. For production, replace with client's Zoho credentials."

**Environment Variables Available:**
- `ZOHO_CLIENT_ID`
- `ZOHO_CLIENT_SECRET`
- `ZOHO_REFRESH_TOKEN`
- `ZOHO_CALENDAR_ID`

These are used as fallbacks when client config values are null.

## Gaps Identified

### 1. OAuth Token Persistence (BLOCKER)

| Gap | Impact | Solution |
|-----|--------|----------|
| Tokens in memory only | Lost on deploy | Add `oauth_tokens` table |
| No refresh token capture | Silent failures after ~60 days | Save new refresh_token from response |
| No proactive refresh | Token may expire mid-request | Scheduled job to refresh before expiry |

### 2. Appointment Data Not Synced

Currently, post-call processor syncs:
- Lead creation with phone
- Call summary as Note

**Not synced:**
- Appointment time (from `extractedData.appointment_time`)
- Appointment type
- Customer name (when provided)
- Customer email (when provided)
- PRISM scores as custom fields

### 3. No CRM Sync Status Tracking

No table to track:
- When lead was last synced
- Sync success/failure history
- What fields were synced
- Delta sync (only sync changed fields)

### 4. No CRM Read-Back

System doesn't:
- Pull lead status changes from CRM
- Sync CRM contact updates back to customer table
- Detect lead conversion to contact

### 5. Error Recovery

Current implementation:
- Logs error and continues (`logger.error`)
- No retry mechanism
- No dead letter queue for failed syncs
- No Slack alert on CRM failure

Should leverage existing `errorMonitorService` pattern.

## Recommended Approach

### Phase 5 Scope (Minimal Viable)

1. **Add `oauth_tokens` table** (required for production)
2. **Create `OAuthTokenService`** to manage token refresh with DB persistence
3. **Update `ZohoCRMService`** to use `OAuthTokenService`
4. **Configure Smart Tax Nation credentials** (or use shared dev credentials)
5. **Enhance lead data sync** to include appointment info
6. **Add CRM error alerting** via `slackService`

### Out of Scope for Phase 5

- CRM read-back / bidirectional sync
- Comprehensive sync status tracking table
- Multi-CRM provider support (Salesforce, HubSpot)
- CRM webhook listeners

### Task Breakdown

| Task | Type | Dependencies |
|------|------|--------------|
| Create `oauth_tokens` schema | Database | None |
| Create `OAuthTokenService` | Service | Schema |
| Update `ZohoCRMService` to use token service | Refactor | OAuthTokenService |
| Update `ZohoCalendarService` to use token service | Refactor | OAuthTokenService |
| Configure Smart Tax Nation Zoho credentials | Config | None |
| Enhance post-call CRM sync with appointment data | Feature | CRM service working |
| Add CRM sync error alerting | Feature | Slack service |
| Test end-to-end CRM flow | Testing | All above |

## Risk Assessment

### High Risk

| Risk | Mitigation |
|------|------------|
| Zoho refresh token expires | Implement proactive refresh; alert on failure |
| Zoho API rate limits | Add retry with exponential backoff |
| CRM sync fails silently | Use error monitor service; Slack alerts |

### Medium Risk

| Risk | Mitigation |
|------|------------|
| Duplicate leads created | Use `getOrCreateByPhone` (already implemented) |
| Token stolen from database | Encrypt sensitive columns |
| Deploy breaks tokens | DB persistence solves this |

### Low Risk

| Risk | Mitigation |
|------|------------|
| Zoho API changes | Pin to v3 API; monitor deprecation notices |
| Performance impact | Async processing already in place |

## Error Handling Patterns

### Existing Pattern (from `queue-processor.service.ts`)

```typescript
// Retry with exponential backoff
const attempts = (message.attempts || 0) + 1;
const maxAttempts = message.maxAttempts || 3;

if (attempts >= maxAttempts) {
  // Move to dead letter
  await slackService.sendError('Message Moved to Dead Letter Queue', ...);
} else {
  // Schedule retry
  const nextRetry = new Date(Date.now() + retryDelayMs);
  await db.update(messageQueue).set({ scheduledFor: nextRetry, attempts });
}
```

### Recommended CRM Error Pattern

```typescript
// In post-call-processor.ts
if (zohoCRMService.isConfigured()) {
  try {
    await this.syncToCRM(data, customer, intent);
  } catch (error) {
    // Log to error monitor (already exists)
    await errorMonitorService.logError('ZohoCRM', 'sync', error, {
      clientId: data.clientId,
      callId: data.callId,
      severity: 'error',
    });

    // Alert via Slack
    await slackService.sendError('CRM Sync Failed',
      `Lead sync failed for call ${data.callId}`,
      { clientId: data.clientId, callId: data.callId, error }
    );

    // Continue processing - graceful degradation
  }
}
```

## Code Examples

### OAuth Token Service Pattern

```typescript
// Source: Derived from zoho-calendar.service.ts + db-backed-oauth-tokens.md
class OAuthTokenService {
  async getAccessToken(clientId: string, provider: string): Promise<string> {
    // 1. Check database for existing token
    const stored = await db.select().from(oauthTokens)
      .where(and(eq(oauthTokens.clientId, clientId), eq(oauthTokens.provider, provider)))
      .limit(1);

    if (stored[0]) {
      // Check if still valid
      const bufferMs = 5 * 60 * 1000;
      if (stored[0].tokenExpiry && stored[0].tokenExpiry.getTime() - bufferMs > Date.now()) {
        return stored[0].accessToken!;
      }
      // Refresh using stored refresh_token
      return this.refreshAndStore(clientId, provider, stored[0].refreshToken);
    }

    // No stored token - fall back to env vars or throw
    throw new Error(`No OAuth token found for ${clientId}/${provider}`);
  }

  private async refreshAndStore(clientId: string, provider: string, refreshToken: string): Promise<string> {
    const response = await fetch('https://accounts.zoho.com/oauth/v2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: env.ZOHO_CLIENT_ID || '',
        client_secret: env.ZOHO_CLIENT_SECRET || '',
        refresh_token: refreshToken,
      }),
    });

    const data = await response.json() as {
      access_token: string;
      expires_in: number;
      refresh_token?: string; // Zoho may return new refresh token
    };

    // Update database
    await db.update(oauthTokens)
      .set({
        accessToken: data.access_token,
        tokenExpiry: new Date(Date.now() + data.expires_in * 1000),
        refreshToken: data.refresh_token || refreshToken, // Save new if provided
        updatedAt: new Date(),
      })
      .where(and(eq(oauthTokens.clientId, clientId), eq(oauthTokens.provider, provider)));

    return data.access_token;
  }
}
```

### Enhanced Lead Sync

```typescript
// Enhanced sync with appointment data
async function syncToCRM(
  data: PostCallData,
  customer: Customer,
  intent: string,
  entities: Record<string, string>
): Promise<void> {
  const lead = await zohoCRMService.getOrCreateByPhone(data.phone, {
    firstName: customer.name?.split(' ')[0] || undefined,
    lastName: customer.name?.split(' ').slice(1).join(' ') || undefined,
    email: customer.email || undefined,
    leadSource: 'Voice AI',
    description: `Last call: ${data.summary || 'No summary'}`,
    customFields: {
      Total_Calls: customer.totalCalls,
      Last_Intent: intent,
      PRISM_Dominant: getDominantPRISMNeed(customer),
    },
  });

  // Add note with call details
  const noteContent = [
    `Call Summary:\n${data.summary || 'No summary'}`,
    `Intent: ${intent}`,
    `Duration: ${Math.round((data.durationMs || 0) / 1000)}s`,
  ];

  // Include appointment if booked
  if (entities['appointment_time']) {
    noteContent.push(`Appointment: ${entities['appointment_time']}`);
    if (entities['appointment_type']) {
      noteContent.push(`Type: ${entities['appointment_type']}`);
    }
  }

  await zohoCRMService.addNote(
    lead.id,
    noteContent.join('\n\n'),
    `Voice AI Call - ${new Date().toLocaleDateString()}`
  );

  // Link customer to CRM
  if (!customer.crmId) {
    await customerService.update(customer.id, {
      crmId: lead.id,
      crmProvider: 'zoho',
    });
  }
}
```

## Sources

### Primary (HIGH confidence)
- `D:/xlnc-perception/backend/src/services/divine/zoho-crm.service.ts` - Existing CRM service implementation
- `D:/xlnc-perception/backend/src/services/divine/zoho-calendar.service.ts` - OAuth pattern reference
- `D:/xlnc-perception/backend/src/services/divine/post-call-processor.ts` - Integration point
- `D:/xlnc-perception/backend/src/db/schema/customers.ts` - Customer data model
- `D:/xlnc-perception/.planning/todos/pending/db-backed-oauth-tokens.md` - Token persistence proposal

### Secondary (MEDIUM confidence)
- `D:/xlnc-perception/backend/config/clients/smart-tax-nation.json` - Client configuration
- `D:/xlnc-perception/backend/src/config/env.ts` - Environment variable definitions
- `D:/xlnc-perception/backend/src/services/divine/error-monitor.service.ts` - Error handling pattern
- `D:/xlnc-perception/backend/src/services/divine/queue-processor.service.ts` - Retry/dead-letter pattern

## Metadata

**Confidence breakdown:**
- Existing infrastructure: HIGH - Direct code review
- OAuth pattern: HIGH - Direct code review of both Zoho services
- Gaps identified: HIGH - Comparison of TODO doc vs implementation
- Recommended approach: MEDIUM - Based on codebase patterns and TODO doc

**Research date:** 2026-01-27
**Valid until:** 2026-02-27 (stable domain, existing implementation)
