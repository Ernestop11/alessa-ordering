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

export async function POST(req: Request) {
  try {
    const tenant = await requireTenant();
    const customer = await getCustomerFromCookie(tenant.id);

    if (!customer) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    const body = await req.json();
    const { rewardId, pointsCost } = body;

    if (!rewardId) {
      return NextResponse.json({ error: 'Reward ID required' }, { status: 400 });
    }

    // Get reward details from settings
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: tenant.id },
      select: { rewards: true },
    });

    const rewards = (settings?.rewards as any[]) || [];
    const reward = rewards.find((r: any) => r.id === rewardId);

    if (!reward) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 });
    }

    if (!reward.active) {
      return NextResponse.json({ error: 'Reward is not active' }, { status: 400 });
    }

    // Check expiration
    if (reward.expirationDate && new Date(reward.expirationDate) < new Date()) {
      return NextResponse.json({ error: 'Reward has expired' }, { status: 400 });
    }

    // Check max uses
    if (reward.maxUses && (reward.usesCount || 0) >= reward.maxUses) {
      return NextResponse.json({ error: 'Reward has reached maximum uses' }, { status: 400 });
    }

    // Check points
    const currentPoints = customer.loyaltyPoints ?? 0;
    const requiredPoints = pointsCost || reward.pointsCost || 0;

    if (requiredPoints > 0 && currentPoints < requiredPoints) {
      return NextResponse.json(
        { error: `Insufficient points. You have ${currentPoints}, need ${requiredPoints}` },
        { status: 400 }
      );
    }

    // Deduct points if required
    if (requiredPoints > 0) {
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          loyaltyPoints: { decrement: requiredPoints },
        },
      });
    }

    // Increment reward uses count
    const updatedRewards = rewards.map((r: any) =>
      r.id === rewardId
        ? { ...r, usesCount: (r.usesCount || 0) + 1 }
        : r
    );

    await prisma.tenantSettings.update({
      where: { tenantId: tenant.id },
      data: { rewards: updatedRewards },
    });

    return NextResponse.json({
      success: true,
      reward,
      remainingPoints: requiredPoints > 0 ? currentPoints - requiredPoints : currentPoints,
    });
  } catch (err) {
    console.error('[rewards-redeem] Error:', err);
    return NextResponse.json({ error: 'Failed to redeem reward' }, { status: 500 });
  }
}

