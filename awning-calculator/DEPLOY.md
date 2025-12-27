# Deployment Guide

## Critical Environment Variables

For the application to function correctly, ESPECIALLY Authentication, you must have these variables set in Vercel.

| Variable | Required | Description | Example / Command to Generate |
|----------|----------|-------------|-------------------------------|
| `DATABASE_URL` | **YES** | Connection string to Neon/Supabase/Postgres | `postgres://...` |
| `GOOGLE_CLIENT_ID` | **YES** | From Google Cloud Console | `....apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | **YES** | From Google Cloud Console | `GOCSPX-...` |
| `NEXTAUTH_SECRET` | **YES** | CRITICAL: Session encryption key. Missing this causes infinite login loops. | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Optional | Canonical URL of your site (Vercel sets this mostly automatically, but good to have) | `https://your-app.vercel.app` |

## Google Cloud Console Setup

1.  **Authorized Origins**:
    *   `https://your-app.vercel.app`
    *   `http://localhost:3000` (for local dev)

2.  **Authorized Redirect URIs**:
    *   `https://your-app.vercel.app/api/auth/callback/google`
    *   `http://localhost:3000/api/auth/callback/google`

## Troubleshooting "Infinite Loop"

If you see the "Sign in with Google" -> "Redirect" -> "Sign in with Google" loop:
1.  **Check `NEXTAUTH_SECRET`**: It is likely missing or different between builds.
2.  **Check Database**: Ensure the `User` table exists.
3.  **Check Cookies**: The app is configured to handle `Secure` cookies correctly in production.
