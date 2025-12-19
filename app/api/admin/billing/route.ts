import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';
import { getStripeClient } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/billing
 * 
 * Fetch tenant's billing info from Stripe
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await requireTenant();

    if (!tenant.stripeCustomerId) {
      return NextResponse.json({
        subscriptions: [],
        invoices: [],
        paymentMethods: [],
      });
    }

    const stripe = getStripeClient();

    // Get subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: tenant.stripeCustomerId,
      limit: 100,
    });

    // Get invoices
    const invoices = await stripe.invoices.list({
      customer: tenant.stripeCustomerId,
      limit: 50,
    });

    // Get payment methods
    const paymentMethods = await stripe.paymentMethods.list({
      customer: tenant.stripeCustomerId,
    });

    return NextResponse.json({
      subscriptions: subscriptions.data.map((s) => ({
        id: s.id,
        status: s.status,
        currentPeriodEnd: s.current_period_end,
        items: s.items.data.map((item) => ({
          id: item.id,
          priceId: item.price.id,
          amount: item.price.unit_amount,
        })),
      })),
      invoices: invoices.data.map((i) => ({
        id: i.id,
        number: i.number,
        amount: i.amount_paid || i.amount_due,
        status: i.status,
        created: i.created,
        hosted_invoice_url: i.hosted_invoice_url,
        invoice_pdf: i.invoice_pdf,
      })),
      paymentMethods: paymentMethods.data.map((pm) => ({
        id: pm.id,
        type: pm.type,
        card: pm.card
          ? {
              brand: pm.card.brand,
              last4: pm.card.last4,
              expMonth: pm.card.exp_month,
              expYear: pm.card.exp_year,
            }
          : null,
      })),
    });
  } catch (error: any) {
    console.error('[billing] GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch billing info' },
      { status: 500 }
    );
  }
}

