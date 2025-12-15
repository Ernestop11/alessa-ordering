/**
 * Menu Availability API
 *
 * Returns current availability and prices for all menu items.
 * This enables real-time updates when admin marks items as sold out
 * or changes prices in the Menu Editor.
 *
 * HOW IT WORKS:
 * 1. Frontend polls this endpoint every 15 seconds (see OrderPageClient.tsx)
 * 2. Returns id, available, and price for all menu items
 * 3. Frontend merges this data with existing sections state
 *
 * RELATED FILES:
 * - /api/menu/[id]/route.ts - Admin updates items
 * - /components/order/OrderPageClient.tsx - Frontend polling
 * - /docs/REAL_TIME_SYNC_SYSTEM.md - System documentation
 */
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';

// Force dynamic rendering - never cache this route
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tenant = await requireTenant();

    // Only fetch the fields we need for availability updates
    const menuItems = await prisma.menuItem.findMany({
      where: { tenantId: tenant.id },
      select: {
        id: true,
        available: true,
        price: true,
        name: true, // Include name for debugging
      },
    });

    const response = NextResponse.json({
      items: menuItems,
      timestamp: Date.now(),
    });

    // Prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (err) {
    console.error('[menu-availability] GET error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch menu availability' },
      { status: 500 }
    );
  }
}
