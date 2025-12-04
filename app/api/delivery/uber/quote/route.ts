import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';
import { getUberAccessToken, isUberDirectConfigured } from '@/lib/uber/auth';

/**
 * Uber Direct API - Delivery Quote
 * 
 * This endpoint gets a delivery quote from Uber Direct API
 * 
 * NOTE: This is a placeholder implementation. Actual API endpoints and structure
 * may differ. Requires Uber Direct partnership and API credentials.
 * 
 * Documentation: https://developer.uber.com/docs/direct
 */

interface UberQuoteRequest {
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

// Format address for Uber Direct API
function formatAddress(address: { street: string; city: string; state: string; zipCode: string }): string {
  return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;
}

export async function POST(req: NextRequest) {
  try {
    const tenant = await requireTenant();
    const body = (await req.json()) as UberQuoteRequest;

    // Validate required fields
    if (!body.pickupAddress || !body.dropoffAddress) {
      return NextResponse.json(
        { error: 'Pickup and dropoff addresses are required' },
        { status: 400 }
      );
    }

    // Check if Uber Direct is configured
    if (!isUberDirectConfigured()) {
      console.log('[Uber Direct Quote] API not configured, using mock data');

      const baseFee = tenant.integrations?.deliveryBaseFee ?? 4.99;
      const perMileFee = 1.5;
      const estimatedMiles = 3.5;
      const deliveryFee = parseFloat((baseFee + perMileFee * estimatedMiles).toFixed(2));
      const etaMinutes = 35;

      await prisma.integrationLog.create({
        data: {
          tenantId: tenant.id,
          source: 'uber',
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
        partner: 'uber',
        deliveryFee,
        estimatedMiles,
        etaMinutes,
        currency: 'USD',
        quoteId: `uber_quote_mock_${Date.now()}`,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        message: 'Mock quote. Set UBER_CLIENT_ID and UBER_CLIENT_SECRET for live pricing.',
        mode: 'mock',
      });
    }

    // Get access token
    const accessToken = await getUberAccessToken();
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Failed to authenticate with Uber Direct API' },
        { status: 500 }
      );
    }

    // TODO: Implement actual Uber Direct quote API call
    // The actual API endpoint and request structure will be provided by Uber
    // after partnership approval. This is a placeholder structure.

    const uberRequest = {
      pickup_address: formatAddress(body.pickupAddress),
      dropoff_address: formatAddress(body.dropoffAddress),
      order_value: body.orderValue || 0,
    };

    console.log('[Uber Direct Quote] Calling Uber Direct API (placeholder)', {
      request: uberRequest,
    });

    // Placeholder for actual API call
    // const response = await fetch('https://api.uber.com/v1/deliveries/quotes', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${accessToken}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(uberRequest),
    // });

    // For now, return mock data
    const baseFee = tenant.integrations?.deliveryBaseFee ?? 4.99;
    const deliveryFee = baseFee;
    const etaMinutes = 30;

    await prisma.integrationLog.create({
      data: {
        tenantId: tenant.id,
        source: 'uber',
        message: 'Delivery quote requested (Uber Direct - placeholder)',
        payload: {
          request: uberRequest,
          deliveryFee,
          etaMinutes,
          mode: 'placeholder',
          note: 'Uber Direct API integration pending partnership approval',
        },
      },
    });

    return NextResponse.json({
      partner: 'uber',
      deliveryFee,
      etaMinutes,
      currency: 'USD',
      quoteId: `uber_quote_${Date.now()}`,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      mode: 'placeholder',
      message: 'Uber Direct integration pending. Using estimated pricing.',
    });
  } catch (error) {
    console.error('[Uber Direct Quote] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get delivery quote' },
      { status: 500 }
    );
  }
}

