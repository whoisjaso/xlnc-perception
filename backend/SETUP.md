# Divine Agentic Intelligence System - Setup Guide

This guide walks you through setting up the Divine system for a new client like Smart Tax Nation.

## Prerequisites

- Node.js 20+
- PostgreSQL database
- Zoho account with CRM and Calendar access
- Retell AI account
- Text180 or Twilio account for SMS
- SendGrid account for email

## 1. Environment Setup

### Copy the example environment file:

```bash
cp .env.example .env
```

### Required Variables

These must be set for the system to start:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/xlnc_divine
JWT_SECRET=your-32-character-minimum-secret-key-here
FRONTEND_URL=http://localhost:5173
```

## 2. Zoho Integration Setup

### 2.1 Create Zoho API Credentials

1. Go to [Zoho API Console](https://api-console.zoho.com/)
2. Click "Add Client" → "Server-based Applications"
3. Fill in:
   - Client Name: `XLNC Divine System`
   - Homepage URL: `https://your-domain.com`
   - Authorized Redirect URIs: `https://your-domain.com/api/auth/zoho/callback`
4. Note the **Client ID** and **Client Secret**

### 2.2 Get Zoho Refresh Token

Run this authorization flow to get refresh tokens:

```bash
# Step 1: Generate authorization URL
# Replace CLIENT_ID with your actual client ID

https://accounts.zoho.com/oauth/v2/auth?scope=ZohoCRM.modules.ALL,ZohoCalendar.calendar.ALL&client_id=YOUR_CLIENT_ID&response_type=code&access_type=offline&redirect_uri=https://your-domain.com/api/auth/zoho/callback
```

After authorizing, you'll get a `code` parameter. Exchange it for tokens:

```bash
curl -X POST https://accounts.zoho.com/oauth/v2/token \
  -d "grant_type=authorization_code" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "redirect_uri=https://your-domain.com/api/auth/zoho/callback" \
  -d "code=YOUR_AUTHORIZATION_CODE"
```

Save the `refresh_token` from the response.

### 2.3 Get Zoho Calendar ID

