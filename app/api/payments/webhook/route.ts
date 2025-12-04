import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripeClient } from '../../../../lib/stripe';
import prisma from '../../../../lib/prisma';
import { createOrderFromPayload, type OrderPayload } from '../../../../lib/order-service';
import { createSubscriptionCommission } from '../../../../lib/mlm/commission-automation';
import { createPlatformFeeCommission } from '../../../../lib/mlm/product-commissions';

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

        // Create platform fee commission for MLM associates
        if (order.platformFee && order.platformFee > 0) {
          try {
            await createPlatformFeeCommission(
              session.tenant.id,
              order.platformFee,
              order.id,
              `Platform fee commission for order ${order.id}`
            );
          } catch (error) {
            console.error('[mlm] Error creating platform fee commission:', error);
            // Don't fail webhook if commission creation fails
          }
        }

        // Send email notification to admin
        if (session.tenant.contactEmail) {
          try {
            const { sendOrderNotificationEmail } = await import('@/lib/email-service');
            
            // Fetch order items with menu item details for email
            const orderItems = await prisma.orderItem.findMany({
              where: { orderId: order.id },
              include: {
                menuItem: {
                  select: {
                    name: true,
                  },
                },
              },
            });

            const itemsForEmail = orderItems.map((item) => ({
              name: item.menuItem?.name || 'Item',
              quantity: item.quantity,
              price: item.price,
            }));

            const fulfillmentUrl = `${process.env.NEXTAUTH_URL || 'https://lasreinas.alessacloud.com'}/admin/fulfillment`;

            await sendOrderNotificationEmail({
              to: session.tenant.contactEmail,
              orderId: order.id,
              customerName: order.customerName || null,
              totalAmount: order.totalAmount,
              items: itemsForEmail,
              tenantName: session.tenant.name,
              fulfillmentUrl,
            });

            console.log('[email] Order notification email sent', { orderId: order.id, to: session.tenant.contactEmail });
          } catch (emailError) {
            console.error('[email] Failed to send order notification email:', emailError);
            // Don't fail the webhook if email fails
          }
        } else {
          console.warn('[email] Tenant contact email not set, skipping order notification', { tenantId: session.tenant.id });
        }
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
  }

  // Handle subscription invoice payments for MLM commissions
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object as Stripe.Invoice;
    console.log('✅ invoice.payment_succeeded received', invoice.id);

    // Check if this is a subscription invoice
    if ((invoice as any).subscription && invoice.customer) {
      try {
        // Find tenant by Stripe customer ID or account ID
        const tenant = await prisma.tenant.findFirst({
          where: {
            OR: [
              { integrations: { stripeAccountId: invoice.customer as string } },
              // If using Stripe Customer objects, you'd need to store customer ID
            ],
          },
          include: {
            integrations: true,
          },
        });

        if (tenant && invoice.amount_paid) {
          const subscriptionAmount = invoice.amount_paid / 100; // Convert from cents
          
          // Create commission for associate referral
          await createSubscriptionCommission(
            tenant.id,
            subscriptionAmount,
            `Monthly subscription commission for ${tenant.name}`
          );

          console.log('[mlm] Commission created for subscription payment', {
            tenantId: tenant.id,
            tenantName: tenant.name,
            amount: subscriptionAmount,
          });
        }
      } catch (error) {
        console.error('[mlm] Error creating subscription commission:', error);
        // Don't fail webhook if commission creation fails
      }
    }
  }

  if (!['payment_intent.succeeded', 'payment_intent.payment_failed', 'invoice.payment_succeeded'].includes(event.type)) {
    console.log('[stripe] Unhandled webhook event', event.type);
  }

  return NextResponse.json({ received: true });
}
