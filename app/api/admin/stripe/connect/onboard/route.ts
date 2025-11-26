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

    // Build company information from tenant data for pre-filling Stripe onboarding
    const companyInfo: any = {};
    if (tenant.name) companyInfo.name = tenant.name;
    if (tenant.contactPhone) companyInfo.phone = tenant.contactPhone;
    
    // Build address if we have enough information
    if (tenant.addressLine1 || tenant.city || tenant.state || tenant.postalCode) {
      companyInfo.address = {};
      if (tenant.addressLine1) companyInfo.address.line1 = tenant.addressLine1;
      if (tenant.addressLine2) companyInfo.address.line2 = tenant.addressLine2;
      if (tenant.city) companyInfo.address.city = tenant.city;
      if (tenant.state) companyInfo.address.state = tenant.state;
      if (tenant.postalCode) companyInfo.address.postal_code = tenant.postalCode;
      if (tenant.country) companyInfo.address.country = tenant.country;
    }

    // If no account exists, create a new Stripe Connect Express account
    if (!accountId) {
      console.log(`[stripe-connect] Creating new account for tenant: ${tenant.slug}`);

      const accountData: any = {
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
      };

      // Add company information if we have it (pre-fills onboarding form)
      if (Object.keys(companyInfo).length > 0) {
        accountData.company = companyInfo;
        console.log(`[stripe-connect] Pre-filling company info:`, {
          name: companyInfo.name,
          phone: companyInfo.phone ? 'provided' : 'missing',
          address: companyInfo.address ? 'provided' : 'missing',
        });
      }

      const account = await stripe.accounts.create(accountData);

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
    } else {
      // Account already exists - update it with current tenant information
      // This ensures the onboarding form shows real data even for existing accounts
      try {
        const updateData: any = {};
        
        if (Object.keys(companyInfo).length > 0) {
          updateData.company = companyInfo;
        }
        
        // Update business profile if needed
        if (tenant.name || tenant.contactEmail) {
          updateData.business_profile = {
            name: tenant.name,
            url: redirectUrl.includes('localhost')
              ? undefined
              : `${redirectUrl}/order?tenant=${tenant.slug}`,
            mcc: '5812',
            product_description: `Online ordering for ${tenant.name}`,
          };
        }

        if (Object.keys(updateData).length > 0) {
          await stripe.accounts.update(accountId, updateData);
          console.log(`[stripe-connect] Updated account ${accountId} with tenant information`);
        }
      } catch (updateError: any) {
        // Log but don't fail - some updates may not be allowed depending on account status
        console.warn(`[stripe-connect] Could not update account ${accountId}:`, updateError.message);
      }
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
