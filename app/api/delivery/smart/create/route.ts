import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';
import {
  getSmartQuotes,
  selectBestQuote,
  DeliveryAddress,
  DeliveryQuote,
} from '@/lib/delivery/aggregator';

/**
 * Smart Delivery Create API
 *
 * Creates a delivery with the selected or auto-selected provider.
 * Includes automatic fallback: if primary provider fails, tries next cheapest.
 *
 * POST /api/delivery/smart/create
 *
 * Body:
 * - orderId: string (required)
 * - provider?: 'uber' | 'doordash' | 'self' (optional, auto-selects if not provided)
 * - quoteId?: string (optional, gets fresh quote if not provided)
 * - strategy?: 'cheapest' | 'fastest' (default: 'cheapest')
 * - pickupAddress: DeliveryAddress
 * - dropoffAddress: DeliveryAddress
 * - dropoffName: string
 * - dropoffPhone: string
 * - dropoffInstructions?: string
 * - orderValue?: number
 * - tip?: number
 */

interface SmartCreateRequest {
  orderId: string;
  provider?: 'uber' | 'doordash' | 'self';
  quoteId?: string;
  strategy?: 'cheapest' | 'fastest';
  pickupAddress: DeliveryAddress;
  pickupName?: string;
  pickupPhone?: string;
  dropoffAddress: DeliveryAddress;
  dropoffName: string;
  dropoffPhone: string;
  dropoffInstructions?: string;
  orderValue?: number;
  tip?: number;
}

interface CreateDeliveryResult {
  success: boolean;
  deliveryId: string;
  provider: string;
  status: string;
  trackingUrl?: string;
  estimatedPickupTime?: string;
  estimatedDropoffTime?: string;
  deliveryFee?: number;
  mode: string;
  fallback?: boolean;
  fallbackReason?: string;
}

/**
 * Create delivery with Uber Direct
 */
async function createUberDelivery(
  orderId: string,
  quoteId: string,
  request: SmartCreateRequest,
  tenant: { id: string; name: string; slug: string; integrations: Record<string, unknown> | null }
): Promise<CreateDeliveryResult> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/delivery/uber/create`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `tenant=${tenant.slug}`,
      },
      body: JSON.stringify({
        externalDeliveryId: orderId,
        quoteId,
        pickupAddress: request.pickupAddress,
        pickupName: request.pickupName || tenant.name,
        pickupPhone: request.pickupPhone || '',
        dropoffAddress: request.dropoffAddress,
        dropoffName: request.dropoffName,
        dropoffPhone: request.dropoffPhone,
        dropoffInstructions: request.dropoffInstructions,
        orderValue: request.orderValue,
        tip: request.tip,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create Uber delivery');
  }

  const data = await response.json();
  return {
    success: true,
    deliveryId: data.deliveryId,
    provider: 'uber',
    status: data.status,
    trackingUrl: data.trackingUrl,
    estimatedPickupTime: data.estimatedPickupTime,
    estimatedDropoffTime: data.estimatedDropoffTime,
    deliveryFee: data.deliveryFee,
    mode: data.mode,
  };
}

/**
 * Create delivery with DoorDash Drive
 */
async function createDoorDashDelivery(
  orderId: string,
  quoteId: string,
  request: SmartCreateRequest,
  tenant: { id: string; name: string; slug: string; integrations: Record<string, unknown> | null }
): Promise<CreateDeliveryResult> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/delivery/doordash/create`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `tenant=${tenant.slug}`,
      },
      body: JSON.stringify({
        externalDeliveryId: orderId,
        quoteId,
        pickupAddress: {
          ...request.pickupAddress,
          contactName: request.pickupName || tenant.name,
          contactPhone: request.pickupPhone,
        },
        dropoffAddress: {
          ...request.dropoffAddress,
          contactName: request.dropoffName,
          contactPhone: request.dropoffPhone,
          instructions: request.dropoffInstructions,
        },
        orderValue: request.orderValue,
        tip: request.tip,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create DoorDash delivery');
  }

  const data = await response.json();
  return {
    success: true,
    deliveryId: data.deliveryId,
    provider: 'doordash',
    status: data.status,
    trackingUrl: data.trackingUrl,
    estimatedPickupTime: data.estimatedPickupTime,
    estimatedDropoffTime: data.estimatedDropoffTime,
    deliveryFee: data.fee,
    mode: data.mode,
  };
}

