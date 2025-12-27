# Google OAuth Setup Guide for Universal Awning Workspace

This guide explains how to set up Google OAuth authentication for your Vercel deployment.

## Step 1: Create Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth 2.0 Client IDs**
5. Configure the consent screen if prompted:
   - Choose "Internal" if only @universalawning.com users will access it
   - Or "External" and add your domain to allowed test users
6. For Application Type, select **Web application**
7. Add the following to **Authorized redirect URIs**:
   - For production: `https://your-app.vercel.app/api/auth/google/callback`
   - For local development: `http://localhost:5000/api/auth/google/callback`
8. Click **Create** and copy your Client ID and Client Secret

## Step 2: Set Up Database

You need a PostgreSQL database. Options:
- [Neon](https://neon.tech/) - Free tier available
- [Supabase](https://supabase.com/) - Free tier available
- [Railway](https://railway.app/) - Simple setup

Get your `DATABASE_URL` connection string from your database provider.

## Step 3: Configure Environment Variables in Vercel

Go to your Vercel project settings > Environment Variables and add:

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | **Yes** | PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `SESSION_SECRET` | **Yes** | Random string for session encryption | Generate with: `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | **Yes** | From Google Cloud Console | `xxxxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | **Yes** | From Google Cloud Console | `GOCSPX-xxxxx` |
| `APP_URL` | **Yes** | Your production URL (no trailing slash) | `https://your-app.vercel.app` |
| `NODE_ENV` | Auto | Set automatically by Vercel | `production` |

**IMPORTANT**: All variables marked as required MUST be set or login will fail with a 500 error.

## Step 4: Install Dependencies

Run in your project:
```bash
npm install passport passport-google-oauth20 express-session connect-pg-simple
npm install -D @types/passport @types/passport-google-oauth20 @types/express-session @types/connect-pg-simple
```

## Step 5: Run Database Migration

```bash
npm run db:push
```

This creates the `users` and `sessions` tables.

## Step 6: Deploy to Vercel

Push your changes and Vercel will automatically redeploy.

## How It Works

- Users click "Sign in with Google" on the landing page
- They authenticate with their Google account
- The app checks if their email ends with `@universalawning.com`
- If yes: they're logged in and redirected to the home page
- If no: they see an "Access denied" error message

## Security Notes

- Only `@universalawning.com` email addresses are allowed
- Sessions are stored in PostgreSQL and expire after 7 days
- Session cookies are HTTP-only and secure in production
