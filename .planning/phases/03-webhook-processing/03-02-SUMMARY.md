---
phase: 03
plan: 02
subsystem: webhook-processing
tags: [pii-masking, logging, response-time, monitoring, compliance]

dependency-graph:
  requires:
    - "03-01 (webhook event storage)"
  provides:
    - "PII masking utilities"
    - "Response time monitoring for context_request"
    - "Slack alerting for slow responses"
  affects:
    - "All logging statements"
    - "Webhook performance monitoring"
    - "Log export and debugging"

tech-stack:
  added: []
  patterns:
    - "PII masking pattern (mask last 4 digits)"
    - "Response time tracking with threshold alerting"
    - "Recursive object masking for nested PII"

key-files:
  created:
    - "backend/src/utils/pii-mask.ts"
  modified:
    - "backend/src/core/router.ts"
    - "backend/src/routes/webhooks.ts"

decisions:
  - id: "phone-mask-format"
    decision: "Show only last 4 digits of phone numbers (***4567)"
    rationale: "Allows identification while protecting full number"
  - id: "name-redaction"
    decision: "Fully redact names as [name redacted]"
    rationale: "Names are PII that should not appear in logs"
  - id: "500ms-threshold"
    decision: "Alert via Slack when context_request exceeds 500ms"
    rationale: "Per REQ-001, <500ms response time is critical for voice UX"
  - id: "recursive-masking"
    decision: "Recursively mask PII in nested objects"
    rationale: "Webhook payloads may have deeply nested customer data"

metrics:
  duration: "~8 minutes"
  completed: "2026-01-25"
---

# Phase 03 Plan 02: PII Masking & Response Time Summary

**One-liner:** PII masking utilities with phone/email/name protection plus 500ms response time alerting for context_request.

## What Was Built

### 1. PII Masking Utility (Task 1)
Created `backend/src/utils/pii-mask.ts` with comprehensive PII protection:

**Functions:**
- `maskPhone(phone)` - Masks to `***4567` (last 4 digits)
- `maskEmail(email)` - Masks to `j***@example.com` (first char + domain)
- `maskName(name)` - Redacts to `[name redacted]`
- `maskPII(obj)` - Recursively masks all known PII fields in an object
- `createSafeLogObject(obj)` - Wrapper for logging with PII masked
- `safeLog(fields)` - Type-safe logging helper

**Auto-detected PII fields:**
- phone, from_number, to_number, customerPhone
- email, customerEmail
- name, customerName, customer_name

### 2. Response Time Tracking (Task 2)
Enhanced CentralRouter's `handleContextRequest` method:
- Track start time with `Date.now()`
- Log response time with masked phone number
- Alert via Slack when exceeding 500ms threshold
- Import and use `slackService.sendWarning()` for slow response alerts

### 3. Webhook Route Updates (Task 3)
Updated webhook routes with:
- Import `maskPhone` for future PII masking needs
- Track webhook processing duration with `webhookStartTime`
- Log processing time after successful webhook handling
- Include `processingTimeMs` in response for external monitoring

## Architecture

```
Customer Data (PII)
        |
        v
  [maskPII / createSafeLogObject]
        |
        v
  Safe Log Object (masked)
        |
        v
   logger.info(...)
```

```
context_request
        |
        v
  [startTime = Date.now()]
        |
        v
  [Build context + calendar]
        |
        v
  [responseTime = Date.now() - startTime]
        |
        +-- responseTime > 500ms? --> [slackService.sendWarning()]
        |
        v
  [Log: { responseTimeMs, phone (masked) }]
```

## Key Files

| File | Purpose |
|------|---------|
| `backend/src/utils/pii-mask.ts` | PII masking utilities for log compliance |
| `backend/src/core/router.ts` | Response time tracking with Slack alerting |
| `backend/src/routes/webhooks.ts` | Webhook processing time tracking |

## Commits

| Hash | Description |
|------|-------------|
| 804462c | Add PII masking utility for log compliance |
| 6cb79c7 | Response time tracking (part of 03-01 commit) |
| f8fd65e | Add PII masking import and response time tracking to webhooks |

## Deviations from Plan

### Prior Work Discovered
**[Rule 3 - Blocking]** Task 2 response time tracking was partially implemented in commit `6cb79c7` as part of plan 03-01 execution. The core router already had:
- `startTime` tracking
- `responseTimeMs` logging
- Slack alerting for slow responses

This was discovered when attempting to commit - the changes already existed. Proceeded with Task 3 which was still needed.

## Testing Notes

To test PII masking:
```typescript
import { maskPhone, maskEmail, maskPII } from '../utils/pii-mask';

// Test phone masking
console.log(maskPhone('+15551234567')); // ***4567

// Test email masking
console.log(maskEmail('john.doe@example.com')); // j***@example.com

// Test object masking
const obj = { phone: '+15551234567', name: 'John Doe', callId: '123' };
console.log(maskPII(obj));
// { phone: '***4567', name: '[name redacted]', callId: '123' }
```

To test response time alerting:
1. Make a context_request that takes >500ms (add artificial delay)
2. Check Slack channel for "Slow context_request Response" alert
3. Check logs for `context_request exceeded 500ms threshold`

## Success Criteria Met

- [x] New pii-mask.ts utility exists with maskPhone, maskEmail, maskPII functions
- [x] CentralRouter tracks context_request response time and logs it
- [x] Slack alert fires when context_request exceeds 500ms
- [x] Webhook routes use maskPhone import (ready for PII logging)
- [x] TypeScript compiles without errors related to plan changes

## Next Steps

1. Apply `createSafeLogObject()` to any new logging that includes customer data
2. Monitor Slack for slow response alerts in production
3. Consider adding metrics dashboard for response time trends
4. Phase 03 Plan 03 (Idempotency) and Plan 04 (Alerting) can leverage PII masking
