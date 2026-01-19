import { Router, Response } from 'express';
import axios from 'axios';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../config/database';
import { users } from '../db/schema/users';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';
import { createTheatricalResponse, createErrorResponse, theatricalMessages } from '../utils/theatrical';
import { logTheatrical } from '../utils/logger';
import env from '../config/env';
import { z } from 'zod';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Helper: Generate JWT tokens
const generateTokens = (userId: string, email: string, isAdmin: boolean, plan: string) => {
  const accessToken = jwt.sign(
    { id: userId, email, isAdmin, plan },
    env.JWT_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRY }
  );

  const refreshToken = jwt.sign(
    { id: userId, email },
    env.JWT_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRY }
  );

  return { accessToken, refreshToken };
};

/**
 * POST /api/auth/register
 * Create new user account
 */
router.post('/register', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, email, password } = registerSchema.parse(req.body);

  // Check if user already exists
  const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (existingUser.length > 0) {
    return res.status(409).json(
      createErrorResponse(
        'Email already registered',
        'CONFLICT',
        409
      )
    );
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Create user
  const [newUser] = await db.insert(users).values({
    name,
    email,
    passwordHash,
    plan: 'INITIATE',
    isAdmin: false,
  }).returning();

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(
    newUser.id,
    newUser.email,
    newUser.isAdmin,
    newUser.plan
  );

  // Set refresh token as HTTP-only cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  logTheatrical.success(`New sovereign registered: ${email}`);

  res.status(201).json(
    createTheatricalResponse({
      accessToken,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        plan: newUser.plan,
        isAdmin: newUser.isAdmin,
        avatarUrl: newUser.avatarUrl,
      },
      message: theatricalMessages.USER_REGISTERED,
    }, {
      consciousness_level: 'INITIATE',
    })
  );
}));

/**
 * POST /api/auth/login
 * Authenticate user and return tokens
 */
router.post('/login', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);

  // Find user
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!user) {
    return res.status(401).json(
      createErrorResponse(
        'Invalid credentials',
        'INVALID_CREDENTIALS',
        401
      )
    );
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.passwordHash);

  if (!isValidPassword) {
    return res.status(401).json(
      createErrorResponse(
        'Invalid credentials',
        'INVALID_CREDENTIALS',
        401
      )
    );
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(
    user.id,
    user.email,
    user.isAdmin,
    user.plan
  );

  // Set refresh token as HTTP-only cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  logTheatrical.success(`Sovereign authenticated: ${email}`);

  res.json(
    createTheatricalResponse({
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        isAdmin: user.isAdmin,
        avatarUrl: user.avatarUrl,
      },
      message: theatricalMessages.USER_LOGGED_IN,
    }, {
      consciousness_level: user.plan as any,
    })
  );
}));

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', asyncHandler(async (req: AuthRequest, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json(
      createErrorResponse(
        'No refresh token provided',
        'AUTHENTICATION_FAILED',
        401
      )
    );
  }

  try {
    const decoded = jwt.verify(refreshToken, env.JWT_SECRET) as any;

    // Get user from database
    const [user] = await db.select().from(users).where(eq(users.id, decoded.id)).limit(1);

    if (!user) {
      return res.status(401).json(
        createErrorResponse(
          'User not found',
          'AUTHENTICATION_FAILED',
          401
        )
      );
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, isAdmin: user.isAdmin, plan: user.plan },
      env.JWT_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRY }
    );

    logTheatrical.info(`Token refreshed for: ${user.email}`);

    res.json(
      createTheatricalResponse({
        accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          plan: user.plan,
          isAdmin: user.isAdmin,
          avatarUrl: user.avatarUrl,
        },
        message: theatricalMessages.TOKEN_REFRESHED,
      })
    );
  } catch (error) {
    return res.status(401).json(
      createErrorResponse(
        'Invalid refresh token',
        'AUTHENTICATION_FAILED',
        401
      )
    );
  }
}));

/**
 * POST /api/auth/logout
 * Invalidate refresh token
 */
router.post('/logout', (req: AuthRequest, res: Response) => {
  res.clearCookie('refreshToken');

  logTheatrical.info('User logged out');

  res.json(
    createTheatricalResponse({
      message: theatricalMessages.USER_LOGGED_OUT,
    })
  );
});

/**
 * Zoho OAuth Scopes - unified for CRM + Calendar
 */
