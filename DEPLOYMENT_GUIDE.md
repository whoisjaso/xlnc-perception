# Deployment Guide - Railway (Recommended)

## Why Railway?

- ✅ Free tier with $5/month credits
- ✅ Auto-detects Node.js/TypeScript
- ✅ Built-in PostgreSQL and Redis
- ✅ Automatic HTTPS
- ✅ GitHub integration
- ✅ Zero config deployments

## Quick Deploy (5 minutes)

### Step 1: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub (recommended for auto-deploy)
3. Verify your email

### Step 2: Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose this repository: `xlnc-perception`
4. Railway will auto-detect the Node.js app

### Step 3: Add PostgreSQL Database

1. In your Railway project, click **"New"**
2. Select **"Database" → "PostgreSQL"**
3. Railway provisions it automatically
4. Note: DATABASE_URL is auto-injected as environment variable

### Step 4: Add Redis (Optional but Recommended)

1. Click **"New"**
2. Select **"Database" → "Redis"**
3. Railway provisions it automatically
4. Note: REDIS_URL is auto-injected

### Step 5: Configure Environment Variables

Click on your backend service → **"Variables"** tab:

```env
# Node Environment
NODE_ENV=production
PORT=3000

# Database (Auto-provided by Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (Auto-provided if added)
REDIS_URL=${{Redis.REDIS_URL}}

# Retell AI
RETELL_API_KEY=your_retell_api_key_here
RETELL_WEBHOOK_SECRET=your_webhook_secret_here

# Zoho CRM
ZOHO_CLIENT_ID=your_zoho_client_id
ZOHO_CLIENT_SECRET=your_zoho_client_secret
ZOHO_REFRESH_TOKEN=your_zoho_refresh_token

# Zoho Calendar
ZOHO_CALENDAR_CLIENT_ID=your_calendar_client_id
ZOHO_CALENDAR_CLIENT_SECRET=your_calendar_client_secret
ZOHO_CALENDAR_REFRESH_TOKEN=your_calendar_refresh_token
ZOHO_CALENDAR_ID=your_calendar_id

# Text180 SMS
TEXT180_API_KEY=your_text180_key
TEXT180_BRAND_ID=your_brand_id
TEXT180_CAMPAIGN_ID=your_campaign_id
TEXT180_FROM_NUMBER=your_sms_number

# SendGrid Email
SENDGRID_API_KEY=your_sendgrid_key
SENDGRID_FROM_EMAIL=noreply@smarttaxnation.com
SENDGRID_FROM_NAME=Smart Tax Nation

# JWT Secrets
JWT_SECRET=your_random_jwt_secret_here
JWT_REFRESH_SECRET=your_random_refresh_secret_here

# Slack Alerts (optional)
SLACK_WEBHOOK_URL=your_slack_webhook_url
```

**Generate secure secrets:**
```bash
# For JWT secrets, run:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 6: Deploy

1. Railway automatically deploys on push to `main` branch
2. Or click **"Deploy"** manually
3. Wait for build to complete (2-3 minutes)
4. Railway will give you a public URL like: `https://xlnc-perception-production.up.railway.app`

### Step 7: Run Database Migrations

1. Click on your service → **"Settings"**
2. Add a **"One-off Command"**: `cd backend && npm run db:setup`
3. Or use Railway CLI:
   ```bash
   railway run npm run db:setup
   ```

### Step 8: Verify Deployment

Visit your Railway URL + `/health`:
```
https://your-app.up.railway.app/health
```

Should return:
```json
{
  "status": "operational",
  "timestamp": "2026-01-18T...",
  "environment": "production",
  "consciousness_level": "TRANSCENDENT"
}
```

## Your Webhook URL

Once deployed, your webhook URL will be:
```
https://your-app.up.railway.app/api/webhooks/retell/smart-tax-nation
```

Use this URL in your Retell agent configuration.

## Alternative: Render

If you prefer Render over Railway:

1. Go to [render.com](https://render.com)
2. Create **"New Web Service"**
3. Connect GitHub repo
4. Settings:
   - **Build Command:** `cd backend && npm install && npm run build`
   - **Start Command:** `cd backend && npm start`
   - **Environment:** Node
5. Add PostgreSQL database from Render dashboard
6. Configure environment variables
7. Deploy

## Alternative: Local Testing with ngrok

For quick local testing before deploying:

```bash
# Install ngrok
brew install ngrok  # Mac
# or download from ngrok.com

# Start your backend
cd backend
npm run dev

# In another terminal, expose it
ngrok http 3000

# Use the ngrok URL in Retell
https://abc123.ngrok.io/api/webhooks/retell/smart-tax-nation
```

**Note:** ngrok URLs change every restart on free tier.

## Monitoring & Logs

**Railway:**
- Click on your service → **"Deployments"** → **"View Logs"**
- Live logs show all console output
- Filter by log level

**Health Checks:**
- Railway automatically monitors `/health` endpoint
- Restarts service if health check fails

## Troubleshooting

### Build Fails

**Check:**
- `backend/package.json` has valid `build` script
- TypeScript compiles: `npm run build` locally
- All dependencies in `package.json`

### Runtime Errors

**Check:**
- Environment variables are set correctly
- Database URL is valid
- Port is set to Railway's `PORT` variable (auto-injected)

### Database Connection Issues

**Check:**
- DATABASE_URL environment variable exists
- PostgreSQL service is running in Railway
- Run migrations: `railway run npm run db:setup`

## Cost Estimate

**Railway Free Tier:**
- $5 credit/month
- Enough for: Backend + PostgreSQL + Redis
- No credit card required to start

**If you exceed free tier:**
- ~$5-10/month for small app
- Pay-as-you-go pricing

## Next Steps After Deployment

1. ✅ Get your Railway URL
2. ✅ Update Retell webhook to point to it
3. ✅ Test `/health` endpoint
4. ✅ Make a test call
5. ✅ Check logs for "Calendar context injected"
6. ✅ Monitor for errors

## Support

**Railway Docs:** https://docs.railway.app
**Railway Discord:** https://discord.gg/railway

Need help? Let me know!
