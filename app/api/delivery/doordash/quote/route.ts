import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';
import { getDoorDashAuthToken } from '@/lib/doordash/jwt';

/**
 * DoorDash Drive API - Delivery Quote
 *
 * This endpoint gets a delivery quote from DoorDash Drive API
 *
 * DoorDash Drive API Documentation:
 * https://developer.doordash.com/en-US/api/drive
 *
 * API Endpoints:
 * - Sandbox: https://openapi.doordash.com/drive/v2/quotes
 * - Production: https://openapi.doordash.com/drive/v2/quotes
 */

interface DoorDashQuoteRequest {
  pickupAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  dropoffAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  orderValue?: number;
}

interface DoorDashAPIQuoteRequest {
  external_delivery_id: string;
  pickup_address: string;
  pickup_business_name?: string;
  pickup_phone_number?: string;
  dropoff_address: string;
  dropoff_business_name?: string;
  dropoff_phone_number?: string;
  order_value: number;
}

interface DoorDashAPIQuoteResponse {
  external_delivery_id: string;
  currency: string;
  fee: number;
  estimated_pickup_time?: string;
  estimated_dropoff_time?: string;
  quote_id?: string;
  expires_at?: string;
}

// Format address for DoorDash API (single line)
function formatAddress(address: { street: string; city: string; state: string; zipCode: string }): string {
  return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;
}

// Get DoorDash API configuration
function getDoorDashConfig() {
  const authToken = getDoorDashAuthToken();
  const isSandbox = process.env.DOORDASH_SANDBOX === 'true';

  if (!authToken) {
    return { enabled: false, authToken: null, isSandbox: false };
  }

  return { enabled: true, authToken, isSandbox };
}

export async function POST(req: NextRequest) {
  try {
    const tenant = await requireTenant();
    const body = (await req.json()) as DoorDashQuoteRequest;

    // Validate required fields
    if (!body.pickupAddress || !body.dropoffAddress) {
      return NextResponse.json(
        { error: 'Pickup and dropoff addresses are required' },
        { status: 400 }
      );
    }

    const config = getDoorDashConfig();

    // If DoorDash API is not configured, return mock data
    if (!config.enabled) {
      console.log('[DoorDash Quote] API not configured, using mock data');

      const baseFee = tenant.integrations?.deliveryBaseFee ?? 4.99;
      const perMileFee = 1.5;
      const estimatedMiles = 3.5;
      const deliveryFee = parseFloat((baseFee + perMileFee * estimatedMiles).toFixed(2));
      const etaMinutes = 35;

      await prisma.integrationLog.create({
        data: {
          tenantId: tenant.id,
          source: 'doordash',
          message: 'Delivery quote requested (mock)',
          payload: {
            pickupAddress: body.pickupAddress,
            dropoffAddress: body.dropoffAddress,
            orderValue: body.orderValue,
            deliveryFee,
            estimatedMiles,
            etaMinutes,
            mode: 'mock',
          },
        },
      });

      return NextResponse.json({
        partner: 'doordash',
        deliveryFee,
        estimatedMiles,
        etaMinutes,
        currency: 'USD',
        quoteId: `dd_quote_mock_${Date.now()}`,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        message: 'Mock quote. Set DOORDASH_API_KEY and DOORDASH_DEVELOPER_ID for live pricing.',
        mode: 'mock',
      });
    }

    // Call DoorDash Drive API for live quote
    const externalDeliveryId = `quote_${tenant.slug}_${Date.now()}`;
    const doordashRequest: DoorDashAPIQuoteRequest = {
      external_delivery_id: externalDeliveryId,
      pickup_address: formatAddress(body.pickupAddress),
      pickup_business_name: tenant.name,
      dropoff_address: formatAddress(body.dropoffAddress),
      order_value: Math.round((body.orderValue || 0) * 100), // Convert to cents
    };

    console.log('[DoorDash Quote] Calling DoorDash API:', {
      url: 'https://openapi.doordash.com/drive/v2/quotes',
      sandbox: config.isSandbox,
      externalDeliveryId,
    });

    const doordashResponse = await fetch('https://openapi.doordash.com/drive/v2/quotes', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(doordashRequest),
    });

    const responseText = await doordashResponse.text();
    console.log('[DoorDash Quote] Response status:', doordashResponse.status);

    if (!doordashResponse.ok) {
      console.error('[DoorDash Quote] API error:', responseText);

      await prisma.integrationLog.create({
        data: {
          tenantId: tenant.id,
          source: 'doordash',
          message: 'Delivery quote failed',
          payload: JSON.parse(JSON.stringify({
            error: responseText,
            status: doordashResponse.status,
            request: doordashRequest,
          })),
        },
      });

      return NextResponse.json(
        { error: 'Failed to get delivery quote from DoorDash', details: responseText },
        { status: doordashResponse.status }
      );
    }

    const doordashData: DoorDashAPIQuoteResponse = JSON.parse(responseText);

    // Convert fee from cents to dollars
    const deliveryFee = doordashData.fee / 100;

    // Calculate estimated times
    const etaMinutes = doordashData.estimated_dropoff_time
      ? Math.round((new Date(doordashData.estimated_dropoff_time).getTime() - Date.now()) / 60000)
      : 35;

    // Log successful quote
    await prisma.integrationLog.create({
      data: {
        tenantId: tenant.id,
        source: 'doordash',
        message: 'Delivery quote received',
        payload: JSON.parse(JSON.stringify({
          request: doordashRequest,
          response: doordashData,
          deliveryFee,
          etaMinutes,
          mode: config.isSandbox ? 'sandbox' : 'production',
        })),
      },
    });

    return NextResponse.json({
      partner: 'doordash',
      deliveryFee,
      etaMinutes,
      currency: doordashData.currency || 'USD',
      quoteId: doordashData.quote_id || doordashData.external_delivery_id,
      externalDeliveryId: doordashData.external_delivery_id,
      expiresAt: doordashData.expires_at || new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      estimatedPickupTime: doordashData.estimated_pickup_time,
      estimatedDropoffTime: doordashData.estimated_dropoff_time,
      mode: config.isSandbox ? 'sandbox' : 'production',
    });
  } catch (error) {
    console.error('[DoorDash Quote] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get delivery quote' },
      { status: 500 }
    );
  }
}

