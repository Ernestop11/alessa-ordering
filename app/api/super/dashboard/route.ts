import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/prisma';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'super_admin') return unauthorized();

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get all data in parallel
    const [
      tenants,
      leads,
      products,
      tenantProducts,
      orders,
      sevenDayOrders,
      associates,
      commissions,
      mlmTreeData,
    ] = await Promise.all([
      prisma.tenant.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          subscriptionMonthlyFee: true,
        },
      }),
      prisma.lead.findMany({
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.findMany({
        orderBy: { order: 'asc' },
        include: {
          subscriptions: {
            where: { status: 'active' },
            select: { tenantId: true },
          },
        },
      }),
      prisma.tenantProduct.findMany({
        where: { status: 'active' },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              type: true,
              monthlyPrice: true,
            },
          },
          tenant: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),
      prisma.order.findMany({
        select: {
          totalAmount: true,
          createdAt: true,
          tenantId: true,
        },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: {
          totalAmount: true,
          createdAt: true,
          tenantId: true,
        },
      }),
      prisma.associate.findMany({
        select: {
          id: true,
          userId: true,
          rank: true,
          totalRecruits: true,
        },
      }),
      prisma.commission.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: {
          amount: true,
          createdAt: true,
        },
      }),
      // MLM Tree data
      prisma.associate.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
    ]);

    // Build MLM tree (simplified - need user data)
    const mlmTree = null; // Will be populated by MLM tree endpoint

    const rankValues = associates.map((a) => {
      const rankMap: Record<string, number> = {
        REP: 1,
        SENIOR_REP: 2,
        SUPERVISOR: 3,
        MANAGER: 4,
        SENIOR_MANAGER: 5,
        DIRECTOR: 6,
        SENIOR_DIRECTOR: 7,
        VP: 8,
        SVP: 9,
      };
      return rankMap[a.rank] || 0;
    });

    // Calculate metrics
    const totalTenants = tenants.length;
    const liveTenants = tenants.filter((t) => t.status === 'LIVE').length;
    const pendingTenants = tenants.filter((t) => t.status === 'PENDING_REVIEW').length;

    // Pipeline metrics
    const newLeads = leads.filter((l) => l.status === 'new').length;
    const inProgressLeads = leads.filter((l) => l.status === 'in_progress').length;
    const closingLeads = leads.filter((l) => l.status === 'closing').length;
    const convertedLeads = leads.filter((l) => l.status === 'converted').length;

    // Revenue calculations
    const mrr = tenants.reduce((sum, t) => sum + (t.subscriptionMonthlyFee || 0), 0);
    const productRevenue = tenantProducts.reduce(
      (sum, tp) => sum + (tp.product.monthlyPrice || 0),
      0,
    );
    const totalMRR = mrr + productRevenue;

    // MLM metrics
    const totalAssociates = associates.length;
    const activeRecruits = associates.filter((a) => a.totalRecruits > 0).length;
    const mlmRevenue = commissions.reduce((sum, c) => sum + Number(c.amount || 0), 0);

    // Revenue projection (next 30 days)
    const avgMonthlyGrowth = 0.1; // 10% - can be calculated from historical data
    const projectedMRR = totalMRR * (1 + avgMonthlyGrowth);

    // Service adoption
    const serviceAdoption = products.map((product) => ({
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      subscriberCount: product.subscriptions.length,
    }));

    return NextResponse.json({
      metrics: {
        totalTenants,
        liveTenants,
        pendingTenants,
        newLeads,
        inProgressLeads,
        closingLeads,
        convertedLeads,
        totalMRR,
        projectedMRR,
        mlmRevenue,
        totalAssociates,
        activeRecruits,
      },
      tenants: tenants.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        status: t.status,
        monthlyFee: t.subscriptionMonthlyFee || 0,
      })),
      leads,
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        type: p.type,
        status: p.status,
        monthlyPrice: p.monthlyPrice || 0,
        icon: p.icon,
        color: p.color,
        subscriberCount: p.subscriptions.length,
      })),
      tenantProducts: tenantProducts.map((tp) => ({
        id: tp.id,
        tenantId: tp.tenantId,
        tenantName: tp.tenant.name,
        tenantSlug: tp.tenant.slug,
        productId: tp.productId,
        productName: tp.product.name,
        productSlug: tp.product.slug,
        productType: tp.product.type,
        status: tp.status,
        subscribedAt: tp.subscribedAt.toISOString(),
      })),
      serviceAdoption,
      orders: {
        total: orders.length,
        sevenDay: sevenDayOrders.length,
        totalRevenue: orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0),
        sevenDayRevenue: sevenDayOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0),
      },
      mlmTree: null, // Loaded separately via /api/super/mlm/tree
      mlmStats: {
        totalAssociates: associates.length,
        totalRecruits: associates.reduce((sum, a) => sum + a.totalRecruits, 0),
        averageRank: rankValues.length > 0 ? rankValues.reduce((sum, r) => sum + r, 0) / rankValues.length : 0,
      },
    });
  } catch (error: any) {
    console.error('[Super Admin Dashboard] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

