import { redirect, notFound } from 'next/navigation';
import prisma from '@/lib/prisma';

// DEPRECATED: This page is deprecated for security reasons.
// Redirects to the tenant-scoped tracking page at /[tenantSlug]/track/[orderId]
// This prevents cross-tenant data access where users could track orders from other tenants.

interface Props {
  params: Promise<{ orderId: string }>;
}

export default async function OrderTrackingRedirect({ params }: Props) {
  const { orderId } = await params;

  // Look up the order to find its tenant (we still need this to redirect properly)
  const isShortId = orderId.length === 6;

  const order = await prisma.order.findFirst({
    where: isShortId
      ? { id: { endsWith: orderId.toLowerCase() } }
      : { id: orderId },
    select: {
      id: true,
      tenant: {
        select: { slug: true },
      },
    },
  });

  if (!order || !order.tenant?.slug) {
    notFound();
  }

  // Redirect to the tenant-scoped tracking page
  redirect(`/${order.tenant.slug}/track/${order.id}`);
}
