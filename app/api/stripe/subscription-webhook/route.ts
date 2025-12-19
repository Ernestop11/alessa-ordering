import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripeClient } from '@/lib/stripe';
import prisma from '@/lib/prisma';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_SUBSCRIPTION || process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  if (!webhookSecret) {
    console.warn('[subscription-webhook] Missing STRIPE_WEBHOOK_SECRET_SUBSCRIPTION; ignoring webhook call.');
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
    console.error('[subscription-webhook] Stripe client initialization failed', err);
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('[subscription-webhook] Webhook signature verification failed', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log(`[subscription-webhook] Received event: ${event.type}`);

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`[subscription-webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[subscription-webhook] Error processing event:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const tenantId = subscription.metadata?.tenantId;
  if (!tenantId) {
    console.warn('[subscription-webhook] Subscription missing tenantId metadata', subscription.id);
    return;
  }

  // Update all tenant products linked to this subscription
  await prisma.tenantProduct.updateMany({
    where: {
      stripeSubscriptionId: subscription.id,
    },
    data: {
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      status: subscription.status === 'active' ? 'active' : subscription.status === 'past_due' ? 'past_due' : 'cancelled',
    },
  });

  // Update individual subscription items
  for (const item of subscription.items.data) {
    const tenantProduct = await prisma.tenantProduct.findFirst({
      where: {
        stripeSubscriptionItemId: item.id,
      },
    });

    if (tenantProduct) {
      await prisma.tenantProduct.update({
        where: { id: tenantProduct.id },
        data: {
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          status: subscription.status === 'active' ? 'active' : subscription.status === 'past_due' ? 'past_due' : 'cancelled',
        },
      });
    }
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await prisma.tenantProduct.updateMany({
    where: {
      stripeSubscriptionId: subscription.id,
    },
    data: {
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelReason: 'Subscription deleted in Stripe',
    },
  });
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
  if (!subscriptionId) return;

  // Update subscription status to active
  await prisma.tenantProduct.updateMany({
    where: {
      stripeSubscriptionId: subscriptionId,
      status: 'past_due',
    },
    data: {
      status: 'active',
    },
  });

  // Log successful payment
  const tenantProducts = await prisma.tenantProduct.findMany({
    where: {
      stripeSubscriptionId: subscriptionId,
    },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  for (const tp of tenantProducts) {
    await prisma.integrationLog.create({
      data: {
        tenantId: tp.tenantId,
        source: 'stripe_subscription',
        message: `Invoice payment succeeded: $${((invoice.amount_paid || 0) / 100).toFixed(2)}`,
        payload: {
          invoiceId: invoice.id,
          subscriptionId,
          amountPaid: invoice.amount_paid,
        },
      },
    });
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
  if (!subscriptionId) return;

  // Update subscription status to past_due
  await prisma.tenantProduct.updateMany({
    where: {
      stripeSubscriptionId: subscriptionId,
    },
    data: {
      status: 'past_due',
    },
  });

  // Log failed payment
  const tenantProducts = await prisma.tenantProduct.findMany({
    where: {
      stripeSubscriptionId: subscriptionId,
    },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  for (const tp of tenantProducts) {
    await prisma.integrationLog.create({
      data: {
        tenantId: tp.tenantId,
        source: 'stripe_subscription',
        level: 'error',
        message: `Invoice payment failed: $${((invoice.amount_due || 0) / 100).toFixed(2)}`,
        payload: {
          invoiceId: invoice.id,
          subscriptionId,
          amountDue: invoice.amount_due,
          attemptCount: invoice.attempt_count,
        },
      },
    });
  }
}

