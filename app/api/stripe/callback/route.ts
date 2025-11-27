import { NextResponse } from 'next/server';
import Stripe from 'stripe';

function getStripeClient() {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) {
    throw new Error('STRIPE_SECRET_KEY is not set.');
  }
  return new Stripe(stripeSecret, {
    apiVersion: '2024-10-28.acacia' as any,
  });
}
import prisma from '@/lib/prisma';

/**
 * GET /api/stripe/callback?tenant=lasreinas
 *
 * Handles Stripe Connect onboarding callback.
 * Updates tenant.stripeOnboardingComplete if charges_enabled or payouts_enabled.
 * Redirects to /admin/payments?tenant=lasreinas
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantSlug = searchParams.get('tenant');
    const isRefresh = searchParams.get('refresh') === 'true';

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

    const stripe = getStripeClient();

    // Retrieve Stripe account
    const account = await stripe.accounts.retrieve(accountId);

    // If charges_enabled or payouts_enabled, onboarding is complete
    const onboardingComplete = account.charges_enabled || account.payouts_enabled;

    // Update tenant integration - store Stripe status in paymentConfig JSON field
    // Schema only has stripeAccountId, so we store status in paymentConfig
    const currentPaymentConfig = tenant.integrations?.paymentConfig as Record<string, any> || {};
    await prisma.tenantIntegration.upsert({
      where: { tenantId: tenant.id },
      create: {
        tenantId: tenant.id,
        stripeAccountId: accountId,
        paymentConfig: {
          ...currentPaymentConfig,
          stripeChargesEnabled: account.charges_enabled,
          stripePayoutsEnabled: account.payouts_enabled,
          stripeDetailsSubmitted: account.details_submitted,
          stripeOnboardingComplete: onboardingComplete,
        },
      },
      update: {
        stripeAccountId: accountId,
        paymentConfig: {
          ...currentPaymentConfig,
          stripeChargesEnabled: account.charges_enabled,
          stripePayoutsEnabled: account.payouts_enabled,
          stripeDetailsSubmitted: account.details_submitted,
          stripeOnboardingComplete: onboardingComplete,
        },
      },
    });

    const origin = request.headers.get('origin') || request.headers.get('host') || 'lasreinas.alessacloud.com';
    const protocol = origin.includes('localhost') ? 'http' : 'https';
    const baseUrl = origin.includes('localhost') ? origin : `https://${origin.split('://')[1] || origin}`;

    // Redirect to /admin/payments?tenant=lasreinas
    return NextResponse.redirect(`${baseUrl}/admin/payments?tenant=${tenantSlug}`);
  } catch (error: any) {
    console.error('[stripe-callback] Error:', error);
    const tenantSlug = new URL(request.url).searchParams.get('tenant') || 'lasreinas';
    const origin = request.headers.get('origin') || request.headers.get('host') || 'lasreinas.alessacloud.com';
    const baseUrl = origin.includes('localhost') ? origin : `https://${origin.split('://')[1] || origin}`;
    
    // Redirect to admin even on error
    return NextResponse.redirect(`${baseUrl}/admin/payments?tenant=${tenantSlug}&error=${encodeURIComponent(error.message || 'Unknown error')}`);
  }
}

