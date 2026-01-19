# Retell AI Webhook Setup Guide

## Overview
Your backend now has a webhook endpoint ready to receive call data from Retell AI. This guide will walk you through exposing it publicly and configuring Retell to send webhooks.

## Current Status
✅ Webhook endpoint created: `/api/webhooks/retell`
✅ Backend server running on `localhost:3000`
✅ Webhook test endpoint verified
⏳ Need to expose webhook publicly
⏳ Need to configure in Retell dashboard

---

## Step 1: Install ngrok (Free Tunneling Service)

Ngrok will create a public URL for your local webhook endpoint.

### Download ngrok:
1. Go to https://ngrok.com/download
2. Download the Windows version
3. Extract the `ngrok.exe` file to a convenient location (e.g., `C:\ngrok\`)

### Sign up for free account:
1. Go to https://dashboard.ngrok.com/signup
2. Create a free account
3. Copy your authtoken from https://dashboard.ngrok.com/get-started/your-authtoken

### Configure ngrok:
Open PowerShell or Command Prompt and run:
```bash
# Navigate to where you extracted ngrok
cd C:\ngrok

# Add your authtoken (replace YOUR_TOKEN with actual token)
.\2ngrok.exe config add-authtoken YOUR_TOKEN
```

### Start ngrok tunnel:
```bash
.\ngrok.exe http 3000
```

You should see output like:
```
Forwarding   https://abc123.ngrok-free.app -> http://localhost:3000
```

**IMPORTANT**: Copy the `https://` URL (e.g., `https://abc123.ngrok-free.app`)
This is your public webhook URL!

---

## Step 2: Configure Retell AI Dashboard

### Navigate to Retell Dashboard:
1. Go to https://app.retellai.com
2. Log in with your account
3. Go to **Settings** or **Webhooks** section

### Add Webhook URL:
1. Find the "Webhook URL" field
2. Enter your ngrok URL + webhook path:
   ```
   https://YOUR_NGROK_URL.ngrok-free.app/api/webhooks/retell
   ```
   Example: `https://abc123.ngrok-free.app/api/webhooks/retell`

### Generate Webhook Secret (Public Key):
Retell will provide a **Webhook Secret** (this is what you asked about as "public key").

**IMPORTANT**: Copy this secret! You'll need it in Step 3.

### Select Events:
Make sure these events are enabled:
- ✅ `call_ended`
- ✅ `call_analyzed`

### Save Configuration

---

## Step 3: Add Webhook Secret to Backend

### Open your backend `.env` file:
```bash
D:\xlnc-perception\backend\.env
```

### Add this line (replace with actual secret from Retell):
```bash
RETELL_WEBHOOK_SECRET=your_actual_webhook_secret_from_retell
```

### Restart your backend server:
Stop the current server (Ctrl+C in terminal) and restart:
```bash
cd D:\xlnc-perception\backend
npm run dev
```

---

## Step 4: Test the Webhook

### Make a test call:
1. In Retell dashboard, find your agent: `agent_2902ef6cd0a87f863052e3efff`
2. Make a test call using Retell's test call feature
3. Complete the call

### Check webhook received data:
1. Watch your ngrok console - you should see incoming POST requests
2. Watch your backend logs - you should see:
   ```
   Retell webhook received: call_ended
   Stored new call log: [call_id]
   ```

### Verify in Drizzle Studio:
1. Go to https://local.drizzle.studio (should be running)
2. Check the `webhookEvents` table - should have new entries
3. Check the `callLogs` table - should have the call data

### Check Admin Dashboard:
1. Go to http://localhost:5173
2. Login with your credentials
3. Navigate to Admin Panel
4. Check "Recent Call Logs" - your test call should appear!

---

## Troubleshooting

### Webhook returns 401 Unauthorized:
- Check that `RETELL_WEBHOOK_SECRET` in `.env` matches Retell dashboard
- Restart backend server after changing `.env`

### No data appearing in database:
- Check backend logs for errors
- Verify webhook URL is correct in Retell dashboard
- Make sure ngrok tunnel is still running

### ngrok URL changes:
- Free ngrok URLs change every time you restart
- Update the URL in Retell dashboard each time
- Consider ngrok paid plan for static URLs ($8/month)

---

## Summary

Your webhook system works like this:

```
Retell AI Call → Webhook Event → ngrok Tunnel → Your Backend → Database
                                  (public)      (localhost)
```

1. User makes/receives a call via Retell
2. Retell processes the call
3. Retell sends webhook to your public ngrok URL
4. ngrok forwards to localhost:3000
5. Your backend verifies signature and stores data
6. Data appears in database and admin dashboard

---

## Alternative: Deploy to Production

For a permanent solution without ngrok:

### Option 1: Railway
1. Deploy backend to Railway (free tier)
2. Use Railway's public URL as webhook endpoint
3. No need for ngrok

### Option 2: Render
1. Deploy to Render.com (free tier)
2. Use Render's public URL

### Option 3: Vercel
1. Deploy backend as serverless functions
2. Use Vercel's URL

Would you like help deploying to production instead of using ngrok?

---

## Quick Reference

| Item | Value |
|------|-------|
| Local Backend | http://localhost:3000 |
| Webhook Endpoint | /api/webhooks/retell |
| Test Endpoint | /api/webhooks/retell/test |
| Retell Agent ID | agent_2902ef6cd0a87f863052e3efff |
| Drizzle Studio | https://local.drizzle.studio |
| Frontend | http://localhost:5173 |

---

## Step 5: Configure Text180 SMS Integration

To enable SMS functionality, we have configured the Text180 credentials in the backend environment.

### Environment Variables
Ensure your `.env` file contains the following variables (automatically added):
```bash
TEXT180_AUTH_KEY=be7f19a8ab7de611fc94bc3a52246051
TEXT180_ACCOUNT_ID=6038
TEXT180_SHORT_CODE=8888131403
TEXT180_KEYWORD=thinksmart
```

### API Body Format
The integration uses the following XML body structure:
```xml
<sms>
  <auth_key>{{TEXT180_AUTH_KEY}}</auth_key>
  <command>send_message</command>
  <account_id>{{TEXT180_ACCOUNT_ID}}</account_id>
  <short_code>{{TEXT180_SHORT_CODE}}</short_code>
  <keyword>{{TEXT180_KEYWORD}}</keyword>
  <message><![CDATA[{{ $input.first().json.message }}]]></message>
  <contact_number>{{ $input.first().json.recipient_phone }}</contact_number>
</sms>
```

> [!NOTE]
> **OAuth2 Preference**: While OAuth2 is preferred for securely acquiring credentials and supporting multiple clients, the current Text180 integration relies on static API keys (Legacy XML API). For future multi-tenant scaling, we should prioritize providers with OAuth2 support or implement a secure credential management system.

---

## Next Steps After Setup

Once webhooks are working:
1. Make real calls through your agent
2. Monitor call data in admin dashboard
3. View analytics and sentiment data
4. Test different call scenarios
5. Configure alert/notification system (future enhancement)
