import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripeClient } from '../../../../lib/stripe';
import prisma from '../../../../lib/prisma';
import { createOrderFromPayload, type OrderPayload } from '../../../../lib/order-service';

function isOrderPayload(v: any): v is OrderPayload {
  if (!v || typeof v !== 'object') return false;
  if (!Array.isArray(v.items)) return false;
  if (typeof v.totalAmount !== 'number') return false;
  for (const it of v.items) {
    if (!it || typeof it !== 'object') return false;
    if (typeof it.menuItemId !== 'string') return false;
    if (typeof it.quantity !== 'number') return false;
    if (typeof it.price !== 'number') return false;
  }
  return true;
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  if (!webhookSecret) {
    console.warn('Missing STRIPE_WEBHOOK_SECRET; ignoring webhook call.');
    return NextResponse.json({ received: true });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
  }

  let stripe;
  try {
    stripe = getStripeClient();
  } catch (err) {
    console.error('[stripe] Client initialization failed', err);
    return NextResponse.json({ error: 'Stripe is not configured for this environment.' }, { status: 500 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('[stripe] Webhook signature verification failed', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    console.log('✅ payment_intent.succeeded received', paymentIntent.id);

    const orderId = paymentIntent.metadata?.orderId;
    if (orderId) {
      const updateResult = await prisma.order.updateMany({
        where: { id: orderId },
        data: {
          status: 'confirmed',
          paymentMethod: paymentIntent.payment_method_types?.[0] ?? 'card',
          paymentIntentId: paymentIntent.id,
        },
      });

      if (updateResult.count > 0) {
        console.log('✅ Order marked as paid', { orderId, paymentIntentId: paymentIntent.id });
      } else {
        console.warn('⚠️ Unable to find order to mark as paid', { orderId, paymentIntentId: paymentIntent.id });
      }
    } else {
      console.warn('⚠️ payment_intent.succeeded missing orderId metadata', paymentIntent.id);
    }

    const session = await prisma.$transaction(async (prisma) => {
      const session = await prisma.paymentSession.findFirst({
        where: { paymentIntentId: paymentIntent.id }
      });

      if (!session) return null;

      const tenant = await prisma.tenant.findUnique({
        where: { id: session.tenantId },
        include: { settings: true, integrations: true }
      });

      return { ...session, tenant };
    });

    if (session && session.status !== 'completed') {
      if (!session.tenant) {
        console.error('[stripe] Tenant not found for payment session', session.tenantId);
        return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
      }

      try {
        if (!isOrderPayload(session.orderData)) {
          console.error('[stripe] Invalid orderData payload on payment session', session.id);
          await prisma.paymentSession.update({ where: { id: session.id }, data: { status: 'error' } });
          return NextResponse.json({ error: 'Invalid order payload' }, { status: 400 });
        }

        const order = await createOrderFromPayload({
          tenant: session.tenant,
          payload: session.orderData,
          paymentIntentId: paymentIntent.id,
        });

        await prisma.paymentSession.update({
          where: { id: session.id },
          data: { status: 'completed' },
        });

        await prisma.integrationLog.create({
          data: {
            tenantId: session.tenant.id,
            source: 'stripe',
            message: 'Payment intent succeeded and order created',
            payload: {
              paymentIntentId: paymentIntent.id,
              orderId: order.id,
            },
          },
        });
      } catch (error) {
        console.error('[stripe] Failed to finalize order from webhook', error);
        await prisma.paymentSession.update({
          where: { id: session.id },
          data: { status: 'error' },
        });
        return NextResponse.json({ error: 'Failed to finalize order' }, { status: 500 });
      }
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    console.warn('⚠️ payment_intent.payment_failed received', paymentIntent.id);
    await prisma.paymentSession.updateMany({
      where: { paymentIntentId: paymentIntent.id },
      data: { status: 'failed' },
    });
    if (paymentIntent.metadata?.orderId) {
      await prisma.order.updateMany({
        where: { id: paymentIntent.metadata.orderId },
        data: {
          status: 'pending',
        },
      });
    }
  } else if (!['payment_intent.succeeded', 'payment_intent.payment_failed'].includes(event.type)) {
    console.log('[stripe] Unhandled webhook event', event.type);
  }

  return NextResponse.json({ received: true });
}
