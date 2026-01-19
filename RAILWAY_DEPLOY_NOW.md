# 🚂 Deploy to Railway - RIGHT NOW (5 minutes)

## Step 1: Sign Up for Railway

👉 **Go to:** [railway.app](https://railway.app)

- Click **"Login"** or **"Start a New Project"**
- Choose **"Login with GitHub"**
- Authorize Railway to access your GitHub account

## Step 2: Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Find and select: **`whoisjaso/xlnc-perception`**
4. Railway will start deploying automatically!

## Step 3: Add PostgreSQL Database

1. In your Railway project dashboard, click **"New"**
2. Select **"Database"**
3. Choose **"Add PostgreSQL"**
4. Railway creates it instantly (no config needed)

## Step 4: Add Environment Variables

1. Click on your **backend service** (not the database)
2. Click **"Variables"** tab
3. Click **"Raw Editor"**
4. Paste this (I'll help you fill in the values):

```env
NODE_ENV=production
PORT=3000

# Database (Railway provides this automatically)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Retell AI
RETELL_API_KEY=your_retell_api_key
RETELL_WEBHOOK_SECRET=your_webhook_secret

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
TEXT180_FROM_NUMBER=+1XXXXXXXXXX

# SendGrid Email
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@smarttaxnation.com
SENDGRID_FROM_NAME=Smart Tax Nation

# JWT Secrets (generate random strings)
JWT_SECRET=run_this_command_to_generate
JWT_REFRESH_SECRET=run_this_command_to_generate
```

**Generate JWT secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Run that twice to get two different secrets.

**Don't have all credentials yet?** That's okay! At minimum, add:
- `NODE_ENV=production`
- `PORT=3000`
- `JWT_SECRET=` (generate this)
- `JWT_REFRESH_SECRET=` (generate this)
- `RETELL_API_KEY=` (you have this)

You can add the others later!

## Step 5: Run Database Migration

1. Click your backend service → **"Settings"**
2. Scroll to **"One-off Commands"**
3. Enter: `npm run db:setup`
4. Click **"Run"**
5. Wait for it to complete (creates database tables)

## Step 6: Get Your URL

1. Go back to your backend service
2. Click **"Settings"** tab
3. Find **"Domains"** section
4. You'll see a URL like: `https://xlnc-perception-production.up.railway.app`
5. **COPY THIS URL** - you'll give it to me!

## Step 7: Test It Works

Visit: `https://your-railway-url.up.railway.app/health`

Should return:
```json
{
  "status": "operational",
  "environment": "production"
}
```

---

## ✅ Once You Have Your Railway URL

**Give me the URL** and I'll:
1. Update your Retell agent webhook to point to it
2. Verify the connection
3. Have you test a live call
4. Confirm calendar context is working!

---

## 🆘 Having Issues?

**Build failing?**
- Check that PostgreSQL database is added
- Check environment variables are set

**Can't find the URL?**
- Backend service → Settings → Domains section

**App won't start?**
- Check logs: Service → Deployments → View Logs
- Make sure `npm run db:setup` completed successfully

---

## 📱 What's Your Railway URL?

Once you have it, paste it here and we're ready to test!

Format: `https://something.up.railway.app`
