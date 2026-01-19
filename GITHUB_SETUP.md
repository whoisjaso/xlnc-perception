# GitHub Setup - Quick Guide

## ✅ Step 1: Create GitHub Repository

1. **Go to GitHub:** [github.com/new](https://github.com/new)

2. **Repository Settings:**
   - **Name:** `xlnc-perception` (or whatever you prefer)
   - **Description:** "XLNC Divine Agentic Intelligence System - Production AI Voice Automation"
   - **Visibility:** Choose Private or Public
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)

3. **Click:** "Create repository"

## ✅ Step 2: Push Your Code

After creating the repository, GitHub will show you commands. **Use these:**

```bash
git remote add origin https://github.com/whoisjaso/xlnc-perception.git
git branch -M main
git push -u origin main
```

**Or if you named it differently:**
```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

## ✅ Step 3: Verify

- Refresh your GitHub repository page
- You should see all 259 files

## 🚂 Next: Deploy to Railway

Once your code is on GitHub, we'll:

1. Connect Railway to your GitHub repo
2. Add environment variables
3. Deploy automatically
4. Get your webhook URL
5. Update Retell
6. Test!

---

## Quick Commands Summary

```bash
# Add remote
git remote add origin https://github.com/whoisjaso/xlnc-perception.git

# Rename branch to main
git branch -M main

# Push to GitHub
git push -u origin main
```

**Ready?** Run those commands and let me know when your code is on GitHub!
