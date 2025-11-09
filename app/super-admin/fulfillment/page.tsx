import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth/options';
import { serializeOrder } from '@/lib/order-serializer';
import FulfillmentDashboard from '@/components/fulfillment/FulfillmentDashboard';

export default async function SuperFulfillmentPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'super_admin') {
    redirect('/admin/login');
  }

  const orders = await prisma.order.findMany({
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
    take: 200,
  });

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <FulfillmentDashboard
        initialOrders={orders.map((order) => serializeOrder(order, null))}
        feedUrl="/api/super/fulfillment/stream"
        scope="platform"
      />
    </div>
  );
}
