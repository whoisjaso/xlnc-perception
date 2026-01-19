# Requirements

## v1 Scope - Smart Tax Nation Launch

### REQ-001: Webhook Handling
**Priority:** Critical
**Status:** Partial (existing code needs verification)

Handle all Retell AI webhook events:
- `call_started` - Log call, load customer context
- `call_ended` - Process transcript, trigger follow-ups
- `function_call_invoked` - Execute calendar/CRM functions
- `context_request` - Return customer memory to Retell

**Acceptance Criteria:**
- [ ] All event types routed correctly
- [ ] Payload validation with Zod schemas
- [ ] Response time <500ms for context_request
- [ ] Idempotent handling (duplicate events don't cause issues)

---

### REQ-002: Calendar Integration
**Priority:** Critical (User's top priority)
**Status:** Exists but needs Smart Tax Nation config

Check availability and book appointments via Zoho Calendar.

**Acceptance Criteria:**
- [ ] `check_calendar_availability` function returns accurate slots
- [ ] `book_appointment` function creates calendar event
- [ ] Business hours respected (Smart Tax Nation specific)
- [ ] OAuth token refresh automated
- [ ] Confirmation sent after booking

---

### REQ-003: Customer Memory
**Priority:** High
**Status:** Partial implementation exists

Persist customer data across calls for personalized experience.

**Acceptance Criteria:**
- [ ] Customer identified by phone number
- [ ] Call history stored and retrievable
- [ ] Context injected into Retell via `context_request`
- [ ] Returning customers greeted by name

---

### REQ-004: SMS Follow-ups
**Priority:** High
**Status:** Service exists, needs end-to-end testing

Send SMS after calls (confirmations, follow-ups).

**Acceptance Criteria:**
- [ ] Immediate SMS for appointment confirmations
- [ ] Delayed SMS for follow-ups (if configured)
- [ ] Queue with retry logic (3 attempts)
- [ ] Delivery status tracked

---

### REQ-005: Email Follow-ups
**Priority:** High
**Status:** Service exists, needs end-to-end testing

Send emails after calls with AI-generated content.

**Acceptance Criteria:**
- [ ] AI generates personalized follow-up content
- [ ] Templates for different intents
- [ ] Queue with retry logic
- [ ] Delivery status tracked

---

### REQ-006: CRM Sync
**Priority:** High
**Status:** Service exists, needs Smart Tax Nation config

Create/update leads in Zoho CRM.

**Acceptance Criteria:**
- [ ] New callers create lead in Zoho CRM
- [ ] Existing customers updated with call data
- [ ] Appointment info synced to lead
- [ ] OAuth token refresh automated

---

### REQ-007: Admin Dashboard
**Priority:** High
**Status:** Frontend exists, needs real-time data

Provide visibility for debugging and monitoring.

**Acceptance Criteria:**
- [ ] Real-time call status via Socket.IO
- [ ] Message queue viewer
- [ ] Error log browser
- [ ] Per-client filtering

---

### REQ-008: Error Monitoring
**Priority:** Medium
**Status:** Partial implementation

Track errors and alert via Slack.

**Acceptance Criteria:**
- [ ] All errors logged to database
- [ ] Critical errors trigger immediate Slack alert
- [ ] Error aggregation for batch notifications
- [ ] Error resolution tracking

---

### REQ-009: Smart Tax Nation Configuration
**Priority:** Critical
**Status:** Not started

Set up client-specific configuration for Smart Tax Nation.

**Acceptance Criteria:**
- [ ] Client config file created
- [ ] Zoho CRM credentials configured
- [ ] Zoho Calendar credentials configured
- [ ] SMS/Email templates customized
- [ ] Business hours defined
- [ ] Retell webhook URL configured

---

## v2 Scope (Future)

### REQ-010: Multi-Client Onboarding
Easy setup process for new clients like OATH.

### REQ-011: PRISM Behavioral Intelligence
Psychological needs detection for personalized responses.

### REQ-012: Advanced Analytics
Call volume, conversion rates, sentiment trends.

---

## Out of Scope

- SCOPE-001: Public marketing website
- SCOPE-002: Customer mobile app
- SCOPE-003: Self-service client portal
- SCOPE-004: Voice agent prompt editor
