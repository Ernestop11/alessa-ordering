import { NextRequest, NextResponse } from 'next/server';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';

/**
 * Self-Delivery API - Create Delivery
 *
 * Creates a self-delivery record when a customer chooses restaurant delivery
 */

interface CreateSelfDeliveryRequest {
  orderId: string;
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
  customerName: string;
  customerPhone: string;
  deliveryNotes?: string;
  deliveryFee?: number;
}

export async function POST(req: NextRequest) {
  try {
    const tenant = await requireTenant();
    const body = (await req.json()) as CreateSelfDeliveryRequest;

    const {
      orderId,
      pickupAddress,
      dropoffAddress,
      customerName,
      customerPhone,
      deliveryNotes,
      deliveryFee,
    } = body;

    if (!orderId || !pickupAddress || !dropoffAddress || !customerName || !customerPhone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify order exists and belongs to tenant
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        tenantId: tenant.id,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Get configured self-delivery fee
    const fee = deliveryFee ?? tenant.integrations?.deliveryBaseFee ?? 4.99;

    // Create self-delivery record
    const selfDelivery = await prisma.selfDelivery.create({
      data: {
        orderId,
        tenantId: tenant.id,
        pickupAddress,
        dropoffAddress,
        customerName,
        customerPhone,
        deliveryNotes,
        deliveryFee: fee,
        status: 'pending',
        estimatedPickup: new Date(Date.now() + 15 * 60 * 1000), // 15 min from now
        estimatedDropoff: new Date(Date.now() + 45 * 60 * 1000), // 45 min from now
      },
    });

    // Update order with delivery info
    await prisma.order.update({
      where: { id: orderId },
      data: {
        deliveryPartner: 'self',
        deliveryStatus: 'pending',
        deliveryFee: fee,
        deliveryAddress: dropoffAddress,
        deliveryInstructions: deliveryNotes,
      },
    });

    // Log the delivery creation
    await prisma.integrationLog.create({
      data: {
        tenantId: tenant.id,
        source: 'self_delivery',
        message: 'Self-delivery created',
        payload: {
          orderId,
          selfDeliveryId: selfDelivery.id,
          status: 'pending',
          fee,
        },
      },
    });

    return NextResponse.json({
      success: true,
      deliveryId: selfDelivery.id,
      orderId,
      status: 'pending',
      deliveryFee: fee,
      estimatedPickup: selfDelivery.estimatedPickup,
      estimatedDropoff: selfDelivery.estimatedDropoff,
      message: 'Delivery created - waiting for driver assignment',
    });
  } catch (error: unknown) {
    console.error('[Self-Delivery Create] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create delivery';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
