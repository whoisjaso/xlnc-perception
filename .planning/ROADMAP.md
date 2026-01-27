# Roadmap

## Milestone: v1.0 - Smart Tax Nation Launch

### Phase 1: Smart Tax Nation Configuration
**Status:** Completed
**Requirements:** REQ-009

Set up all client-specific configuration and credentials for Smart Tax Nation.

**Goals:**
- Create Smart Tax Nation client config file
- Configure Zoho CRM OAuth credentials
- Configure Zoho Calendar OAuth credentials
- Set up SMS/Email provider credentials
- Define business hours and templates
- Configure Retell webhook endpoint

**Deliverables:**
- `backend/src/config/clients/smart-tax-nation.json`
- Environment variables documented and set
- Webhook URL ready for Retell

---

### Phase 2: Calendar Booking Flow
**Status:** Completed
**Requirements:** REQ-002
**Depends on:** Phase 1
**Plans:** 3 plans

Get calendar availability and booking working end-to-end.

**Goals:**
- Verify Zoho Calendar OAuth flow
- Test `check_calendar_availability` function
- Test `book_appointment` function
- Verify calendar event creation
- Test confirmation SMS/Email after booking

**Deliverables:**
- Working calendar integration for Smart Tax Nation
- Automated OAuth token refresh
- End-to-end booking test passing

Plans:
- [x] 02-01-PLAN.md - Zoho OAuth Setup & Verification
- [x] 02-02-PLAN.md - Calendar Functions Testing & Timezone Fix
- [x] 02-03-PLAN.md - Confirmation Flow & End-to-End Validation

---

### Phase 3: Webhook Processing
**Status:** Completed
**Requirements:** REQ-001, REQ-003
**Depends on:** Phase 1
**Plans:** 4 plans
**Completed:** 2026-01-25

Ensure all Retell webhook events are handled correctly with customer memory persistence.

**Goals:**
- Verify webhook endpoint receives events
- Test `call_started` event handling
- Test `call_ended` event handling
- Test `function_call_invoked` routing
- Test `context_request` response with customer memory
- Response time <500ms for context_request
- Idempotent webhook handling
- PII masking in logs

**Deliverables:**
- All webhook event types handled
- Customer memory persists and loads
- Response time <500ms verified
- Duplicate webhooks rejected gracefully
- Multi-channel error alerting

Plans:
- [x] 03-01-PLAN.md - Fix CustomerMemory for context_request
- [x] 03-02-PLAN.md - PII Masking & Response Time Tracking
- [x] 03-03-PLAN.md - Idempotent Webhook Handling
- [x] 03-04-PLAN.md - Multi-Channel Error Alerting

---

### Phase 4: Follow-up Messaging
**Status:** Completed
**Requirements:** REQ-004, REQ-005
**Depends on:** Phase 2, Phase 3
**Plans:** 5 plans
**Completed:** 2026-01-27

SMS and Email follow-ups working after calls with dashboard visibility.

**Goals:**
- Immediate confirmation SMS/email after booking
- Appointment reminders (24h and 1h before)
- Nurture sequences for non-bookers (Day 1, Day 4)
- Business hours enforcement for marketing messages
- Real-time dashboard with WebSocket updates
- Dead letter queue for permanently failed messages
- Manual compose and edit-before-retry

**Deliverables:**
- SMS sends immediately for confirmations
- Reminders scheduled automatically on booking
- Nurture sequences respect business hours
- Dashboard shows real-time message status
- Retry logic with 1-minute fixed intervals (3 attempts)
- Admin can compose ad-hoc messages
- Admin can edit and retry failed messages

Plans:
- [x] 04-01-PLAN.md - Schema Enhancement & Business Hours Utility
- [x] 04-02-PLAN.md - Scheduled Messages & Reminders
- [x] 04-03-PLAN.md - Enhanced Post-Call Triggering & Nurture Sequences
- [x] 04-04-PLAN.md - Dashboard Messaging View (Real-time WebSocket)
- [x] 04-05-PLAN.md - Dashboard Manual Compose & Edit Retry

---

### Phase 5: CRM Synchronization
**Status:** Planned
**Requirements:** REQ-006
**Depends on:** Phase 1, Phase 3
**Plans:** 4 plans

Leads created and updated in Zoho CRM with database-backed OAuth tokens.

**Goals:**
- Database-backed OAuth token persistence (fixes blocker)
- Verify Zoho CRM OAuth flow
- Test lead creation for new callers
- Test lead update for existing customers
- Verify appointment data syncs
- Test error handling for CRM failures

**Deliverables:**
- OAuth tokens persist across server restarts
- Leads auto-created in Zoho CRM
- Lead data includes call summary, intent, and appointment details
- Graceful degradation when CRM unavailable
- Slack alerts on CRM sync failures

Plans:
- [ ] 05-01-PLAN.md - OAuth Token Infrastructure (database schema + OAuthTokenService)
- [ ] 05-02-PLAN.md - Zoho Services Integration (update CRM + Calendar services)
- [ ] 05-03-PLAN.md - Enhanced CRM Sync (appointment data + error alerting)
- [ ] 05-04-PLAN.md - End-to-End CRM Test Script

---

### Phase 6: Admin Dashboard & Monitoring
**Status:** Not Started
**Requirements:** REQ-007, REQ-008
**Depends on:** Phase 3, Phase 4

Admin visibility for debugging and monitoring.

**Goals:**
- Real-time call status on dashboard
- Message queue viewer functional
- Error log browser working
- Slack alerts configured
- Per-client filtering working

**Deliverables:**
- Dashboard shows live data
- Errors visible and filterable
- Slack alerts for critical errors

---

### Phase 7: End-to-End Testing & Polish
**Status:** Not Started
**Requirements:** All
**Depends on:** Phases 1-6

Full system validation before go-live.

**Goals:**
- Run complete call flow test
- Verify all integrations work together
- Load test webhook endpoint
- Fix any remaining bugs
- Document deployment process

**Deliverables:**
- All acceptance criteria met
- Integration tests passing
- System handles concurrent calls
- Deployment documentation complete

---

## Future Milestones

### v1.1 - Multi-Client Support
- Phase 8: Client onboarding process
- Phase 9: OATH integration

### v2.0 - Intelligence Layer
- Phase 10: PRISM behavioral analysis
- Phase 11: Advanced analytics dashboard