const ZOHO_SCOPES = [
  // CRM Scopes
  'ZohoCRM.modules.ALL',
  'ZohoCRM.settings.ALL',
  'ZohoCRM.users.READ',
  // Calendar Scopes
  'ZohoCalendar.calendar.ALL',
  'ZohoCalendar.event.ALL',
].join(',');

/**
 * GET /api/auth/zoho/authorize
 * Redirect user to Zoho OAuth consent screen
 * Supports both CRM and Calendar with unified credentials
 */
router.get('/zoho/authorize', (req: AuthRequest, res: Response) => {
  if (!env.ZOHO_CLIENT_ID || !env.ZOHO_REDIRECT_URI) {
    return res.status(500).json(createErrorResponse(
      'Zoho configuration missing. Set ZOHO_CLIENT_ID and ZOHO_REDIRECT_URI in .env',
      'CONFIG_ERROR',
      500
    ));
  }

  const zohoAuthUrl = new URL('https://accounts.zoho.com/oauth/v2/auth');
  zohoAuthUrl.searchParams.set('scope', ZOHO_SCOPES);
  zohoAuthUrl.searchParams.set('client_id', env.ZOHO_CLIENT_ID);
  zohoAuthUrl.searchParams.set('response_type', 'code');
  zohoAuthUrl.searchParams.set('access_type', 'offline');
  zohoAuthUrl.searchParams.set('redirect_uri', env.ZOHO_REDIRECT_URI);
  zohoAuthUrl.searchParams.set('prompt', 'consent');

  logTheatrical.info(`Redirecting to Zoho OAuth: ${zohoAuthUrl.toString()}`);
  res.redirect(zohoAuthUrl.toString());
});

/**
 * GET /api/auth/zoho/callback
 * Exchange authorization code for refresh token
 */
router.get('/zoho/callback', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { code, error, error_description } = req.query;

  if (error) {
    logTheatrical.error(`Zoho auth error: ${error} - ${error_description}`);
    return res.status(400).send(`
      <html>
        <head><title>Zoho Auth Error</title></head>
        <body style="font-family: system-ui; padding: 40px; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc2626;">❌ Zoho Authorization Failed</h1>
          <p><strong>Error:</strong> ${error}</p>
          <p><strong>Description:</strong> ${error_description || 'No description provided'}</p>
          <p><a href="/api/auth/zoho/authorize">Try Again</a></p>
        </body>
      </html>
    `);
  }

  if (!code) {
    return res.status(400).send(`
      <html>
        <head><title>Missing Code</title></head>
        <body style="font-family: system-ui; padding: 40px; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc2626;">❌ No Authorization Code</h1>
          <p>No authorization code was received from Zoho.</p>
          <p><a href="/api/auth/zoho/authorize">Try Again</a></p>
        </body>
      </html>
    `);
  }

  try {
    const tokenUrl = 'https://accounts.zoho.com/oauth/v2/token';
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', env.ZOHO_CLIENT_ID!);
    params.append('client_secret', env.ZOHO_CLIENT_SECRET!);
    params.append('redirect_uri', env.ZOHO_REDIRECT_URI!);
    params.append('code', code as string);

    const response = await axios.post(tokenUrl, params);
    const { refresh_token, access_token, expires_in, api_domain } = response.data;

    if (refresh_token) {
      logTheatrical.success('🎉 Zoho Refresh Token Acquired!');
      logTheatrical.important(`\n${'='.repeat(60)}\nADD THIS TO YOUR .env FILE:\n\nZOHO_REFRESH_TOKEN=${refresh_token}\n${'='.repeat(60)}\n`);

      res.send(`
        <html>
          <head>
            <title>Zoho Connected!</title>
            <style>
              body { font-family: system-ui; padding: 40px; max-width: 700px; margin: 0 auto; background: #0f172a; color: #e2e8f0; }
              h1 { color: #22c55e; }
              .token-box { background: #1e293b; padding: 20px; border-radius: 8px; margin: 20px 0; overflow-x: auto; }
              code { background: #334155; padding: 2px 6px; border-radius: 4px; font-size: 14px; }
              .copy-btn { background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; margin-top: 10px; }
              .copy-btn:hover { background: #2563eb; }
              .env-line { font-family: monospace; font-size: 13px; word-break: break-all; }
              .success { color: #22c55e; }
              .info { color: #94a3b8; font-size: 14px; }
            </style>
          </head>
          <body>
            <h1>✅ Zoho Authorization Successful!</h1>
            <p class="success">Your Zoho CRM and Calendar are now connected.</p>

            <div class="token-box">
              <p><strong>Add this to your <code>.env</code> file:</strong></p>
              <p class="env-line" id="token-line">ZOHO_REFRESH_TOKEN=${refresh_token}</p>
              <button class="copy-btn" onclick="copyToken()">📋 Copy to Clipboard</button>
            </div>

            <div class="info">
              <p><strong>API Domain:</strong> ${api_domain || 'https://www.zohoapis.com'}</p>
              <p><strong>Access Token Expires In:</strong> ${expires_in || 3600} seconds</p>
              <p><strong>Scopes Granted:</strong> CRM (modules, settings, users) + Calendar (events)</p>
            </div>

            <h3>Next Steps:</h3>
            <ol>
              <li>Copy the refresh token above</li>
              <li>Add it to your <code>backend/.env</code> file</li>
              <li>Restart the server</li>
              <li>Get your Calendar ID from Zoho Calendar settings</li>
            </ol>

            <script>
              function copyToken() {
                const token = 'ZOHO_REFRESH_TOKEN=${refresh_token}';
                navigator.clipboard.writeText(token).then(() => {
                  alert('Copied to clipboard!');
                });
              }
            </script>
          </body>
        </html>
      `);
    } else {
      logTheatrical.warn('No refresh token received - app may already be authorized');
      res.send(`
        <html>
          <head><title>Already Authorized</title></head>
          <body style="font-family: system-ui; padding: 40px; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0;">
            <h1 style="color: #eab308;">⚠️ Already Authorized</h1>
            <p>No refresh token was returned. This usually means you've already authorized this app.</p>
            <p>If you need a new refresh token, go to <a href="https://api-console.zoho.com" style="color: #3b82f6;">Zoho API Console</a> and revoke the existing token, then try again.</p>
            <p><strong>Access Token (temporary):</strong></p>
            <code style="word-break: break-all; display: block; padding: 10px; background: #1e293b; border-radius: 4px;">${access_token}</code>
          </body>
        </html>
      `);
    }

  } catch (err: any) {
    const errorMsg = err.response?.data?.error || err.message;
    logTheatrical.error(`Zoho token exchange failed: ${errorMsg}`);

    res.status(500).send(`
      <html>
        <head><title>Token Exchange Failed</title></head>
        <body style="font-family: system-ui; padding: 40px; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #dc2626;">❌ Token Exchange Failed</h1>
          <p><strong>Error:</strong> ${errorMsg}</p>
          <p>Please check your Zoho API Console settings and ensure the redirect URI matches exactly.</p>
          <p><a href="/api/auth/zoho/authorize">Try Again</a></p>
        </body>
      </html>
    `);
  }
}));

