// Stateless JWT-based Google OAuth for Vercel serverless
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import type { Express, Request, Response, NextFunction, RequestHandler } from 'express';
import { authStorage } from './storage';

const ALLOWED_EMAIL_DOMAIN = '@universalawning.com';
const JWT_EXPIRY = '7d';

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

// Parse auth cookie from request
function getAuthToken(req: Request): string | null {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
  
  return cookies['auth_token'] || null;
}

// Set auth cookie
function setAuthCookie(res: Response, token: string): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
  
  res.setHeader('Set-Cookie', [
    `auth_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${isProduction ? '; Secure' : ''}`
  ]);
}

// Clear auth cookie
function clearAuthCookie(res: Response): void {
  res.setHeader('Set-Cookie', [
    'auth_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
  ]);
}

export async function setupJWTAuth(app: Express) {
  app.set('trust proxy', 1);

  // Check environment variables
  const requiredVars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'SESSION_SECRET'];
  if (process.env.NODE_ENV === 'production') {
    requiredVars.push('APP_URL');
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
  const appUrl = process.env.NODE_ENV === 'production' 
    ? process.env.APP_URL! 
    : 'http://localhost:5000';
  
  const redirectUri = `${appUrl}/api/auth/google/callback`;
  const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);

  // Login route - redirect to Google
  app.get('/api/login', (req, res) => {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['profile', 'email'],
      prompt: 'select_account',
    });
    res.redirect(authUrl);
  });

  // Google OAuth callback
  app.get('/api/auth/google/callback', async (req, res) => {
    const code = req.query.code as string;
    
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

      // Generate JWT and set cookie
      const token = generateToken(user);
      setAuthCookie(res, token);

      console.log(`User logged in: ${email}`);
      return res.redirect('/');
    } catch (error) {
      console.error('OAuth callback error:', error);
      return res.redirect('/?error=auth_failed');
    }
  });

  // Get current user
  app.get('/api/auth/user', async (req, res) => {
    const token = getAuthToken(req);
    
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      clearAuthCookie(res);
      return res.status(401).json({ message: 'Invalid token' });
    }

    try {
      const user = await authStorage.getUser(decoded.userId);
      if (!user) {
        clearAuthCookie(res);
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
    clearAuthCookie(res);
    res.redirect('/');
  });

  // Also support POST logout for API calls
  app.post('/api/logout', (req, res) => {
    clearAuthCookie(res);
    res.json({ success: true });
  });
}

// Middleware to protect routes
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const token = getAuthToken(req);
  
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
