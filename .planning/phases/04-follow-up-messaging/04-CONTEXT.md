# Phase 4: Follow-up Messaging - Context

**Gathered:** 2026-01-25
**Status:** Ready for planning

<domain>
## Phase Boundary

SMS and Email follow-ups sent automatically after calls. Includes:
- Post-call confirmations and follow-ups
- Appointment reminders (24h and 1h before)
- Nurture sequences for non-bookers
- Delivery tracking with retries
- Dashboard visibility for message queue

Does NOT include: CRM sync (Phase 5), advanced analytics (Phase 6+).

</domain>

<decisions>
## Implementation Decisions

### Message Triggers & Timing
- **Confirmation SMS**: Send immediately after successful booking (within seconds)
- **Follow-up emails**: Claude determines based on call outcome (booking vs no-booking vs missed)
- **Email timing**: Send immediately (within seconds), not delayed
- **Appointment reminders**: Both 24 hours AND 1 hour before appointment
- **Reminders include**: Rescheduling option via SMS reply or email link
- **Nurture sequence**: 1-2 follow-up attempts for non-bookers
- **Nurture spacing**: Day 1 (first follow-up), Day 4 (second follow-up)
- **Business hours rule**: Confirmations send anytime 24/7, marketing/nurture messages only during business hours

### Content Generation
- **Email approach**: Hybrid — template structure with AI-generated personalized sections
- **SMS personalization**: Slightly personalized (include appointment type/topic from call)
- **Call summary in emails**: Yes, brief summary of discussion
- **Tone**: Warm & friendly ("Hi John! Great chatting with you today...")
- **Email branding**: Simple with logo only (clean design, logo at top)
- **Nurture emails**: Reference the original call ("Following up on our chat about...")
- **Links in messages**: Always include BOTH booking link AND Smart Tax Nation Portal link (mobile app for document uploads)

### Delivery Tracking & Retries
- **Retry attempts**: 3 attempts with fixed 1-minute intervals
- **Status tracking**: Detailed — queued/sent/delivered/failed + opened/clicked/bounced
- **Failure action**: Alert admin via multi-channel alertingService
- **Manual retry**: Yes, with edit option before retry from dashboard
- **Dead letter queue**: Yes, separate queue for permanently failed messages
- **Provider redundancy**: Failover to backup (Twilio → Text180 for SMS, SendGrid → Zoho for email)
- **Cost tracking**: Yes, track per-message cost for billing/analytics

### Dashboard Visibility
- **Message data display**: Full message log with content visible
- **Real-time updates**: Yes, via WebSocket (messages appear instantly, status updates live)
- **Queue organization**: By status tabs (Pending/Sent/Failed)
- **Engagement metrics**: Basic for v1 — sent count, failed count
- **Cost analytics**: Yes, per-client cost breakdown
- **Manual send**: Yes, admin can compose and send ad-hoc SMS/email from dashboard
- **Failed alerts**: Prominent failed section at top of dashboard for quick action
- **Scheduled view**: Yes, show upcoming scheduled messages (next 24-48 hours of reminders)

### Claude's Discretion
- Email template HTML/CSS structure
- Exact retry backoff implementation
- Which call outcomes trigger which email types
- Loading states and error UI in dashboard
- WebSocket reconnection logic

</decisions>

<specifics>
## Specific Ideas

- **Smart Tax Nation Portal**: Mobile app link for new clients to upload necessary documents — include in every email alongside booking link
- Dashboard should feel like a command center — failed messages prominently visible, not hidden in tabs
- Warm friendly tone but still professional — "Hi John!" not "Hey John!!!"

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-follow-up-messaging*
*Context gathered: 2026-01-25*
