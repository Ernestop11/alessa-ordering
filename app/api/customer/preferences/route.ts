import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';
import { getCustomerFromCookie } from '../../../../lib/auth/customer';

export async function GET() {
  const tenant = await requireTenant();
  const customer = await getCustomerFromCookie(tenant.id);

  if (!customer) {
    return NextResponse.json({ accessibility: null, loyaltyPoints: 0, membershipTier: null }, { status: 200 });
  }

  return NextResponse.json({
    accessibility: customer.accessibilityPreferences ?? null,
    loyaltyPoints: customer.loyaltyPoints ?? 0,
    membershipTier: customer.membershipTier ?? null,
  });
}

export async function PATCH(req: Request) {
  const tenant = await requireTenant();
  const customer = await getCustomerFromCookie(tenant.id);

  if (!customer) {
    return NextResponse.json({ error: 'No active customer session' }, { status: 401 });
  }

  const body = await req.json();
  const accessibility = body?.accessibility ?? null;

  await prisma.customer.update({
    where: { id: customer.id },
    data: {
      accessibilityPreferences: accessibility,
    },
  });

  return NextResponse.json({ ok: true });
}
