import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'admin') return unauthorized();

  const tenant = await requireTenant();

  const customers = await prisma.customer.findMany({
    where: { tenantId: tenant.id },
    orderBy: { updatedAt: 'desc' },
    include: {
      orders: {
        select: {
          id: true,
          totalAmount: true,
          createdAt: true,
          fulfillmentMethod: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      _count: { select: { orders: true } },
    },
  });

  const response = customers.map((customer) => ({
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt.toISOString(),
    orderCount: customer._count?.orders ?? customer.orders.length,
    lastOrder: customer.orders[0]
      ? {
          ...customer.orders[0],
          createdAt: customer.orders[0].createdAt.toISOString(),
        }
      : null,
    recentOrders: customer.orders.map((order) => ({
      ...order,
      totalAmount: Number(order.totalAmount ?? 0),
      createdAt: order.createdAt.toISOString(),
    })),
  }));

  return NextResponse.json(response);
}
