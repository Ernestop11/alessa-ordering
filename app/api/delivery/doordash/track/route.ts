import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';
import { getDoorDashAuthToken } from '@/lib/doordash/jwt';

// Force dynamic rendering - this route uses searchParams
export const dynamic = 'force-dynamic';

/**
 * DoorDash Drive API - Track Delivery
 *
 * This endpoint gets the current status of a DoorDash delivery
 *
 * DoorDash Drive API Documentation:
 * https://developer.doordash.com/en-US/api/drive
 *
 * API Endpoints:
 * - Sandbox: https://openapi.doordash.com/drive/v2/deliveries/{delivery_id}
 * - Production: https://openapi.doordash.com/drive/v2/deliveries/{delivery_id}
 */

interface DoorDashAPITrackResponse {
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
  cancel_reason?: string;
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

export async function GET(req: NextRequest) {
  try {
    const tenant = await requireTenant();
    const searchParams = req.nextUrl.searchParams;
    const deliveryId = searchParams.get('deliveryId');
    const externalDeliveryId = searchParams.get('externalDeliveryId');

    if (!deliveryId && !externalDeliveryId) {
      return NextResponse.json(
        { error: 'deliveryId or externalDeliveryId is required' },
        { status: 400 }
      );
    }

    const config = getDoorDashConfig();

    // If DoorDash API is not configured, return mock data
    if (!config.enabled) {
      console.log('[DoorDash Track] API not configured, using mock data');

      const status = 'picked_up'; // pending, accepted, picked_up, delivered, cancelled
      const currentLocation = {
        lat: 36.1627,
        lng: -86.7816,
      };

      await prisma.integrationLog.create({
        data: {
          tenantId: tenant.id,
          source: 'doordash',
          message: 'Delivery tracking requested (mock)',
          payload: {
            deliveryId,
            externalDeliveryId,
            status,
            currentLocation,
            mode: 'mock',
          },
        },
      });

      return NextResponse.json({
        deliveryId: deliveryId || `dd_delivery_mock_${Date.now()}`,
        externalDeliveryId,
        status,
        currentLocation,
        estimatedDropoffTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        trackingUrl: `https://track.doordash.com/${deliveryId}`,
        message: 'Mock tracking data. Set DOORDASH_API_KEY and DOORDASH_DEVELOPER_ID for live tracking.',
        mode: 'mock',
      });
    }

    // Use deliveryId from DoorDash (not externalDeliveryId)
    const ddDeliveryId = deliveryId;
    if (!ddDeliveryId) {
      return NextResponse.json(
        { error: 'deliveryId is required for live tracking' },
        { status: 400 }
      );
    }

    // Call DoorDash Drive API for live tracking
    console.log('[DoorDash Track] Calling DoorDash API:', {
      url: `https://openapi.doordash.com/drive/v2/deliveries/${ddDeliveryId}`,
      sandbox: config.isSandbox,
      deliveryId: ddDeliveryId,
    });

    const doordashResponse = await fetch(
      `https://openapi.doordash.com/drive/v2/deliveries/${ddDeliveryId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.authToken}`,
        },
      }
    );

    const responseText = await doordashResponse.text();
    console.log('[DoorDash Track] Response status:', doordashResponse.status);

    if (!doordashResponse.ok) {
      console.error('[DoorDash Track] API error:', responseText);

      await prisma.integrationLog.create({
        data: {
          tenantId: tenant.id,
          source: 'doordash',
          message: 'Delivery tracking failed',
          payload: JSON.parse(JSON.stringify({
            error: responseText,
            status: doordashResponse.status,
            deliveryId: ddDeliveryId,
          })),
        },
      });

      return NextResponse.json(
        { error: 'Failed to track delivery with DoorDash', details: responseText },
        { status: doordashResponse.status }
      );
    }

    const doordashData: DoorDashAPITrackResponse = JSON.parse(responseText);

    // Log successful tracking
    await prisma.integrationLog.create({
      data: {
        tenantId: tenant.id,
        source: 'doordash',
        message: 'Delivery tracking retrieved',
        payload: JSON.parse(JSON.stringify({
          response: doordashData,
          mode: config.isSandbox ? 'sandbox' : 'production',
        })),
      },
    });

    return NextResponse.json({
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
      cancelReason: doordashData.cancel_reason,
      mode: config.isSandbox ? 'sandbox' : 'production',
    });
  } catch (error) {
    console.error('[DoorDash Track] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to track delivery' },
      { status: 500 }
    );
  }
}

