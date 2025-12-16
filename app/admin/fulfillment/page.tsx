import type { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';
import { serializeOrder } from '@/lib/order-serializer';
import FulfillmentPageClient from '@/components/fulfillment/FulfillmentPageClient';

export const metadata: Metadata = {
  manifest: '/admin/fulfillment/manifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Kitchen Dashboard',
  },
};

export default async function AdminFulfillmentPage() {
  // Don't do server-side redirect - let client component handle it
  // This prevents Safari from opening when redirect happens
  const tenant = await requireTenant();

  // Fetch orders (will be empty if not authenticated, but that's OK)
  // Client component will handle redirect if needed
  let orders: any[] = [];
  try {
    orders = await prisma.order.findMany({
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
  } catch (error) {
    // If tenant fetch fails, orders will be empty
    // Client component will handle redirect
    console.error('Failed to fetch orders:', error);
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <FulfillmentPageClient
        initialOrders={orders.map((order) => serializeOrder(order, null))}
        feedUrl={`/api/admin/fulfillment/stream?tenant=${tenant.slug}`}
        scope="tenant"
      />
    </div>
  );
}
