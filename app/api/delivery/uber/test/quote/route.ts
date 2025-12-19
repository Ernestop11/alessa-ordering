import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const UBER_CLIENT_ID = process.env.UBER_CLIENT_ID;
const UBER_CLIENT_SECRET = process.env.UBER_CLIENT_SECRET;

/**
 * POST /api/delivery/uber/test/quote
 * 
 * Gets a delivery quote for test deliveries
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

    if (!integration?.uberOAuthAccessToken) {
      return NextResponse.json(
        { error: 'Uber Direct not connected' },
        { status: 400 }
      );
    }

    // Check token expiry and refresh if needed
    let accessToken = integration.uberOAuthAccessToken;
    if (integration.uberOAuthExpiresAt && new Date(integration.uberOAuthExpiresAt) < new Date()) {
      if (!integration.uberOAuthRefreshToken || !UBER_CLIENT_ID || !UBER_CLIENT_SECRET) {
        return NextResponse.json(
          { error: 'Access token expired' },
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
      }
    }

    const parseAddress = (address: string) => {
      const parts = address.split(',').map((p) => p.trim());
      return {
        street_address: [parts[0] || address],
        city: parts[1] || '',
        state: parts[2] || '',
        zip_code: parts[3] || '',
        country: 'US',
      };
    };

    const merchantId = integration.uberMerchantId;
    if (!merchantId) {
      return NextResponse.json(
        { error: 'Merchant ID not configured' },
        { status: 400 }
      );
    }

    const quoteRequest = {
      pickup_address: JSON.stringify(parseAddress(pickup.address)),
      dropoff_address: JSON.stringify(parseAddress(dropoff.address)),
    };

    const apiResponse = await fetch(
      `https://api.uber.com/v1/customers/${merchantId}/delivery_quotes`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quoteRequest),
      }
    );

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      return NextResponse.json(
        { error: 'Failed to get quote', details: errorText },
        { status: apiResponse.status }
      );
    }

    const quoteData = await apiResponse.json();
    const dropoffEta = new Date(quoteData.dropoff_eta);
    const etaMinutes = Math.round((dropoffEta.getTime() - Date.now()) / 60000);

    return NextResponse.json({
      price: quoteData.fee / 100, // Convert cents to dollars
      eta: etaMinutes,
      available: true,
      surgePricing: false,
    });
  } catch (error: any) {
    console.error('[uber-quote] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get quote' },
      { status: 500 }
    );
  }
}

