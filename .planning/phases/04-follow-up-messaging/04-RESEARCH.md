# Phase 4: Follow-up Messaging - Research

**Researched:** 2026-01-25
**Domain:** SMS/Email queue processing, real-time dashboard integration
**Confidence:** HIGH

## Summary

Phase 4 focuses on enabling SMS and email follow-ups after calls complete. The existing codebase already has substantial infrastructure in place:

- **SMS service** with dual-provider support (Text180 primary, Twilio fallback)
- **Email service** with dual-provider support (Zoho SMTP primary, SendGrid fallback)
- **Message queue** with PostgreSQL-based storage and retry logic
- **Queue processor** with Socket.IO real-time updates
- **AI content generation** via Claude for personalized follow-ups
- **Alerting service** for multi-channel failure notifications

The primary work involves: (1) enhancing message triggering from `call_ended` webhook, (2) implementing scheduled messages for appointment reminders and nurture sequences, (3) adding dead letter queue handling, (4) implementing provider failover correctly, and (5) building dashboard UI components for message management.

**Primary recommendation:** Enhance the existing queue infrastructure rather than rebuilding. Focus on scheduling logic, failover robustness, and dashboard visibility.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| nodemailer | 6.x | SMTP email sending | Industry standard, supports Zoho SMTP |
| @sendgrid/mail | 8.x | SendGrid API | Official SendGrid SDK, fallback provider |
| socket.io | 4.x | Real-time updates | Already integrated, used by queue processor |
| drizzle-orm | 0.29.x | Database ORM | Already used for messageQueue schema |
| zod | 3.x | Schema validation | Already used throughout codebase |

### Supporting (Need to Verify Installation)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | 3.x | Date manipulation | Scheduling appointment reminders |
| date-fns-tz | 3.x | Timezone handling | Business hours calculations |
| luxon | 3.x | Alternative date library | If complex timezone logic needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| PostgreSQL queue | BullMQ + Redis | BullMQ more powerful but adds Redis dependency; current setup works |
| Custom scheduler | node-cron | node-cron simpler but custom gives more control over business hours |

**Installation:**
```bash
# Verify these are already installed
npm list nodemailer @sendgrid/mail socket.io drizzle-orm zod

# Add if needed for scheduling
npm install date-fns date-fns-tz
```

## Architecture Patterns

### Existing Project Structure
```
backend/src/
├── services/divine/
│   ├── sms.service.ts           # SMS with Text180/Twilio failover
│   ├── email.service.ts         # Email with Zoho/SendGrid failover
│   ├── message-queue.service.ts # Queue operations (enqueue, process)
│   ├── queue-processor.service.ts # Processing with Socket.IO
│   ├── followup-writer.service.ts # AI content generation
│   ├── post-call-processor.ts   # Triggers follow-ups after calls
│   └── alerting.service.ts      # Multi-channel failure alerts
├── db/schema/
│   └── messageQueue.ts          # Queue table schema
├── routes/
│   └── divine.ts                # Queue management API endpoints
└── core/
    └── router.ts                # Webhook event routing
```

### Pattern 1: Message Triggering Flow
**What:** Call ends -> Post-call processor -> Queue messages -> Processor sends
**When to use:** Immediate post-call confirmations

```
call_ended webhook
    -> CentralRouter.handleCallEnded()
    -> PostCallProcessor.process()
    -> shouldSendFollowUp() check
    -> messageQueueService.enqueueSMS() / enqueueEmail()
    -> queueProcessorService.processQueue()
    -> smsService.send() / emailService.send()
    -> Socket.IO emit status
```

### Pattern 2: Scheduled Message Flow
**What:** Schedule future messages (reminders, nurture sequences)
**When to use:** Appointment reminders, delayed nurture emails

```
booking created
    -> schedule reminder 24h before
    -> schedule reminder 1h before
    -> messageQueueService.enqueue({ scheduledFor: futureDate })
    -> processQueue() checks scheduledFor <= now
    -> sends when due
```

### Pattern 3: Provider Failover
**What:** Primary fails -> Try backup provider
**When to use:** Every send attempt

