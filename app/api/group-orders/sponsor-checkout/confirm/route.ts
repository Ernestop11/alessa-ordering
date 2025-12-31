import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantByRequest } from '@/lib/tenant';

export async function POST(request: NextRequest) {
  try {
    const tenant = await getTenantByRequest(request);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const body = await request.json();
    const { sessionCode, paymentIntentId } = body;

    if (!sessionCode || !paymentIntentId) {
      return NextResponse.json(
        { error: 'Session code and payment intent ID are required' },
        { status: 400 }
      );
    }

    // Find the group order
    const groupOrder = await prisma.groupOrder.findFirst({
      where: {
        sessionCode,
        tenantId: tenant.id,
      },
      include: {
        orders: true,
      },
    });

    if (!groupOrder) {
      return NextResponse.json(
        { error: 'Group order not found' },
        { status: 404 }
      );
    }

    if (groupOrder.sponsorPaidAt) {
      return NextResponse.json(
        { error: 'This group order has already been paid' },
        { status: 400 }
      );
    }

    // Update the group order as paid
    await prisma.groupOrder.update({
      where: { id: groupOrder.id },
      data: {
        sponsorPaidAt: new Date(),
        status: 'closed', // Close the group order after payment
        closedAt: new Date(),
      },
    });

    // Update all participant orders to 'pending' (ready for kitchen)
    await prisma.order.updateMany({
      where: {
        groupOrderId: groupOrder.id,
        status: 'pending_sponsor_payment',
      },
      data: {
        status: 'pending',
        paymentIntentId: paymentIntentId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Payment confirmed for all orders',
      orderCount: groupOrder.orders.length,
      totalAmount: groupOrder.totalAmount,
    });
  } catch (error) {
    console.error('[Sponsor Checkout] Confirm payment error:', error);
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    );
  }
}
