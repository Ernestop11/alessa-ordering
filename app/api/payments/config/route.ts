import { NextResponse } from 'next/server';
import { requireTenant } from '@/lib/tenant';

/**
 * GET /api/payments/config
 * Returns Stripe configuration for the current tenant
 */
export async function GET() {
  try {
    const tenant = await requireTenant();

    console.log('[payments/config] Tenant:', tenant.slug, {
      hasIntegrations: !!tenant.integrations,
      stripeAccountId: tenant.integrations?.stripeAccountId,
      chargesEnabled: tenant.integrations?.stripeChargesEnabled,
    });

    // Check if tenant has Stripe Connect configured
    const stripeAccount = tenant.integrations?.stripeAccountId;
    const chargesEnabled = tenant.integrations?.stripeChargesEnabled;

    // Only return account ID if fully onboarded
    if (stripeAccount && chargesEnabled) {
      return NextResponse.json({
        stripeAccount,
        mode: 'connect',
      });
    }

    // Fallback to platform account
    return NextResponse.json({
      stripeAccount: null,
      mode: 'platform',
    });
  } catch (error: any) {
    console.error('[payments/config] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get payment config' },
      { status: 500 }
    );
  }
}
