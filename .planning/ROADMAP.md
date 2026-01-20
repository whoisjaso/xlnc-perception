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
**Status:** Planning Complete
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
- [ ] 02-01-PLAN.md - Zoho OAuth Setup & Verification
- [ ] 02-02-PLAN.md - Calendar Functions Testing & Timezone Fix
- [ ] 02-03-PLAN.md - Confirmation Flow & End-to-End Validation

---

### Phase 3: Webhook Processing
**Status:** Not Started
**Requirements:** REQ-001, REQ-003
**Depends on:** Phase 1

Ensure all Retell webhook events are handled correctly.

**Goals:**
- Verify webhook endpoint receives events
- Test `call_started` event handling
- Test `call_ended` event handling
- Test `function_call_invoked` routing
- Test `context_request` response with customer memory

**Deliverables:**
- All webhook event types handled
- Customer memory persists and loads
- Response time <500ms verified

---

### Phase 4: Follow-up Messaging
**Status:** Not Started
**Requirements:** REQ-004, REQ-005
**Depends on:** Phase 2, Phase 3

SMS and Email follow-ups working after calls.

**Goals:**
- Test SMS queue processing
- Test Email queue processing
- Verify AI-generated email content
- Test retry logic for failed messages
- Verify delivery tracking

**Deliverables:**
- SMS sends within 5 seconds
- Email sends within 10 seconds
- Retry logic working (3 attempts)

---

### Phase 5: CRM Synchronization
**Status:** Not Started
**Requirements:** REQ-006
**Depends on:** Phase 1, Phase 3

Leads created and updated in Zoho CRM.

**Goals:**
- Verify Zoho CRM OAuth flow
- Test lead creation for new callers
- Test lead update for existing customers
- Verify appointment data syncs
- Test error handling for CRM failures

**Deliverables:**
- Leads auto-created in Zoho CRM
- Lead data includes call summary and intent
- Graceful degradation when CRM unavailable

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
