import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';
import { createOrderFromPayload, type OrderPayload } from '@/lib/order-service';
import { getStripeClient } from '@/lib/stripe';

/**
 * POST /api/payments/confirm
 *
 * Called by the client after a payment succeeds (Apple Pay, Google Pay, etc.)
 * This creates the order from the PaymentSession.
 *
 * This is a fallback/complement to the Stripe webhook - ensures order is created
 * even if webhook doesn't fire (e.g., Stripe Connect webhook misconfiguration)
 */
export async function POST(req: Request) {
  try {
    const tenant = await requireTenant();
    const body = await req.json();

    const { paymentIntentId, paymentSessionId } = body;

    if (!paymentIntentId && !paymentSessionId) {
      return NextResponse.json(
        { error: 'paymentIntentId or paymentSessionId required' },
        { status: 400 }
      );
    }

    // Find the payment session
    const session = await prisma.paymentSession.findFirst({
      where: paymentIntentId
        ? { paymentIntentId, tenantId: tenant.id }
        : { id: paymentSessionId, tenantId: tenant.id },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Payment session not found' },
        { status: 404 }
      );
    }

    // If already completed, return the existing order
    if (session.status === 'completed') {
      const existingOrder = await prisma.order.findFirst({
        where: { paymentIntentId: session.paymentIntentId },
      });

      if (existingOrder) {
        console.log('[confirm] Order already exists:', existingOrder.id);
        return NextResponse.json({
          success: true,
          orderId: existingOrder.id,
          alreadyExists: true,
        });
      }
    }

    // Verify payment succeeded with Stripe
    let stripe;
    try {
      stripe = getStripeClient();
    } catch (err) {
      console.error('[confirm] Stripe client init failed', err);
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 500 }
      );
    }

    // Check if using Stripe Connect
    const accountId = tenant.integrations?.stripeAccountId;
    const isConnect = accountId && tenant.integrations?.stripeChargesEnabled;

    const paymentIntent = isConnect
      ? await stripe.paymentIntents.retrieve(session.paymentIntentId, {}, { stripeAccount: accountId })
      : await stripe.paymentIntents.retrieve(session.paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      console.log('[confirm] Payment not yet succeeded:', paymentIntent.status);
      return NextResponse.json(
        { error: `Payment status: ${paymentIntent.status}`, status: paymentIntent.status },
        { status: 400 }
      );
    }

    // Get full tenant info for order creation
    const fullTenant = await prisma.tenant.findUnique({
      where: { id: tenant.id },
      include: { settings: true, integrations: true },
    });

    if (!fullTenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Validate order payload
    const orderData = session.orderData as any;
    if (!orderData || !orderData.items || !Array.isArray(orderData.items)) {
      console.error('[confirm] Invalid order data in session:', session.id);
      return NextResponse.json(
        { error: 'Invalid order data' },
        { status: 400 }
      );
    }

    // Create the order
    try {
      const order = await createOrderFromPayload({
        tenant: fullTenant,
        payload: orderData as OrderPayload,
        paymentIntentId: session.paymentIntentId,
      });

      // Mark session as completed
      await prisma.paymentSession.update({
        where: { id: session.id },
        data: { status: 'completed' },
      });

      console.log('[confirm] Order created:', order.id);

      await prisma.integrationLog.create({
        data: {
          tenantId: tenant.id,
          source: 'payments-confirm',
          message: 'Order created via client confirmation',
          payload: {
            paymentIntentId: session.paymentIntentId,
            orderId: order.id,
          },
        },
      });

      return NextResponse.json({
        success: true,
        orderId: order.id,
      });
    } catch (orderError: any) {
      console.error('[confirm] Order creation failed:', orderError);

      // Check if order already exists (race condition with webhook)
      const existingOrder = await prisma.order.findFirst({
        where: { paymentIntentId: session.paymentIntentId },
      });

      if (existingOrder) {
        await prisma.paymentSession.update({
          where: { id: session.id },
          data: { status: 'completed' },
        });

        return NextResponse.json({
          success: true,
          orderId: existingOrder.id,
          alreadyExists: true,
        });
      }

      return NextResponse.json(
        { error: orderError.message || 'Failed to create order' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[confirm] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
