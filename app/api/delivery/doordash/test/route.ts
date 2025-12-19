import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/delivery/doordash/test
 * 
 * Creates a test delivery using DoorDash Drive JWT credentials
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await requireTenant();
    const body = await req.json();
    const { pickup, dropoff, packageSize } = body;

    if (!pickup?.address || !dropoff?.address) {
      return NextResponse.json(
        { error: 'Pickup and dropoff addresses are required' },
        { status: 400 }
      );
    }

    const integration = await prisma.tenantIntegration.findUnique({
      where: { tenantId: tenant.id },
    });

    const doordashConfig = (integration?.paymentConfig as any)?.doordash;
    if (!doordashConfig?.developerId || !doordashConfig?.keyId || !doordashConfig?.signingSecretEncrypted) {
      return NextResponse.json(
        { error: 'DoorDash Drive not connected. Please connect your account first.' },
        { status: 400 }
      );
    }

    // Generate JWT token (simplified - in production use proper JWT library)
    // This is a placeholder - actual implementation would use jsonwebtoken or jose
    const jwt = generateDoorDashJWT(
      doordashConfig.developerId,
      doordashConfig.keyId,
      doordashConfig.signingSecretEncrypted
    );

    // Parse addresses
    const parseAddress = (address: string) => {
      const parts = address.split(',').map((p) => p.trim());
      return {
        street_address: parts[0] || address,
        city: parts[1] || '',
        state: parts[2] || '',
        zip_code: parts[3] || '',
        country: 'US',
      };
    };

    const businessId = integration?.doordashBusinessId;
    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID not configured' },
        { status: 400 }
      );
    }

    // Create test delivery
    const deliveryRequest = {
      external_delivery_id: `test_${tenant.id}_${Date.now()}`,
      pickup_address: parseAddress(pickup.address),
      pickup_business_name: tenant.name,
      pickup_phone_number: tenant.contactPhone || '+15555555555',
      dropoff_address: parseAddress(dropoff.address),
      dropoff_phone_number: dropoff.phone || '+15555555556',
      dropoff_contact_given_name: dropoff.name?.split(' ')[0] || 'Test',
      dropoff_contact_family_name: dropoff.name?.split(' ').slice(1).join(' ') || 'Customer',
    };

    const apiResponse = await fetch('https://openapi.doordash.com/drive/v2/deliveries', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deliveryRequest),
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      return NextResponse.json(
        { error: 'Failed to create test delivery', details: errorText },
        { status: apiResponse.status }
      );
    }

    const deliveryData = await apiResponse.json();

    await prisma.integrationLog.create({
      data: {
        tenantId: tenant.id,
        source: 'doordash',
        message: 'Test delivery created',
        payload: { deliveryId: deliveryData.id, status: deliveryData.status },
      },
    });

    return NextResponse.json({
      success: true,
      deliveryId: deliveryData.id,
      status: deliveryData.status,
      trackingUrl: deliveryData.tracking_url,
    });
  } catch (error: any) {
    console.error('[doordash-test] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create test delivery' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/delivery/doordash/test?id={deliveryId}
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await requireTenant();
    const { searchParams } = new URL(req.url);
    const deliveryId = searchParams.get('id');

    if (!deliveryId) {
      return NextResponse.json({ error: 'Delivery ID required' }, { status: 400 });
    }

    const integration = await prisma.tenantIntegration.findUnique({
      where: { tenantId: tenant.id },
    });

    const doordashConfig = (integration?.paymentConfig as any)?.doordash;
    if (!doordashConfig?.developerId || !doordashConfig?.keyId || !doordashConfig?.signingSecretEncrypted) {
      return NextResponse.json(
        { error: 'DoorDash Drive not connected' },
        { status: 400 }
      );
    }

    const jwt = generateDoorDashJWT(
      doordashConfig.developerId,
      doordashConfig.keyId,
      doordashConfig.signingSecretEncrypted
    );

    const apiResponse = await fetch(
      `https://openapi.doordash.com/drive/v2/deliveries/${deliveryId}`,
      {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      }
    );

    if (!apiResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to get delivery status' },
        { status: apiResponse.status }
      );
    }

    const deliveryData = await apiResponse.json();

    return NextResponse.json({
      deliveryId: deliveryData.id,
      status: deliveryData.status,
      trackingUrl: deliveryData.tracking_url,
    });
  } catch (error: any) {
    console.error('[doordash-test] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get delivery status' },
      { status: 500 }
    );
  }
}

function generateDoorDashJWT(developerId: string, keyId: string, signingSecret: string): string {
  // Placeholder - in production use proper JWT library like 'jsonwebtoken' or 'jose'
  // This should generate a proper JWT with:
  // - Header: { alg: 'HS256', typ: 'JWT', kid: keyId }
  // - Payload: { iss: developerId, iat: now, exp: now + 3600 }
  // - Signature: HMAC-SHA256(signingSecret)
  return `placeholder-jwt-${developerId}-${keyId}`;
}

