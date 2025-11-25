import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';

export async function GET() {
  try {
    const tenant = await requireTenant();
    const packages = await prisma.cateringPackage.findMany({
      where: {
        tenantId: tenant.id,
        available: true,
      },
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json(packages);
  } catch (err) {
    console.error('Failed to fetch catering packages', err);
    return NextResponse.json({ error: 'Failed to fetch catering packages' }, { status: 500 });
  }
}
