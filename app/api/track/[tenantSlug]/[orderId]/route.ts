import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface Props {
  params: Promise<{ tenantSlug: string; orderId: string }>;
}

export async function GET(req: Request, { params }: Props) {
  const { tenantSlug, orderId } = await params;

  // First, find the tenant by slug
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: { id: true },
  });

  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
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
    select: {
      id: true,
      status: true,
      acknowledgedAt: true,
      updatedAt: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: order.id,
    status: order.status,
    acknowledgedAt: order.acknowledgedAt?.toISOString() ?? null,
    updatedAt: order.updatedAt.toISOString(),
  });
}