/**
 * GET /api/auth/zoho/status
 * Check if Zoho is configured and test the connection
 */
router.get('/zoho/status', asyncHandler(async (req: AuthRequest, res: Response) => {
  const hasClientId = !!env.ZOHO_CLIENT_ID;
  const hasClientSecret = !!env.ZOHO_CLIENT_SECRET;
  const hasRefreshToken = !!env.ZOHO_REFRESH_TOKEN;
  const hasCalendarId = !!env.ZOHO_CALENDAR_ID;

  const status = {
    configured: hasClientId && hasClientSecret && hasRefreshToken,
    credentials: {
      client_id: hasClientId ? '✅ Set' : '❌ Missing',
      client_secret: hasClientSecret ? '✅ Set' : '❌ Missing',
      refresh_token: hasRefreshToken ? '✅ Set' : '❌ Missing (run /api/auth/zoho/authorize)',
      calendar_id: hasCalendarId ? '✅ Set' : '⚠️ Optional - needed for calendar booking',
    },
    authorize_url: '/api/auth/zoho/authorize',
  };

  // If configured, try to get an access token to verify it works
  if (status.configured) {
    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'refresh_token');
      params.append('client_id', env.ZOHO_CLIENT_ID!);
      params.append('client_secret', env.ZOHO_CLIENT_SECRET!);
      params.append('refresh_token', env.ZOHO_REFRESH_TOKEN!);

      const response = await axios.post('https://accounts.zoho.com/oauth/v2/token', params);

      if (response.data.access_token) {
        (status as any).connection = '✅ Connected - Token refresh successful';
        (status as any).api_domain = response.data.api_domain;
      }
    } catch (err: any) {
      (status as any).connection = `❌ Failed - ${err.response?.data?.error || err.message}`;
    }
  }

  res.json(status);
}));

export default router;
