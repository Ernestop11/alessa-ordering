import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';
import GroceryPageClient from '@/components/grocery/GroceryPageClient';

export const dynamic = 'force-dynamic';

export default async function GroceryPage() {
  const tenant = await requireTenant();

  // Fetch grocery items
  const groceryItems = await prisma.groceryItem.findMany({
    where: {
      tenantId: tenant.id,
      available: true,
    },
    orderBy: {
      displayOrder: 'asc',
    },
  });

  return (
    <GroceryPageClient
      groceryItems={groceryItems}
      tenantSlug={tenant.slug}
      tenantName={tenant.name}
    />
  );
}
