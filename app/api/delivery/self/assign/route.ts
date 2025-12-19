import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';

/**
 * Self-Delivery API - Assign Driver
 *
 * Assigns a driver to a pending self-delivery
 */

interface AssignDriverRequest {
  selfDeliveryId: string;
  driverId: string;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;

    if (!session || (role !== 'admin' && role !== 'super_admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await requireTenant();
    const body = (await req.json()) as AssignDriverRequest;

    const { selfDeliveryId, driverId } = body;

    if (!selfDeliveryId || !driverId) {
      return NextResponse.json(
        { error: 'Self-delivery ID and driver ID are required' },
        { status: 400 }
      );
    }

    // Verify self-delivery exists and belongs to tenant
    const selfDelivery = await prisma.selfDelivery.findFirst({
      where: {
        id: selfDeliveryId,
        tenantId: tenant.id,
      },
    });

    if (!selfDelivery) {
      return NextResponse.json(
        { error: 'Delivery not found' },
        { status: 404 }
      );
    }

    // Verify driver exists and belongs to tenant
    const driver = await prisma.driver.findFirst({
      where: {
        id: driverId,
        tenantId: tenant.id,
        isActive: true,
      },
    });

    if (!driver) {
      return NextResponse.json(
        { error: 'Driver not found or inactive' },
        { status: 404 }
      );
    }

    // Assign driver to delivery
    const updatedDelivery = await prisma.selfDelivery.update({
      where: { id: selfDeliveryId },
      data: {
        driverId,
        status: 'assigned',
      },
      include: {
        driver: true,
        order: {
          select: {
            id: true,
            customerName: true,
            customerPhone: true,
            totalAmount: true,
          },
        },
      },
    });

    // Update order delivery status
    await prisma.order.update({
      where: { id: selfDelivery.orderId },
      data: {
        deliveryStatus: 'assigned',
      },
    });

    // Log the assignment
    await prisma.integrationLog.create({
      data: {
        tenantId: tenant.id,
        source: 'self_delivery',
        message: `Driver ${driver.name} assigned to delivery`,
        payload: {
          selfDeliveryId,
          orderId: selfDelivery.orderId,
          driverId,
          driverName: driver.name,
          driverPhone: driver.phone,
        },
      },
    });

    return NextResponse.json({
      success: true,
      delivery: updatedDelivery,
      message: `Driver ${driver.name} assigned to delivery`,
    });
  } catch (error: unknown) {
    console.error('[Self-Delivery Assign] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to assign driver';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