1. Go to [Zoho Calendar](https://calendar.zoho.com)
2. Click Settings → Calendar Settings
3. Find the calendar you want to use
4. The Calendar ID is in the URL or settings

### 2.4 Set Zoho Environment Variables

```env
# Zoho CRM
ZOHO_CRM_CLIENT_ID=your_client_id
ZOHO_CRM_CLIENT_SECRET=your_client_secret
ZOHO_CRM_REFRESH_TOKEN=your_refresh_token

# Zoho Calendar
ZOHO_CALENDAR_CLIENT_ID=your_client_id
ZOHO_CALENDAR_CLIENT_SECRET=your_client_secret
ZOHO_CALENDAR_REFRESH_TOKEN=your_refresh_token
ZOHO_CALENDAR_ID=your_calendar_id
```

## 3. Retell AI Setup

### 3.1 Create Retell Agent

1. Go to [Retell AI Dashboard](https://dashboard.retell.ai)
2. Create a new agent for Smart Tax Nation
3. Note the **Agent ID** (e.g., `agent_abc123`)

### 3.2 Configure Webhook URL

In Retell Dashboard → Agent Settings → Webhooks:

```
General Webhook URL: https://your-domain.com/api/webhooks/retell/smart-tax-nation
Function Call URL: https://your-domain.com/api/webhooks/retell/smart-tax-nation/function
```

### 3.3 Get Webhook Secret (Optional but Recommended)

In Retell Dashboard → Settings → Webhooks, generate a webhook secret and add it:

```env
RETELL_WEBHOOK_SECRET=your_webhook_secret
```

## 4. SMS Provider Setup

### Option A: Text180

1. Log into your Text180 dashboard
2. Get your credentials from API settings:

```env
TEXT180_AUTH_KEY=your_auth_key
TEXT180_ACCOUNT_ID=12345
TEXT180_SHORT_CODE=your_short_code
TEXT180_KEYWORD=your_keyword
```

### Option B: Twilio

1. Go to [Twilio Console](https://console.twilio.com)
2. Get credentials from Dashboard:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+1234567890
```

## 5. Email Provider Setup

### SendGrid

1. Go to [SendGrid Settings](https://app.sendgrid.com/settings/api_keys)
2. Create an API Key with "Mail Send" permission:

```env
SENDGRID_API_KEY=SG.xxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=Smart Tax Nation
```

## 6. Client Configuration

### Update the client config file:

Edit `config/clients/smart-tax-nation.json`:

```json
{
  "client_id": "smart-tax-nation",
  "business_name": "Smart Tax Nation",
  "owner_name": "Your Name",
  "phone": "+1234567890",
  "email": "contact@smarttaxnation.com",
  "address": "123 Tax Street, Suite 100, City, ST 12345",

  "retell_agent_id": "agent_YOUR_ACTUAL_AGENT_ID",
  "zoho_calendar_id": "YOUR_ACTUAL_CALENDAR_ID",

  "business_hours": {
    "monday": { "start": "09:00", "end": "18:00" },
    "tuesday": { "start": "09:00", "end": "18:00" },
    "wednesday": { "start": "09:00", "end": "18:00" },
    "thursday": { "start": "09:00", "end": "18:00" },
    "friday": { "start": "09:00", "end": "17:00" },
    "saturday": { "start": "10:00", "end": "14:00" },
    "sunday": { "start": "00:00", "end": "00:00", "closed": true }
  }
}
```

## 7. Database Setup

### Run migrations:

```bash
npm run db:migrate
```

## 8. Start the Server

### Development:

```bash
npm run dev
```

### Production:

```bash
npm run build
npm start
```

## 9. Verify Setup

### Test the webhook endpoint:

```bash
curl http://localhost:3000/api/webhooks/retell/smart-tax-nation/test
```

Expected response:
```json
{
  "success": true,
  "message": "Webhook endpoint configured for Smart Tax Nation",
  "client": {
    "id": "smart-tax-nation",
    "name": "Smart Tax Nation",
    "features": {
      "sms_enabled": true,
      "email_enabled": true,
      "appointment_booking_enabled": true,
      "zoho_crm_enabled": true
    }
  },
  "webhookUrl": "/api/webhooks/retell/smart-tax-nation"
}
```

### List all configured clients:

```bash
curl http://localhost:3000/api/webhooks/clients
```

## 10. Configuring Retell Agent

In your Retell agent's system prompt, you can reference the Divine system's functions:

### Available Functions

| Function | Purpose |
|----------|---------|
| `check_calendar_availability` | Check available appointment slots |
| `book_appointment` | Book a confirmed appointment |
| `get_customer_history` | Retrieve returning customer info |
| `transfer_to_human` | Request human transfer |
| `collect_information` | Store customer data |
| `end_call` | End the call gracefully |

### Example Function Call Setup in Retell

```json
{
  "name": "check_calendar_availability",
  "description": "Check available appointment times",
  "parameters": {
    "type": "object",
    "properties": {
      "requested_date": {
        "type": "string",
        "description": "The date to check (e.g., 'tomorrow', 'next monday', '2026-01-20')"
      },
      "time_preference": {
        "type": "string",
        "enum": ["morning", "afternoon", "evening", "any"]
      }
    },
    "required": ["requested_date"]
  }
}
```

## Troubleshooting

### Webhook not receiving events

1. Check Retell dashboard for webhook delivery status
2. Verify the URL is publicly accessible
3. Check server logs for errors

### Calendar not returning slots

1. Verify Zoho Calendar credentials
2. Check if refresh token is valid
3. Test with: `curl http://localhost:3000/api/divine/calendar/test`

### SMS not sending

1. Verify Text180/Twilio credentials
2. Check the message queue: `curl http://localhost:3000/api/divine/queue/status`
3. Check error logs

## Next Steps

1. Test end-to-end call flow with Retell
2. Configure follow-up email templates
3. Set up Slack alerts for errors
4. Configure CRM field mappings
