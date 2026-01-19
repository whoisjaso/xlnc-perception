# 🚀 Quick Start - Deploy in 5 Minutes

## What You Need

- [ ] GitHub account (to connect Railway)
- [ ] Your Retell API key
- [ ] Your Zoho credentials (from Smart Tax Nation setup)
- [ ] 5 minutes

## Deploy to Railway (Easiest)

### 1. **Sign Up**
👉 [railway.app](https://railway.app) → Sign in with GitHub

### 2. **Create Project**
- Click **"New Project"**
- Select **"Deploy from GitHub repo"**
- Choose your `xlnc-perception` repo
- Railway auto-detects everything! ✨

### 3. **Add Database**
- In your project, click **"New"** → **"Database"** → **"PostgreSQL"**
- Done! Railway connects it automatically

### 4. **Add Environment Variables**
Click your backend service → **"Variables"** → **"Raw Editor"**

Paste this (fill in YOUR values):

```env
NODE_ENV=production
PORT=3000

# Retell
RETELL_API_KEY=key_xxx
RETELL_WEBHOOK_SECRET=secret_xxx

# Zoho CRM
ZOHO_CLIENT_ID=1000.XXX
ZOHO_CLIENT_SECRET=xxx
ZOHO_REFRESH_TOKEN=1000.xxx

# Zoho Calendar
ZOHO_CALENDAR_CLIENT_ID=1000.XXX
ZOHO_CALENDAR_CLIENT_SECRET=xxx
ZOHO_CALENDAR_REFRESH_TOKEN=1000.xxx
ZOHO_CALENDAR_ID=your_calendar_id

# Text180
TEXT180_API_KEY=xxx
TEXT180_BRAND_ID=xxx
TEXT180_CAMPAIGN_ID=xxx
TEXT180_FROM_NUMBER=+1xxx

# SendGrid
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@smarttaxnation.com

# JWT (generate random strings)
JWT_SECRET=xxx
JWT_REFRESH_SECRET=xxx
```

**Generate JWT secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. **Deploy!**
- Railway deploys automatically
- Wait 2-3 minutes
- You'll get a URL like: `https://xlnc-perception-production.up.railway.app`

### 6. **Run Database Migration**
In Railway, click your service → **"Settings"** → scroll to **"One-off Commands"**

Add this command:
```
cd backend && npm run db:setup
```

Click **"Run"** and wait for it to complete.

### 7. **Verify It's Working**
Visit: `https://your-app.up.railway.app/health`

Should see:
```json
{
  "status": "operational",
  "environment": "production"
}
```

## ✅ You're Done!

**Your webhook URL is:**
```
https://your-app.up.railway.app/api/webhooks/retell/smart-tax-nation
```

**Copy that URL** and give it to me - I'll update your Retell agent and we'll test it!

---

## Troubleshooting

### "Build Failed"
- Check that all environment variables are set
- Make sure PostgreSQL database is added to project

### "Application Error"
- Check logs: Click service → "Deployments" → "View Logs"
- Look for database connection errors
- Verify DATABASE_URL is set (Railway does this automatically)

### "Can't access the URL"
- Wait 3-5 minutes after first deploy
- Check deployment status (should be green)
- Verify service is running

---

## Alternative: Quick Test with ngrok

**Want to test locally first?**

```bash
# Terminal 1: Start backend
cd backend
npm install
npm run dev

# Terminal 2: Expose it
npx ngrok http 3000

# Copy the ngrok URL (like https://abc123.ngrok.io)
# Give it to me and I'll update Retell
```

**Note:** ngrok URL changes on every restart (free tier)

---

## What Happens Next?

Once you give me your Railway URL, I'll:
1. ✅ Update your Retell agent webhook
2. ✅ Verify the connection
3. ✅ Have you make a test call
4. ✅ Confirm calendar context is working
5. 🎉 You're live!

**Drop your Railway URL when ready!**