```typescript
// Existing pattern in sms.service.ts
if (this.txt180.isConfigured()) {
  const result = await this.txt180.send(to, body);
  if (result.success) return result;

  // Failover
  if (this.twilio.isConfigured()) {
    logger.warn('TXT180 failed, falling back to Twilio');
    return this.twilio.send(to, body);
  }
}
```

### Pattern 4: Dead Letter Queue
**What:** Permanently failed messages moved to separate status for review
**When to use:** After max retries exhausted

```typescript
// Current implementation marks as 'failed'
// Enhancement: Add 'dead_letter' status for dashboard visibility
if (attempts >= maxAttempts) {
  await db.update(messageQueue).set({
    status: 'dead_letter',  // Changed from 'failed'
    failedAt: new Date(),
    deadLetterReason: result.error,
  });
}
```

### Anti-Patterns to Avoid
- **Synchronous sending in webhook:** Always queue, never send directly in webhook handler
- **No retry limits:** Current 3-attempt limit is correct; don't remove it
- **Missing idempotency:** Duplicate webhooks could double-send; use existing idempotency service
- **Blocking on AI generation:** Generate content async, queue first

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SMS sending | Raw HTTP to Twilio/Text180 | `smsService.send()` | Has failover, logging, error handling |
| Email sending | Raw SMTP | `emailService.send()` | Has dual-provider support |
| Message queuing | Custom queue table | `messageQueueService` | Already has retry logic, status tracking |
| Real-time updates | Polling | `queueProcessorService` with Socket.IO | Already emits events |
| AI content | Direct Claude calls | `followUpWriterService` | Has PRISM integration, templates |
| Failure alerts | Custom notification | `alertingService` | Multi-channel, throttled |
| Business hours check | Manual date math | Create utility using client config | Use `business_hours` from client config |

**Key insight:** The codebase has comprehensive services already. Phase 4 is about wiring them together correctly and adding missing pieces (scheduling, dead letter, dashboard UI) rather than building new infrastructure.

## Common Pitfalls

### Pitfall 1: Sending Marketing Messages 24/7
**What goes wrong:** SMS/email sent at 2am annoys customers
**Why it happens:** Not checking business hours before scheduling
**How to avoid:** Per CONTEXT.md - confirmations send 24/7, marketing/nurture only during business hours
**Warning signs:** Customer complaints about late-night messages

### Pitfall 2: Exponential Backoff Too Aggressive
**What goes wrong:** Messages delayed hours due to 2^n backoff
**Why it happens:** Default exponential backoff with high retry count
**How to avoid:** Per CONTEXT.md - fixed 1-minute intervals, 3 attempts max
**Warning signs:** Long `scheduledFor` delays in queue

### Pitfall 3: Missing Email Customer Lookup
**What goes wrong:** No email sent because customer email is null
**Why it happens:** Phone-only customer records, email not collected
**How to avoid:** Check for email existence before queueing; don't fail silently
**Warning signs:** Low email send rates vs SMS

### Pitfall 4: WebSocket Connection Loss
**What goes wrong:** Dashboard shows stale data
**Why it happens:** Network interrupts, server restarts
**How to avoid:** Implement reconnection logic on frontend; fetch initial state on reconnect
**Warning signs:** Dashboard frozen, manual refresh needed

### Pitfall 5: Provider Rate Limits
**What goes wrong:** Bulk sends trigger rate limiting
**Why it happens:** No throttling on queue processor
**How to avoid:** Consider batch delays; Text180 and SendGrid have limits
**Warning signs:** 429 errors in logs, messages stuck

### Pitfall 6: Missing Cost Tracking
**What goes wrong:** Can't analyze messaging costs per client
**Why it happens:** Not storing provider cost data
**How to avoid:** Per CONTEXT.md - track per-message cost; add costCents to message queue
**Warning signs:** No cost data in analytics

## Code Examples

Verified patterns from existing codebase:

