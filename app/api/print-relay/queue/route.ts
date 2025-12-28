import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { serializeOrder } from '@/lib/order-serializer';

/**
 * Print Queue API
 *
 * This endpoint manages a print queue for the local print relay.
 * When an admin clicks "Print" on an order, it adds the order to a queue.
 * The local print relay polls this queue and prints the orders.
 *
 * GET - Fetch orders in the print queue (for local relay to poll)
 * POST - Add an order to the print queue (when admin clicks Print button)
 * DELETE - Remove an order from the queue (after printing)
 */

// In-memory print queue (persists until server restart)
// In production, you'd want to use Redis or a database table
const printQueue: Map<string, { orderId: string; addedAt: Date; tenantSlug: string }> = new Map();

export async function GET(request: NextRequest) {
  // Get API key from header or query param
  const apiKey = request.headers.get('X-Print-Relay-Key') ||
                 request.nextUrl.searchParams.get('key');

  // Get tenant slug from header or query param
  const tenantSlug = request.headers.get('X-Tenant-Slug') ||
                     request.nextUrl.searchParams.get('tenant');

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Missing API key. Provide X-Print-Relay-Key header or ?key= param' },
      { status: 401 }
    );
  }

  if (!tenantSlug) {
    return NextResponse.json(
      { error: 'Missing tenant. Provide X-Tenant-Slug header or ?tenant= param' },
      { status: 400 }
    );
  }

  // Validate API key
  const validKey = process.env.PRINT_RELAY_API_KEY;
  if (!validKey || apiKey !== validKey) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  // Get queued orders for this tenant
  const queuedItems = Array.from(printQueue.values())
    .filter(item => item.tenantSlug === tenantSlug);

  if (queuedItems.length === 0) {
    return NextResponse.json({ orders: [] });
  }

  // Fetch the actual order data
  const orderIds = queuedItems.map(item => item.orderId);
  const orders = await prisma.order.findMany({
    where: {
      id: { in: orderIds },
    },
    include: {
      items: {
        include: {
          menuItem: {
            select: {
              name: true,
              section: {
                select: { type: true },
              },
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
  });

  return NextResponse.json({
    orders: orders.map(order => serializeOrder(order, null)),
    queuedAt: queuedItems.map(item => ({ orderId: item.orderId, addedAt: item.addedAt })),
  });
}

export async function POST(request: NextRequest) {
  // Require admin session for adding to queue
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session || (role !== 'admin' && role !== 'super_admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    // Fetch the order to get tenant info
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        tenant: { select: { slug: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Add to queue
    printQueue.set(orderId, {
      orderId,
      addedAt: new Date(),
      tenantSlug: order.tenant.slug,
    });

    console.log(`[Print Queue] Order ${orderId.slice(-6)} added to print queue`);

    return NextResponse.json({
      success: true,
      message: 'Order added to print queue',
      orderId,
    });
  } catch (error: any) {
    console.error('[Print Queue] Error adding to queue:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add to print queue' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  // API key auth for the relay to remove printed items
  const apiKey = request.headers.get('X-Print-Relay-Key') ||
                 request.nextUrl.searchParams.get('key');

  const validKey = process.env.PRINT_RELAY_API_KEY;
  if (!validKey || apiKey !== validKey) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    const existed = printQueue.delete(orderId);
    console.log(`[Print Queue] Order ${orderId.slice(-6)} removed from queue (existed: ${existed})`);

    return NextResponse.json({
      success: true,
      removed: existed,
    });
  } catch (error: any) {
    console.error('[Print Queue] Error removing from queue:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove from queue' },
      { status: 500 }
    );
  }
}
