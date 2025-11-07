import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import { serializeOrder } from '@/lib/order-serializer';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'admin') return unauthorized();

  const tenant = await requireTenant();

  const orders = await prisma.order.findMany({
    where: { tenantId: tenant.id },
    include: {
      items: {
        include: {
          menuItem: {
            select: {
              name: true,
            },
          },
        },
      },
      customer: true,
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
          primaryColor: true,
          secondaryColor: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return NextResponse.json(orders.map(serializeOrder));
}
