import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/stripe/dashboard?tenant=lasreinas
 *
 * Redirects to Stripe Dashboard for the tenant's Connect account.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantSlug = searchParams.get('tenant');

    if (!tenantSlug) {
      return NextResponse.json({ error: 'tenant parameter is required' }, { status: 400 });
    }

    // Load tenant from DB
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      include: {
        integrations: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const accountId = tenant.integrations?.stripeAccountId;

    if (!accountId) {
      return NextResponse.json({ error: 'No Stripe account found for tenant' }, { status: 400 });
    }

    // Redirect to https://dashboard.stripe.com/connect/accounts/<tenant.stripeAccountId>
    return NextResponse.redirect(`https://dashboard.stripe.com/connect/accounts/${accountId}`);
  } catch (error: any) {
    console.error('[stripe-dashboard] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to redirect to dashboard' },
      { status: 500 }
    );
  }
}

