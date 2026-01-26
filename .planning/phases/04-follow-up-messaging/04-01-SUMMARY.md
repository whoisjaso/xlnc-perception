---
phase: 04-follow-up-messaging
plan: 01
subsystem: messaging-queue
tags: [drizzle, schema, queue, business-hours, retry, failover, cost-tracking]
depends_on:
  requires: [03-webhook-processing]
  provides: [enhanced-message-queue-schema, business-hours-utility, queue-processor-enhancements]
  affects: [04-02, 04-03, 04-04]
tech-stack:
  added: []
  patterns: [dead-letter-queue, provider-failover, cost-tracking]
key-files:
  created:
    - backend/src/utils/business-hours.ts
  modified:
    - backend/src/db/schema/messageQueue.ts
    - backend/src/services/divine/queue-processor.service.ts
decisions:
  - id: retry-interval
    choice: "Fixed 1-minute intervals"
    rationale: "Per CONTEXT.md - predictable retry behavior for voice agent messages"
  - id: dead-letter-status
    choice: "Use 'dead_letter' status instead of 'failed' for permanent failures"
    rationale: "Separates retriable failures from permanently failed messages for dashboard visibility"
  - id: cost-calculation
    choice: "SMS: 0.75c/segment (160 chars), Email: 0.1c flat"
    rationale: "Industry standard rates for Twilio SMS and SendGrid email"
  - id: provider-tracking
    choice: "Track providerUsed field from SMS service result"
    rationale: "SMS service already handles failover; just capture which provider succeeded"
metrics:
  duration: "~8 minutes"
  completed: "2026-01-26"
---

# Phase 04 Plan 01: Message Queue Foundation Summary

**One-liner:** Enhanced message queue schema with message type categorization, dead letter handling, cost tracking, and business hours utility with fixed 1-minute retry intervals.

## What Was Built

### 1. Enhanced Message Queue Schema (`messageQueue.ts`)
Added five new fields to support Phase 4 messaging requirements:

| Field | Type | Purpose |
|-------|------|---------|
| `messageType` | varchar(50) | Categorize: confirmation, reminder_24h, reminder_1h, nurture_day1, nurture_day4, post_call_followup, manual |
| `costCents` | real | Per-message cost tracking for billing/analytics |
| `deadLetterAt` | timestamp | When message moved to dead letter queue |
| `deadLetterReason` | text | Why message permanently failed |
| `providerUsed` | varchar(50) | Which provider actually sent (for failover tracking) |

Also exported `MessageType` TypeScript type for type safety.

### 2. Business Hours Utility (`business-hours.ts`)
Created timezone-aware business hours checking with three exports:

- `isWithinBusinessHours(date, businessHours, timezone)` - Check if time falls within hours
- `getNextBusinessHour(date, businessHours, timezone)` - Find next open time
- `requiresBusinessHours(messageType)` - Determine if message type needs time restrictions

Uses `date-fns-tz` for proper timezone handling. Tested against Smart Tax Nation's business hours config.

### 3. Queue Processor Enhancements (`queue-processor.service.ts`)

**Fixed Retry Intervals:**
- Changed from exponential backoff (`Math.pow(2, attempts) * 1000`) to fixed 1-minute intervals (`60 * 1000`)

**Provider Failover Tracking:**
- SMS service already has built-in failover (TXT180 <-> Twilio)
- Now captures `result.provider` to track which provider succeeded
- Email defaults to 'sendgrid' (service doesn't expose provider info)

**Cost Tracking:**
- SMS: `Math.ceil(body.length / 160) * 0.75` cents per segment
- Email: `0.1` cents flat rate

**Dead Letter Queue:**
- Changed permanent failure status from 'failed' to 'dead_letter'
- Sets `deadLetterAt` timestamp and `deadLetterReason` with detailed message
- Added `getDeadLetterMessages(clientId?)` method for dashboard
- Updated `retryMessage()` to handle both 'failed' and 'dead_letter' statuses
- Updated `QueueStats` interface to include `deadLetter: number`

## Technical Details

### Business Hours Logic
```typescript
// Convert to client timezone
const zonedDate = toZonedTime(date, timezone);
const dayName = dayNames[getDay(zonedDate)]; // 'monday', 'tuesday', etc.
const dayConfig = businessHours[dayName];

// Check if within hours
return currentTimeMinutes >= startMinutes && currentTimeMinutes < endMinutes;
```

### Cost Calculation
```typescript
const costCents = message.channel === 'sms'
  ? Math.ceil(message.body.length / 160) * 0.75  // SMS segments
  : 0.1;  // Email flat rate
```

## Commits

| Hash | Description |
|------|-------------|
| f021416 | feat(04-01): enhance message queue schema |
| d5993bf | feat(04-01): create business hours utility |
| 27cb7d5 | feat(04-01): enhance queue processor with retry, failover, cost tracking |

## Verification Results

- [x] Schema generates valid migration (24 columns in message_queue table)
- [x] Business hours tests pass (5/5):
  - Monday 10am EST (within hours): PASS
  - Monday 2am EST (outside hours): PASS
  - Sunday (closed): PASS
  - Next hour from Sunday returns Monday 9am: PASS
  - Next hour from Monday 7am returns Monday 9am: PASS
- [x] Queue processor compiles without errors
- [x] All modified files have no TypeScript errors

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

**Ready for 04-02 (Message Templates):**
- messageType field available for categorizing messages
- Business hours utility ready for marketing message timing
- Dead letter queue ready for permanent failure handling

**Dependencies for future plans:**
- 04-03 (Reminder Scheduling) can use business hours utility
- 04-04 (Dashboard Integration) can use getDeadLetterMessages() and QueueStats.deadLetter
