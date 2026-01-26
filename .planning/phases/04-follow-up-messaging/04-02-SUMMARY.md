---
phase: 04-follow-up-messaging
plan: 02
subsystem: reminder-scheduling
tags: [reminders, appointment, sms, email, scheduling, cancellation]
depends_on:
  requires: [04-01]
  provides: [reminder-scheduler-service, messageType-in-queue]
  affects: [04-03, 04-04]
tech-stack:
  added: []
  patterns: [future-dated-queue-entries, appointment-reminder-cancellation]
key-files:
  created:
    - backend/src/services/divine/reminder-scheduler.service.ts
  modified:
    - backend/src/services/divine/message-queue.service.ts
    - backend/src/services/divine/index.ts
decisions:
  - id: reminder-times
    choice: "24h and 1h before appointment"
    rationale: "Per CONTEXT.md - standard reminder intervals for appointment show rate optimization"
  - id: cancellation-lookup
    choice: "Store appointmentId in metadata, filter by JSONB field"
    rationale: "Drizzle lacks native JSONB query support; metadata filter approach works reliably"
  - id: default-links
    choice: "Smart Tax Nation booking and portal links as defaults"
    rationale: "Primary client configuration; can be overridden per-appointment"
metrics:
  duration: "~6 minutes"
  completed: "2026-01-26"
---

# Phase 04 Plan 02: Reminder Scheduling Summary

**One-liner:** Appointment reminder scheduling service with 24h/1h SMS and email reminders, rescheduling links, and full cancellation support via appointmentId lookup.

## What Was Built

### 1. Enhanced Message Queue Service (`message-queue.service.ts`)

Added two new capabilities:

| Feature | Purpose |
|---------|---------|
| `messageType` option | Accept message type in `enqueueSMS` and `enqueueEmail` for categorization |
| `getScheduledMessages(hoursAhead, clientId?)` | Query future-scheduled pending messages |

The `messageType` parameter flows through to the database, allowing reminders to be categorized as `reminder_24h` or `reminder_1h` for filtering and cancellation.

### 2. Reminder Scheduler Service (`reminder-scheduler.service.ts`)

New service with two main methods:

**`scheduleAppointmentReminders(appointment)`**
- Schedules up to 4 reminders (24h SMS, 1h SMS, 24h Email, 1h Email)
- Only schedules reminders that are still in the future
- Stores `appointmentId` in metadata for cancellation tracking
- Default links: `https://smarttaxnation.com/book` and `https://smarttaxnation.com/portal`

**`cancelAppointmentReminders(appointmentId)`**
- Queries all pending reminders with messageType `reminder_24h` or `reminder_1h`
- Filters by `appointmentId` in metadata
- Updates status to `cancelled` for matching reminders
- Returns count of cancelled reminders

### 3. Service Export (`index.ts`)

Added export for `reminderSchedulerService` and `ReminderSchedulerService` from the divine services barrel.

## Reminder Message Content

### SMS Templates

**24h Reminder:**
```
Hi {name}! Reminder: Your appointment with {business} is tomorrow at {time}. Need to reschedule? {bookingLink}
```

**1h Reminder:**
```
Hi {name}! Your {business} appointment is in 1 hour! We're looking forward to seeing you.
```

### Email Templates

Both templates use professional HTML with:
- Clean typography (Arial)
- Highlighted appointment details box
- Call-to-action buttons
- "Reschedule Appointment" button (24h email only)
- "Upload Documents" button (24h email only)

## Technical Details

### Metadata Structure
```typescript
{
  appointmentTime: string; // ISO 8601
  appointmentId: string;   // For cancellation
  type?: string;           // Appointment type
}
```

### Cancellation Query Flow
1. Query all pending messages with `messageType` in `['reminder_24h', 'reminder_1h']`
2. Fetch full record for each to access metadata
3. Filter by `metadata.appointmentId === appointmentId`
4. Batch update status to `cancelled`

This approach handles Drizzle's limited JSONB support while maintaining correctness.

## Commits

| Hash | Description |
|------|-------------|
| 40f4ec7 | feat(04-02): enhance message queue with messageType support |
| 95e95ed | feat(04-02): create reminder scheduler service |
| 08557e5 | feat(04-02): export reminder scheduler from divine services |

## Verification Results

- [x] `enqueueSMS` and `enqueueEmail` accept `messageType` option
- [x] `getScheduledMessages` returns future-scheduled messages
- [x] `scheduleAppointmentReminders` creates 24h and 1h reminders
- [x] `cancelAppointmentReminders` has actual DB queries (not stubs)
- [x] Reminders include booking link (`https://smarttaxnation.com/book`)
- [x] Reminders include portal link (`https://smarttaxnation.com/portal`)
- [x] SMS includes rescheduling text: "Need to reschedule?"
- [x] Email includes "Reschedule Appointment" button
- [x] All TypeScript compiles without new errors

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

**Ready for 04-03 (Nurture Sequences):**
- `messageType` field available for nurture message categorization (`nurture_day1`, `nurture_day4`)
- `scheduledFor` date support tested via reminder scheduling
- `getScheduledMessages` can be used to view upcoming nurture messages

**Ready for 04-04 (Dashboard Integration):**
- `cancelAppointmentReminders` can be exposed in dashboard for appointment management
- Scheduled message visibility via `getScheduledMessages`
