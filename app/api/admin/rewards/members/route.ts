import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tenant = await requireTenant();

    const customers = await prisma.customer.findMany({
      where: { tenantId: tenant.id },
      orderBy: { loyaltyPoints: 'desc' },
      include: {
        orders: {
          select: {
            id: true,
            totalAmount: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { orders: true },
        },
      },
    });

    const members = customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      loyaltyPoints: customer.loyaltyPoints ?? 0,
      membershipTier: customer.membershipTier,
      orderCount: customer._count.orders,
      totalSpent: customer.orders.reduce((sum, order) => sum + Number(order.totalAmount ?? 0), 0),
      lastOrderDate: customer.orders[0]?.createdAt.toISOString() || null,
      createdAt: customer.createdAt.toISOString(),
    }));

    const response = NextResponse.json(members);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
  } catch (err) {
    console.error('[rewards-members] GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}

