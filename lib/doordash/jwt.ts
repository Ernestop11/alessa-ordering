/**
 * DoorDash Drive API JWT Authentication Helper
 * 
 * DoorDash Drive API requires JWT tokens signed with RS256 using:
 * - Developer ID (iss claim)
 * - Key ID (kid claim)  
 * - Signing Secret (private key for signing)
 * 
 * Documentation: https://developer.doordash.com/en-US/api/drive
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';

interface DoorDashCredentials {
  developerId: string;
  keyId: string;
  signingSecret: string;
}

/**
 * Generate a JWT token for DoorDash Drive API authentication
 * 
 * The token is valid for 1 hour and includes:
 * - iss: Developer ID
 * - kid: Key ID
 * - exp: Expiration time (1 hour from now)
 * - iat: Issued at time
 */
export function generateDoorDashJWT(credentials: DoorDashCredentials): string {
  const { developerId, keyId, signingSecret } = credentials;

  if (!developerId || !keyId || !signingSecret) {
    throw new Error('Missing DoorDash credentials: developerId, keyId, and signingSecret are required');
  }

  // DoorDash expects RS256 signing, but they provide a signing secret (not a full RSA key)
  // Based on DoorDash docs, we need to convert the signing secret to a format suitable for JWT signing
  // The signing secret is actually a base64-encoded key that we use directly
  
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: developerId,
    kid: keyId,
    exp: now + 3600, // 1 hour expiration
    iat: now,
  };

  // DoorDash uses HS256 with the signing secret, not RS256
  // The "signing secret" is actually a shared secret for HMAC
  try {
    const token = jwt.sign(payload, signingSecret, {
      algorithm: 'HS256',
      header: {
        alg: 'HS256',
        kid: keyId,
        typ: 'JWT',
      },
    });

    return token;
  } catch (error) {
    console.error('[DoorDash JWT] Failed to generate token:', error);
    throw new Error(`Failed to generate DoorDash JWT: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get DoorDash credentials from environment variables
 */
export function getDoorDashCredentials(): DoorDashCredentials | null {
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
 * Generate a fresh JWT token for DoorDash API calls
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

