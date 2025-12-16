import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth/options';
import { requireTenant, getTenantBySlug } from '@/lib/tenant';
import { serializeOrder } from '@/lib/order-serializer';

/**
 * GET /api/admin/fulfillment
 * Returns orders for the fulfillment dashboard.
 * Used for polling fallback when SSE stream is not available.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session || role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenantSlug = request.nextUrl.searchParams.get('tenant');
  const tenant = tenantSlug ? await getTenantBySlug(tenantSlug) : await requireTenant();

  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }

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

  const serializedOrders = orders.map((order) => serializeOrder(order, null));

  return NextResponse.json(serializedOrders, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
