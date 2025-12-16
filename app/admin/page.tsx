import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { requireTenant } from '@/lib/tenant'
import prisma from '@/lib/prisma'
import AdminPageClient from '@/components/admin/AdminPageClient'

export default async function AdminPage() {
  // Don't do server-side redirects - let client component handle it
  // This prevents Safari from opening when redirect happens
  
  // Try to get tenant (will fail if on root domain, but that's OK - client will handle)
  let tenant = null;
  try {
    tenant = await requireTenant();
  } catch (error) {
    // If tenant fetch fails (e.g., on root domain), tenant will be null
    // Client component will handle redirect
    console.error('Failed to fetch tenant:', error);
  }

  // Fetch data (will be empty if tenant is null, but that's OK)
  let orderStats = { _count: { id: 0 }, _sum: { totalAmount: 0 } };
  let recentOrders: any[] = [];
  let menuItemCount = 0;
  let stripeStatus = { connected: false, accountId: null };
  let doordashStatus = { connected: false, storeId: null };

  if (tenant) {
    try {
      orderStats = await prisma.order.aggregate({
        where: { tenantId: tenant.id },
        _count: { id: true },
        _sum: { totalAmount: true },
      });

      recentOrders = await prisma.order.findMany({
        where: { tenantId: tenant.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          customer: {
            select: {
              name: true,
              phone: true,
            },
          },
        },
      });

      menuItemCount = await prisma.menuItem.count({
        where: { tenantId: tenant.id },
      });

      stripeStatus = tenant.integrations?.stripeAccountId 
        ? { connected: true, accountId: tenant.integrations.stripeAccountId }
        : { connected: false, accountId: null };

      doordashStatus = tenant.integrations?.doorDashStoreId
        ? { connected: true, storeId: tenant.integrations.doorDashStoreId }
        : { connected: false, storeId: null };
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    }
  }

  return (
    <AdminPageClient
      tenant={tenant || ({} as any)}
      stripeStatus={stripeStatus}
      doordashStatus={doordashStatus}
      menuItemCount={menuItemCount}
      orderStats={{
        totalOrders: orderStats._count.id,
        totalRevenue: orderStats._sum.totalAmount || 0,
      }}
      recentOrders={recentOrders.map(order => ({
        id: order.id,
        createdAt: order.createdAt,
        status: order.status,
        totalAmount: order.totalAmount,
        customerName: order.customer?.name || 'Guest',
      }))}
    />
  )
}
