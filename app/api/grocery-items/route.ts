import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';

export async function GET() {
  try {
    const tenant = await requireTenant();

    // Fetch grocery items from database
    const items = await prisma.groceryItem.findMany({
      where: {
        tenantId: tenant.id,
        available: true,
      },
      orderBy: [
        { displayOrder: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    console.log('[grocery-items] 🏢 Tenant:', tenant.slug, tenant.id);
    console.log('[grocery-items] 🛒 Fetched items:', items.length);

    const response = NextResponse.json(items);
    // Prevent caching to ensure fresh data (matches catering packages pattern)
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');
    return response;
  } catch (err) {
    console.error('[grocery-items] GET error:', err);
    const errorResponse = NextResponse.json({ error: 'Failed to fetch grocery items' }, { status: 500 });
    errorResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return errorResponse;
  }
}
