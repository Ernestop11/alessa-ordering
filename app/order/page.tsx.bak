import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';
import OrderPageClient, { type OrderMenuSection } from '../../components/order/OrderPageClient';

async function getMenuSections(tenantId: string): Promise<OrderMenuSection[]> {
  const sections = await prisma.menuSection.findMany({
    where: { tenantId },
    orderBy: { position: 'asc' },
    include: {
      menuItems: {
        where: { available: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  return sections.map((section) => ({
    id: section.id,
    name: section.name,
    description: section.description,
    type: section.type,
    items: section.menuItems.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      available: item.available,
      image: item.image,
      tags: item.tags || [],
    })),
  }));
}

export default async function OrderPage() {
  const tenant = await requireTenant();
  const sections = await getMenuSections(tenant.id);

  return <OrderPageClient sections={sections} tenantSlug={tenant.slug} />;
}
