import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';
import GroceryPageClient from '@/components/grocery/GroceryPageClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function BakeryPage() {
  const tenant = await requireTenant();

  // Fetch grocery/bakery items - fresh data on every request
  // Uses the same GroceryItem model but with bakery theming
  const rawItems = await prisma.groceryItem.findMany({
    where: {
      tenantId: tenant.id,
      available: true,
    },
    orderBy: [
      { displayOrder: 'asc' },
      { createdAt: 'asc' },
    ],
  });

  // Add cache-busting timestamps to images
  const groceryItems = rawItems.map((item) => {
    const timestamp = new Date(item.updatedAt).getTime();
    const addCacheBuster = (url: string | null) => {
      if (!url) return null;
      return url.includes('?') ? `${url}&t=${timestamp}` : `${url}?t=${timestamp}`;
    };

    return {
      ...item,
      image: addCacheBuster(item.image),
    };
  });

  // Fetch bundles (pan dulce boxes, etc.)
  const bundles = await prisma.groceryBundle.findMany({
    where: {
      tenantId: tenant.id,
      available: true,
    },
    orderBy: [
      { displayOrder: 'asc' },
      { createdAt: 'asc' },
    ],
  });

  // Fetch daily specials (using the weekend specials functionality)
  const now = new Date();
  const weekendSpecialsRaw = await prisma.groceryItem.findMany({
    where: {
      tenantId: tenant.id,
      available: true,
      isWeekendSpecial: true,
      OR: [
        // No dates set = always active
        {
          weekendStartDate: null,
          weekendEndDate: null,
        },
        // Within date range
        {
          weekendStartDate: { lte: now },
          weekendEndDate: { gte: now },
        },
        // Only start date set
        {
          weekendStartDate: { lte: now },
          weekendEndDate: null,
        },
        // Only end date set
        {
          weekendStartDate: null,
          weekendEndDate: { gte: now },
        },
      ],
    },
    orderBy: [
      { displayOrder: 'asc' },
      { name: 'asc' },
    ],
  });

  // Add cache-busting to daily specials
  const weekendSpecials = weekendSpecialsRaw.map((item) => {
    const timestamp = new Date(item.updatedAt).getTime();
    const addCacheBuster = (url: string | null) => {
      if (!url) return null;
      return url.includes('?') ? `${url}&t=${timestamp}` : `${url}?t=${timestamp}`;
    };

    return {
      ...item,
      image: addCacheBuster(item.image),
    };
  });

  console.log('[bakery-page] 🥐 Rendering with', groceryItems.length, 'items,', bundles.length, 'bundles, and', weekendSpecials.length, 'daily specials for tenant:', tenant.slug);

  return (
    <GroceryPageClient
      groceryItems={groceryItems}
      bundles={bundles}
      weekendSpecials={weekendSpecials}
      tenantSlug={tenant.slug}
      tenantName={tenant.name}
      variant="bakery"
    />
  );
}
