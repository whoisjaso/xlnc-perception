# 🚂 Railway Setup - Do This RIGHT NOW

## ⚡ Step-by-Step Instructions (5 minutes)

### 📍 **You Are Here:**
- ✅ Code is on GitHub
- ✅ Railway project created
- ✅ Retell webhook updated
- ❌ **Environment variables NOT SET** ← This is why it's not working

---

## 🎯 **Step 1: Add Environment Variables** (2 minutes)

### A. Open Railway Dashboard
1. Go to: https://railway.com/project/834e2627-092c-4c9e-9162-6f28e1889447
2. Click on your **backend service** (the one connected to GitHub)
3. Click the **"Variables"** tab
4. Click **"Raw Editor"** button

### B. Copy-Paste These Variables

**COPY THIS ENTIRE BLOCK:**

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=20b53c2e794942f2ec073fcaa8b9400420bdf960bc914d9ac1cce5b4fa978019
JWT_REFRESH_SECRET=985b4159314bdf56fdef7a72da711c2084e154c7b878e62a5f83e52ac846ff83
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
RETELL_WEBHOOK_SECRET=key_a01bedb0228379656e3b09215227
RETELL_AGENT_ID=agent_2902ef6cd0a87f863052e3efff
ZOHO_CLIENT_ID=1000.GKLJHJYMUO098KD2UQQBY07ERD94OD
ZOHO_CLIENT_SECRET=a979a5a1e73e9c01cf6cde6cf0786a565fef9a2041
ZOHO_REFRESH_TOKEN=1000.9160655ddf9da0acf6ceaefe4cc76c5b.96ef80539fc9a6434106dfcf213a53c7
ZOHO_CALENDAR_ID=c349f76861954b919e182591808d02b9
TEXT180_AUTH_KEY=be7f19a8ab7de611fc94bc3a52246051
TEXT180_ACCOUNT_ID=6038
TEXT180_SHORT_CODE=8888131403
TEXT180_KEYWORD=thinksmart
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=alerts@xlnc.app
SENDGRID_FROM_NAME=XLNC Neural Core
ANTHROPIC_API_KEY=
ENCRYPTION_KEY=xlnc_encryption_key_32_chars_min
FRONTEND_URL=https://xlnc-perception-production.up.railway.app
```

### C. Save
- Railway auto-saves when you paste
- OR click "Save" button if there is one
- Railway will automatically redeploy in ~30 seconds

---

## 🎯 **Step 2: Wait for Deployment** (2 minutes)

### Watch the Logs
1. Stay in Railway dashboard
2. Click **"Deployments"** tab
3. Watch the build logs
4. Wait for status to show **"Success" (green checkmark)**

### What You'll See:
```
✓ Building...
✓ Installing dependencies...
✓ Running npm run build...
✓ Starting application...
✓ Deployment successful
```

---

## 🎯 **Step 3: Run Database Setup** (1 minute)

### Option A: One-Off Command (Recommended)
1. In Railway dashboard → Your service
2. Scroll down to **"Deploy"** or **"Settings"** section
3. Find **"One-off Commands"** or **"Run Command"**
4. Enter: `npm run db:setup`
5. Click **"Run"**
6. Wait for it to complete (~30 seconds)

### Option B: Custom Start Command (Alternative)
1. In Railway dashboard → Your service → **"Settings"**
2. Find **"Start Command"** field
3. Change from `npm start` to:
   ```
   npm run db:setup && npm start
   ```
4. Save and redeploy

**Note:** This runs migration on every deploy (safe but slower)

---

## 🎯 **Step 4: Test Your Deployment** (1 minute)

### Test Health Endpoint
Open this URL in your browser:
```
https://xlnc-perception-production.up.railway.app/health
```

**You should see:**
```json
{
  "status": "operational",
  "environment": "production",
  "database": "connected",
  "timestamp": "2026-01-19T..."
}
```

### If You See 404 or Error:
1. Check Railway logs for errors
2. Verify environment variables were saved
3. Make sure deployment completed successfully
4. Wait 1 more minute (cold start delay)

---

## 🎯 **Step 5: Test Webhook Endpoint**

Open this URL in your browser:
```
https://xlnc-perception-production.up.railway.app/api/webhooks/retell/smart-tax-nation
```

**You should see:**
```json
{
  "error": "Method not allowed",
  "message": "This endpoint only accepts POST requests"
}
```

**This is GOOD!** It means the endpoint exists and is working.

---

## ✅ **Success Checklist**

- [ ] Environment variables pasted into Railway
- [ ] Deployment succeeded (green checkmark)
- [ ] Database setup completed (`npm run db:setup`)
- [ ] `/health` endpoint returns "operational"
- [ ] `/api/webhooks/retell/smart-tax-nation` returns 405 error (expected)

---

## 🎉 **Once All Green Checkmarks:**

**Tell me:** "Railway is deployed successfully"

**Then I'll:**
1. ✅ Make a test call to verify calendar context
2. ✅ Check backend logs for webhook events
3. ✅ Confirm appointment booking works
4. ✅ Verify SMS/email follow-ups

---

## 🚨 **Troubleshooting**

### "Build Failed"
**Check:**
- Is PostgreSQL database added to project? (Railway → New → Database → PostgreSQL)
- Are environment variables correct? (no typos, no missing values)
- Do logs show specific error? (read the error message)

### "Application Error"
**Check:**
- Did you run `npm run db:setup`?
- Is `DATABASE_URL` set correctly? (should be `${{Postgres.DATABASE_URL}}`)
- Are there errors in deployment logs?

### "Health Endpoint Returns 404"
**Check:**
- Did deployment actually finish? (wait 2 minutes)
- Is the service running? (Railway dashboard shows "Active")
- Is the URL correct? (`xlnc-perception-production.up.railway.app`)

### "Database Connection Error"
**Check:**
- Is PostgreSQL service running in Railway?
- Is `DATABASE_URL` environment variable set?
- Did you run `npm run db:setup` to create tables?

---

## 📞 **Need Help?**

**Copy-paste this info:**
1. Railway deployment logs (last 50 lines)
2. Error messages (exact text)
3. Which step you're stuck on

**And I'll debug it immediately.**

---

**Just follow the steps above. You'll be live in 5 minutes.**
