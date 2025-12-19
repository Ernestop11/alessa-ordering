/**
 * Uber Direct API Authentication Helper
 *
 * Uber Direct API uses OAuth 2.0 with Client Credentials flow
 * Documentation: https://developer.uber.com/docs/deliveries/overview
 *
 * MULTI-TENANT ARCHITECTURE (like Stripe Connect):
 * Each tenant can have their own Uber Direct account. Credentials are stored
 * in TenantIntegration model:
 * - uberClientId
 * - uberClientSecret
 * - uberCustomerId
 * - uberSandbox
 *
 * Falls back to global env vars if tenant-specific not configured:
 * - UBER_CLIENT_ID
 * - UBER_CLIENT_SECRET
 * - UBER_CUSTOMER_ID
 * - UBER_SANDBOX
 */

export interface UberCredentials {
  clientId: string;
  clientSecret: string;
  customerId: string;
  sandbox: boolean;
  tenantId?: string; // Track which tenant these belong to
}

// Per-tenant token cache to avoid unnecessary auth calls
// Key: tenantId or 'global' for fallback credentials
const tokenCache: Map<string, { token: string; expiresAt: number }> = new Map();

/**
 * Get Uber Direct credentials from environment variables (global fallback)
 */
export function getGlobalUberCredentials(): UberCredentials | null {
  const clientId = process.env.UBER_CLIENT_ID;
  const clientSecret = process.env.UBER_CLIENT_SECRET;
  const customerId = process.env.UBER_CUSTOMER_ID;
  const sandbox = process.env.UBER_SANDBOX === 'true';

  if (!clientId || !clientSecret || !customerId) {
    return null;
  }

  return {
    clientId,
    clientSecret,
    customerId,
    sandbox,
    tenantId: 'global',
  };
}

/**
 * Get Uber Direct credentials for a specific tenant
 * Falls back to global credentials if tenant-specific not configured
 */
export function getUberCredentialsForTenant(
  integration: {
    uberClientId?: string | null;
    uberClientSecret?: string | null;
    uberCustomerId?: string | null;
    uberSandbox?: boolean | null;
  } | null,
  tenantId: string
): UberCredentials | null {
  // Try tenant-specific credentials first
  if (
    integration?.uberClientId &&
    integration?.uberClientSecret &&
    integration?.uberCustomerId
  ) {
    return {
      clientId: integration.uberClientId,
      clientSecret: integration.uberClientSecret,
      customerId: integration.uberCustomerId,
      sandbox: integration.uberSandbox ?? true,
      tenantId,
    };
  }

  // Fall back to global credentials
  const globalCreds = getGlobalUberCredentials();
  if (globalCreds) {
    console.log(`[Uber Direct] Using global credentials for tenant ${tenantId}`);
  }
  return globalCreds;
}

/**
 * Legacy: Get credentials from env (for backwards compatibility)
 */
export function getUberCredentials(): UberCredentials | null {
  return getGlobalUberCredentials();
}

/**
 * Get Customer ID for API calls (legacy - use getUberCredentialsForTenant)
 */
export function getUberCustomerId(): string | null {
  return process.env.UBER_CUSTOMER_ID || null;
}

/**
 * Get OAuth access token for Uber Direct API
 *
 * Uses Client Credentials flow to get access token
 * Token is cached per-tenant and valid for ~30 days (2592000 seconds)
 */
export async function getUberAccessTokenForTenant(
  credentials: UberCredentials
): Promise<string | null> {
  const cacheKey = credentials.tenantId || 'global';

  // Check cache first (with 5 minute buffer before expiry)
  const cached = tokenCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now() + 5 * 60 * 1000) {
    return cached.token;
  }

  try {
    // Uber Direct uses the same auth endpoint for sandbox and production
    // The sandbox/production is determined by the credentials used
    const tokenUrl = 'https://auth.uber.com/oauth/v2/token';

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        grant_type: 'client_credentials',
        scope: 'eats.deliveries',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Uber Direct] Failed to get access token for ${cacheKey}:`, errorText);
      return null;
    }

    const data = await response.json();
    const token = data.access_token;
    const expiresIn = data.expires_in || 2592000; // Default 30 days

    // Cache the token per tenant
    tokenCache.set(cacheKey, {
      token,
      expiresAt: Date.now() + expiresIn * 1000,
    });

    console.log(`[Uber Direct] Access token obtained for ${cacheKey}, expires in`, expiresIn, 'seconds');
    return token;
  } catch (error) {
    console.error(`[Uber Direct] Error getting access token for ${cacheKey}:`, error);
    return null;
  }
}

/**
 * Legacy: Get access token using global credentials
 */
export async function getUberAccessToken(): Promise<string | null> {
  const credentials = getGlobalUberCredentials();
  if (!credentials) {
    return null;
  }
  return getUberAccessTokenForTenant(credentials);
}

/**
 * Get the base API URL for Uber Direct
 */
export function getUberApiBaseUrl(): string {
  return 'https://api.uber.com/v1';
}

/**
 * Check if Uber Direct is configured (global)
 */
export function isUberDirectConfigured(): boolean {
  return getGlobalUberCredentials() !== null;
}

/**
 * Check if Uber Direct is configured for a specific tenant
 */
export function isUberDirectConfiguredForTenant(
  integration: {
    uberClientId?: string | null;
    uberClientSecret?: string | null;
    uberCustomerId?: string | null;
  } | null
): boolean {
  // Check tenant-specific
  if (
    integration?.uberClientId &&
    integration?.uberClientSecret &&
    integration?.uberCustomerId
  ) {
    return true;
  }
  // Fall back to global
  return isUberDirectConfigured();
}

/**
 * Clear cached token for a tenant (useful when credentials change)
 */
export function clearUberTokenCache(tenantId?: string): void {
  if (tenantId) {
    tokenCache.delete(tenantId);
  } else {
    tokenCache.clear();
  }
}

