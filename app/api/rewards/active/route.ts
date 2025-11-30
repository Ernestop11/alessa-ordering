import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';
import { cookies } from 'next/headers';

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
      select: { rewards: true, membershipProgram: true },
    });

    const allRewards = (settings?.rewards as any[]) || [];
    const membershipProgram = settings?.membershipProgram as any;

    // Filter active rewards that customer is eligible for
    const eligibleRewards = allRewards.filter((reward: any) => {
      if (!reward.active) return false;

      // Check expiration
      if (reward.expirationDate && new Date(reward.expirationDate) < new Date()) {
        return false;
      }

      // Check max uses
      if (reward.maxUses && (reward.usesCount || 0) >= reward.maxUses) {
        return false;
      }

      // If customer is logged in, check tier restrictions
      if (customer) {
        const customerTier = customer.membershipTier;
        const customerPoints = customer.loyaltyPoints || 0;

        // Check tier restriction
        if (reward.tierId) {
          const tiers = Array.isArray(membershipProgram?.tiers) ? membershipProgram.tiers : [];
          const rewardTier = tiers.find((t: any) => t.id === reward.tierId);
          if (rewardTier && customerTier !== rewardTier.name) {
            return false;
          }
        }

        // Check points cost
        if (reward.pointsCost && customerPoints < reward.pointsCost) {
          return false;
        }
      } else {
        // Guest users can only see free rewards with no tier restrictions
        if (reward.pointsCost && reward.pointsCost > 0) return false;
        if (reward.tierId) return false;
      }

      return true;
    });

    const response = NextResponse.json({ rewards: eligibleRewards });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
  } catch (err) {
    console.error('[rewards-active] GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch active rewards' }, { status: 500 });
  }
}

