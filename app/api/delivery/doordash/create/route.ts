import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';

/**
 * DoorDash Drive API - Create Delivery
 *
 * This endpoint creates a delivery order with DoorDash Drive API
 *
 * DoorDash Drive API Documentation:
 * https://developer.doordash.com/en-US/api/drive
 *
 * API Endpoints:
 * - Sandbox: https://openapi.doordash.com/drive/v2/deliveries
 * - Production: https://openapi.doordash.com/drive/v2/deliveries
 */

interface DoorDashCreateRequest {
  quoteId?: string;
  externalDeliveryId: string; // Your order ID
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
    instructions?: string;
  };
  orderValue?: number;
  tip?: number;
  pickupInstructions?: string;
}

interface DoorDashAPICreateRequest {
  external_delivery_id: string;
  pickup_address: string;
  pickup_business_name: string;
  pickup_phone_number?: string;
  pickup_instructions?: string;
  dropoff_address: string;
  dropoff_business_name?: string;
  dropoff_phone_number: string;
  dropoff_contact_given_name?: string;
  dropoff_contact_family_name?: string;
  dropoff_instructions?: string;
  order_value: number;
  tip?: number;
  pickup_time?: string;
  dropoff_time?: string;
}

interface DoorDashAPICreateResponse {
  external_delivery_id: string;
  delivery_id: string;
  delivery_status: string;
  fee: number;
  currency: string;
  tracking_url?: string;
  pickup_time_estimated?: string;
  dropoff_time_estimated?: string;
  dasher_name?: string;
  dasher_phone_number?: string;
  dasher_vehicle_make?: string;
  dasher_vehicle_model?: string;
  dasher_vehicle_year?: string;
  dasher_location?: {
    lat: number;
    lng: number;
  };
}

// Format address for DoorDash API (single line)
function formatAddress(address: { street: string; city: string; state: string; zipCode: string }): string {
  return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;
}

// Get DoorDash API credentials
function getDoorDashConfig() {
  const apiKey = process.env.DOORDASH_API_KEY;
  const developerId = process.env.DOORDASH_DEVELOPER_ID;
  const isSandbox = process.env.DOORDASH_SANDBOX === 'true';

  if (!apiKey || !developerId) {
    return { enabled: false, apiKey: null, developerId: null, isSandbox: false };
  }

  return { enabled: true, apiKey, developerId, isSandbox };
}

export async function POST(req: NextRequest) {
  try {
    const tenant = await requireTenant();
    const body = (await req.json()) as DoorDashCreateRequest;

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

    const config = getDoorDashConfig();

    // If DoorDash API is not configured, return mock data
    if (!config.enabled) {
      console.log('[DoorDash Create] API not configured, using mock data');

      const deliveryId = `dd_delivery_mock_${Date.now()}`;
      const trackingUrl = `https://track.doordash.com/${deliveryId}`;
      const status = 'pending';

      await prisma.integrationLog.create({
        data: {
          tenantId: tenant.id,
          source: 'doordash',
          message: 'Delivery order created (mock)',
          payload: {
            externalDeliveryId: body.externalDeliveryId,
            doordashDeliveryId: deliveryId,
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
        message: 'Mock delivery created. Set DOORDASH_API_KEY and DOORDASH_DEVELOPER_ID for live deliveries.',
        mode: 'mock',
      });
    }

    // Parse customer name
    const nameParts = body.dropoffAddress.contactName.trim().split(' ');
    const givenName = nameParts[0] || 'Customer';
    const familyName = nameParts.slice(1).join(' ') || '';

    // Call DoorDash Drive API for live delivery
    const doordashRequest: DoorDashAPICreateRequest = {
      external_delivery_id: body.externalDeliveryId,
      pickup_address: formatAddress(body.pickupAddress),
      pickup_business_name: tenant.name,
      pickup_phone_number: body.pickupAddress.contactPhone || undefined,
      pickup_instructions: body.pickupInstructions,
      dropoff_address: formatAddress(body.dropoffAddress),
      dropoff_phone_number: body.dropoffAddress.contactPhone,
      dropoff_contact_given_name: givenName,
      dropoff_contact_family_name: familyName || undefined,
      dropoff_instructions: body.dropoffAddress.instructions,
      order_value: Math.round((body.orderValue || 0) * 100), // Convert to cents
      tip: body.tip ? Math.round(body.tip * 100) : undefined, // Convert to cents
    };

    console.log('[DoorDash Create] Calling DoorDash API:', {
      url: 'https://openapi.doordash.com/drive/v2/deliveries',
      sandbox: config.isSandbox,
      externalDeliveryId: body.externalDeliveryId,
    });

    const doordashResponse = await fetch('https://openapi.doordash.com/drive/v2/deliveries', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(doordashRequest),
    });

    const responseText = await doordashResponse.text();
    console.log('[DoorDash Create] Response status:', doordashResponse.status);

    if (!doordashResponse.ok) {
      console.error('[DoorDash Create] API error:', responseText);

      await prisma.integrationLog.create({
        data: {
          tenantId: tenant.id,
          source: 'doordash',
          message: 'Delivery creation failed',
          payload: JSON.parse(JSON.stringify({
            error: responseText,
            status: doordashResponse.status,
            request: doordashRequest,
          })),
        },
      });

      return NextResponse.json(
        { error: 'Failed to create delivery with DoorDash', details: responseText },
        { status: doordashResponse.status }
      );
    }

    const doordashData: DoorDashAPICreateResponse = JSON.parse(responseText);

    // Log successful delivery creation
    await prisma.integrationLog.create({
      data: {
        tenantId: tenant.id,
        source: 'doordash',
        message: 'Delivery order created',
        payload: JSON.parse(JSON.stringify({
          request: doordashRequest,
          response: doordashData,
          mode: config.isSandbox ? 'sandbox' : 'production',
        })),
      },
    });

    return NextResponse.json({
      success: true,
      deliveryId: doordashData.delivery_id,
      externalDeliveryId: doordashData.external_delivery_id,
      status: doordashData.delivery_status,
      fee: doordashData.fee / 100, // Convert from cents to dollars
      currency: doordashData.currency,
      trackingUrl: doordashData.tracking_url,
      estimatedPickupTime: doordashData.pickup_time_estimated,
      estimatedDropoffTime: doordashData.dropoff_time_estimated,
      dasher: doordashData.dasher_name ? {
        name: doordashData.dasher_name,
        phone: doordashData.dasher_phone_number,
        vehicle: doordashData.dasher_vehicle_make && doordashData.dasher_vehicle_model
          ? `${doordashData.dasher_vehicle_year || ''} ${doordashData.dasher_vehicle_make} ${doordashData.dasher_vehicle_model}`.trim()
          : undefined,
        location: doordashData.dasher_location,
      } : undefined,
      mode: config.isSandbox ? 'sandbox' : 'production',
    });
  } catch (error) {
    console.error('[DoorDash Create] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create delivery' },
      { status: 500 }
    );
  }
}