/**
 * Create self-delivery record
 */
async function createSelfDelivery(
  orderId: string,
  request: SmartCreateRequest,
  tenant: { id: string; name: string; slug: string; integrations: Record<string, unknown> | null }
): Promise<CreateDeliveryResult> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/delivery/self/create`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `tenant=${tenant.slug}`,
      },
      body: JSON.stringify({
        orderId,
        pickupAddress: request.pickupAddress,
        dropoffAddress: request.dropoffAddress,
        customerName: request.dropoffName,
        customerPhone: request.dropoffPhone,
        deliveryNotes: request.dropoffInstructions,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create self-delivery');
  }

  const data = await response.json();
  return {
    success: true,
    deliveryId: data.deliveryId || data.id,
    provider: 'self',
    status: 'pending',
    estimatedDropoffTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    mode: 'live',
  };
}

/**
 * Create delivery with the specified provider
 */
async function createDeliveryWithProvider(
  provider: 'uber' | 'doordash' | 'self',
  orderId: string,
  quoteId: string,
  request: SmartCreateRequest,
  tenant: { id: string; name: string; slug: string; integrations: Record<string, unknown> | null }
): Promise<CreateDeliveryResult> {
  switch (provider) {
    case 'uber':
      return createUberDelivery(orderId, quoteId, request, tenant);
    case 'doordash':
      return createDoorDashDelivery(orderId, quoteId, request, tenant);
    case 'self':
      return createSelfDelivery(orderId, request, tenant);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenant = await requireTenant();
    const body = (await req.json()) as SmartCreateRequest;

    // Validate required fields
    if (!body.orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    if (!body.pickupAddress || !body.dropoffAddress) {
      return NextResponse.json(
        { error: 'Pickup and dropoff addresses are required' },
        { status: 400 }
      );
    }

    if (!body.dropoffName || !body.dropoffPhone) {
      return NextResponse.json(
        { error: 'Dropoff contact name and phone are required' },
        { status: 400 }
      );
    }

    let provider = body.provider;
    let quoteId = body.quoteId;
    let quotes: DeliveryQuote[] = [];
    const strategy = body.strategy || 'cheapest';

    // If no provider specified, get quotes and auto-select
    if (!provider) {
      const quoteResult = await getSmartQuotes(
        body.pickupAddress,
        body.dropoffAddress,
        tenant,
        body.orderValue
      );

      quotes = quoteResult.quotes;
      const selectedQuote = selectBestQuote(quotes, strategy);

      if (!selectedQuote) {
        return NextResponse.json(
          { error: 'No delivery providers available' },
          { status: 400 }
        );
      }

      provider = selectedQuote.provider;
      quoteId = selectedQuote.quoteId;

      console.log(`[Smart Create] Auto-selected ${provider} (${strategy}):`, {
        fee: selectedQuote.deliveryFee,
        eta: selectedQuote.etaMinutes,
      });
    }

    // Log the dispatch attempt
    await prisma.integrationLog.create({
      data: {
        tenantId: tenant.id,
        source: 'smart_dispatch',
        message: `Creating delivery with ${provider}`,
        payload: {
          orderId: body.orderId,
          provider,
          quoteId,
          strategy,
          autoSelected: !body.provider,
        },
      },
    });

    // Try to create delivery with selected provider
    let result: CreateDeliveryResult;
    try {
      result = await createDeliveryWithProvider(
        provider,
        body.orderId,
        quoteId || '',
        body,
        tenant
      );
    } catch (primaryError) {
      console.error(`[Smart Create] Primary provider ${provider} failed:`, primaryError);

      // Try fallback to next provider
      if (quotes.length === 0) {
        // Get fresh quotes for fallback
        const quoteResult = await getSmartQuotes(
          body.pickupAddress,
          body.dropoffAddress,
          tenant,
          body.orderValue
        );
        quotes = quoteResult.quotes;
      }

      // Find next available provider
      const fallbackQuote = quotes.find((q) => q.provider !== provider && q.available);

      if (!fallbackQuote) {
        await prisma.integrationLog.create({
          data: {
            tenantId: tenant.id,
            source: 'smart_dispatch',
            message: `Delivery failed - no fallback available`,
            payload: {
              orderId: body.orderId,
              primaryProvider: provider,
              error: primaryError instanceof Error ? primaryError.message : 'Unknown error',
            },
          },
        });

        return NextResponse.json(
          {
            error: `Failed to create delivery with ${provider} and no fallback available`,
            details: primaryError instanceof Error ? primaryError.message : 'Unknown error',
          },
          { status: 500 }
        );
      }

      console.log(`[Smart Create] Falling back to ${fallbackQuote.provider}`);

      // Try fallback provider
      try {
        result = await createDeliveryWithProvider(
          fallbackQuote.provider,
          body.orderId,
          fallbackQuote.quoteId,
          body,
          tenant
        );
        result.fallback = true;
        result.fallbackReason = `${provider} failed: ${primaryError instanceof Error ? primaryError.message : 'Unknown error'}`;

        await prisma.integrationLog.create({
          data: {
            tenantId: tenant.id,
            source: 'smart_dispatch',
            message: `Delivery created with fallback provider ${fallbackQuote.provider}`,
            payload: {
              orderId: body.orderId,
              primaryProvider: provider,
              fallbackProvider: fallbackQuote.provider,
              deliveryId: result.deliveryId,
            },
          },
        });
      } catch (fallbackError) {
        console.error(`[Smart Create] Fallback provider ${fallbackQuote.provider} also failed:`, fallbackError);

        await prisma.integrationLog.create({
          data: {
            tenantId: tenant.id,
            source: 'smart_dispatch',
            message: `Delivery failed - both providers failed`,
            payload: {
              orderId: body.orderId,
              primaryProvider: provider,
              primaryError: primaryError instanceof Error ? primaryError.message : 'Unknown error',
              fallbackProvider: fallbackQuote.provider,
              fallbackError: fallbackError instanceof Error ? fallbackError.message : 'Unknown error',
            },
          },
        });

        return NextResponse.json(
          {
            error: 'All delivery providers failed',
            details: {
              primary: { provider, error: primaryError instanceof Error ? primaryError.message : 'Unknown error' },
              fallback: { provider: fallbackQuote.provider, error: fallbackError instanceof Error ? fallbackError.message : 'Unknown error' },
            },
          },
          { status: 500 }
        );
      }
    }

    // Update order with selected provider
    await prisma.order.update({
      where: { id: body.orderId },
      data: {
        deliveryPartner: result.provider,
        deliveryStatus: result.status,
        deliveryTrackingUrl: result.trackingUrl,
        deliveryFee: result.deliveryFee,
        ...(result.provider === 'uber' && { uberDeliveryId: result.deliveryId }),
        ...(result.provider === 'doordash' && { doordashDeliveryId: result.deliveryId }),
      },
    });

    // Log successful delivery
    await prisma.integrationLog.create({
      data: {
        tenantId: tenant.id,
        source: 'smart_dispatch',
        message: 'Delivery created successfully',
        payload: {
          orderId: body.orderId,
          provider: result.provider,
          deliveryId: result.deliveryId,
          status: result.status,
          trackingUrl: result.trackingUrl,
          fallback: result.fallback,
          fallbackReason: result.fallbackReason,
        },
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Smart Create] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create delivery' },
      { status: 500 }
    );
  }
}
