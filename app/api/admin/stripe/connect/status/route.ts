import { NextResponse } from 'next/server';
import { requireTenant } from '@/lib/tenant';
import { getStripeClient } from '@/lib/stripe';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/stripe/connect/status
 *
 * Checks the current status of the tenant's Stripe Connect account
 * and updates the database with the latest information.
 */
export async function GET() {
  try {
    const tenant = await requireTenant();
    const accountId = tenant.integrations?.stripeAccountId;

    if (!accountId) {
      return NextResponse.json({
        connected: false,
        accountId: null,
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
        onboardingComplete: false,
      });
    }

    const stripe = getStripeClient();

    // Fetch the account details from Stripe
    const account = await stripe.accounts.retrieve(accountId);

    // Update our database with the latest status
    await prisma.tenantIntegration.update({
      where: { tenantId: tenant.id },
      data: {
        stripeChargesEnabled: account.charges_enabled,
        stripePayoutsEnabled: account.payouts_enabled,
        stripeDetailsSubmitted: account.details_submitted,
        stripeOnboardingComplete: account.details_submitted && account.charges_enabled,
        stripeOnboardedAt:
          account.details_submitted && !tenant.integrations?.stripeOnboardedAt
            ? new Date()
            : tenant.integrations?.stripeOnboardedAt,
      },
    });

    return NextResponse.json({
      connected: true,
      accountId: account.id,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      onboardingComplete: account.details_submitted && account.charges_enabled,
      email: account.email || null,
      businessName: account.business_profile?.name || null,
      country: account.country || null,
    });
  } catch (error: any) {
    console.error('[stripe-connect] Status check error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check account status' },
      { status: 500 }
    );
  }
}
