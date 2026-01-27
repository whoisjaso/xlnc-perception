import { db } from '../../config/database';
import { oauthTokens, OAuthToken, OAuthProvider } from '../../db/schema/oauthTokens';
import { eq, and } from 'drizzle-orm';
import { logger } from '../../utils/logger';
import env from '../../config/env';

interface TokenRefreshResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string; // Zoho may return new refresh token
  api_domain?: string;
}

export class OAuthTokenService {
  private readonly tokenEndpoint = 'https://accounts.zoho.com/oauth/v2/token';
  private readonly bufferMs = 5 * 60 * 1000; // 5 minutes before expiry

  /**
   * Get a valid access token for a client/provider combination.
   * Refreshes automatically if expired or about to expire.
   */
  async getAccessToken(
    clientId: string,
    provider: OAuthProvider,
    credentials: { clientId: string; clientSecret: string }
  ): Promise<string> {
    // 1. Check database for existing token
    const stored = await db.select()
      .from(oauthTokens)
      .where(and(
        eq(oauthTokens.clientId, clientId),
        eq(oauthTokens.provider, provider)
      ))
      .limit(1);

    const token = stored[0];

    if (token) {
      // Check if token is still valid
      if (token.accessToken && token.tokenExpiry) {
        if (token.tokenExpiry.getTime() - this.bufferMs > Date.now()) {
          logger.debug({ clientId, provider }, 'Using cached access token from database');
          return token.accessToken;
        }
      }

      // Token expired or about to expire - refresh it
      logger.debug({ clientId, provider }, 'Token expired, refreshing');
      return this.refreshAndStore(clientId, provider, token.refreshToken, credentials);
    }

    // No stored token - try to initialize from env vars (backward compatibility)
    const envRefreshToken = this.getEnvRefreshToken(provider);
    if (envRefreshToken) {
      logger.info({ clientId, provider }, 'Initializing token from env vars');
      return this.refreshAndStore(clientId, provider, envRefreshToken, credentials);
    }

    throw new Error(`No OAuth token found for ${clientId}/${provider}. Configure via env vars or database.`);
  }

  /**
   * Store initial tokens (called after OAuth authorization flow).
   */
  async storeTokens(
    clientId: string,
    provider: OAuthProvider,
    tokens: {
      accessToken?: string;
      refreshToken: string;
      expiresIn?: number;
      scopes?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<void> {
    const tokenExpiry = tokens.expiresIn
      ? new Date(Date.now() + tokens.expiresIn * 1000)
      : null;

    // Check if record exists
    const existing = await db.select({ id: oauthTokens.id })
      .from(oauthTokens)
      .where(and(
        eq(oauthTokens.clientId, clientId),
        eq(oauthTokens.provider, provider)
      ))
      .limit(1);

    if (existing.length > 0) {
      // Update existing record
      await db.update(oauthTokens)
        .set({
          accessToken: tokens.accessToken || null,
          refreshToken: tokens.refreshToken,
          tokenExpiry,
          scopes: tokens.scopes || null,
          metadata: tokens.metadata || null,
          updatedAt: new Date(),
        })
        .where(and(
          eq(oauthTokens.clientId, clientId),
          eq(oauthTokens.provider, provider)
        ));
    } else {
      // Insert new record
      await db.insert(oauthTokens)
        .values({
          clientId,
          provider,
          accessToken: tokens.accessToken || null,
          refreshToken: tokens.refreshToken,
          tokenExpiry,
          scopes: tokens.scopes || null,
          metadata: tokens.metadata || null,
        });
    }

    logger.info({ clientId, provider }, 'OAuth tokens stored');
  }

  /**
   * Check if a token exists for a client/provider.
   */
  async hasToken(clientId: string, provider: OAuthProvider): Promise<boolean> {
    const result = await db.select({ id: oauthTokens.id })
      .from(oauthTokens)
      .where(and(
        eq(oauthTokens.clientId, clientId),
        eq(oauthTokens.provider, provider)
      ))
      .limit(1);

    return result.length > 0 || Boolean(this.getEnvRefreshToken(provider));
  }

  /**
   * Get token record (for debugging/admin).
   */
  async getTokenRecord(clientId: string, provider: OAuthProvider): Promise<OAuthToken | null> {
    const result = await db.select()
      .from(oauthTokens)
      .where(and(
        eq(oauthTokens.clientId, clientId),
        eq(oauthTokens.provider, provider)
      ))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Delete token record (for re-authorization).
   */
  async deleteToken(clientId: string, provider: OAuthProvider): Promise<void> {
    await db.delete(oauthTokens)
      .where(and(
        eq(oauthTokens.clientId, clientId),
        eq(oauthTokens.provider, provider)
      ));

    logger.info({ clientId, provider }, 'OAuth token deleted');
  }

  /**
   * Refresh token and store new values.
   */
  private async refreshAndStore(
    clientId: string,
    provider: OAuthProvider,
    refreshToken: string,
    credentials: { clientId: string; clientSecret: string }
  ): Promise<string> {
    const response = await fetch(this.tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({ status: response.status, error: errorText, clientId, provider }, 'Token refresh failed');
      throw new Error(`Token refresh failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as TokenRefreshResponse;

    // Calculate expiry
    const tokenExpiry = new Date(Date.now() + data.expires_in * 1000);

    // Store refreshed token
    await this.storeTokens(clientId, provider, {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken, // Use new refresh token if provided
      expiresIn: data.expires_in,
      metadata: data.api_domain ? { api_domain: data.api_domain } : undefined,
    });

    logger.debug({ clientId, provider, expiresIn: data.expires_in }, 'Token refreshed and stored');

    return data.access_token;
  }

  /**
   * Get refresh token from environment variables (backward compatibility).
   */
  private getEnvRefreshToken(provider: OAuthProvider): string | null {
    // Both services currently use the same env var
    return env.ZOHO_REFRESH_TOKEN || null;
  }
}

export const oauthTokenService = new OAuthTokenService();
