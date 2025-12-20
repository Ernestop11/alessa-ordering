import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * SMP Orders Ready Sync Endpoint
 * Returns orders that are ready for pickup/display on TV screens
 *
 * GET /api/sync/smp/orders-ready?tenantId=xxx
 * Headers: X-API-Key: {ALESSACLOUD_API_KEY}
 */
export async function GET(req: NextRequest) {
  try {
    // Validate API key
    const apiKey = req.headers.get('X-API-Key');
    if (apiKey !== process.env.ALESSACLOUD_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    // Verify tenant has active SMP subscription
    const subscription = await prisma.tenantProduct.findFirst({
      where: {
        tenantId,
        product: { slug: 'switchmenu-pro' },
        status: { in: ['active', 'prepaid'] },
      },
    });

    if (!subscription) {
      return NextResponse.json({ error: 'No active SMP subscription' }, { status: 403 });
    }

    // Get orders ready for pickup (status = ready, preparing, or recent completed)
    const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);

    const orders = await prisma.order.findMany({
      where: {
        tenantId,
        OR: [
          // Currently ready orders
          { status: 'ready' },
          // Currently preparing
          { status: 'preparing' },
          // Recently completed (show for 5 minutes)
          {
            status: 'completed',
            updatedAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
          },
        ],
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        customerName: true,
        orderType: true,
        estimatedReadyTime: true,
        createdAt: true,
        updatedAt: true,
        items: {
          select: {
            id: true,
            name: true,
            quantity: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // ready first, then preparing
        { createdAt: 'asc' }, // oldest first
      ],
      take: 20, // Limit for TV display
    });

    // Format for TV display
    const displayOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      displayName: order.customerName || `Order #${order.orderNumber}`,
      status: order.status,
      statusDisplay: getStatusDisplay(order.status),
      orderType: order.orderType,
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      items: order.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
      })),
      estimatedReadyTime: order.estimatedReadyTime,
      waitTime: getWaitTime(order.createdAt),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));

    // Group by status for easy display
    const grouped = {
      ready: displayOrders.filter(o => o.status === 'ready'),
      preparing: displayOrders.filter(o => o.status === 'preparing'),
      completed: displayOrders.filter(o => o.status === 'completed'),
    };

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      tenantId,
      orders: displayOrders,
      grouped,
      summary: {
        totalReady: grouped.ready.length,
        totalPreparing: grouped.preparing.length,
        totalCompleted: grouped.completed.length,
      },
    });
  } catch (error) {
    console.error('[SMP Orders Ready] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders', details: String(error) },
      { status: 500 }
    );
  }
}

function getStatusDisplay(status: string): string {
  switch (status) {
    case 'ready':
      return 'READY FOR PICKUP';
    case 'preparing':
      return 'PREPARING';
    case 'completed':
      return 'PICKED UP';
    default:
      return status.toUpperCase();
  }
}

function getWaitTime(createdAt: Date): string {
  const minutes = Math.floor((Date.now() - createdAt.getTime()) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes === 1) return '1 min';
  if (minutes < 60) return `${minutes} mins`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}
