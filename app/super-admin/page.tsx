import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/prisma';
import SuperAdminDashboard from '@/components/super/SuperAdminDashboard';

const ROOT_DOMAIN = process.env.ROOT_DOMAIN || 'localhost';

export default async function SuperAdminPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session || role !== 'super_admin') {
    redirect('/admin/login');
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [tenants, sevenDayStats, allTimeStats, latestOrders] = await Promise.all([
    prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        settings: true,
        integrations: true,
      },
    }),
    prisma.order.groupBy({
      by: ['tenantId'],
      where: { createdAt: { gte: sevenDaysAgo } },
      _count: { _all: true },
      _sum: { totalAmount: true },
    }),
    prisma.order.groupBy({
      by: ['tenantId'],
      _count: { _all: true },
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

  const sevenDayLookup = new Map(
    sevenDayStats.map((stat) => [
      stat.tenantId,
      {
        orders: stat._count._all ?? 0,
        gross: Number(stat._sum.totalAmount ?? 0),
      },
    ]),
  );

  const allTimeLookup = new Map(
    allTimeStats.map((stat) => [
      stat.tenantId,
      {
        orders: stat._count._all ?? 0,
        gross: Number(stat._sum.totalAmount ?? 0),
      },
    ]),
  );

  const latestByTenant = new Map<string, { lastOrderAt: string; lastAmount: number }>();
  latestOrders.forEach((order) => {
    if (!latestByTenant.has(order.tenantId)) {
      latestByTenant.set(order.tenantId, {
        lastOrderAt: order.createdAt.toISOString(),
        lastAmount: Number(order.totalAmount ?? 0),
      });
    }
  });

  const summaries = tenants.map((tenant) => {
    const sevenDay = sevenDayLookup.get(tenant.id) || { orders: 0, gross: 0 };
    const allTime = allTimeLookup.get(tenant.id) || { orders: 0, gross: 0 };
    const latest = latestByTenant.get(tenant.id) || null;

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      contactEmail: tenant.contactEmail,
      contactPhone: tenant.contactPhone,
      addressLine1: tenant.addressLine1,
      addressLine2: tenant.addressLine2,
      city: tenant.city,
      state: tenant.state,
      postalCode: tenant.postalCode,
      primaryColor: tenant.primaryColor,
      secondaryColor: tenant.secondaryColor,
      logoUrl: tenant.logoUrl,
      heroImageUrl: tenant.heroImageUrl,
      heroTitle: tenant.heroTitle,
      heroSubtitle: tenant.heroSubtitle,
      stripeAccountId: tenant.integrations?.stripeAccountId || null,
      platformPercentFee: tenant.integrations?.platformPercentFee ?? null,
      platformFlatFee: tenant.integrations?.platformFlatFee ?? null,
      defaultTaxRate: tenant.integrations?.defaultTaxRate ?? null,
      deliveryBaseFee: tenant.integrations?.deliveryBaseFee ?? null,
      autoPrintOrders: tenant.integrations?.autoPrintOrders ?? false,
      fulfillmentNotificationsEnabled: tenant.integrations?.fulfillmentNotificationsEnabled ?? true,
      cloverMerchantId: tenant.integrations?.cloverMerchantId ?? null,
      cloverApiKey: tenant.integrations?.cloverApiKey ?? null,
      isOpen: tenant.settings?.isOpen ?? true,
      deliveryRadiusMi: tenant.settings?.deliveryRadiusMi ?? null,
      minimumOrderValue: tenant.settings?.minimumOrderValue ?? null,
      currency: tenant.settings?.currency ?? 'USD',
      timeZone: tenant.settings?.timeZone ?? 'America/Los_Angeles',
      tagline: tenant.settings?.tagline ?? '',
      socialInstagram: tenant.settings?.socialInstagram ?? '',
      socialFacebook: tenant.settings?.socialFacebook ?? '',
      socialTikTok: tenant.settings?.socialTikTok ?? '',
      socialYouTube: tenant.settings?.socialYouTube ?? '',
      createdAt: tenant.createdAt.toISOString(),
      updatedAt: tenant.updatedAt.toISOString(),
      ordersLastSevenDays: sevenDay.orders,
      grossLastSevenDays: sevenDay.gross,
      totalOrders: allTime.orders,
      totalGross: allTime.gross,
      lastOrderAt: latest?.lastOrderAt ?? null,
      lastOrderAmount: latest?.lastAmount ?? null,
    };
  });

  const totalOrders = allTimeStats.reduce((sum, stat) => sum + (stat._count._all ?? 0), 0);
  const estimatedStripeVolume = allTimeStats.reduce(
    (sum, stat) => sum + Number(stat._sum.totalAmount ?? 0),
    0,
  );

  const metrics = {
    totalOrders,
    totalTenants: tenants.length,
    sevenDayVolume: sevenDayStats.map((stat) => ({
      tenantId: stat.tenantId,
      tenantName: summaries.find((summary) => summary.id === stat.tenantId)?.name ?? 'Unknown',
      tenantSlug: summaries.find((summary) => summary.id === stat.tenantId)?.slug ?? '',
      orders: stat._count._all ?? 0,
      gross: Number(stat._sum.totalAmount ?? 0),
    })),
    allTimeVolume: allTimeStats.map((stat) => ({
      tenantId: stat.tenantId,
      tenantName: summaries.find((summary) => summary.id === stat.tenantId)?.name ?? 'Unknown',
      tenantSlug: summaries.find((summary) => summary.id === stat.tenantId)?.slug ?? '',
      orders: stat._count._all ?? 0,
      gross: Number(stat._sum.totalAmount ?? 0),
    })),
    tenantActivity: summaries.map((summary) => ({
      tenantId: summary.id,
      tenantName: summary.name,
      tenantSlug: summary.slug,
      lastOrderAt: summary.lastOrderAt,
      lastOrderAmount: summary.lastOrderAmount,
    })),
    estimatedStripeVolume,
  } as const;

  return (
    <SuperAdminDashboard
      initialTenants={summaries}
      initialMetrics={metrics}
      rootDomain={ROOT_DOMAIN}
    />
  );
}
