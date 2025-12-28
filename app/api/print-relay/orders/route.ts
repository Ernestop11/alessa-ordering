import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { serializeOrder } from '@/lib/order-serializer';

/**
 * Print Relay Orders API
 *
 * This endpoint is designed for the local print relay service that runs
 * on a device at the restaurant (Mac, Raspberry Pi, etc.) and polls for
 * new orders to print to the thermal printer.
 *
 * Authentication: API key via X-Print-Relay-Key header or query param
 * The API key should be set in the tenant's settings or environment.
 */

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

  // Validate API key against environment variable
  const validKey = process.env.PRINT_RELAY_API_KEY;

  if (!validKey) {
    return NextResponse.json(
      { error: 'Print relay not configured. Set PRINT_RELAY_API_KEY environment variable on the server.' },
      { status: 403 }
    );
  }

  if (apiKey !== validKey) {
    return NextResponse.json(
      { error: 'Invalid API key' },
      { status: 401 }
    );
  }

  // Find tenant
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  if (!tenant) {
    return NextResponse.json(
      { error: 'Tenant not found' },
      { status: 404 }
    );
  }

  // Get orders for this tenant (only PENDING orders - not yet printed)
  // Once printed, relay marks them as 'confirmed' so they won't appear here again
  const orders = await prisma.order.findMany({
    where: {
      tenantId: tenant.id,
      status: {
        in: ['PENDING', 'pending', 'new', 'NEW'],
      },
      createdAt: {
        // Only get orders from the last 7 days
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    },
    include: {
      items: {
        include: {
          menuItem: {
            select: {
              name: true,
              section: {
                select: {
                  type: true,
                },
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
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json({
    tenant: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
    },
    orders: orders.map((order) => serializeOrder(order, null)),
  });
}

/**
 * POST - Mark an order as printed (changes status to confirmed)
 * This prevents the order from appearing in the GET response again
 */
export async function POST(request: NextRequest) {
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

    // Update order status to confirmed
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'confirmed' },
      select: { id: true, status: true },
    });

    console.log(`[Print Relay] Order ${orderId.slice(-6)} marked as printed/confirmed`);

    return NextResponse.json({
      success: true,
      order: updated,
    });
  } catch (error: any) {
    console.error('[Print Relay] Error marking order as printed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update order' },
      { status: 500 }
    );
  }
}
