/**
 * DoorDash Drive API JWT Authentication Helper
 *
 * DoorDash Drive API requires JWT tokens signed with HS256 using:
 * - Developer ID (iss claim)
 * - Key ID (kid claim)
 * - Signing Secret (shared secret for HMAC)
 *
 * Documentation: https://developer.doordash.com/en-US/api/drive
 */

import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

export interface DoorDashCredentials {
  developerId: string;
  keyId: string;
  signingSecret: string;
}

/**
 * Generate a JWT token for DoorDash Drive API authentication
 *
 * The token is valid for 30 minutes (DoorDash requirement) and includes:
 * - aud: "doordash" (required)
 * - iss: Developer ID
 * - kid: Key ID
 * - exp: Expiration time (30 minutes max)
 * - iat: Issued at time
 */
export function generateDoorDashJWT(credentials: DoorDashCredentials): string {
  const { developerId, keyId, signingSecret } = credentials;

  if (!developerId || !keyId || !signingSecret) {
    throw new Error('Missing DoorDash credentials: developerId, keyId, and signingSecret are required');
  }

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: 'doordash',
    iss: developerId,
    kid: keyId,
    exp: now + 1800, // 30 minutes (DoorDash max)
    iat: now,
  };

  // DoorDash uses HS256 with the signing secret
  try {
    const token = jwt.sign(payload, signingSecret, {
      algorithm: 'HS256',
      header: {
        alg: 'HS256',
        typ: 'JWT',
        'dd-ver': 'DD-JWT-V1',
      },
    });

    return token;
  } catch (error) {
    console.error('[DoorDash JWT] Failed to generate token:', error);
    throw new Error(`Failed to generate DoorDash JWT: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get DoorDash credentials from environment variables (fallback)
 */
export function getDoorDashCredentialsFromEnv(): DoorDashCredentials | null {
  const developerId = process.env.DOORDASH_DEVELOPER_ID;
  const keyId = process.env.DOORDASH_KEY_ID;
  const signingSecret = process.env.DOORDASH_SIGNING_SECRET;

  if (!developerId || !keyId || !signingSecret) {
    return null;
  }

  return {
    developerId,
    keyId,
    signingSecret,
  };
}

/**
 * Get DoorDash credentials for a specific tenant from database
 */
export async function getDoorDashCredentialsForTenant(tenantId: string): Promise<DoorDashCredentials | null> {
  try {
    const integration = await prisma.tenantIntegration.findUnique({
      where: { tenantId },
      select: { paymentConfig: true, doordashOnboardingStatus: true },
    });

    if (!integration || integration.doordashOnboardingStatus !== 'connected') {
      return null;
    }

    const config = integration.paymentConfig as { doordash?: { developerId?: string; keyId?: string; signingSecretEncrypted?: string } } | null;
    if (!config?.doordash) {
      return null;
    }

    const { developerId, keyId, signingSecretEncrypted } = config.doordash;
    if (!developerId || !keyId || !signingSecretEncrypted) {
      return null;
    }

    return {
      developerId,
      keyId,
      signingSecret: signingSecretEncrypted, // TODO: Decrypt in production
    };
  } catch (error) {
    console.error('[DoorDash JWT] Failed to get credentials from DB:', error);
    return null;
  }
}

/**
 * Get DoorDash credentials (tries env vars first, then falls back to nothing)
 * For per-tenant credentials, use getDoorDashCredentialsForTenant
 */
export function getDoorDashCredentials(): DoorDashCredentials | null {
  return getDoorDashCredentialsFromEnv();
}

/**
 * Generate a fresh JWT token for DoorDash API calls using env credentials
 * This should be called for each API request to ensure the token is not expired
 */
export function getDoorDashAuthToken(): string | null {
  const credentials = getDoorDashCredentials();
  if (!credentials) {
    return null;
  }

  try {
    return generateDoorDashJWT(credentials);
  } catch (error) {
    console.error('[DoorDash JWT] Failed to get auth token:', error);
    return null;
  }
}

/**
 * Generate a fresh JWT token for a specific tenant
 */
export async function getDoorDashAuthTokenForTenant(tenantId: string): Promise<string | null> {
  const credentials = await getDoorDashCredentialsForTenant(tenantId);
  if (!credentials) {
    // Fall back to env credentials
    return getDoorDashAuthToken();
  }

  try {
    return generateDoorDashJWT(credentials);
  } catch (error) {
    console.error('[DoorDash JWT] Failed to get auth token for tenant:', error);
    return null;
  }
}

