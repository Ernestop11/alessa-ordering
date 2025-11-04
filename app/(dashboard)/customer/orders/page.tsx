import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';
import OrderHistoryClient from '@/components/order/OrderHistoryClient';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

async function getCustomerBySession(tenantId: string) {
  const token = cookies().get('customer_session')?.value;
  if (!token) return null;

  const session = await prisma.customerSession.findFirst({
    where: {
      tenantId,
      token,
      expiresAt: { gt: new Date() },
    },
    include: {
      customer: {
        include: {
          orders: {
            orderBy: { createdAt: 'desc' },
            include: {
              items: {
                include: { menuItem: true },
              },
            },
          },
        },
      },
    },
  });

  if (!session) return null;

  return session.customer;
}

export default async function CustomerOrdersPage() {
  const tenant = await requireTenant();
  const customer = await getCustomerBySession(tenant.id);

  if (!customer) {
    redirect(`/customer/login?tenant=${tenant.slug}&returnTo=/customer/orders`);
  }

  const serializedCustomer = {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    orders: (customer.orders ?? []).map((order) => ({
      id: order.id,
      createdAt: order.createdAt.toISOString(),
      totalAmount: Number(order.totalAmount ?? 0),
      fulfillmentMethod: order.fulfillmentMethod,
      status: order.status,
      items: order.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: Number(item.price),
        menuItem: item.menuItem ? { name: item.menuItem.name } : null,
      })),
    })),
  };

  return (
    <OrderHistoryClient
      tenant={{
        slug: tenant.slug,
        name: tenant.name,
        heroTitle: tenant.heroTitle,
        heroSubtitle: tenant.heroSubtitle,
      }}
      customer={serializedCustomer}
    />
  );
}
