import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth/options';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'admin') return unauthorized();

  try {
    const orderId = params.id;

    // Find the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, tenantId: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify user has access to this tenant
    const user = await prisma.customer.findUnique({
      where: { email: session.user.email! },
      select: { tenantId: true },
    });

    if (!user?.tenantId || user.tenantId !== order.tenantId) {
      return NextResponse.json(
        { error: 'Access denied to this order' },
        { status: 403 }
      );
    }

    // Update order to mark as acknowledged
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        acknowledgedAt: new Date(),
      },
      select: {
        id: true,
        acknowledgedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error) {
    console.error('[Acknowledge Order] Error:', error);
    return NextResponse.json(
      { error: 'Failed to acknowledge order' },
      { status: 500 }
    );
  }
}
