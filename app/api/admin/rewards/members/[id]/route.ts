import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tenant = await requireTenant();
    const body = await req.json();

    const customer = await prisma.customer.findFirst({
      where: {
        id: params.id,
        tenantId: tenant.id,
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (body.loyaltyPoints !== undefined) {
      updateData.loyaltyPoints = Number(body.loyaltyPoints);
    }
    if (body.membershipTier !== undefined) {
      updateData.membershipTier = body.membershipTier || null;
    }

    const updated = await prisma.customer.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      id: updated.id,
      loyaltyPoints: updated.loyaltyPoints,
      membershipTier: updated.membershipTier,
    });
  } catch (err) {
    console.error('[rewards-members] PATCH error:', err);
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}

