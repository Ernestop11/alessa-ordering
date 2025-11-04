import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

const RETURN_URL = process.env.STRIPE_ONBOARD_RETURN_URL || 'http://localhost:3000/admin?onboarding=success';
const REFRESH_URL = process.env.STRIPE_ONBOARD_REFRESH_URL || 'http://localhost:3000/admin?onboarding=refresh';

export async function POST() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenant = await requireTenant();
  let integration = await prisma.tenantIntegration.findUnique({
    where: { tenantId: tenant.id },
  });

  if (!integration) {
    integration = await prisma.tenantIntegration.create({
      data: { tenantId: tenant.id },
    });
  }

  let accountId = integration.stripeAccountId;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      business_profile: {
        name: tenant.name,
      },
      metadata: {
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
      },
    });

    accountId = account.id;
    await prisma.tenantIntegration.update({
      where: { tenantId: tenant.id },
      data: { stripeAccountId: accountId },
    });
  }

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: REFRESH_URL,
    return_url: RETURN_URL,
    type: 'account_onboarding',
  });

  return NextResponse.json({
    url: accountLink.url,
    accountId,
  });
}
