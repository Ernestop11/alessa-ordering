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
 * Uber Direct API - Create Delivery
 *
 * Creates a delivery order with Uber Direct
 * Documentation: https://developer.uber.com/docs/deliveries/overview
 *
 * Endpoint: POST /v1/customers/{customer_id}/deliveries
 */

interface UberCreateRequest {
  externalDeliveryId: string;
  quoteId: string;
  pickupAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  pickupName: string;
  pickupPhone: string;
  pickupInstructions?: string;
  dropoffAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  dropoffName: string;
  dropoffPhone: string;
  dropoffInstructions?: string;
  manifestItems?: Array<{
    name: string;
    quantity: number;
    price?: number;
  }>;
  orderValue: number;
  tip?: number;
}

interface UberDeliveryResponse {
  id: string;
  quote_id: string;
  status: string;
  tracking_url: string;
  courier?: {
    name: string;
    phone_number: string;
    vehicle_type: string;
    img_href: string;
    location?: {
      lat: number;
      lng: number;
    };
  };
  pickup_eta: string;
  dropoff_eta: string;
  dropoff_deadline: string;
  fee: number;
  currency: string;
  created: string;
  updated: string;
}

export async function POST(req: NextRequest) {
  try {
    const tenant = await requireTenant();
    const body = (await req.json()) as UberCreateRequest;

    // Validate required fields
    if (!body.externalDeliveryId || !body.quoteId) {
      return NextResponse.json(
        { error: 'Missing required fields: externalDeliveryId, quoteId' },
        { status: 400 }
      );
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

    // Check if Uber Direct is configured
    if (!isUberDirectConfigured()) {
      console.log('[Uber Direct Create] API not configured, using mock data');

      const deliveryId = `uber_mock_${Date.now()}`;
      const trackingUrl = `https://www.uber.com/orders/${deliveryId}`;

      await prisma.integrationLog.create({
        data: {
          tenantId: tenant.id,
          source: 'uber',
          message: 'Delivery created (mock)',
          payload: {
            externalDeliveryId: body.externalDeliveryId,
            uberDeliveryId: deliveryId,
            trackingUrl,
            mode: 'mock',
          },
        },
      });

      // Update order with delivery info
      await prisma.order.update({
        where: { id: body.externalDeliveryId },
        data: {
          deliveryPartner: 'uber',
          uberDeliveryId: deliveryId,
          deliveryStatus: 'pending',
          deliveryTrackingUrl: trackingUrl,
        },
      });

      return NextResponse.json({
        success: true,
        deliveryId,
        externalDeliveryId: body.externalDeliveryId,
        status: 'pending',
        trackingUrl,
        estimatedPickupTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        estimatedDropoffTime: new Date(Date.now() + 35 * 60 * 1000).toISOString(),
        message: 'Mock delivery - Configure Uber credentials for live deliveries',
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

    // Build Uber Direct delivery request
    const uberRequest = {
      quote_id: body.quoteId,
      pickup_address: JSON.stringify({
        street_address: [body.pickupAddress.street],
        city: body.pickupAddress.city,
        state: body.pickupAddress.state,
        zip_code: body.pickupAddress.zipCode,
        country: 'US',
      }),
      pickup_name: body.pickupName,
      pickup_phone_number: body.pickupPhone,
      pickup_notes: body.pickupInstructions || '',
      dropoff_address: JSON.stringify({
        street_address: [body.dropoffAddress.street],
        city: body.dropoffAddress.city,
        state: body.dropoffAddress.state,
        zip_code: body.dropoffAddress.zipCode,
        country: 'US',
      }),
      dropoff_name: body.dropoffName,
      dropoff_phone_number: body.dropoffPhone,
      dropoff_notes: body.dropoffInstructions || '',
      manifest_items: body.manifestItems?.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price ? Math.round(item.price * 100) : undefined,
      })),
      external_id: body.externalDeliveryId,
      tip: body.tip ? Math.round(body.tip * 100) : undefined,
    };

    console.log('[Uber Direct Create] Calling API:', {
      url: `${baseUrl}/customers/${customerId}/deliveries`,
    });

    const response = await fetch(
      `${baseUrl}/customers/${customerId}/deliveries`,
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
      console.error('[Uber Direct Create] API error:', response.status, errorText);

      await prisma.integrationLog.create({
        data: {
          tenantId: tenant.id,
          source: 'uber',
          message: `Create delivery API error: ${response.status}`,
          payload: {
            error: errorText,
            status: response.status,
            orderId: body.externalDeliveryId,
          },
        },
      });

      return NextResponse.json(
        { error: 'Failed to create delivery with Uber', details: errorText },
        { status: response.status }
      );
    }

    const uberResponse: UberDeliveryResponse = await response.json();

    // Update order with delivery info
    await prisma.order.update({
      where: { id: body.externalDeliveryId },
      data: {
        deliveryPartner: 'uber',
        uberDeliveryId: uberResponse.id,
        deliveryStatus: uberResponse.status,
        deliveryTrackingUrl: uberResponse.tracking_url,
        deliveryFee: uberResponse.fee / 100,
      },
    });

    // Log successful delivery creation
    await prisma.integrationLog.create({
      data: {
        tenantId: tenant.id,
        source: 'uber',
        message: 'Delivery created successfully',
        payload: {
          orderId: body.externalDeliveryId,
          uberDeliveryId: uberResponse.id,
          status: uberResponse.status,
          trackingUrl: uberResponse.tracking_url,
          fee: uberResponse.fee,
          pickupEta: uberResponse.pickup_eta,
          dropoffEta: uberResponse.dropoff_eta,
        },
      },
    });

    return NextResponse.json({
      success: true,
      deliveryId: uberResponse.id,
      externalDeliveryId: body.externalDeliveryId,
      status: uberResponse.status,
      trackingUrl: uberResponse.tracking_url,
      estimatedPickupTime: uberResponse.pickup_eta,
      estimatedDropoffTime: uberResponse.dropoff_eta,
      dropoffDeadline: uberResponse.dropoff_deadline,
      deliveryFee: uberResponse.fee / 100,
      courier: uberResponse.courier,
      mode: 'live',
    });
  } catch (error) {
    console.error('[Uber Direct Create] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create delivery' },
      { status: 500 }
    );
  }
}
