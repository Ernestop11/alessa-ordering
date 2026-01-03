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
 * GET /api/stripe/onboard?tenant=lasreinas
 *
 * Creates or retrieves a Stripe Connect Express account for the tenant
 * and generates an onboarding link.
 */
export const dynamic = 'force-dynamic';

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

    const stripe = getStripeClient();

    // Build base URL from tenant's configured domain or ROOT_DOMAIN
    const ROOT_DOMAIN = process.env.ROOT_DOMAIN || 'alessacloud.com';
    const host = request.headers.get('host') || '';
    const isLocalhost = host.includes('localhost');

    // Priority: tenant.customDomain > tenant.domain > subdomain of ROOT_DOMAIN
    let baseUrl: string;
    if (isLocalhost) {
      baseUrl = `http://${host}`;
    } else if (tenant.customDomain) {
      baseUrl = `https://${tenant.customDomain}`;
    } else if (tenant.domain) {
      baseUrl = `https://${tenant.domain}`;
    } else {
      baseUrl = `https://${tenant.slug}.${ROOT_DOMAIN}`;
    }

    let accountId = tenant.integrations?.stripeAccountId;

    // If tenant.stripeAccountId is null, create Stripe Express account
    if (!accountId) {
      console.log(`[stripe-onboard] Creating new account for tenant: ${tenantSlug}`);

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
          url: tenant.domain ? `https://${tenant.domain}` : undefined,
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

      // Save acct_xxx to tenant
      await prisma.tenantIntegration.upsert({
        where: { tenantId: tenant.id },
        create: {
          tenantId: tenant.id,
          stripeAccountId: accountId,
        },
        update: {
          stripeAccountId: accountId,
        },
      });

      console.log(`[stripe-onboard] Created account ${accountId} for tenant ${tenantSlug}`);
    }

    // Create onboarding link via stripe.accountLinks.create
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${baseUrl}/api/stripe/callback?tenant=${tenantSlug}&refresh=true`,
      return_url: `${baseUrl}/api/stripe/callback?tenant=${tenantSlug}`,
      type: 'account_onboarding',
    });

    // Redirect to onboarding_url
    return NextResponse.redirect(accountLink.url);
  } catch (error: any) {
    console.error('[stripe-onboard] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create onboarding link' },
      { status: 500 }
    );
  }
}
