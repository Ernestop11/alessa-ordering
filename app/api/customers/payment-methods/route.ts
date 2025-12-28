import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';
import { cookies } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover' as any,
});

// GET - List saved payment methods for logged-in customer
export async function GET(req: NextRequest) {
  try {
    const tenant = await requireTenant();
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('customer_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ paymentMethods: [] });
    }

    // Find the customer session
    const session = await prisma.customerSession.findFirst({
      where: {
        token: sessionToken,
        tenantId: tenant.id,
        expiresAt: { gt: new Date() },
      },
      include: { customer: true },
    });

    if (!session?.customer?.stripeCustomerId) {
      return NextResponse.json({ paymentMethods: [] });
    }

    // List payment methods from Stripe
    const paymentMethods = await stripe.paymentMethods.list({
      customer: session.customer.stripeCustomerId,
      type: 'card',
    });

    // Format for frontend
    const formattedMethods = paymentMethods.data.map((pm) => ({
      id: pm.id,
      brand: pm.card?.brand || 'unknown',
      last4: pm.card?.last4 || '****',
      expMonth: pm.card?.exp_month,
      expYear: pm.card?.exp_year,
      isDefault: pm.metadata?.default === 'true',
    }));

    return NextResponse.json({ paymentMethods: formattedMethods });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
      { status: 500 }
    );
  }
}

// DELETE - Remove a saved payment method
export async function DELETE(req: NextRequest) {
  try {
    const tenant = await requireTenant();
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('customer_session')?.value;
    const { paymentMethodId } = await req.json();

    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Find the customer session
    const session = await prisma.customerSession.findFirst({
      where: {
        token: sessionToken,
        tenantId: tenant.id,
        expiresAt: { gt: new Date() },
      },
      include: { customer: true },
    });

    if (!session?.customer?.stripeCustomerId) {
      return NextResponse.json({ error: 'No saved cards' }, { status: 400 });
    }

    // Verify the payment method belongs to this customer
    const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
    if (pm.customer !== session.customer.stripeCustomerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Detach the payment method
    await stripe.paymentMethods.detach(paymentMethodId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing payment method:', error);
    return NextResponse.json(
      { error: 'Failed to remove payment method' },
      { status: 500 }
    );
  }
}
