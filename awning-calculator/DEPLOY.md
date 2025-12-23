# Deploy to Vercel - Step by Step Guide

## Quick Deploy via GitHub Integration (Recommended)

Follow these exact steps to deploy your app to Vercel:

### Step 1: Commit and Push (if not already done)
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin claude/build-awning-calculator-YoT98
```

### Step 2: Go to Vercel
1. Open your browser and go to **[vercel.com](https://vercel.com)**
2. Click **"Sign Up"** or **"Log In"** (use your GitHub account for easiest setup)

### Step 3: Import Your Repository
1. Once logged in, click **"Add New..."** button in the top right
2. Select **"Project"**
3. Click **"Import Git Repository"**
4. Find and select **`jacobuniversalawning/claude-workspace`**
   - If you don't see it, click "Adjust GitHub App Permissions" to grant access

### Step 4: Configure Project Settings
When the import screen appears, configure these settings:

**Project Name:**
```
awning-calculator
```

**Framework Preset:**
```
Next.js (should auto-detect)
```

**Root Directory:**
```
awning-calculator
```
⚠️ **IMPORTANT:** Click "Edit" next to Root Directory and enter `awning-calculator`

**Build and Output Settings:** (Leave as default - Vercel will detect automatically)
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

**Environment Variables:** (None needed for now)

### Step 5: Deploy
1. Click **"Deploy"** button
2. Wait 2-3 minutes while Vercel builds your app
3. You'll see a success screen with your live URL!

### Step 6: Get Your Live URL
After deployment completes, you'll get a URL like:
```
https://awning-calculator-xyz.vercel.app
```

Click it to view your live app!

---

## Important Notes

### Database Limitation
⚠️ **The SQLite database will NOT persist on Vercel.** Data will reset on each deployment.

For production use, you'll need to upgrade to a hosted database:

**Option 1: Vercel Postgres (Recommended)**
1. In your Vercel project dashboard, go to **Storage** tab
2. Click **Create Database** → **Postgres**
3. Follow the prompts to create a database
4. Vercel will auto-inject the `DATABASE_URL` environment variable
5. Update `prisma/schema.prisma` to use PostgreSQL:
   ```prisma
   datasource db {
     provider = "postgresql"
   }
   ```
6. Redeploy

**Option 2: Supabase (Free tier available)**
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Get your connection string
4. Add to Vercel environment variables as `DATABASE_URL`
5. Update Prisma schema to PostgreSQL

### Automatic Deployments
Once connected, Vercel will automatically:
- Deploy on every push to your branch
- Create preview URLs for pull requests
- Show build logs and errors

### Custom Domain (Optional)
To add a custom domain:
1. Go to your project settings in Vercel
2. Click **"Domains"**
3. Add your domain and follow DNS instructions

---

## Troubleshooting

### Build Fails
- Check the build logs in Vercel dashboard
- Make sure Root Directory is set to `awning-calculator`
- Verify all dependencies are in package.json

### Database Errors
- SQLite won't work in production - switch to PostgreSQL
- Check that environment variables are set correctly

### Font Loading Errors (Can be ignored)
You may see warnings about Google Fonts - these are non-critical and use fallback fonts.

---

## What You'll See After Deployment

Once deployed, your live app will have:
- ✅ Dashboard with cost sheet history
- ✅ Create new cost sheets
- ✅ Real-time calculations
- ✅ Search and filter
- ✅ Job outcome tracking (Won/Lost/Unknown)
- ✅ Weighted average analytics
- ⚠️ **Data will reset on each deploy** (until you add a hosted database)

---

## Next Steps After Deployment

1. **Test the app** - Create a few cost sheets to verify everything works
2. **Upgrade database** - Switch to Vercel Postgres or Supabase for persistent data
3. **Add authentication** - Implement Google OAuth for @universalawning.com emails
4. **Share with team** - Send the live URL to your developer for further enhancements

---

Need help? Check the Vercel docs: https://vercel.com/docs
