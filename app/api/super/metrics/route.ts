import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth/options';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'super_admin') return unauthorized();

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [totalOrders, tenants, sevenDayStats, allTimeStats, latestOrders] = await Promise.all([
    prisma.order.count(),
    prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
    }),
    prisma.order.groupBy({
      by: ['tenantId'],
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      _count: { _all: true },
      _sum: { totalAmount: true },
    }),
    prisma.order.groupBy({
      by: ['tenantId'],
      _sum: { totalAmount: true },
    }),
    prisma.order.findMany({
      select: {
        tenantId: true,
        createdAt: true,
        totalAmount: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
  ]);

  const tenantLookup = new Map(tenants.map((tenant) => [tenant.id, tenant]));

  const sevenDayVolume = sevenDayStats.map((stat) => ({
    tenantId: stat.tenantId,
    tenantName: tenantLookup.get(stat.tenantId)?.name ?? 'Unknown',
    tenantSlug: tenantLookup.get(stat.tenantId)?.slug ?? '',
    orders: ((stat as any)._count?._all) ?? 0,
    gross: Number(stat._sum.totalAmount ?? 0),
  }));

  const latestByTenant = new Map<string, { lastOrderAt: string; lastAmount: number }>();
  latestOrders.forEach((order) => {
    if (!latestByTenant.has(order.tenantId)) {
      latestByTenant.set(order.tenantId, {
        lastOrderAt: order.createdAt.toISOString(),
        lastAmount: Number(order.totalAmount ?? 0),
      });
    }
  });

  const estimatedStripeVolume = allTimeStats.reduce(
    (sum, stat) => sum + Number(stat._sum.totalAmount ?? 0),
    0,
  );

  const allTimeVolume = allTimeStats.map((stat) => ({
    tenantId: stat.tenantId,
    tenantName: tenantLookup.get(stat.tenantId)?.name ?? 'Unknown',
    tenantSlug: tenantLookup.get(stat.tenantId)?.slug ?? '',
    orders: ((stat as any)._count?._all) ?? 0,
    gross: Number(stat._sum.totalAmount ?? 0),
  }));

  const tenantActivity = tenants.map((tenant) => ({
    tenantId: tenant.id,
    tenantName: tenant.name,
    tenantSlug: tenant.slug,
    lastOrderAt: latestByTenant.get(tenant.id)?.lastOrderAt ?? null,
    lastOrderAmount: latestByTenant.get(tenant.id)?.lastAmount ?? null,
  }));

  return NextResponse.json({
    totalOrders,
    totalTenants: tenants.length,
    sevenDayVolume,
    allTimeVolume,
    tenantActivity,
    estimatedStripeVolume,
  });
}
