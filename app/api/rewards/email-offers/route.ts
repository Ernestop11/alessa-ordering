import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

async function getCustomerFromCookie(tenantId: string) {
  const token = cookies().get('customer_session')?.value;
  if (!token) return null;

  const session = await prisma.customerSession.findFirst({
    where: {
      tenantId,
      token,
      expiresAt: { gt: new Date() },
    },
    include: {
      customer: true,
    },
  });
  return session?.customer ?? null;
}

export async function GET() {
  try {
    const tenant = await requireTenant();
    const customer = await getCustomerFromCookie(tenant.id);

    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: tenant.id },
      select: { emailOffers: true, membershipProgram: true },
    });

    const allOffers = (settings?.emailOffers as any[]) || [];
    const membershipProgram = settings?.membershipProgram as any;

    // Filter offers that are relevant to this customer
    const relevantOffers = allOffers.filter((offer: any) => {
      // Only show sent offers
      if (!offer.sent) return false;

      // If customer is logged in, check targeting
      if (customer) {
        const customerTier = customer.membershipTier;

        // Check tier targeting
        if (offer.targetTier) {
          const tiers = Array.isArray(membershipProgram?.tiers) ? membershipProgram.tiers : [];
          const targetTier = tiers.find((t: any) => t.id === offer.targetTier);
          if (targetTier && customerTier !== targetTier.name) {
            return false;
          }
        }

        // Check segment targeting
        if (offer.targetSegment === 'inactive') {
          // Would need to check last order date - for now show to all
        } else if (offer.targetSegment === 'high_value') {
          // Would need to check spending - for now show to all
        }
      } else {
        // Guest users see offers targeted to "all"
        if (offer.targetSegment !== 'all' && offer.targetTier) {
          return false;
        }
      }

      return true;
    });

    const response = NextResponse.json({ offers: relevantOffers });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
  } catch (err) {
    console.error('[rewards-email-offers] GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch email offers' }, { status: 500 });
  }
}
