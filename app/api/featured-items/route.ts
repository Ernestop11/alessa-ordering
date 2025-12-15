/**
 * Featured Items API
 *
 * Returns current featured menu items for frontend polling.
 * This enables real-time refresh when admin changes featured items
 * in the Menu Editor > Frontend Sections > Featured Carousel.
 *
 * HOW IT WORKS:
 * 1. Frontend polls this endpoint every 15 seconds (see OrderPageClient.tsx)
 * 2. Returns all menu items with isFeatured: true
 * 3. Includes cache-busting timestamps on images
 */
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';

// Force dynamic rendering - never cache this route
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tenant = await requireTenant();

    const featuredItems = await prisma.menuItem.findMany({
      where: {
        tenantId: tenant.id,
        available: true,
        isFeatured: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Add cache-busting timestamp to image URLs
    const timestamp = Date.now();
    const addCacheBuster = (url: string | null) => {
      if (!url) return null;
      return url.includes('?') ? `${url}&t=${timestamp}` : `${url}?t=${timestamp}`;
    };

    const items = featuredItems.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      available: item.available,
      image: addCacheBuster(item.image),
      gallery: Array.isArray(item.gallery)
        ? (item.gallery as unknown[])
            .filter((url): url is string => typeof url === 'string' && url.length > 0)
            .map((url) => addCacheBuster(url) as string)
        : [],
      tags: item.tags || [],
      customizationRemovals: (item as any).customizationRemovals || [],
      customizationAddons: (item as any).customizationAddons || [],
      timeSpecificEnabled: (item as any).timeSpecificEnabled || false,
      timeSpecificDays: (item as any).timeSpecificDays || [],
      timeSpecificStartTime: (item as any).timeSpecificStartTime || null,
      timeSpecificEndTime: (item as any).timeSpecificEndTime || null,
      timeSpecificPrice: (item as any).timeSpecificPrice || null,
      timeSpecificLabel: (item as any).timeSpecificLabel || null,
    }));

    const response = NextResponse.json({
      items,
      timestamp: Date.now(),
    });

    // Prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (err) {
    console.error('[featured-items] GET error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch featured items' },
      { status: 500 }
    );
  }
}
