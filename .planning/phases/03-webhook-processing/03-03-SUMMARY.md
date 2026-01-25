---
phase: 03
plan: 03
subsystem: webhook-processing
tags: [idempotency, webhooks, duplicate-prevention, database]

dependency-graph:
  requires:
    - "03-01 (webhook event storage)"
  provides:
    - "Idempotent webhook processing"
    - "Duplicate webhook detection"
    - "webhookIdempotencyService"
  affects:
    - "All webhook handlers"
    - "Retell retry behavior"

tech-stack:
  added: []
  patterns:
    - "Idempotency key pattern (clientId:callId:eventType)"
    - "Check-then-record with unique constraint fallback"
    - "Fail-open error handling"

key-files:
  created:
    - "backend/src/services/divine/webhook-idempotency.service.ts"
  modified:
    - "backend/src/db/schema/webhookEvents.ts"
    - "backend/src/config/database.ts"
    - "backend/src/routes/webhooks.ts"

decisions:
  - id: "idempotency-key-format"
    decision: "Use clientId:callId:eventType as idempotency key"
    rationale: "Unique across clients and event types, allows same call to have multiple event types"
  - id: "fail-open-on-error"
    decision: "Allow processing if idempotency check fails"
    rationale: "Better to risk duplicate than block legitimate events"
  - id: "unique-index-where-not-null"
    decision: "Unique index only on non-null idempotency keys"
    rationale: "Allows backward compatibility with existing records"

metrics:
  duration: "~5 minutes"
  completed: "2026-01-25"
---

# Phase 03 Plan 03: Webhook Idempotency Summary

**One-liner:** Idempotent webhook handling with clientId:callId:eventType deduplication via unique database constraint.

## What Was Built

### 1. Schema Updates (Task 1)
Added idempotency support to the webhookEvents table:
- `client_id` column for multi-tenant support
- `idempotency_key` column (format: `{clientId}:{callId}:{eventType}`)
- `processed_at` timestamp for tracking completion time
- Unique index on `idempotency_key` for duplicate prevention
- Helper function `generateIdempotencyKey()` for consistent key generation

### 2. Idempotency Service (Task 2)
Created `WebhookIdempotencyService` with:
- `check()` - Query for existing event by idempotency key
- `record()` - Insert new event, catch unique constraint violations
- `markProcessed()` - Update event with processed timestamp
- `checkAndRecord()` - Combined atomic operation for duplicate prevention

### 3. Route Integration (Task 3)
Updated webhook routes to use idempotency:
- Check idempotency BEFORE any processing
- Return `200 OK` with `duplicate: true` for duplicate webhooks
- This prevents Retell from retrying already-processed events
- Mark events as processed after successful completion

## Architecture

```
Webhook Request
     |
     v
[checkAndRecord]
     |
     +-- isDuplicate? --> YES --> Return 200 OK (duplicate: true)
     |
     NO
     |
     v
[Process Event]
     |
     v
[markProcessed]
     |
     v
Return 200 OK (success)
```

## Key Files

| File | Purpose |
|------|---------|
| `backend/src/db/schema/webhookEvents.ts` | Schema with idempotency columns and helper |
| `backend/src/services/divine/webhook-idempotency.service.ts` | Idempotency checking service |
| `backend/src/routes/webhooks.ts` | Route integration with duplicate detection |
| `backend/src/config/database.ts` | Migration to add columns to existing tables |

## Commits

| Hash | Description |
|------|-------------|
| e7ea970 | Add idempotency key column to webhookEvents schema |
| 60114a3 | Create webhook idempotency service |
| e990d5f | Integrate idempotency check into webhook routes |

## Deviations from Plan

None - plan executed exactly as written.

## Testing Notes

To test idempotency:
1. Send a webhook to `/api/webhooks/retell/smart-tax-nation` with a specific `call_id` and event type
2. Send the SAME webhook again
3. Second request should return `{ duplicate: true }` without reprocessing
4. Check database - only one record should exist for that idempotency key

## Success Criteria Met

- [x] webhookEvents schema has idempotencyKey column with unique index
- [x] Idempotency service checks for duplicates before processing
- [x] Duplicate webhooks return 200 OK with `duplicate: true`
- [x] Database migration applied (via runMigrations on startup)
- [x] No duplicate processing occurs for retried webhooks

## Next Steps

1. Monitor for duplicate detection in production logs
2. Consider adding metrics/alerts for duplicate rate
3. Phase 03 Plan 04 (Error Alerting) can now build on reliable event processing
