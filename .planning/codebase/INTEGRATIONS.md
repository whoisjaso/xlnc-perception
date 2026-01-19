# External Integrations

## AI/LLM Services

| Service | Purpose | Config Keys |
|---------|---------|-------------|
| Anthropic Claude | Intent classification, follow-up generation | `ANTHROPIC_API_KEY` |
| Google Gemini | Alternative LLM (frontend) | `GEMINI_API_KEY` |

## Voice Platform

| Service | Purpose | Config Keys |
|---------|---------|-------------|
| Retell AI | Voice agent platform | `RETELL_API_KEY`, `RETELL_WEBHOOK_SECRET` |

## Communication

| Service | Purpose | Config Keys |
|---------|---------|-------------|
| Twilio | SMS delivery | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` |
| Text180 | SMS provider alternative | `TEXT180_AUTH_KEY`, `TEXT180_ACCOUNT_ID`, `TEXT180_SHORT_CODE` |
| SendGrid | Email delivery | `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `SENDGRID_FROM_NAME` |
| Nodemailer | SMTP email (Zoho) | Configured in code |

## CRM & Calendar

| Service | Purpose | Config Keys |
|---------|---------|-------------|
| Zoho CRM | Lead/customer management | `ZOHO_CRM_CLIENT_ID`, `ZOHO_CRM_CLIENT_SECRET`, `ZOHO_CRM_REFRESH_TOKEN` |
| Zoho Calendar | Appointment scheduling | `ZOHO_CALENDAR_CLIENT_ID`, `ZOHO_CALENDAR_CLIENT_SECRET`, `ZOHO_CALENDAR_ID` |

## Monitoring

| Service | Purpose | Config Keys |
|---------|---------|-------------|
| Slack | Error alerts & monitoring | `SLACK_WEBHOOK_URL` |

## Infrastructure

| Service | Purpose | Config Keys |
|---------|---------|-------------|
| Redis | Message queue, cache | `REDIS_URL` (optional) |
| PostgreSQL | Primary database | `DATABASE_URL` |

## Webhook Endpoints

```
POST /api/webhooks/retell/:clientId          # Retell call events
POST /api/webhooks/retell/:clientId/function # Retell function dispatcher
```

## OAuth Flows

### Zoho CRM
1. User redirected to Zoho consent screen
2. Authorization code exchanged for tokens
3. Refresh token stored in `.env`
4. Access token refreshed on each request

### Zoho Calendar
- Similar OAuth pattern
- Requires manual callback URL setup in Zoho console

## Integration Notes

- All external services have retry logic
- Message queue has 3 retry attempts
- Zoho OAuth tokens require manual refresh when expired
- Slack alerts only on errors (no success metrics)
