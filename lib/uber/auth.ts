/**
 * Uber Direct API Authentication Helper
 * 
 * Uber Direct API uses OAuth 2.0 with Client Credentials flow
 * Documentation: https://developer.uber.com/docs/direct
 * 
 * Note: This is a placeholder structure. Actual implementation requires:
 * 1. Uber Direct partnership application approval
 * 2. Client ID and Client Secret from Uber
 * 3. API endpoint URLs (may differ from DoorDash)
 */

interface UberCredentials {
  clientId: string;
  clientSecret: string;
  sandbox?: boolean;
}

/**
 * Get Uber Direct credentials from environment variables
 */
export function getUberCredentials(): UberCredentials | null {
  const clientId = process.env.UBER_CLIENT_ID;
  const clientSecret = process.env.UBER_CLIENT_SECRET;
  const sandbox = process.env.UBER_SANDBOX === 'true';

  if (!clientId || !clientSecret) {
    return null;
  }

  return {
    clientId,
    clientSecret,
    sandbox,
  };
}

/**
 * Get OAuth access token for Uber Direct API
 * 
 * Uses Client Credentials flow to get access token
 * Token is valid for a limited time (typically 1 hour)
 */
export async function getUberAccessToken(): Promise<string | null> {
  const credentials = getUberCredentials();
  if (!credentials) {
    return null;
  }

  try {
    const tokenUrl = credentials.sandbox
      ? 'https://sandbox-api.uber.com/v1/oauth/token'
      : 'https://api.uber.com/v1/oauth/token';

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'eats.deliveries', // Uber Direct scope
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Uber Direct] Failed to get access token:', errorText);
      return null;
    }

    const data = await response.json();
    return data.access_token || null;
  } catch (error) {
    console.error('[Uber Direct] Error getting access token:', error);
    return null;
  }
}

/**
 * Check if Uber Direct is configured
 */
export function isUberDirectConfigured(): boolean {
  return getUberCredentials() !== null;
}

