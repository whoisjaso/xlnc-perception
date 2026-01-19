# XLNC Perception - Divine Agentic Intelligence System

## Vision

Build a production-ready AI voice automation platform that replaces n8n workflows with a unified TypeScript backend. The system handles Retell AI webhooks, customer memory, calendar booking, multi-channel messaging (SMS/Email), and CRM synchronization.

**First Client:** Smart Tax Nation
**Business:** XLNC AI Agency
**Goal:** Fully automated voice agent system that makes tax consultation seamless

## Problem Statement

Current n8n-based automation has critical limitations:
- No type safety (data flows without validation)
- No unit testing capability
- Poor version control (JSON exports)
- Limited debugging tools
- Node-to-node latency compounds quickly
- Scaling costs poorly
- Error tracing across workflows is painful

## Solution

A TypeScript monorepo that:
1. Handles all Retell webhook events with <500ms latency
2. Maintains customer memory across calls
3. Books appointments via Zoho Calendar integration
4. Sends follow-up SMS/Email within seconds
5. Syncs leads to Zoho CRM
6. Provides admin dashboard visibility for debugging

## Target Users

1. **Smart Tax Nation** (First client) - Tax consultation business
2. **Future clients** (OATH, others) - Easy onboarding with per-client configuration
3. **XLNC Developers** (Jason + partner) - Admin dashboard for monitoring/debugging

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Database | PostgreSQL + Drizzle ORM | Type-safe queries, existing setup |
| Backend Framework | Express.js | Already implemented, stable |
| Real-time | Socket.IO | Admin dashboard live updates |
| Queue | BullMQ + Redis | Message queue with retry logic |
| AI/LLM | Anthropic Claude | Intent classification, follow-ups |
| Voice | Retell AI | Client's existing voice platform |
| CRM | Zoho CRM | Smart Tax Nation uses Zoho |
| Calendar | Zoho Calendar | Smart Tax Nation uses Zoho |
| SMS | Twilio + Text180 | Redundancy for reliability |
| Email | SendGrid + Zoho SMTP | Multiple providers |

## Success Criteria

1. [ ] All Retell webhook events handled correctly
2. [ ] Customer memory persists across calls
3. [ ] Calendar availability returns accurate slots
4. [ ] Appointments book successfully
5. [ ] SMS sends within 5 seconds of trigger
6. [ ] Email sends within 10 seconds of trigger
7. [ ] CRM leads created/updated correctly
8. [ ] Errors logged and alerted via Slack
9. [ ] Admin dashboard shows real-time status
10. [ ] Latency <500ms for context_request events
11. [ ] Zero data loss on external service failures

## Constraints

- Must work with existing Retell AI agent setup
- Must integrate with Smart Tax Nation's Zoho account
- Must be scalable for future multi-client architecture
- Must provide admin visibility for debugging

## Out of Scope (v1)

- Public marketing website
- Customer-facing mobile app
- Multi-tenant self-service onboarding
- Advanced analytics/reporting
- Voice agent prompt editing UI

## References

- `d:\CLAUDE_CODE_EXECUTION_PROMPT.md` - Execution guidelines
- `d:\AGENTIC_RETELL_SYSTEM_PLAN.md` - Full system architecture
- `.planning/codebase/` - Existing codebase analysis
