import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const BASE_URL = process.env.NEXTAUTH_URL || process.env.BASE_URL || 'http://localhost:3001';

/**
 * POST /api/delivery/doordash/oauth
 *
 * DoorDash Drive uses JWT-based authentication, not OAuth.
 * This endpoint handles the business account creation and credential setup.
 *
 * Body:
 * {
 *   developerId: string,
 *   keyId: string,
 *   signingSecret: string,
 *   businessId?: string (optional, if business already exists)
 * }
 */
export async function POST(req: Request) {
  try {
    // Verify admin authentication
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await requireTenant();
    const body = await req.json();
    const { developerId, keyId, signingSecret, businessId } = body;

    if (!developerId || !keyId || !signingSecret) {
      return NextResponse.json(
        { error: 'developerId, keyId, and signingSecret are required' },
        { status: 400 }
      );
    }

    // DoorDash Drive uses JWT for authentication
    // Store credentials securely (consider encrypting signingSecret in production)
    // For now, we'll store them in TenantIntegration
    // In production, use environment-specific encryption

    // If businessId is not provided, we may need to create a business account via DoorDash API
    // This depends on DoorDash Drive API requirements
    let finalBusinessId = businessId;

    if (!finalBusinessId) {
      // Create business account via DoorDash Drive API
      // This is a placeholder - actual implementation depends on DoorDash Drive API
      try {
        // Generate JWT token for DoorDash API
        const jwt = generateDoorDashJWT(developerId, keyId, signingSecret);
        
        // Call DoorDash Drive API to create business
        const createBusinessResponse = await fetch('https://openapi.doordash.com/developer/v1/businesses', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${jwt}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            // Business details from tenant
            name: tenant.name,
            // Add other required fields based on DoorDash API
          }),
        });

        if (createBusinessResponse.ok) {
          const businessData = await createBusinessResponse.json();
          finalBusinessId = businessData.id || businessData.business_id;
        } else {
          console.error('[doordash-oauth] Failed to create business:', await createBusinessResponse.text());
          // Continue without businessId - it can be set later
        }
      } catch (e) {
        console.warn('[doordash-oauth] Could not create business account:', e);
        // Continue without businessId - it can be set later
      }
    }

    // Store credentials in TenantIntegration
    // Note: In production, encrypt sensitive data like signingSecret
    await prisma.tenantIntegration.upsert({
      where: { tenantId: tenant.id },
      create: {
        tenantId: tenant.id,
        doordashBusinessId: finalBusinessId,
        doordashOnboardingStatus: finalBusinessId ? 'connected' : 'pending',
        // Store credentials in a JSON field or use encryption
        // For now, we'll use a JSON field for DoorDash config
        paymentConfig: {
          doordash: {
            developerId,
            keyId,
            // In production, use encryption for signingSecret
            signingSecretEncrypted: signingSecret, // TODO: Encrypt this
          },
        } as any,
      },
      update: {
        doordashBusinessId: finalBusinessId,
        doordashOnboardingStatus: finalBusinessId ? 'connected' : 'pending',
        paymentConfig: {
          doordash: {
            developerId,
            keyId,
            signingSecretEncrypted: signingSecret, // TODO: Encrypt this
          },
        } as any,
      },
    });

    return NextResponse.json({
      success: true,
      businessId: finalBusinessId,
      status: finalBusinessId ? 'connected' : 'pending',
    });
  } catch (error: any) {
    console.error('[doordash-oauth] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to setup DoorDash credentials' },
      { status: 500 }
    );
  }
}

/**
 * Generate JWT token for DoorDash Drive API authentication
 * 
 * DoorDash uses JWT with the following claims:
 * - iss: developerId
 * - kid: keyId
 * - exp: expiration time
 * - iat: issued at time
 * 
 * Signature: HMAC-SHA256 with signingSecret
 */
function generateDoorDashJWT(developerId: string, keyId: string, signingSecret: string): string {
  // This is a simplified version - actual implementation should use a JWT library
  // like 'jsonwebtoken' or 'jose'
  const header = {
    alg: 'HS256',
    typ: 'JWT',
    kid: keyId,
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: developerId,
    iat: now,
    exp: now + 3600, // 1 hour expiration
  };

  // For now, return a placeholder - in production use proper JWT library
  // Example with 'jsonwebtoken':
  // return jwt.sign(payload, signingSecret, { header: { ...header, kid: keyId } });
  
  // Placeholder implementation
  return `placeholder-jwt-${developerId}-${keyId}`;
}

