import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';
import { getStripeClient } from '@/lib/stripe';

// Refund reason codes for restaurant scenarios
export type RefundReason =
  | 'customer_request'
  | 'wrong_order'
  | 'missing_items'
  | 'quality_issue'
  | 'late_delivery'
  | 'order_cancelled'
  | 'duplicate_charge'
  | 'other';

interface RefundRequest {
  amount?: number; // If not provided, full refund
  reason: RefundReason;
  notes?: string;
  refundItems?: Array<{
    itemId: string;
    quantity: number;
    amount: number;
  }>;
}

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
    const body: RefundRequest = await request.json().catch(() => ({
      reason: 'customer_request' as RefundReason,
    }));

    const order = await prisma.order.findUnique({
      where: { id: resolvedParams.id },
      include: {
        tenant: {
          include: {
            integrations: true,
          },
        },
        items: true,
      },
    });

    if (!order || order.tenantId !== tenant.id) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Calculate refund amount
    let refundAmount = body.amount ?? order.totalAmount;

    // If specific items are being refunded, calculate from items
    if (body.refundItems && body.refundItems.length > 0) {
      refundAmount = body.refundItems.reduce((sum, item) => sum + item.amount, 0);
    }

    // Validate refund amount
    if (refundAmount <= 0) {
      return NextResponse.json(
        { error: 'Refund amount must be greater than 0' },
        { status: 400 }
      );
    }

    if (refundAmount > order.totalAmount) {
      return NextResponse.json(
        { error: 'Refund amount cannot exceed order total' },
        { status: 400 }
      );
    }

    const isFullRefund = refundAmount === order.totalAmount;
    const stripeAccountId = tenant.integrations?.stripeAccountId;

    // If there's a payment intent and Stripe is connected, process Stripe refund
    if (order.paymentIntentId && stripeAccountId) {
      const stripe = getStripeClient();

      // Create refund on Stripe
      const refund = await stripe.refunds.create(
        {
          payment_intent: order.paymentIntentId,
          amount: Math.round(refundAmount * 100), // Convert to cents
          reason: body.reason === 'duplicate_charge' ? 'duplicate' :
                  body.reason === 'customer_request' ? 'requested_by_customer' :
                  'requested_by_customer',
          metadata: {
            orderId: order.id,
            reason: body.reason,
            notes: body.notes || '',
            refundType: isFullRefund ? 'full' : 'partial',
          },
        },
        {
          stripeAccount: stripeAccountId,
        }
      );

      // Update order status only for full refunds
      if (isFullRefund) {
        await prisma.order.update({
          where: { id: resolvedParams.id },
          data: { status: 'cancelled' },
        });
      }

      // Log the refund
      await prisma.integrationLog.create({
        data: {
          tenantId: tenant.id,
          source: 'stripe',
          level: 'info',
          message: `Order ${isFullRefund ? 'fully' : 'partially'} refunded`,
          payload: {
            orderId: order.id,
            refundId: refund.id,
            refundAmount,
            totalAmount: order.totalAmount,
            reason: body.reason,
            notes: body.notes,
            refundItems: body.refundItems,
            isFullRefund,
          },
        },
      });

      return NextResponse.json({
        success: true,
        refundId: refund.id,
        refundAmount,
        totalAmount: order.totalAmount,
        isFullRefund,
        reason: body.reason,
        status: refund.status,
      });
    }

    // No Stripe payment - just log the refund (cash/comp)
    if (isFullRefund) {
      await prisma.order.update({
        where: { id: resolvedParams.id },
        data: { status: 'cancelled' },
      });
    }

    // Log the manual refund
    await prisma.integrationLog.create({
      data: {
        tenantId: tenant.id,
        source: 'manual',
        level: 'info',
        message: `Manual ${isFullRefund ? 'full' : 'partial'} refund recorded`,
        payload: {
          orderId: order.id,
          refundAmount,
          totalAmount: order.totalAmount,
          reason: body.reason,
          notes: body.notes,
          refundItems: body.refundItems,
          isFullRefund,
        },
      },
    });

    return NextResponse.json({
      success: true,
      refundId: `manual-${Date.now()}`,
      refundAmount,
      totalAmount: order.totalAmount,
      isFullRefund,
      reason: body.reason,
      status: 'succeeded',
      paymentMethod: 'manual',
    });
  } catch (error: any) {
    console.error('[refund] Error:', error);

    // Handle Stripe-specific errors
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: error.message || 'Invalid refund request' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to process refund' },
      { status: 500 }
    );
  }
}

// GET endpoint to check refund status/history for an order
export async function GET(
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
        items: true,
      },
    });

    if (!order || order.tenantId !== tenant.id) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Get refund history from integration logs
    const refundLogs = await prisma.integrationLog.findMany({
      where: {
        tenantId: tenant.id,
        message: { contains: 'refund' },
        payload: {
          path: ['orderId'],
          equals: order.id,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate total refunded
    const totalRefunded = refundLogs.reduce((sum, log) => {
      const payload = log.payload as { refundAmount?: number } | null;
      return sum + (payload?.refundAmount || 0);
    }, 0);

    return NextResponse.json({
      orderId: order.id,
      totalAmount: order.totalAmount,
      totalRefunded,
      remainingAmount: order.totalAmount - totalRefunded,
      canRefund: totalRefunded < order.totalAmount,
      refundHistory: refundLogs.map((log) => ({
        id: log.id,
        createdAt: log.createdAt,
        source: log.source,
        payload: log.payload,
      })),
    });
  } catch (error: any) {
    console.error('[refund GET] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch refund info' },
      { status: 500 }
    );
  }
}
