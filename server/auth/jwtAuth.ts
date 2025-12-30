// Stateless JWT-based Google OAuth for Vercel serverless
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import type { Express, Request, Response, NextFunction, RequestHandler } from 'express';
import { authStorage } from './storage';

const ALLOWED_EMAIL_DOMAIN = '@universalawning.com';
const JWT_EXPIRY = '7d';
const COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days in seconds

// Environment validation
function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function isAllowedEmail(email: string | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase().endsWith(ALLOWED_EMAIL_DOMAIN.toLowerCase());
}

// Generate cryptographically secure state for CSRF protection
function generateState(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Generate JWT token for authenticated user
function generateToken(user: { id: string; email: string | null }): string {
  const secret = getEnvVar('SESSION_SECRET');
  return jwt.sign(
    { userId: user.id, email: user.email },
    secret,
    { expiresIn: JWT_EXPIRY }
  );
}

// Verify JWT token
function verifyToken(token: string): { userId: string; email: string } | null {
  try {
    const secret = getEnvVar('SESSION_SECRET');
    const decoded = jwt.verify(token, secret) as { userId: string; email: string };
    return decoded;
  } catch {
    return null;
  }
}

// Parse cookies from request
function getCookie(req: Request, name: string): string | null {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    if (key && value) {
      acc[key] = decodeURIComponent(value);
    }
    return acc;
  }, {} as Record<string, string>);
  
  return cookies[name] || null;
}

// Set a cookie
function setCookie(res: Response, name: string, value: string, maxAgeSeconds: number): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const existingCookies = res.getHeader('Set-Cookie') as string[] || [];
  const newCookie = `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${isProduction ? '; Secure' : ''}`;
  res.setHeader('Set-Cookie', [...existingCookies, newCookie]);
}

// Clear a cookie
function clearCookie(res: Response, name: string): void {
  const existingCookies = res.getHeader('Set-Cookie') as string[] || [];
  const newCookie = `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
  res.setHeader('Set-Cookie', [...existingCookies, newCookie]);
}

export async function setupJWTAuth(app: Express) {
  app.set('trust proxy', 1);

  // Check environment variables
  const requiredVars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'SESSION_SECRET'];
  if (process.env.NODE_ENV === 'production') {
  }
  
  const missing = requiredVars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    console.error(`FATAL: Missing environment variables: ${missing.join(', ')}`);
    if (process.env.NODE_ENV === 'production') {
      app.get('/api/login', (req, res) => {
        res.status(500).json({ error: 'Auth not configured', missing });
      });
      return;
    }
    return;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;

  // Login route - redirect to Google with CSRF state
  app.get('/api/login', (req, res) => {
    const state = generateState();

        // Dynamic URL detection for preview deployments
        const protocol = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
        const host = req.headers['x-forwarded-host'] || req.headers.host;
        const redirectUri = `${protocol}://${host}/api/auth/google/callback`;
        const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);
    
    // Store state in a short-lived cookie for verification
    setCookie(res, 'oauth_state', state, 600); // 10 minutes
    
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['profile', 'email'],
      prompt: 'select_account',
      state: state,
    });
    res.redirect(authUrl);
  });

  // Google OAuth callback
  app.get('/api/auth/google/callback', async (req, res) => {
        // Dynamic URL detection for preview deployments
        const protocol = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
        const host = req.headers['x-forwarded-host'] || req.headers.host;
        const redirectUri = `${protocol}://${host}/api/auth/google/callback`;
        const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);
    
    const code = req.query.code as string;
    const returnedState = req.query.state as string;
    const storedState = getCookie(req, 'oauth_state');
    
    // Clear the state cookie
    clearCookie(res, 'oauth_state');
    
    // Verify CSRF state
    if (!returnedState || !storedState || returnedState !== storedState) {
      console.error('OAuth state mismatch - possible CSRF attack');
      return res.redirect('/?error=invalid_state');
    }
    
    if (!code) {
      console.error('No auth code received');
      return res.redirect('/?error=no_code');
    }

    try {
      // Exchange code for tokens
      const { tokens } = await oauth2Client.getToken(code);
      
      if (!tokens.id_token) {
        console.error('No ID token received');
        return res.redirect('/?error=no_token');
      }

      // Verify and decode the ID token
      const ticket = await oauth2Client.verifyIdToken({
        idToken: tokens.id_token,
        audience: clientId,
      });
      
      const payload = ticket.getPayload();
      if (!payload) {
        console.error('No payload in ID token');
        return res.redirect('/?error=invalid_token');
      }

      const email = payload.email;
      const googleId = payload.sub;
      const firstName = payload.given_name || null;
      const lastName = payload.family_name || null;
      const picture = payload.picture || null;

      // Check email domain
      if (!isAllowedEmail(email)) {
        console.log(`Access denied for: ${email} (not @universalawning.com)`);
        return res.redirect('/?error=access_denied');
      }

      // Upsert user in database
      const user = await authStorage.upsertUser({
        id: googleId,
        email: email || null,
        firstName,
        lastName,
        profileImageUrl: picture,
      });

      // Generate JWT and set cookie (7 days)
      const token = generateToken(user);
      setCookie(res, 'auth_token', token, COOKIE_MAX_AGE_SECONDS);

      console.log(`User logged in: ${email}`);
      return res.redirect('/');
    } catch (error) {
      console.error('OAuth callback error:', error);
      return res.redirect('/?error=auth_failed');
    }
  });

  // Get current user
  app.get('/api/auth/user', async (req, res) => {
    const token = getCookie(req, 'auth_token');
    
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      clearCookie(res, 'auth_token');
      return res.status(401).json({ message: 'Invalid token' });
    }

    try {
      const user = await authStorage.getUser(decoded.userId);
      if (!user) {
        clearCookie(res, 'auth_token');
        return res.status(401).json({ message: 'User not found' });
      }

      return res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });

  // Logout
  app.get('/api/logout', (req, res) => {
    clearCookie(res, 'auth_token');
    res.redirect('/');
  });

  // Also support POST logout for API calls
  app.post('/api/logout', (req, res) => {
    clearCookie(res, 'auth_token');
    res.json({ success: true });
  });
}

// Middleware to protect routes
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const token = getCookie(req, 'auth_token');
  
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  try {
    const user = await authStorage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    (req as any).user = user;
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};
