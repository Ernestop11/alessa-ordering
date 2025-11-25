import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';
import { getStripeClient } from '@/lib/stripe';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tenant = await requireTenant();
    const resolvedParams = await Promise.resolve(params);
    const order = await prisma.order.findUnique({
      where: { id: resolvedParams.id },
      include: {
        tenant: {
          include: {
            integrations: true,
          },
        },
      },
    });

    if (!order || order.tenantId !== tenant.id) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!order.paymentIntentId) {
      return NextResponse.json(
        { error: 'Order does not have a payment intent' },
        { status: 400 }
      );
    }

    const stripeAccountId = tenant.integrations?.stripeAccountId;
    if (!stripeAccountId) {
      return NextResponse.json(
        { error: 'Stripe account not connected' },
        { status: 400 }
      );
    }

    const stripe = getStripeClient();

    // Create refund
    const refund = await stripe.refunds.create(
      {
        payment_intent: order.paymentIntentId,
        amount: Math.round(order.totalAmount * 100), // Convert to cents
      },
      {
        stripeAccount: stripeAccountId,
      }
    );

    // Update order status
    await prisma.order.update({
      where: { id: resolvedParams.id },
      data: { status: 'cancelled' },
    });

    // Log the refund
    await prisma.integrationLog.create({
      data: {
        tenantId: tenant.id,
        source: 'stripe',
        level: 'info',
        message: 'Order refunded',
        payload: {
          orderId: order.id,
          refundId: refund.id,
          amount: order.totalAmount,
        },
      },
    });

    return NextResponse.json({
      success: true,
      refundId: refund.id,
      amount: order.totalAmount,
    });
  } catch (error: any) {
    console.error('[refund] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process refund' },
      { status: 500 }
    );
  }
}

