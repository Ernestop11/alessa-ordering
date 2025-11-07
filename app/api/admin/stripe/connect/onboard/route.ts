import { NextResponse } from 'next/server';
import { requireTenant } from '@/lib/tenant';
import { getStripeClient } from '@/lib/stripe';
import prisma from '@/lib/prisma';

/**
 * POST /api/admin/stripe/connect/onboard
 *
 * Creates or retrieves a Stripe Connect Express account for the current tenant
 * and generates an onboarding link for the restaurant owner to complete setup.
 */
export async function POST(req: Request) {
  try {
    const tenant = await requireTenant();
    const stripe = getStripeClient();

    const body = await req.json();
    const { redirectUrl } = body;

    if (!redirectUrl) {
      return NextResponse.json({ error: 'redirectUrl is required' }, { status: 400 });
    }

    let accountId = tenant.integrations?.stripeAccountId;

    // If no account exists, create a new Stripe Connect Express account
    if (!accountId) {
      console.log(`[stripe-connect] Creating new account for tenant: ${tenant.slug}`);

      const account = await stripe.accounts.create({
        type: 'express',
        country: tenant.country || 'US',
        email: tenant.contactEmail || undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'company',
        business_profile: {
          name: tenant.name,
          url: redirectUrl.includes('localhost')
            ? undefined
            : `${redirectUrl}/order?tenant=${tenant.slug}`,
          mcc: '5812', // Merchant Category Code for restaurants
          product_description: `Online ordering for ${tenant.name}`,
        },
        metadata: {
          tenantId: tenant.id,
          tenantSlug: tenant.slug,
          platform: 'alessa-ordering',
        },
      });

      accountId = account.id;

      // Save the account ID to the database
      await prisma.tenantIntegration.upsert({
        where: { tenantId: tenant.id },
        create: {
          tenantId: tenant.id,
          stripeAccountId: accountId,
          stripeOnboardingComplete: false,
          stripeChargesEnabled: false,
          stripePayoutsEnabled: false,
          stripeDetailsSubmitted: false,
        },
        update: {
          stripeAccountId: accountId,
        },
      });

      console.log(`[stripe-connect] Created account ${accountId} for tenant ${tenant.slug}`);
    }

    // Generate the onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${redirectUrl}/admin/stripe-connect/refresh`,
      return_url: `${redirectUrl}/admin/stripe-connect/complete`,
      type: 'account_onboarding',
    });

    await prisma.integrationLog.create({
      data: {
        tenantId: tenant.id,
        source: 'stripe-connect',
        level: 'info',
        message: 'Stripe Connect onboarding initiated',
        payload: {
          accountId,
          onboardingUrl: accountLink.url,
        },
      },
    });

    return NextResponse.json({
      url: accountLink.url,
      accountId,
    });
  } catch (error: any) {
    console.error('[stripe-connect] Onboarding error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create onboarding link' },
      { status: 500 }
    );
  }
}
