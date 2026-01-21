# Phase 3: Webhook Processing - Research

**Researched:** 2026-01-21
**Domain:** Retell AI Webhook Integration, Customer Memory Management
**Confidence:** HIGH

## Summary

This research phase analyzed the existing codebase infrastructure for Retell AI webhook processing and customer memory management. The codebase has substantial existing implementation covering webhook routing, event handling, customer services, and context building. However, there are gaps between what exists and what the CONTEXT.md decisions require.

**Key findings:**
1. Core webhook infrastructure EXISTS and handles `call_started`, `call_ended`, `call_analyzed` events
2. Customer memory infrastructure EXISTS with PRISM behavioral scoring, but CustomerMemory class in router is a stub
3. `context_request` handling PARTIALLY EXISTS via CentralRouter but needs enhancement for full profile + availability
4. Function call routing EXISTS via separate `/function` endpoint
5. Error alerting is Slack-only - needs email/SMS channels per CONTEXT.md
6. PII masking NOT IMPLEMENTED in logging
7. Response time tracking NOT IMPLEMENTED for <500ms validation
8. Two-way CRM sync PARTIALLY EXISTS (Zoho CRM service exists but no pull mechanism for existing contacts)

**Primary recommendation:** Focus implementation on filling gaps rather than rebuilding - enhance existing services with missing features.

## Current Implementation Analysis

### What EXISTS and is Working

| Component | Location | Status | Completeness |
|-----------|----------|--------|--------------|
| Webhook routes | `backend/src/routes/webhooks.ts` | Working | 90% |
| Webhook handler service | `backend/src/services/divine/webhook-handler.service.ts` | Working | 80% |
| Customer service | `backend/src/services/divine/customer.service.ts` | Working | 85% |
| Conversation service | `backend/src/services/divine/conversation.service.ts` | Working | 90% |
| Context builder | `backend/src/services/divine/context-builder.service.ts` | Working | 75% |
| Function dispatcher | `backend/src/services/divine/function-dispatcher.service.ts` | Working | 85% |
| Central router | `backend/src/core/router.ts` | Working | 70% |
| Post-call processor | `backend/src/services/divine/post-call-processor.ts` | Working | 80% |
| Slack alerting | `backend/src/services/divine/slack.service.ts` | Working | 90% |
| Zoho CRM service | `backend/src/services/divine/zoho-crm.service.ts` | Working | 85% |
| Message queue | `backend/src/services/divine/message-queue.service.ts` | Working | 90% |

### What is MISSING or INCOMPLETE

| Gap | Impact | Priority |
|-----|--------|----------|
| CustomerMemory class is a stub | CentralRouter context_request uses empty data | CRITICAL |
| PII masking in logs | Compliance risk | HIGH |
| Response time tracking | Cannot verify <500ms requirement | HIGH |
| Multi-channel error alerting (email/SMS) | Only Slack implemented | HIGH |
| Idempotent webhook handling | Duplicate processing risk | MEDIUM |
| Two-way CRM sync (pull existing contacts) | Can't greet known CRM contacts | MEDIUM |
| Client-configurable retention | No retention policy implementation | MEDIUM |
| Sensitive data flagging | Complaints not flagged for review | MEDIUM |
| Natural language context summaries | Only structured JSON returned | LOW |

## Retell Webhook Event Types

### Documented Events (Source: [Retell AI Webhook Documentation](https://docs.retellai.com/features/webhook-overview))

| Event | When Triggered | Response Required | Timeout |
|-------|----------------|-------------------|---------|
| `call_started` | Call begins (not triggered if dial fails) | 2xx status | 10s |
| `call_ended` | Call completes, transfers, or errors | 2xx status | 10s |
| `call_analyzed` | Call analysis complete | 2xx status | 10s |
| Inbound webhook | Before inbound call connects | JSON with dynamic_variables | 10s |

