import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantByRequest } from '@/lib/tenant';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover' as any,
});

export async function POST(request: NextRequest) {
  try {
    const tenant = await getTenantByRequest(request);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const body = await request.json();
    const { sessionCode } = body;

    if (!sessionCode) {
      return NextResponse.json(
        { error: 'Session code is required' },
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

    if (!groupOrder.isSponsoredOrder) {
      return NextResponse.json(
        { error: 'This group order is not sponsored' },
        { status: 400 }
      );
    }

    if (groupOrder.sponsorPaidAt) {
      return NextResponse.json(
        { error: 'This group order has already been paid' },
        { status: 400 }
      );
    }

    if (groupOrder.orders.length === 0) {
      return NextResponse.json(
        { error: 'No orders to pay for' },
        { status: 400 }
      );
    }

    // Calculate total amount
    const totalAmount = groupOrder.totalAmount;

    if (totalAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid order total' },
        { status: 400 }
      );
    }

    // Get the connected Stripe account if available
    const stripeAccountId = tenant.integrations?.stripeAccountId;
    const isConnectAccount = stripeAccountId && tenant.integrations?.stripeChargesEnabled;

    // Create payment intent
    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(totalAmount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        type: 'group_order_sponsor',
        groupOrderId: groupOrder.id,
        sessionCode: groupOrder.sessionCode,
        tenantId: tenant.id,
        sponsorName: groupOrder.sponsorName || groupOrder.organizerName,
        orderCount: groupOrder.orders.length.toString(),
      },
    };

    // If connected account, use application fee
    if (isConnectAccount && stripeAccountId) {
      paymentIntentParams.application_fee_amount = Math.round(totalAmount * 0.03 * 100); // 3% platform fee
      paymentIntentParams.transfer_data = {
        destination: stripeAccountId,
      };
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      totalAmount,
    });
  } catch (error) {
    console.error('[Sponsor Checkout] Create payment intent error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}
