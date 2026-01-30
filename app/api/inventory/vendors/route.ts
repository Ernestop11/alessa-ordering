import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session || (role !== 'admin' && role !== 'super_admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await requireTenant();
    const status = request.nextUrl.searchParams.get('status');

    const where: any = { tenantId: tenant.id };
    if (status) where.status = status;

    const credits = await prisma.vendorCredit.findMany({
      where,
      include: {
        item: { select: { id: true, name: true, unit: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ credits });
  } catch (error: any) {
    console.error('[Vendor Credits GET]', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch credits' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session || (role !== 'admin' && role !== 'super_admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await requireTenant();
    const body = await request.json();

    const { vendorName, amount, reason, itemId, quantity } = body;

    if (!vendorName || !amount) {
      return NextResponse.json({ error: 'vendorName and amount are required' }, { status: 400 });
    }

    const credit = await prisma.vendorCredit.create({
      data: {
        tenantId: tenant.id,
        vendorName,
        amount,
        reason: reason || null,
        itemId: itemId || null,
        quantity: quantity || null,
      },
      include: {
        item: { select: { id: true, name: true, unit: true } },
      },
    });

    return NextResponse.json({ credit }, { status: 201 });
  } catch (error: any) {
    console.error('[Vendor Credits POST]', error);
    return NextResponse.json({ error: error.message || 'Failed to create credit' }, { status: 500 });
  }
}
