# Pre-Deployment Checklist

Before deploying, make sure you have these credentials ready:

## ✅ Required Credentials

### Retell AI
- [ ] **RETELL_API_KEY** - From Retell dashboard
- [ ] **RETELL_WEBHOOK_SECRET** - Set in Retell dashboard for webhook verification

### Zoho CRM OAuth
- [ ] **ZOHO_CLIENT_ID** - From Zoho API Console
- [ ] **ZOHO_CLIENT_SECRET** - From Zoho API Console
- [ ] **ZOHO_REFRESH_TOKEN** - Generated via OAuth flow

**Get these:**
1. Go to https://api-console.zoho.com
2. Create "Server-based Application"
3. Generate OAuth tokens
4. Copy the refresh token

### Zoho Calendar OAuth
- [ ] **ZOHO_CALENDAR_CLIENT_ID**
- [ ] **ZOHO_CALENDAR_CLIENT_SECRET**
- [ ] **ZOHO_CALENDAR_REFRESH_TOKEN**
- [ ] **ZOHO_CALENDAR_ID** - Your calendar's unique ID

**Get Calendar ID:**
1. Log into Zoho Calendar
2. Go to Settings → Calendars
3. Copy the calendar ID (usually looks like: `3051971000000029001`)

### Text180 SMS
- [ ] **TEXT180_API_KEY**
- [ ] **TEXT180_BRAND_ID**
- [ ] **TEXT180_CAMPAIGN_ID**
- [ ] **TEXT180_FROM_NUMBER** - Format: `+1XXXXXXXXXX`

**Get these:**
1. Log into Text180 dashboard
2. Go to API section
3. Create API key and note the Brand/Campaign IDs

### SendGrid Email
- [ ] **SENDGRID_API_KEY**
- [ ] **SENDGRID_FROM_EMAIL** - Your verified sender email
- [ ] **SENDGRID_FROM_NAME** - Usually "Smart Tax Nation"

**Get API key:**
1. Log into SendGrid
2. Settings → API Keys → Create API Key
3. Use "Full Access" or custom with mail send permission

### JWT Secrets (Generate New)
- [ ] **JWT_SECRET** - Random 64-char string
- [ ] **JWT_REFRESH_SECRET** - Different random 64-char string

**Generate these:**
```bash
# Run this twice to get two different secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🎯 Client Configuration File

- [ ] **File exists:** `backend/config/clients/smart-tax-nation.json`
- [ ] **Has correct structure** (see template below)

**Template:**
```json
{
  "client_id": "smart-tax-nation",
  "business_name": "Smart Tax Nation",
  "industry": "tax_preparation",
  "phone": "+17133601925",
  "email": "info@smarttaxnation.com",
  "website": "https://smarttaxnation.com",
  "address": "Houston, TX",

  "retell_agent_id": "agent_2902ef6cd0a87f863052e3efff",

  "sms_enabled": true,
  "sms_provider": "txt180",
  "email_enabled": true,
  "email_provider": "sendgrid",
  "appointment_booking_enabled": true,
  "zoho_crm_enabled": true,

  "zoho_client_id": "YOUR_ZOHO_CRM_CLIENT_ID",
  "zoho_client_secret": "YOUR_ZOHO_CRM_CLIENT_SECRET",
  "zoho_refresh_token": "YOUR_ZOHO_CRM_REFRESH_TOKEN",

  "zoho_calendar_id": "YOUR_CALENDAR_ID",

  "business_hours": {
    "start": "09:00",
    "end": "17:00",
    "days": [1, 2, 3, 4, 5]
  },

  "timezone": "America/Chicago"
}
```

## 📦 Code Ready?

- [ ] **Dependencies installed:** `cd backend && npm install`
- [ ] **TypeScript compiles:** `npm run build`
- [ ] **No build errors**

## 🔍 Quick Verification

Run these locally to verify everything compiles:

```bash
cd backend
npm install
npm run build
npm run typecheck
```

All should complete without errors.

## 🚀 Ready to Deploy?

If you have all the ✅ checked above, you're ready!

Follow: **QUICK_START.md** for deployment steps.

## ⚠️ Don't Have Some Credentials?

**That's okay!** You can deploy without some features and add them later:

**Minimum to deploy:**
- Retell API key
- JWT secrets (generate new ones)
- PostgreSQL (Railway provides this)

**Can add later:**
- Zoho credentials (calendar booking won't work yet)
- SMS/Email providers (follow-ups won't work yet)

The backend will still start and handle basic webhooks.

## Need Help Getting Credentials?

**Zoho OAuth Setup:**
See: `backend/SETUP.md` - Step-by-step Zoho OAuth guide

**Text180:**
Contact: support@text180.com for API access

**SendGrid:**
Free tier available at: sendgrid.com

**Questions?**
Just ask! I can help you get any of these set up.
