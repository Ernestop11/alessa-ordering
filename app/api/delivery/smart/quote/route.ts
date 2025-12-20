import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';
import {
  getSmartQuotes,
  DeliveryAddress,
  SmartQuoteResult,
} from '@/lib/delivery/aggregator';

/**
 * Smart Delivery Quote API
 *
 * Fetches quotes from all enabled delivery providers in parallel,
 * compares prices and ETAs, and returns sorted results.
 *
 * POST /api/delivery/smart/quote
 *
 * Body:
 * - pickupAddress: { street, city, state, zipCode }
 * - dropoffAddress: { street, city, state, zipCode }
 * - orderValue?: number (for DoorDash pricing)
 *
 * Returns:
 * - quotes: DeliveryQuote[] (sorted by price, cheapest first)
 * - cheapest: DeliveryQuote | null
 * - fastest: DeliveryQuote | null
 * - enabledProviders: string[]
 */

interface SmartQuoteRequest {
  pickupAddress: DeliveryAddress;
  dropoffAddress: DeliveryAddress;
  orderValue?: number;
}

export async function POST(req: NextRequest) {
  try {
    const tenant = await requireTenant();
    const body = (await req.json()) as SmartQuoteRequest;

    // Validate required fields
    if (!body.pickupAddress || !body.dropoffAddress) {
      return NextResponse.json(
        { error: 'Pickup and dropoff addresses are required' },
        { status: 400 }
      );
    }

    if (!body.dropoffAddress.street || !body.dropoffAddress.zipCode) {
      return NextResponse.json(
        { error: 'Complete dropoff address is required' },
        { status: 400 }
      );
    }

    // Fetch quotes from all enabled providers in parallel
    const result: SmartQuoteResult = await getSmartQuotes(
      body.pickupAddress,
      body.dropoffAddress,
      tenant,
      body.orderValue
    );

    // Log the quote request
    await prisma.integrationLog.create({
      data: {
        tenantId: tenant.id,
        source: 'smart_dispatch',
        message: 'Smart quote requested',
        payload: JSON.parse(JSON.stringify({
          pickupAddress: body.pickupAddress,
          dropoffAddress: body.dropoffAddress,
          orderValue: body.orderValue,
          enabledProviders: result.enabledProviders,
          quotesReceived: result.quotes.length,
          cheapest: result.cheapest
            ? {
                provider: result.cheapest.provider,
                fee: result.cheapest.deliveryFee,
                eta: result.cheapest.etaMinutes,
              }
            : null,
          fastest: result.fastest
            ? {
                provider: result.fastest.provider,
                fee: result.fastest.deliveryFee,
                eta: result.fastest.etaMinutes,
              }
            : null,
        })),
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Smart Quote] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get delivery quotes' },
      { status: 500 }
    );
  }
}
