import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';

/**
 * Ping endpoint for fulfillment notifications
 * Used by polling clients to check for new orders
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session || role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tenant = await requireTenant();
    const { searchParams } = new URL(req.url);
    const lastCheck = searchParams.get('lastCheck');

    // Get orders created/updated since last check
    const where: any = {
      tenantId: tenant.id,
    };

    if (lastCheck) {
      const lastCheckDate = new Date(lastCheck);
      where.OR = [
        { createdAt: { gte: lastCheckDate } },
        { updatedAt: { gte: lastCheckDate } },
      ];
    } else {
      // If no lastCheck, return count of unacknowledged orders
      where.acknowledgedAt = null;
      where.status = { in: ['pending', 'confirmed'] };
    }

    const newOrders = await prisma.order.findMany({
      where,
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
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      newOrdersCount: newOrders.length,
      hasNewOrders: newOrders.length > 0,
      orders: newOrders.map((order) => ({
        id: order.id,
        status: order.status,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        acknowledgedAt: order.acknowledgedAt?.toISOString() || null,
      })),
    });
  } catch (error: any) {
    console.error('[Notifications Ping] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check notifications' },
      { status: 500 }
    );
  }
}
