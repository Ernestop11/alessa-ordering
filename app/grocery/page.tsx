import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';
import GroceryPageClient from '@/components/grocery/GroceryPageClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function GroceryPage() {
  const tenant = await requireTenant();

  // Fetch grocery items - fresh data on every request
  const groceryItems = await prisma.groceryItem.findMany({
    where: {
      tenantId: tenant.id,
      available: true,
    },
    orderBy: [
      { displayOrder: 'asc' },
      { createdAt: 'asc' },
    ],
  });

  console.log('[grocery-page] 🛒 Rendering with', groceryItems.length, 'items for tenant:', tenant.slug);

  return (
    <GroceryPageClient
      groceryItems={groceryItems}
      tenantSlug={tenant.slug}
      tenantName={tenant.name}
    />
  );
}
