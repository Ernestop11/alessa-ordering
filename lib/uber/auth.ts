/**
 * Uber Direct API Authentication Helper
 *
 * Uber Direct API uses OAuth 2.0 with Client Credentials flow
 * Documentation: https://developer.uber.com/docs/deliveries/overview
 *
 * Required environment variables:
 * - UBER_CLIENT_ID: From Uber Direct Dashboard > Developer tab
 * - UBER_CLIENT_SECRET: From Uber Direct Dashboard > Developer tab
 * - UBER_CUSTOMER_ID: From Uber Direct Dashboard > Developer tab
 * - UBER_SANDBOX: Set to 'true' for test mode
 */

interface UberCredentials {
  clientId: string;
  clientSecret: string;
  customerId: string;
  sandbox: boolean;
}

// Token cache to avoid unnecessary auth calls
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Get Uber Direct credentials from environment variables
 */
export function getUberCredentials(): UberCredentials | null {
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
  };
}

/**
 * Get Customer ID for API calls
 */
export function getUberCustomerId(): string | null {
  return process.env.UBER_CUSTOMER_ID || null;
}

/**
 * Get OAuth access token for Uber Direct API
 *
 * Uses Client Credentials flow to get access token
 * Token is cached and valid for ~30 days (2592000 seconds)
 */
export async function getUberAccessToken(): Promise<string | null> {
  // Check cache first (with 5 minute buffer before expiry)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5 * 60 * 1000) {
    return cachedToken.token;
  }

  const credentials = getUberCredentials();
  if (!credentials) {
    return null;
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
      console.error('[Uber Direct] Failed to get access token:', errorText);
      return null;
    }

    const data = await response.json();
    const token = data.access_token;
    const expiresIn = data.expires_in || 2592000; // Default 30 days

    // Cache the token
    cachedToken = {
      token,
      expiresAt: Date.now() + expiresIn * 1000,
    };

    console.log('[Uber Direct] Access token obtained, expires in', expiresIn, 'seconds');
    return token;
  } catch (error) {
    console.error('[Uber Direct] Error getting access token:', error);
    return null;
  }
}

/**
 * Get the base API URL for Uber Direct
 */
export function getUberApiBaseUrl(): string {
  return 'https://api.uber.com/v1';
}

/**
 * Check if Uber Direct is configured
 */
export function isUberDirectConfigured(): boolean {
  return getUberCredentials() !== null;
}

