# 🚀 Client Onboarding Template - 10x Faster Deployment

## Overview
This is the **EXACT process** for onboarding a new client to the XLNC Perception platform.
Follow this checklist and new clients take **10 minutes instead of 10 hours**.

---

## 📋 Pre-Onboarding Checklist

**What You Need From Client:**
- [ ] Business Name & Industry
- [ ] Primary Phone Number
- [ ] Primary Email Address
- [ ] Business Address
- [ ] Timezone (e.g., `America/Chicago`)
- [ ] Business Hours (Monday-Sunday schedule)
- [ ] Special Instructions (tone, policies, etc.)

**What You Need To Create For Client:**
- [ ] Retell AI Agent (voice agent)
- [ ] Zoho CRM Account (or get their OAuth credentials)
- [ ] Zoho Calendar ID
- [ ] SMS Provider Account (Text180/Twilio)
- [ ] Email Provider Account (SendGrid/Zoho Mail)

---

## ⚡ Step 1: Create Client Configuration File

**File Location:** `backend/config/clients/{client-slug}.json`

**Example:** `backend/config/clients/smart-tax-nation.json`

**Template:**
```json
{
  "client_id": "client-slug",
  "business_name": "Client Business Name",
  "owner_name": "Owner Full Name",
  "industry": "Industry Type",
  "phone": "+1XXXXXXXXXX",
  "email": "contact@clientdomain.com",
  "address": "123 Main St, City, State ZIP",
  "timezone": "America/Chicago",

  "business_hours": {
    "monday": { "start": "09:00", "end": "18:00" },
    "tuesday": { "start": "09:00", "end": "18:00" },
    "wednesday": { "start": "09:00", "end": "18:00" },
    "thursday": { "start": "09:00", "end": "18:00" },
    "friday": { "start": "09:00", "end": "17:00" },
    "saturday": { "start": "10:00", "end": "14:00" },
    "sunday": { "start": "00:00", "end": "00:00", "closed": true }
  },

  "retell_agent_id": "agent_xxxxxxxxxxxxx",

  "zoho_calendar_id": "client_calendar_id",
  "zoho_client_id": "1000.XXXXXX",
  "zoho_client_secret": "xxxxxxxxxxxxx",
  "zoho_refresh_token": "1000.xxxxxxxxxxxxxx",
  "zoho_crm_enabled": true,

  "sms_provider": "txt180",
  "email_provider": "sendgrid",
  "sms_enabled": true,
  "email_enabled": true,

  "ai_followup_enabled": true,
  "prism_analysis_enabled": true,

  "appointment_booking_enabled": true,
  "inventory_check_enabled": false,
  "human_transfer_enabled": true,

  "special_instructions": "Add any client-specific instructions here."
}
```

---

## ⚡ Step 2: Create Retell AI Agent

### Option A: Use Retell MCP (Automated)
```typescript
// Use the retell_create_agent MCP tool
{
  "agent_name": "Client Name - Voice Agent",
  "voice_id": "cartesia-Brooke",
  "response_engine": {
    "type": "conversation-flow",
    "conversation_flow_id": "conversation_flow_adebf64b666c" // Reuse existing flow
  },
  "webhook_url": "https://xlnc-perception-production.up.railway.app/api/webhooks/retell/{client-id}"
}
```

### Option B: Clone Existing Agent (Manual)
1. Go to Retell Dashboard
2. Find "Smart Tax Nation - Tax Voice Agent"
3. Click "Clone Agent"
4. Update:
   - Name: `{Client Name} - Voice Agent`
   - Webhook URL: `https://your-backend.railway.app/api/webhooks/retell/{client-id}`
5. Copy the new `agent_id`

---

## ⚡ Step 3: Configure Zoho OAuth

**Get Client's Zoho OAuth Credentials:**

1. Have client create Zoho API Console app: https://api-console.zoho.com
2. Create "Server-based Application"
3. Get:
   - Client ID
   - Client Secret
   - Refresh Token (via OAuth flow)
4. Get Calendar ID from: Zoho Calendar → Settings → Calendars

**Or Use Shared XLNC Account:**
- If client doesn't have Zoho, create calendar under XLNC's Zoho account
- Generate OAuth credentials for that specific calendar
- Store in client config file

---

## ⚡ Step 4: Configure SMS/Email Providers

### Text180 (SMS)
1. Create campaign in Text180 dashboard
2. Get:
   - `TEXT180_AUTH_KEY`
   - `TEXT180_ACCOUNT_ID`
   - `TEXT180_SHORT_CODE`
   - `TEXT180_KEYWORD`

### SendGrid (Email)
1. Create SendGrid API key with "Mail Send" permission
2. Verify sender email address for client's domain
3. Get:
   - `SENDGRID_API_KEY`
   - `SENDGRID_FROM_EMAIL`
   - `SENDGRID_FROM_NAME`

**Note:** These can be stored in the client config file OR as environment variables

---

## ⚡ Step 5: Deploy Client Configuration

