import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session || role !== 'super_admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get ordering product
    const orderingProduct = await prisma.product.findUnique({
      where: { slug: 'alessa-ordering' },
    });

    if (!orderingProduct) {
      return Response.json({ error: 'Ordering product not found' }, { status: 404 });
    }

    // Get all tenants subscribed to ordering
    const tenants = await prisma.tenant.findMany({
      where: {
        productSubscriptions: {
          some: {
            productId: orderingProduct.id,
            status: { in: ['active', 'prepaid', 'trial'] },
          },
        },
      },
      include: {
        settings: true,
        integrations: true,
        productSubscriptions: {
          where: {
            productId: orderingProduct.id,
          },
          include: {
            product: true,
          },
        },
        crmActivities: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        crmNotes: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
        _count: {
          select: {
            orders: true,
            menuItems: true,
            customers: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate metrics
    const totalTenants = tenants.length;
    const activeSubscriptions = tenants.filter(
      (t) => t.productSubscriptions[0]?.status === 'active' || t.productSubscriptions[0]?.status === 'prepaid'
    ).length;
    
    const totalOrders = await prisma.order.count({
      where: {
        tenantId: { in: tenants.map((t) => t.id) },
      },
    });

    const totalRevenue = await prisma.order.aggregate({
      where: {
        tenantId: { in: tenants.map((t) => t.id) },
      },
      _sum: {
        totalAmount: true,
      },
    });

    // Calculate MRR (Monthly Recurring Revenue)
    const mrr = tenants.reduce((sum, tenant) => {
      const sub = tenant.productSubscriptions[0];
      if (sub && (sub.status === 'active' || sub.status === 'prepaid')) {
        // For prepaid, calculate monthly equivalent
        return sum + (tenant.subscriptionMonthlyFee || 0);
      }
      return sum;
    }, 0);

    // Get upcoming expirations (next 90 days)
    const upcomingExpirations = tenants
      .filter((tenant) => {
        const sub = tenant.productSubscriptions[0];
        if (!sub?.expiresAt) return false;
        const daysUntilExpiry = Math.ceil(
          (sub.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return daysUntilExpiry > 0 && daysUntilExpiry <= 90;
      })
      .map((tenant) => {
        const sub = tenant.productSubscriptions[0];
        const daysUntilExpiry = Math.ceil(
          (sub!.expiresAt!.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        return {
          tenantId: tenant.id,
          tenantName: tenant.name,
          tenantSlug: tenant.slug,
          expiresAt: sub!.expiresAt,
          daysUntilExpiry,
        };
      })
      .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

    return Response.json({
      product: {
        id: orderingProduct.id,
        name: orderingProduct.name,
        slug: orderingProduct.slug,
      },
      metrics: {
        totalTenants,
        activeSubscriptions,
        totalOrders,
        totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
        mrr,
      },
      tenants: tenants.map((tenant) => {
        const sub = tenant.productSubscriptions[0];
        return {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          status: tenant.status,
          contactEmail: tenant.contactEmail,
          contactPhone: tenant.contactPhone,
          subscription: sub
            ? {
                status: sub.status,
                subscribedAt: sub.subscribedAt,
                expiresAt: sub.expiresAt,
                trialEndsAt: sub.trialEndsAt,
                daysUntilExpiry: sub.expiresAt
                  ? Math.ceil((sub.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  : null,
              }
            : null,
          monthlyFee: tenant.subscriptionMonthlyFee,
          stats: {
            orders: tenant._count.orders,
            menuItems: tenant._count.menuItems,
            customers: tenant._count.customers,
          },
          lastActivity: tenant.crmActivities[0]?.createdAt || null,
          recentNotes: tenant.crmNotes.length,
        };
      }),
      upcomingExpirations,
    });
  } catch (error: any) {
    console.error('Error fetching ordering dashboard:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

