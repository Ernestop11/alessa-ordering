import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const UBER_CLIENT_ID = process.env.UBER_CLIENT_ID;
const UBER_CLIENT_SECRET = process.env.UBER_CLIENT_SECRET;

/**
 * POST /api/delivery/uber/test
 * 
 * Creates a test delivery using stored OAuth tokens
 */
export async function POST(req: NextRequest) {
  try {
    // Verify admin authentication
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

    // Get integration with OAuth tokens
    const integration = await prisma.tenantIntegration.findUnique({
      where: { tenantId: tenant.id },
    });

    if (!integration?.uberOAuthAccessToken) {
      return NextResponse.json(
        { error: 'Uber Direct not connected. Please connect your account first.' },
        { status: 400 }
      );
    }

    // Check if token needs refresh
    let accessToken = integration.uberOAuthAccessToken;
    if (integration.uberOAuthExpiresAt && new Date(integration.uberOAuthExpiresAt) < new Date()) {
      // Token expired, refresh it
      if (!integration.uberOAuthRefreshToken || !UBER_CLIENT_ID || !UBER_CLIENT_SECRET) {
        return NextResponse.json(
          { error: 'Access token expired and refresh token not available' },
          { status: 401 }
        );
      }

      const refreshResponse = await fetch('https://login.uber.com/oauth/v2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: UBER_CLIENT_ID,
          client_secret: UBER_CLIENT_SECRET,
          grant_type: 'refresh_token',
          refresh_token: integration.uberOAuthRefreshToken,
        }),
      });

      if (refreshResponse.ok) {
        const tokenData = await refreshResponse.json();
        accessToken = tokenData.access_token;
        const expiresAt = tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000)
          : new Date(Date.now() + 3600 * 1000);

        await prisma.tenantIntegration.update({
          where: { tenantId: tenant.id },
          data: {
            uberOAuthAccessToken: accessToken,
            uberOAuthRefreshToken: tokenData.refresh_token || integration.uberOAuthRefreshToken,
            uberOAuthExpiresAt: expiresAt,
          },
        });
      } else {
        return NextResponse.json(
          { error: 'Failed to refresh access token' },
          { status: 401 }
        );
      }
    }

    // Parse addresses (simple parsing - in production use a geocoding service)
    // For now, expect formatted addresses
    const parseAddress = (address: string) => {
      // Simple parsing - split by commas
      const parts = address.split(',').map((p) => p.trim());
      return {
        street_address: [parts[0] || address],
        city: parts[1] || '',
        state: parts[2] || '',
        zip_code: parts[3] || '',
        country: 'US',
      };
    };

    // First, get a quote
    const quoteRequest = {
      pickup_address: JSON.stringify(parseAddress(pickup.address)),
      dropoff_address: JSON.stringify(parseAddress(dropoff.address)),
    };

    // Get merchant/customer ID - use merchantId if available, or try to fetch it
    const merchantId = integration.uberMerchantId;
    if (!merchantId) {
      return NextResponse.json(
        { error: 'Merchant ID not configured. Please reconnect your Uber account.' },
        { status: 400 }
      );
    }

    // Call Uber Direct API to create delivery
    // Note: This is a simplified version - actual API may require quote ID first
    const deliveryRequest = {
      pickup_address: JSON.stringify(parseAddress(pickup.address)),
      pickup_name: tenant.name,
      pickup_phone_number: tenant.contactPhone || '+15555555555',
      dropoff_address: JSON.stringify(parseAddress(dropoff.address)),
      dropoff_name: dropoff.name || 'Test Customer',
      dropoff_phone_number: dropoff.phone || '+15555555556',
      external_id: `test_${tenant.id}_${Date.now()}`,
    };

    const apiResponse = await fetch(`https://api.uber.com/v1/customers/${merchantId}/deliveries`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deliveryRequest),
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('[uber-test] API error:', errorText);
      
      await prisma.integrationLog.create({
        data: {
          tenantId: tenant.id,
          source: 'uber',
          message: 'Test delivery creation failed',
          payload: { error: errorText, status: apiResponse.status },
        },
      });

      return NextResponse.json(
        { error: 'Failed to create test delivery', details: errorText },
        { status: apiResponse.status }
      );
    }

    const deliveryData = await apiResponse.json();

    await prisma.integrationLog.create({
      data: {
        tenantId: tenant.id,
        source: 'uber',
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
    console.error('[uber-test] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create test delivery' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/delivery/uber/test?id={deliveryId}
 * 
 * Gets delivery status/tracking
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

    if (!integration?.uberOAuthAccessToken) {
      return NextResponse.json(
        { error: 'Uber Direct not connected' },
        { status: 400 }
      );
    }

    const merchantId = integration.uberMerchantId;
    if (!merchantId) {
      return NextResponse.json(
        { error: 'Merchant ID not configured' },
        { status: 400 }
      );
    }

    // Get delivery status from Uber API
    const apiResponse = await fetch(
      `https://api.uber.com/v1/customers/${merchantId}/deliveries/${deliveryId}`,
      {
        headers: {
          Authorization: `Bearer ${integration.uberOAuthAccessToken}`,
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
    console.error('[uber-test] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get delivery status' },
      { status: 500 }
    );
  }
}