### Queueing SMS (from message-queue.service.ts)
```typescript
// Source: backend/src/services/divine/message-queue.service.ts
await messageQueueService.enqueueSMS(
  clientId,
  recipient,
  body,
  {
    customerId,
    conversationId,
    scheduledFor: new Date(), // or future date for reminders
    metadata: { callId, type: 'appointment_confirmation' },
  }
);
```

### Queueing Email (from message-queue.service.ts)
```typescript
// Source: backend/src/services/divine/message-queue.service.ts
await messageQueueService.enqueueEmail(
  clientId,
  email,
  subject,
  body,
  {
    customerId,
    metadata: { callId, type: 'post_call_followup' },
  }
);
```

### AI-Generated Follow-up (from followup-writer.service.ts)
```typescript
// Source: backend/src/services/divine/followup-writer.service.ts
const context: FollowUpContext = {
  customerName,
  customerPhone: phone,
  businessName: config.business_name,
  intent: 'booking_request',
  summary: callSummary,
  appointmentBooked: true,
  appointmentTime: '2:00 PM on Wednesday, January 29th',
  dominantNeed: 'significance', // PRISM
};

const { sms, email } = await followUpWriterService.generateBothFollowUps(context);
```

### Socket.IO Real-time Emit (from queue-processor.service.ts)
```typescript
// Source: backend/src/services/divine/queue-processor.service.ts
if (this.io) {
  this.io.emit('queue:message:sent', {
    messageId: message.id,
    channel: message.channel,
    recipient: message.recipient,
    processingTimeMs,
  });
}

// Events emitted: queue:stats, queue:message:processing,
// queue:message:sent, queue:message:failed, queue:message:retry
```

### Provider Failover (from sms.service.ts)
```typescript
// Source: backend/src/services/divine/sms.service.ts
async send(to: string, body: string, from?: string): Promise<SendSMSResult> {
  if (this.preferredProvider === 'txt180' && this.txt180.isConfigured()) {
    const result = await this.txt180.send(to, body, from);
    if (result.success) return result;

    // Failover to Twilio
    if (this.twilio.isConfigured()) {
      logger.warn('TXT180 failed, falling back to Twilio');
      return this.twilio.send(to, body, from);
    }
  }
  // ... similar for twilio primary
}
```

