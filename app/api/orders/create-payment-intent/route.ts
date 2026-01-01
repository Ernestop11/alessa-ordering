import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover' as any, // Use latest compatible version
});

// Validate cart items exist in database before payment
async function validateCartItems(items: any[], tenantId: string) {
  const invalidItems: { name: string; reason: string }[] = [];
  const validItems: any[] = [];

  for (const item of items) {
    // Extract menuItemId - handle both formats (with and without timestamp suffix)
    const menuItemId = item.menuItemId || item.id?.replace(/-\d{13}$/, '');

    if (!menuItemId) {
      invalidItems.push({ name: item.name || 'Unknown item', reason: 'Missing item ID' });
      continue;
    }

    // Check item type to determine which table to query
    const itemType = item.itemType || 'food';

    if (itemType === 'grocery' || itemType === 'bakery') {
      // Validate against GroceryItem table
      const groceryItem = await prisma.groceryItem.findUnique({
        where: { id: menuItemId },
        select: { tenantId: true, name: true, available: true },
      });

      if (!groceryItem) {
        invalidItems.push({ name: item.name || menuItemId, reason: 'Item not found' });
      } else if (groceryItem.tenantId !== tenantId) {
        invalidItems.push({ name: item.name || menuItemId, reason: 'Item belongs to different store' });
      } else if (!groceryItem.available) {
        invalidItems.push({ name: groceryItem.name, reason: 'Item is no longer available' });
      } else {
        validItems.push(item);
      }
    } else {
      // Validate against MenuItem table (default for food)
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: menuItemId },
        select: { tenantId: true, name: true, available: true },
      });

      if (!menuItem) {
        invalidItems.push({ name: item.name || menuItemId, reason: 'Item not found' });
      } else if (menuItem.tenantId !== tenantId) {
        invalidItems.push({ name: item.name || menuItemId, reason: 'Item belongs to different store' });
      } else if (!menuItem.available) {
        invalidItems.push({ name: menuItem.name, reason: 'Item is no longer available' });
      } else {
        validItems.push(item);
      }
    }
  }

  return { validItems, invalidItems };
}

export async function POST(req: NextRequest) {
  try {
    const tenant = await requireTenant();
    const body = await req.json();
    const {
      items,
      customer,
      orderType,
      total,
      saveCard = false,
      paymentMethodId = null // For paying with saved card
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
    }

    // PRE-PAYMENT VALIDATION: Ensure all items exist in the database BEFORE charging customer
    // This prevents the scenario where payment succeeds but order creation fails
    const itemValidation = await validateCartItems(items, tenant.id);
    if (itemValidation.invalidItems.length > 0) {
      console.error('[create-payment-intent] Invalid items detected before payment:', {
        tenantId: tenant.id,
        invalidItems: itemValidation.invalidItems,
        totalItems: items.length,
      });
      return NextResponse.json({
        error: 'Some items in your cart are no longer available',
        invalidItems: itemValidation.invalidItems,
        message: 'Please remove unavailable items and try again',
      }, { status: 400 });
    }

    if (!customer.name || !customer.email || !customer.phone) {
      return NextResponse.json({ error: 'Missing customer information' }, { status: 400 });
    }

    // Check if user is logged in and get their customer record
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('customer_session')?.value;
    let dbCustomer = null;
    let stripeCustomerId = null;

    if (sessionToken) {
      const session = await prisma.customerSession.findFirst({
        where: {
          token: sessionToken,
          tenantId: tenant.id,
          expiresAt: { gt: new Date() },
        },
        include: { customer: true },
      });

      if (session?.customer) {
        dbCustomer = session.customer;
        stripeCustomerId = dbCustomer.stripeCustomerId;
      }
    }

    // If no Stripe customer exists and user wants to save card OR is logged in, create one
    if (!stripeCustomerId && dbCustomer && (saveCard || paymentMethodId)) {
      const stripeCustomer = await stripe.customers.create({
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        metadata: {
          tenantId: tenant.id,
          tenantSlug: tenant.slug,
          customerId: dbCustomer.id,
        },
      });

      stripeCustomerId = stripeCustomer.id;

      // Save to database
      await prisma.customer.update({
        where: { id: dbCustomer.id },
        data: { stripeCustomerId },
      });
    }

    // Build payment intent options
    const paymentIntentOptions: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(total * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        orderType,
        items: JSON.stringify(items),
        customerId: dbCustomer?.id || '',
      },
      description: `${tenant.name} - ${orderType} order`,
    };

    // If logged in and has/wants saved payment methods
    if (stripeCustomerId) {
      paymentIntentOptions.customer = stripeCustomerId;

      // If user wants to save card for future use
      if (saveCard) {
        paymentIntentOptions.setup_future_usage = 'off_session';
      }
    }

    // If paying with a saved payment method (one-click pay)
    if (paymentMethodId && stripeCustomerId) {
      paymentIntentOptions.payment_method = paymentMethodId;
      paymentIntentOptions.confirm = true;
      paymentIntentOptions.off_session = true;
      // Use tenant's custom domain or subdomain for return URL - no hardcoded fallbacks
      const tenantDomain = tenant.customDomain
        ? `https://${tenant.customDomain}`
        : `https://${tenant.slug}.${process.env.ROOT_DOMAIN || 'alessacloud.com'}`;
      paymentIntentOptions.return_url = `${tenantDomain}/order-confirmation`;
    }

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentOptions);

    // If immediate payment was attempted with saved card
    if (paymentMethodId) {
      if (paymentIntent.status === 'succeeded') {
        return NextResponse.json({
          success: true,
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
        });
      } else if (paymentIntent.status === 'requires_action') {
        // Card requires 3D Secure or other authentication
        return NextResponse.json({
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          requiresAction: true,
          status: paymentIntent.status,
        });
      }
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);

    // Handle Stripe card errors specifically
    if (error instanceof Stripe.errors.StripeCardError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