### A. Commit Config File
```bash
cd backend/config/clients
git add {client-slug}.json
git commit -m "Add client configuration: {Client Name}"
git push
```

### B. Railway Auto-Deploys
- Railway detects the commit
- Automatically redeploys backend
- New client config is live in ~2 minutes

### C. Verify Config Loads
```bash
# Test endpoint
curl https://xlnc-perception-production.up.railway.app/api/admin/clients/{client-id}
```

---

## ⚡ Step 6: Test Client's Agent

### A. Make Test Call
1. Go to Retell Dashboard
2. Find client's agent
3. Click "Test Call"
4. Speak with the agent
5. Verify:
   - ✅ Webhook receives events
   - ✅ Calendar availability is fetched
   - ✅ Agent can book appointments
   - ✅ Follow-ups are sent (SMS/Email)

### B. Check Backend Logs
```bash
# In Railway dashboard
# Service → Deployments → View Logs
# Look for:
# - "Handling context_request for calendar availability"
# - "Calendar context injected"
# - "Post-call processing started"
```

---

## ⚡ Step 7: Client Handoff

**Deliver to Client:**
1. ✅ Retell phone number (if inbound)
2. ✅ Agent ID
3. ✅ Dashboard access (if applicable)
4. ✅ Test call recording
5. ✅ Documentation on how to:
   - View call logs
   - Update business hours
   - Modify agent instructions

---

## 🎯 Future Client Onboarding - Quick Checklist

**Time Estimate: 10 minutes**

- [ ] 1. Create `{client-slug}.json` config file (3 min)
- [ ] 2. Clone Retell agent, update webhook (2 min)
- [ ] 3. Get client's Zoho/SMS/Email credentials (5 min - if client provides)
- [ ] 4. Commit config, push to GitHub (1 min)
- [ ] 5. Railway auto-deploys (2 min)
- [ ] 6. Test call (2 min)
- [ ] 7. Deliver to client (1 min)

**Total: ~15 minutes** (most time is waiting for client credentials)

---

## 🔧 Architecture Benefits

### ✅ Multi-Tenant by Design
- Each client has isolated configuration
- No code changes needed per client
- All clients share same backend infrastructure

### ✅ Scalable
- Add 100 clients = 100 config files
- No performance impact
- Easy to manage and version control

### ✅ Secure
- Client credentials never mixed
- Each webhook endpoint is client-specific
- Per-client access control

### ✅ Maintainable
- Bug fixes benefit all clients instantly
- Feature updates roll out automatically
- Easy to audit and debug per-client

---

## 🚨 Common Pitfalls

**❌ Don't:**
- Hard-code client credentials in environment variables (use config files)
- Share Retell agent IDs between clients
- Use same Zoho calendar for multiple clients
- Forget to update webhook URL after cloning agent

**✅ Do:**
- Keep config files version-controlled
- Test each client's setup before handoff
- Document client-specific customizations
- Use consistent naming conventions (`client-slug`, not `ClientName123`)

---

## 📊 Client Configuration Schema

**Required Fields:**
- `client_id` (string, kebab-case)
- `business_name` (string)
- `phone` (string, E.164 format)
- `email` (string, valid email)
- `timezone` (string, IANA timezone)
- `business_hours` (object, 7 days)
- `retell_agent_id` (string)

**Optional Fields:**
- `zoho_*` (if using Zoho)
- `sms_provider` + credentials
- `email_provider` + credentials
- Feature flags (`*_enabled`)
- `special_instructions` (string)

---

## 🎯 Next Steps After Onboarding

1. **Monitor First Week:**
   - Check call logs daily
   - Ensure appointments are booking correctly
   - Verify SMS/email follow-ups are sending

2. **Optimize:**
   - Adjust agent's conversation flow based on real calls
   - Tune interruption sensitivity
   - Refine post-call analysis prompts

3. **Scale:**
   - Once Smart Tax Nation is proven, replicate for next client
   - Each new client should take <15 minutes

---

## 📞 Support

**If something breaks:**
1. Check Railway logs for errors
2. Verify client config file is valid JSON
3. Test webhook endpoint: `{railway-url}/api/webhooks/retell/{client-id}`
4. Confirm Retell agent's webhook URL is correct
5. Verify client credentials (Zoho, SMS, Email) are valid

**Debugging Commands:**
```bash
# Test client config loads
curl https://your-backend.railway.app/api/admin/clients/{client-id}

# Test health
curl https://your-backend.railway.app/health

# Test webhook (requires Retell signature)
curl -X POST https://your-backend.railway.app/api/webhooks/retell/{client-id}
```

---

## 🎉 Success Criteria

**Client is successfully onboarded when:**
- ✅ Agent answers calls correctly
- ✅ Calendar availability is accurate
- ✅ Appointments can be booked
- ✅ SMS/Email follow-ups are sent
- ✅ Client is satisfied with test calls
- ✅ All logs show no errors

---

**Built for scale. Deploy with confidence. 10x faster, every time.**
