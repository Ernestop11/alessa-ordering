import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface Props {
  params: Promise<{ orderId: string }>;
}

export async function GET(req: Request, { params }: Props) {
  const { orderId } = await params;

  // Support both full UUID and short 6-char order IDs
  const isShortId = orderId.length === 6;

  const order = await prisma.order.findFirst({
    where: isShortId
      ? { id: { endsWith: orderId.toLowerCase() } }
      : { id: orderId },
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
