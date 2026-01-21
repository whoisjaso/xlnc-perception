# Phase 3: Webhook Processing - Context

**Gathered:** 2026-01-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Handle all Retell webhook events correctly with customer memory persistence. Events include `call_started`, `call_ended`, `call_analyzed`, `function_call_invoked`, and `context_request`. Ensure <500ms response times and zero data loss.

</domain>

<decisions>
## Implementation Decisions

### Customer Memory Scope
- **Full profile storage:** Name, phone, email, call history, preferences, notes, appointment history, sentiment trends
- **Retention:** Client-configurable (each client sets their own retention policy)
- **Update timing:** Both real-time during call AND at call end — capture everything
- **Personalization:** Always greet returning customers by name with full context (name, last topic, pending appointments, open issues)
- **Sensitive data:** Flag complaints/disputes for human review before agent uses them
- **CRM sync:** Two-way sync with Zoho CRM (pull existing contacts, push updates back)
- **Identity confirmation:** Ask for name each call to confirm identity (handles shared phones)
- **Data deletion:** Client decides their own data deletion policy (GDPR/CCPA configurable)
- **New callers:** Basic defaults — standard greeting, collect info as needed
- **Transcripts:** Configurable per client (some want full transcripts, others just summaries)

### Error Handling & Alerting
- **Failure response:** Alert immediately while maintaining call functionality
- **Alert channels:** Multi-channel — Slack, email, and SMS for critical errors
- **Retries:** 3 attempts with exponential backoff
- **Escalation:** Dev team + client contact for critical errors
- **Deduplication:** Smart throttling — first occurrence immediate, then digest every 15 min
- **Dashboard visibility:** Real-time error feed with filtering

### Logging & Debugging
- **Detail level:** Standard — Call ID, timestamps, outcome, function calls, response times, errors
- **Retention:** Client-configurable based on compliance needs
- **Access control:** Role-based permissions per client
- **PII handling:** Mask always — show last 4 digits of phone, redact names in logs
- **Search:** Basic filters by client, date range, error level
- **Performance:** Track response times for all endpoints
- **Export:** CSV/JSON export for external analysis

### Context Response Behavior
- **Data returned:** Customer profile + calendar availability
- **Format:** Both structured JSON AND natural language summaries
- **Fallback:** Empty context on failure — agent proceeds without personalization
- **Customization:** Per-client configuration of what context their agent receives
- **Dynamic data:** Support client-configurable dynamic variables (promotions, announcements)
- **Logging:** Full context sent to agent logged for debugging

### Claude's Discretion
- Customer recognition approach (phone-based matching logic)
- Error severity model (Critical/Error/Warning/Info or simpler)
- Tracing approach (correlation IDs vs call ID lookup)
- Auto-recovery decisions (what's safe to auto-reconnect)
- Latency optimization (balance speed vs completeness)
- Mid-call context refresh timing

</decisions>

<specifics>
## Specific Ideas

- "Always greet by name" — returning customers should feel recognized immediately
- "Welcome back, Jason! Last time we discussed bookkeeping." — full context greeting
- Smart throttling prevents alert fatigue while ensuring critical issues surface
- PII masking ensures logs are safe to share/export without data exposure concerns

</specifics>

<deferred>
## Deferred Ideas

- Advanced analytics/reporting on webhook performance — future phase
- Self-service client configuration UI for memory/logging settings — Phase 6 (Dashboard)

</deferred>

---

*Phase: 03-webhook-processing*
*Context gathered: 2026-01-21*
