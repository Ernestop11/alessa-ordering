import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';
import {
  getUberAccessToken,
  getUberCustomerId,
  getUberApiBaseUrl,
  isUberDirectConfigured,
} from '@/lib/uber/auth';

/**
 * Uber Direct API - Delivery Quote
 *
 * Gets a delivery quote from Uber Direct API
 * Documentation: https://developer.uber.com/docs/deliveries/overview
 *
 * Endpoint: POST /v1/customers/{customer_id}/delivery_quotes
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
  pickupName?: string;
  pickupPhone?: string;
  dropoffName?: string;
  dropoffPhone?: string;
  orderValue?: number;
}

interface UberQuoteResponse {
  id: string;
  kind: string;
  fee: number;
  currency: string;
  currency_type: string;
  dropoff_eta: string;
  pickup_duration: number;
  dropoff_deadline: string;
  created: string;
  expires: string;
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

      const baseFee = tenant.integrations?.deliveryBaseFee ?? 6.99;
      const perMileFee = 0.75;
      const estimatedMiles = 3.5;
      const deliveryFee = parseFloat((baseFee + perMileFee * estimatedMiles).toFixed(2));
      const etaMinutes = 25;

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
        quoteId: `uber_mock_${Date.now()}`,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        message: 'Mock quote - Configure UBER_CLIENT_ID, UBER_CLIENT_SECRET, UBER_CUSTOMER_ID for live pricing',
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

    const customerId = getUberCustomerId();
    const baseUrl = getUberApiBaseUrl();

    // Build Uber Direct quote request
    // https://developer.uber.com/docs/deliveries/api-reference/create-delivery-quote
    const uberRequest = {
      pickup_address: JSON.stringify({
        street_address: [body.pickupAddress.street],
        city: body.pickupAddress.city,
        state: body.pickupAddress.state,
        zip_code: body.pickupAddress.zipCode,
        country: 'US',
      }),
      dropoff_address: JSON.stringify({
        street_address: [body.dropoffAddress.street],
        city: body.dropoffAddress.city,
        state: body.dropoffAddress.state,
        zip_code: body.dropoffAddress.zipCode,
        country: 'US',
      }),
    };

    console.log('[Uber Direct Quote] Calling API:', {
      url: `${baseUrl}/customers/${customerId}/delivery_quotes`,
    });

    const response = await fetch(
      `${baseUrl}/customers/${customerId}/delivery_quotes`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(uberRequest),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Uber Direct Quote] API error:', response.status, errorText);

      await prisma.integrationLog.create({
        data: {
          tenantId: tenant.id,
          source: 'uber',
          message: `Quote API error: ${response.status}`,
          payload: {
            error: errorText,
            status: response.status,
          },
        },
      });

      return NextResponse.json(
        { error: 'Failed to get delivery quote from Uber', details: errorText },
        { status: response.status }
      );
    }

    const uberResponse: UberQuoteResponse = await response.json();

    // Calculate ETA in minutes from dropoff_eta
    const dropoffEta = new Date(uberResponse.dropoff_eta);
    const etaMinutes = Math.round((dropoffEta.getTime() - Date.now()) / 60000);

    // Log successful quote
    await prisma.integrationLog.create({
      data: {
        tenantId: tenant.id,
        source: 'uber',
        message: 'Delivery quote received',
        payload: {
          quoteId: uberResponse.id,
          fee: uberResponse.fee,
          etaMinutes,
          pickupDuration: uberResponse.pickup_duration,
          expiresAt: uberResponse.expires,
        },
      },
    });

    return NextResponse.json({
      partner: 'uber',
      deliveryFee: uberResponse.fee / 100, // Convert cents to dollars
      etaMinutes,
      pickupDurationMinutes: uberResponse.pickup_duration,
      currency: uberResponse.currency || 'USD',
      quoteId: uberResponse.id,
      expiresAt: uberResponse.expires,
      dropoffDeadline: uberResponse.dropoff_deadline,
      mode: 'live',
    });
  } catch (error) {
    console.error('[Uber Direct Quote] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get delivery quote' },
      { status: 500 }
    );
  }
}
