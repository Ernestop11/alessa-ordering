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

  // Get orders for this tenant (only recent pending/confirmed orders)
  // Note: statuses can be lowercase or uppercase depending on how they were created
  const orders = await prisma.order.findMany({
    where: {
      tenantId: tenant.id,
      status: {
        in: ['PENDING', 'CONFIRMED', 'PREPARING', 'pending', 'confirmed', 'preparing', 'new', 'NEW'],
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
