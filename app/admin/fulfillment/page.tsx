import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import type { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import { serializeOrder } from '@/lib/order-serializer';
import FulfillmentDashboard from '@/components/fulfillment/FulfillmentDashboard';

export const metadata: Metadata = {
  manifest: '/admin/fulfillment/manifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Kitchen Dashboard',
  },
};

export default async function AdminFulfillmentPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'admin') {
    redirect('/admin/login');
  }

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

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <FulfillmentDashboard
        initialOrders={orders.map((order) => serializeOrder(order, null))}
        feedUrl={`/api/admin/fulfillment/stream?tenant=${tenant.slug}`}
        scope="tenant"
      />
    </div>
  );
}
