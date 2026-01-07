import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import OrderTrackingClient from '@/components/order/OrderTrackingClient';

interface Props {
  params: Promise<{ tenantSlug: string; orderId: string }>;
}

export default async function OrderTrackingPage({ params }: Props) {
  const { tenantSlug, orderId } = await params;

  // First, find the tenant by slug
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true },
  });

  if (!tenant) {
    notFound();
  }

  // Support both full UUID and short 6-char order IDs
  // CRITICAL: Always filter by tenantId to prevent cross-tenant data access
  const isShortId = orderId.length === 6;

  const order = await prisma.order.findFirst({
    where: {
      tenantId: tenant.id, // CRITICAL: Tenant isolation
      ...(isShortId
        ? { id: { endsWith: orderId.toLowerCase() } }
        : { id: orderId }),
    },
    include: {
      items: true,
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          primaryColor: true,
          secondaryColor: true,
          contactPhone: true,
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  // Serialize dates for client component
  const serializedOrder = {
    id: order.id,
    status: order.status,
    fulfillmentMethod: order.fulfillmentMethod,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail,
    subtotalAmount: Number(order.subtotalAmount ?? 0),
    taxAmount: Number(order.taxAmount ?? 0),
    tipAmount: Number(order.tipAmount ?? 0),
    deliveryFee: Number(order.deliveryFee ?? 0),
    platformFee: Number(order.platformFee ?? 0),
    totalAmount: Number(order.totalAmount ?? 0),
    notes: order.notes,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    acknowledgedAt: order.acknowledgedAt?.toISOString() ?? null,
    items: order.items.map((item) => ({
      id: item.id,
      menuItemName: item.menuItemName,
      quantity: item.quantity,
      price: Number(item.price ?? 0),
      notes: item.notes,
    })),
    tenant: order.tenant
      ? {
          id: order.tenant.id,
          name: order.tenant.name,
          slug: order.tenant.slug,
          logo: order.tenant.logoUrl,
          primaryColor: order.tenant.primaryColor,
          secondaryColor: order.tenant.secondaryColor,
          contactPhone: order.tenant.contactPhone,
        }
      : null,
  };

  return <OrderTrackingClient order={serializedOrder} />;
}
