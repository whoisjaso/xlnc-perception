---
phase: 03-webhook-processing
plan: 04
subsystem: alerting
tags: [slack, email, sms, alerting, throttling, multi-channel]

# Dependency graph
requires:
  - 03-01  # Webhook handler foundations (for integration context)
provides:
  - multi-channel-alerting-service
  - severity-based-routing
  - alert-throttling
affects:
  - 03-05  # Database schema (error logging)
  - 03-06  # Dashboard integration

# What was implemented
tech-stack:
  added: []  # Uses existing email.service.ts and sms.service.ts
  patterns:
    - "severity-based-routing"
    - "throttle-then-digest"
    - "multi-channel-fanout"

# Files created/modified
key-files:
  created:
    - backend/src/services/divine/alerting.service.ts
  modified:
    - backend/src/config/env.ts
    - backend/.env.example
    - backend/src/core/router.ts

# Decisions made
decisions:
  - id: use-existing-services
    choice: "Use existing email.service.ts and sms.service.ts"
    rationale: "Services already exist with Zoho SMTP, SendGrid, Twilio, TXT180 support"
  - id: throttle-by-title-client
    choice: "Throttle key = title + clientId"
    rationale: "Prevents duplicate alerts per error per client without blocking different errors"

# Metrics
metrics:
  duration: "~4 minutes"
  completed: "2026-01-25"
---

# Phase 03 Plan 04: Multi-Channel Error Alerting Summary

**One-liner:** Unified alerting service routing to Slack/email/SMS based on severity with 15-minute digest throttling

## What Was Built

### 1. Multi-Channel Alerting Service (`alerting.service.ts`)
Created unified alerting service that routes alerts based on severity:

| Severity | Channels |
|----------|----------|
| `critical` | Slack + Email + SMS |
| `error` | Slack + Email |
| `warning` | Slack only |
| `info` | Slack only |

Key features:
- Smart throttling: First occurrence immediate, then digest every 15 min
- Critical alerts bypass throttling (always sent immediately)
- Graceful degradation if email/SMS services not configured
- Convenience methods: `alertingService.critical()`, `.error()`, `.warning()`, `.info()`

### 2. Environment Configuration
Added 5 new environment variables to `env.ts`:
```typescript
ALERT_EMAIL_ENABLED     // 'true' to enable email alerts
ALERT_EMAIL_RECIPIENTS  // Comma-separated emails
ALERT_SMS_ENABLED       // 'true' to enable SMS alerts
ALERT_SMS_RECIPIENTS    // Comma-separated phone numbers
ALERT_THROTTLE_MINUTES  // Digest interval (default: 15)
```

### 3. Router Integration
Updated `CentralRouter` to use `alertingService` instead of direct `slackService` calls.
This enables future severity escalation without code changes.

## Commits

| Hash | Type | Description |
|------|------|-------------|
| `562eb27` | chore | Add multi-channel alerting configuration to env |
| `2228613` | feat | Create multi-channel alerting service |
| `5305b92` | refactor | Update CentralRouter to use alertingService |

## Files Changed

**Created:**
- `backend/src/services/divine/alerting.service.ts` (361 lines)

**Modified:**
- `backend/src/config/env.ts` - Added 5 alert config vars
- `backend/.env.example` - Documented alerting configuration
- `backend/src/core/router.ts` - Switched to alertingService

## Integration Points

The alerting service uses existing services:
- `slack.service.ts` - For all Slack alerts
- `email.service.ts` - For email alerts (Zoho SMTP or SendGrid)
- `sms.service.ts` - For SMS alerts (TXT180 or Twilio)

## Decisions Made

### Use Existing Email/SMS Services
Instead of creating new `sendgrid.service.ts` and `twilio.service.ts` as mentioned in the plan, I used the existing `email.service.ts` and `sms.service.ts` which already have:
- Zoho SMTP support
- SendGrid SMTP fallback
- TXT180 SMS provider
- Twilio SMS fallback

This follows the DRY principle and avoids code duplication.

### Throttle Key Design
Alerts are throttled by `{title}:{clientId}` which:
- Groups identical errors together
- Keeps different clients' errors separate
- Allows first occurrence through immediately
- Batches subsequent occurrences into 15-minute digests

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Adapted to existing service structure**
- **Found during:** Task 2
- **Issue:** Plan referenced `sendgrid.service.ts` and `twilio.service.ts` which don't exist
- **Fix:** Used existing `email.service.ts` and `sms.service.ts` which provide the same functionality
- **Files modified:** `alerting.service.ts`
- **Commit:** `2228613`

## Testing Notes

To test multi-channel alerting:

1. Enable email alerts:
```env
ALERT_EMAIL_ENABLED=true
ALERT_EMAIL_RECIPIENTS=admin@example.com
```

2. Enable SMS alerts (for critical only):
```env
ALERT_SMS_ENABLED=true
ALERT_SMS_RECIPIENTS=+15551234567
```

3. Trigger alerts programmatically:
```typescript
import { alertingService } from './services/divine/alerting.service';

// Test critical (goes to Slack + Email + SMS)
await alertingService.critical('Test Critical Alert', 'This is a test');

// Test error (goes to Slack + Email)
await alertingService.error('Test Error Alert', 'This is a test');

// Test warning (goes to Slack only)
await alertingService.warning('Test Warning Alert', 'This is a test');
```

## Next Phase Readiness

Plan 03-04 is complete. The alerting service is ready to be integrated with:
- Error monitoring service (`error-monitor.service.ts`)
- Post-call processor (`post-call-processor.ts`)
- Queue processor (`queue-processor.service.ts`)
- Webhook handler (`webhook-handler.service.ts`)

These services currently use `slackService` directly and can be migrated to `alertingService` in future plans to enable multi-channel alerting across the entire system.

## Success Criteria Verification

- [x] alertingService routes to Slack/email/SMS based on severity
- [x] Critical alerts go to all channels
- [x] Error alerts go to Slack + email
- [x] Warning/info alerts go to Slack only
- [x] Throttling prevents duplicate alerts within 15 minutes
- [x] CentralRouter uses alertingService instead of direct slackService