### Business Hours Check (pattern to implement)
```typescript
// Pattern for business hours enforcement
import { isWithinInterval, parseISO, setHours, setMinutes } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

function isWithinBusinessHours(
  date: Date,
  businessHours: ClientConfig['business_hours'],
  timezone: string
): boolean {
  const zonedDate = toZonedTime(date, timezone);
  const dayOfWeek = zonedDate.getDay(); // 0 = Sunday
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayConfig = businessHours[dayNames[dayOfWeek] as keyof typeof businessHours];

  if (dayConfig?.closed) return false;

  const [startHour, startMin] = dayConfig.start.split(':').map(Number);
  const [endHour, endMin] = dayConfig.end.split(':').map(Number);

  const start = setMinutes(setHours(zonedDate, startHour), startMin);
  const end = setMinutes(setHours(zonedDate, endHour), endMin);

  return isWithinInterval(zonedDate, { start, end });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Synchronous sending | Queue-based async | Already implemented | Non-blocking webhooks |
| Single provider | Dual provider failover | Already implemented | Higher delivery rate |
| Polling for updates | WebSocket real-time | Already implemented | Instant dashboard updates |
| Generic messages | AI-personalized content | Already implemented | Better engagement |
| Manual retry | Automatic with backoff | Already implemented | Reliable delivery |

**Deprecated/outdated:**
- None identified - current architecture is modern

## What Exists vs What Needs Building

### EXISTS (Do Not Rebuild)
| Component | Location | Status |
|-----------|----------|--------|
| SMS service with failover | `sms.service.ts` | Working |
| Email service with failover | `email.service.ts` | Working |
| Message queue schema | `messageQueue.ts` | Working |
| Queue processor with retries | `queue-processor.service.ts` | Working |
| Socket.IO integration | `queue-processor.service.ts` | Working |
| AI follow-up generation | `followup-writer.service.ts` | Working |
| Post-call processor | `post-call-processor.ts` | Working, needs enhancement |
| Alerting service | `alerting.service.ts` | Working |
| Queue API endpoints | `divine.ts` routes | Working |

### NEEDS BUILDING
| Component | Description | Priority |
|-----------|-------------|----------|
| Scheduled message support | Appointment reminders (24h, 1h before) | HIGH |
| Nurture sequence logic | Day 1, Day 4 follow-ups for non-bookers | HIGH |
| Business hours enforcement | Marketing messages only during hours | HIGH |
| Dead letter queue status | Separate status for permanently failed | MEDIUM |
| Cost tracking | Add costCents field, track per message | MEDIUM |
| Manual message compose | Admin can send ad-hoc SMS/email | MEDIUM |
| Dashboard message view | Full message log with status tabs | HIGH |
| Failed message prominent display | Top of dashboard alert section | HIGH |
| Scheduled message view | Next 24-48h of pending reminders | MEDIUM |
| Message content preview | View full message before retry | MEDIUM |
| Edit before retry | Modify message content then retry | LOW |

### NEEDS ENHANCEMENT
| Component | Current State | Enhancement Needed |
|-----------|---------------|-------------------|
| Post-call processor | Basic triggering | Smarter intent-based routing per CONTEXT.md |
| Queue processor | Exponential backoff | Change to fixed 1-minute per CONTEXT.md |
| Message queue schema | Basic fields | Add costCents, messageType, deadLetterAt |
| Follow-up writer | Basic templates | Add booking links, portal links per CONTEXT.md |

## Open Questions

Things that couldn't be fully resolved:

1. **Text180 API Documentation**
   - What we know: Auth key exists, basic send implemented
   - What's unclear: Exact rate limits, webhook callbacks for delivery status
   - Recommendation: Test thoroughly, add monitoring

2. **Zoho SMTP Rate Limits**
   - What we know: Using standard SMTP connection
   - What's unclear: Per-hour/day sending limits for Zoho
   - Recommendation: Start conservative, monitor bounce rates

3. **Appointment Data Source**
   - What we know: Calendar events created in Zoho
   - What's unclear: How to query upcoming appointments for reminders
   - Recommendation: May need Zoho Calendar read API, or store locally on booking

4. **Customer Email Collection**
   - What we know: Phone always available from call
   - What's unclear: When/how email gets collected
   - Recommendation: Check if Zoho CRM has email; consider voice agent asking

## Sources

### Primary (HIGH confidence)
- Codebase analysis of existing services:
  - `backend/src/services/divine/sms.service.ts`
  - `backend/src/services/divine/email.service.ts`
  - `backend/src/services/divine/message-queue.service.ts`
  - `backend/src/services/divine/queue-processor.service.ts`
  - `backend/src/services/divine/followup-writer.service.ts`
  - `backend/src/services/divine/post-call-processor.ts`
- Database schema: `backend/src/db/schema/messageQueue.ts`
- API routes: `backend/src/routes/divine.ts`

### Secondary (MEDIUM confidence)
- [BullMQ Documentation](https://docs.bullmq.io) - Queue patterns reference
- [Dead Letter Queue Best Practices](https://swenotes.com/2025/09/25/dead-letter-queues-dlq-the-complete-developer-friendly-guide/) - DLQ implementation patterns
- [BullMQ Real-time Guide](https://www.hkinfosoft.com/blog/behind-the-scenes-of-real-time-apps-how-bullmq-keeps-the-chaos-in-check/) - Socket.IO integration patterns

### Tertiary (LOW confidence)
- Text180 API behavior (based on existing code, not official docs)
- Zoho SMTP limits (not verified)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Verified in package.json and codebase
- Architecture: HIGH - Analyzed existing code
- Pitfalls: MEDIUM - Based on common patterns, some codebase-specific
- Dashboard UI: LOW - Frontend structure unclear (no React files found in expected location)

**Research date:** 2026-01-25
**Valid until:** 2026-02-25 (30 days - stable domain)
