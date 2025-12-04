import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';
import { getUberAccessToken, isUberDirectConfigured } from '@/lib/uber/auth';

/**
 * Uber Direct API - Create Delivery Order
 * 
 * This endpoint creates a delivery order with Uber Direct
 * 
 * NOTE: This is a placeholder implementation. Actual API endpoints and structure
 * may differ. Requires Uber Direct partnership and API credentials.
 */

interface UberCreateRequest {
  externalDeliveryId: string;
  pickupAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    contactName?: string;
    contactPhone?: string;
  };
  dropoffAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    contactName: string;
    contactPhone: string;
  };
  orderValue: number;
}

export async function POST(req: NextRequest) {
  try {
    const tenant = await requireTenant();
    const body = (await req.json()) as UberCreateRequest;

    // Validate required fields
    if (!body.externalDeliveryId || !body.pickupAddress || !body.dropoffAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: externalDeliveryId, pickupAddress, dropoffAddress' },
        { status: 400 }
      );
    }

    if (!body.dropoffAddress.contactName || !body.dropoffAddress.contactPhone) {
      return NextResponse.json(
        { error: 'Dropoff contact name and phone are required' },
        { status: 400 }
      );
    }

    // Check if Uber Direct is configured
    if (!isUberDirectConfigured()) {
      console.log('[Uber Direct Create] API not configured, using mock data');

      const deliveryId = `uber_delivery_mock_${Date.now()}`;
      const trackingUrl = `https://track.uber.com/${deliveryId}`;
      const status = 'pending';

      await prisma.integrationLog.create({
        data: {
          tenantId: tenant.id,
          source: 'uber',
          message: 'Delivery order created (mock)',
          payload: {
            externalDeliveryId: body.externalDeliveryId,
            uberDeliveryId: deliveryId,
            status,
            trackingUrl,
            mode: 'mock',
          },
        },
      });

      return NextResponse.json({
        success: true,
        deliveryId,
        externalDeliveryId: body.externalDeliveryId,
        status,
        trackingUrl,
        estimatedPickupTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        estimatedDropoffTime: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
        message: 'Mock delivery created. Set UBER_CLIENT_ID and UBER_CLIENT_SECRET for live deliveries.',
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

    // TODO: Implement actual Uber Direct delivery creation API call
    // The actual API endpoint and request structure will be provided by Uber
    // after partnership approval. This is a placeholder structure.

    const uberRequest = {
      external_delivery_id: body.externalDeliveryId,
      pickup_address: `${body.pickupAddress.street}, ${body.pickupAddress.city}, ${body.pickupAddress.state} ${body.pickupAddress.zipCode}`,
      dropoff_address: `${body.dropoffAddress.street}, ${body.dropoffAddress.city}, ${body.dropoffAddress.state} ${body.dropoffAddress.zipCode}`,
      dropoff_contact_name: body.dropoffAddress.contactName,
      dropoff_contact_phone: body.dropoffAddress.contactPhone,
      order_value: body.orderValue,
    };

    console.log('[Uber Direct Create] Calling Uber Direct API (placeholder)', {
      request: uberRequest,
    });

    // Placeholder for actual API call
    // const response = await fetch('https://api.uber.com/v1/deliveries', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${accessToken}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(uberRequest),
    // });

    // For now, return mock data
    const deliveryId = `uber_delivery_${Date.now()}`;
    const trackingUrl = `https://track.uber.com/${deliveryId}`;
    const status = 'pending';

    await prisma.integrationLog.create({
      data: {
        tenantId: tenant.id,
        source: 'uber',
        message: 'Delivery order created (Uber Direct - placeholder)',
        payload: {
          request: uberRequest,
          deliveryId,
          status,
          trackingUrl,
          mode: 'placeholder',
          note: 'Uber Direct API integration pending partnership approval',
        },
      },
    });

    return NextResponse.json({
      success: true,
      deliveryId,
      externalDeliveryId: body.externalDeliveryId,
      status,
      trackingUrl,
      estimatedPickupTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      estimatedDropoffTime: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
      mode: 'placeholder',
      message: 'Uber Direct integration pending. Delivery order created in mock mode.',
    });
  } catch (error) {
    console.error('[Uber Direct Create] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create delivery order' },
      { status: 500 }
    );
  }
}