### Inbound Webhook Response Format
Source: [Retell Inbound Call Webhook](https://docs.retellai.com/features/inbound-call-webhook)

```typescript
// Request payload
{
  "event": "call_inbound",
  "call_inbound": {
    "agent_id": "agent_12345",
    "from_number": "+12137771234",
    "to_number": "+12137771235"
  }
}

// Response format (for context injection)
{
  "call_inbound": {
    "dynamic_variables": {
      "customer_name": "John",
      "is_returning_customer": "true",
      "last_call_summary": "Discussed pricing options"
    },
    "metadata": { "customerId": "uuid" }
  }
}
```

### Webhook Delivery Specifications
- **Timeout:** 10 seconds
- **Retries:** Up to 3 attempts if no 2xx received
- **Signature:** `x-retell-signature` header for verification
- **IP Allowlist:** 100.20.5.228

## Database Schema Analysis

### customers table (EXISTS)
```typescript
// Full profile storage SUPPORTED
{
  id, clientId, phone, email, name,
  prismCertainty, prismVariety, prismSignificance,
  prismConnection, prismGrowth, prismContribution,  // PRISM scores
  totalCalls, lastCallAt,
  crmId, crmProvider,
  metadata, tags,  // Extensible storage
  createdAt, updatedAt
}
```

**Gap:** No fields for: preferences, notes, appointment history, sentiment trends

### conversations table (EXISTS)
```typescript
{
  id, customerId, clientId, callId,
  direction, status, durationMs,
  intent, sentiment, summary,
  transcript,  // JSONB for full transcript
  extractedData,  // JSONB for bookings, appointments, etc.
  followUpScheduled, followUpSentAt,
  startedAt, endedAt, createdAt
}
```

**Status:** Good for call history storage

### webhookEvents table (EXISTS)
```typescript
{
  id, eventType, retellCallId,
  payload,  // Full raw payload stored
  processed,  // Boolean flag
  createdAt
}
```

**Gap:** No clientId column (already added in routes but not schema), no idempotency key

## Architecture Patterns

### Current Webhook Flow
```
POST /api/webhooks/retell/:clientId
    |
    v
webhooks.ts (route handler)
    |-- Store raw event in webhookEvents
    |-- Process call_ended/call_analyzed (update callLogs)
    |-- Pass to CentralRouter
    |
    v
CentralRouter.route(event, config)
    |-- call_started: noop
    |-- call_ended: parallel actions (SMS, email, CRM)
    |-- context_request: build and return context
    |-- function_call_invoked: noop (handled by separate endpoint)
    |
    v
Response to Retell
```

### Function Call Flow (Separate)
```
POST /api/webhooks/retell/:clientId/function
    |
    v
FunctionDispatcherService.dispatch(payload, config)
    |-- Validate with Zod schema
    |-- Route to specific handler
    |-- Return response for agent to speak
```

### Context Builder Flow
```
contextBuilderService.buildContext(phone, config)
    |
    v
customerService.getByPhone(phone)
    |-- Found: buildReturningCustomerContext()
    |-- Not found: buildNewCustomerContext()
    |
    v
Return dynamic variables object
```

## Gaps Analysis

### 1. CustomerMemory Stub (CRITICAL)

**Location:** `backend/src/services/memory/customer.ts`

```typescript
// Current implementation - STUB
export class CustomerMemory {
    async getHistory(_phoneNumber: string): Promise<any> {
        return {};  // Returns empty object!
    }
}
```

**Impact:** CentralRouter.handleContextRequest uses this for returning customer context - returns empty data.

**Fix:** CustomerMemory should use customerService and conversationService to fetch real data.

### 2. Dual Context Building Systems

Two separate context building paths exist:
1. `contextBuilderService` - Used by webhook-handler.service (comprehensive)
2. `CentralRouter.handleContextRequest` - Uses broken CustomerMemory (incomplete)

**Impact:** Inconsistent context depending on code path.

**Fix:** Unify on contextBuilderService, deprecate CustomerMemory class.

### 3. Missing Response Time Tracking

**Requirement:** Response time <500ms for context_request

**Current:** No timing measurement for context_request specifically.

**What EXISTS:** webhook-handler.service tracks processingTime but not exposed/logged for monitoring.

**Fix:** Add explicit timing for context_request with alerting if >500ms.

### 4. Missing PII Masking

**Requirement:** Mask always - show last 4 digits of phone, redact names in logs

**Current:** Logs contain full phone numbers and names.

```typescript
// Current - EXPOSES PII
logger.info({ customerId: newCustomer.id, phone: phone.slice(-4) }, 'New customer created');
// This one masks, but most don't
```

**Fix:** Create logging wrapper that auto-masks PII fields.

### 5. Idempotent Handling Missing

**Requirement:** Idempotent handling

**Current:** No deduplication check - duplicate webhooks processed twice.

**Fix:** Add idempotency key (call_id + event_type) check before processing.

### 6. Multi-Channel Alerting Not Implemented

**Requirement:** Multi-channel - Slack, email, and SMS for critical errors

**Current:** Only Slack alerts implemented.

**Fix:** Extend slackService or create unified alertingService with multiple channels.

## Context Response Requirements

Per CONTEXT.md decisions, context_request should return:

### Structured JSON
```typescript
{
  // Customer profile
  customer_name: string,
  is_returning_customer: boolean,
  total_calls: number,
  last_contact: string,

  // Call history context
  last_call_summary: string,
  conversation_notes: string,

  // Psychological profile (PRISM)
  dominant_need: string,
  psychological_profile: string,

  // Calendar availability (if booking enabled)
  available_today: string,
  available_tomorrow: string,
  has_availability: boolean,
  next_available: string,

  // Business context
  business_hours: string,
  special_instructions: string,

  // Dynamic variables (client-configurable)
  ...clientConfig.dynamic_variables
}
```

### Natural Language Summary (MISSING)
Currently not implemented. Need to add:
```typescript
{
  greeting_context: "Welcome back, Jason! Last time we discussed bookkeeping. You have an appointment next Tuesday.",
  customer_summary: "Returning customer, 5 previous calls, interested in pricing, positive sentiment history."
}
```

## Don't Hand-Roll

| Problem | Existing Solution | Notes |
|---------|-------------------|-------|
| Webhook signature verification | `verifyRetellSignature()` in webhooks.ts | Already implemented |
| Customer lookup/creation | `customerService.getOrCreate()` | Works well |
| Conversation tracking | `conversationService` | Comprehensive |
| Calendar integration | `ZohoCalendarService` | Working |
| Message queuing | `messageQueueService` | Has retry logic |
| Zod validation | Schemas in `types/retell.types.ts` | Use existing |

## Common Pitfalls

### Pitfall 1: Webhook Timeout (10 seconds)
**What goes wrong:** Heavy processing blocks response, causing retries
**Why it happens:** Database queries + external API calls take too long
**How to avoid:** Return 2xx immediately, use background processing (setImmediate pattern already used)
**Warning signs:** Retell retry attempts in logs

### Pitfall 2: Race Conditions in Context Request
**What goes wrong:** Customer created during context fetch causes stale data
**Why it happens:** Concurrent call_started and context_request
**How to avoid:** Use database transactions or handle missing customer gracefully
**Warning signs:** "Customer not found" logs shortly after creation

### Pitfall 3: CRM Sync Failures Silent
**What goes wrong:** CRM sync fails but call continues, data diverges
**Why it happens:** Errors caught and logged but not alerted
**How to avoid:** Queue CRM operations with retry, alert on persistent failures
**Warning signs:** CRM data doesn't match system data

### Pitfall 4: Dynamic Variables Type Coercion
**What goes wrong:** Numbers sent as numbers, Retell expects strings
**Why it happens:** Retell dynamic variables must all be strings
**How to avoid:** Always `String(value)` before returning
**Warning signs:** Variables not replaced in agent prompts

## Code Examples

### Correct Dynamic Variables Response
```typescript
// Source: backend/src/services/divine/context-builder.service.ts
return {
  is_returning_customer: String(context.isReturningCustomer),  // 'true' not true
  customer_name: context.customerName || 'there',
  call_count: String(context.totalCalls),  // '5' not 5
  // ... all values must be strings
};
```

### Correct Webhook Response for Context Injection
```typescript
// Source: backend/src/routes/webhooks.ts lines 209-214
if (decision.action === 'respond_with_context' && decision.response) {
  return res.status(200).json({
    response_data: {
      retell_llm_dynamic_variables: decision.response  // Must be under this key
    }
  });
}
```

### Background Processing Pattern
```typescript
// Source: backend/src/services/divine/webhook-handler.service.ts
private queueBackgroundProcessing(call: RetellCall, config: ClientConfig): void {
  // Use setImmediate to not block the response
  setImmediate(async () => {
    try {
      await postCallProcessor.process({...});
    } catch (error) {
      logger.error({ error, callId: call.call_id }, 'Background processing failed');
    }
  });
}
```

## Implementation Priorities

Based on requirements and current gaps:

### Priority 1: Critical Fixes
1. Fix CustomerMemory stub or replace with contextBuilderService in CentralRouter
2. Add response time tracking for context_request with <500ms alerting
3. Implement idempotent handling (dedupe by call_id + event_type)

### Priority 2: Compliance Requirements
4. Implement PII masking in all logging
5. Add multi-channel error alerting (email, SMS alongside Slack)
6. Add sensitive data flagging for complaints/disputes

### Priority 3: Feature Completeness
7. Add natural language context summaries
8. Implement two-way CRM sync (pull existing contacts)
9. Add client-configurable retention policies
10. Add response time metrics dashboard/export

## Open Questions

1. **Inbound webhook vs context_request:**
   - Are these the same event with different names?
   - Current code handles both `context_request` and inbound webhook - need to verify Retell API behavior
   - Recommendation: Test with real Retell calls to confirm event naming

2. **Customer identity confirmation:**
   - CONTEXT.md says "Ask for name each call to confirm identity"
   - This is agent prompt behavior, not webhook code
   - Recommendation: Handle in agent configuration, not webhook processing

3. **Sensitive data storage:**
   - Where to flag complaints/disputes for human review?
   - No existing field in customer or conversation schema
   - Recommendation: Add `flags` JSONB column to conversations table

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `backend/src/routes/webhooks.ts`
- Codebase analysis: `backend/src/services/divine/*.ts`
- Codebase analysis: `backend/src/types/retell.types.ts`
- [Retell AI Webhook Overview](https://docs.retellai.com/features/webhook-overview)
- [Retell AI Inbound Call Webhook](https://docs.retellai.com/features/inbound-call-webhook)

### Secondary (MEDIUM confidence)
- [Retell AI Webhooks Blog](https://www.retellai.com/blog/retell-ai-webhooks-feature) - General patterns
- [n8n Retell Integration Workflows](https://n8n.io/workflows/3385-populate-retell-dynamic-variables-with-google-sheets-data-for-call-handling/) - Community patterns

### Tertiary (LOW confidence)
- Function call webhook exact payload structure - not found in official docs, inferred from codebase

## Metadata

**Confidence breakdown:**
- Existing infrastructure: HIGH - Direct codebase analysis
- Retell webhook events: HIGH - Official documentation
- Gap analysis: HIGH - Requirements vs code comparison
- Implementation priorities: MEDIUM - Based on requirements, may need adjustment

**Research date:** 2026-01-21
**Valid until:** 2026-02-21 (30 days - stable technology, established codebase)
