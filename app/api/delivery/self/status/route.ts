import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';

/**
 * Self-Delivery API - Update Status
 *
 * Updates the status of a self-delivery (used by driver app)
 */

interface UpdateStatusRequest {
  selfDeliveryId: string;
  status: 'picked_up' | 'en_route' | 'delivered' | 'cancelled';
  driverNotes?: string;
  location?: {
    lat: number;
    lng: number;
    accuracy?: number;
    heading?: number;
    speed?: number;
  };
}

export async function POST(req: NextRequest) {
  try {
    const tenant = await requireTenant();
    const body = (await req.json()) as UpdateStatusRequest;

    const { selfDeliveryId, status, driverNotes, location } = body;

    if (!selfDeliveryId || !status) {
      return NextResponse.json(
        { error: 'Self-delivery ID and status are required' },
        { status: 400 }
      );
    }

    // Verify self-delivery exists
    const selfDelivery = await prisma.selfDelivery.findFirst({
      where: {
        id: selfDeliveryId,
        tenantId: tenant.id,
      },
      include: {
        driver: true,
      },
    });

    if (!selfDelivery) {
      return NextResponse.json(
        { error: 'Delivery not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      status,
      ...(driverNotes && { driverNotes }),
    };

    // Set timestamps based on status
    if (status === 'picked_up') {
      updateData.actualPickup = new Date();
    } else if (status === 'delivered') {
      updateData.actualDropoff = new Date();
    }

    // Update self-delivery
    const updatedDelivery = await prisma.selfDelivery.update({
      where: { id: selfDeliveryId },
      data: updateData,
    });

    // Update order delivery status
    const orderStatus = status === 'picked_up' ? 'picking_up' : status;
    await prisma.order.update({
      where: { id: selfDelivery.orderId },
      data: {
        deliveryStatus: orderStatus,
      },
    });

    // Save driver location if provided
    if (location && selfDelivery.driverId) {
      await prisma.driverLocation.create({
        data: {
          driverId: selfDelivery.driverId,
          lat: location.lat,
          lng: location.lng,
          accuracy: location.accuracy,
          heading: location.heading,
          speed: location.speed,
        },
      });
    }

    // Log the status update
    await prisma.integrationLog.create({
      data: {
        tenantId: tenant.id,
        source: 'self_delivery',
        message: `Delivery status updated to ${status}`,
        payload: {
          selfDeliveryId,
          orderId: selfDelivery.orderId,
          previousStatus: selfDelivery.status,
          newStatus: status,
          driverName: selfDelivery.driver?.name,
          location,
        },
      },
    });

    return NextResponse.json({
      success: true,
      delivery: updatedDelivery,
      message: `Delivery status updated to ${status}`,
    });
  } catch (error: unknown) {
    console.error('[Self-Delivery Status] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update status';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// GET: Get delivery status and tracking info
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const selfDelivery = await prisma.selfDelivery.findUnique({
      where: { orderId },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            vehicleType: true,
          },
        },
      },
    });

    if (!selfDelivery) {
      return NextResponse.json(
        { error: 'Delivery not found' },
        { status: 404 }
      );
    }

    // Get latest driver location if assigned
    let driverLocation = null;
    if (selfDelivery.driverId) {
      driverLocation = await prisma.driverLocation.findFirst({
        where: { driverId: selfDelivery.driverId },
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json({
      delivery: {
        id: selfDelivery.id,
        status: selfDelivery.status,
        estimatedPickup: selfDelivery.estimatedPickup,
        actualPickup: selfDelivery.actualPickup,
        estimatedDropoff: selfDelivery.estimatedDropoff,
        actualDropoff: selfDelivery.actualDropoff,
        deliveryFee: selfDelivery.deliveryFee,
      },
      driver: selfDelivery.driver,
      location: driverLocation
        ? {
            lat: driverLocation.lat,
            lng: driverLocation.lng,
            updatedAt: driverLocation.createdAt,
          }
        : null,
    });
  } catch (error: unknown) {
    console.error('[Self-Delivery Status GET] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get delivery status';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
