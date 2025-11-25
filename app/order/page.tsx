import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';
import OrderPageClient, { type OrderMenuSection, type OrderMenuItem } from '../../components/order/OrderPageClient';
import type { Metadata } from 'next';

// Force dynamic rendering to ensure tenant data is always fresh
export const dynamic = 'force-dynamic'
export const revalidate = 0 // Disable all caching
export const fetchCache = 'force-no-store' // Disable fetch caching

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await requireTenant();

  if (tenant.slug === 'lasreinas') {
    return {
      title: 'Las Reinas Colusa - Order Authentic Quesabirrias Online',
      description: 'Order authentic quesabirrias, tacos, and Mexican cuisine from Las Reinas Colusa. Fast delivery in Colusa, CA. Family recipes made fresh daily.',
    };
  }

  return {
    title: `${tenant.name} - Order Online`,
    description: `Order from ${tenant.name}. Fast delivery and pickup available.`,
  };
}

async function getMenuSections(tenantId: string): Promise<OrderMenuSection[]> {
  // Helper to add cache-busting timestamps
  const addCacheBuster = (url: string | null, timestamp: number) => {
    if (!url) return null;
    return url.includes('?') ? `${url}&t=${timestamp}` : `${url}?t=${timestamp}`;
  };

  // Get sections WITH items
  const sectionsWithItems = await prisma.menuSection.findMany({
    where: { tenantId },
    orderBy: { position: 'asc' },
    include: {
      menuItems: {
        where: { available: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  // Get items WITHOUT sections (orphaned items)
  const orphanedItems = await prisma.menuItem.findMany({
    where: {
      tenantId,
      available: true,
      menuSectionId: null,
    },
    orderBy: { category: 'asc' },
  });

  // Map sections with items
  const sections: OrderMenuSection[] = sectionsWithItems.map((section) => ({
    id: section.id,
    name: section.name,
    description: section.description,
    type: section.type,
    items: section.menuItems.map((item) => {
      const timestamp = new Date(item.updatedAt).getTime();
      return {
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        available: item.available,
        image: addCacheBuster(item.image, timestamp),
        gallery: Array.isArray(item.gallery)
          ? (item.gallery as unknown[])
              .filter((url): url is string => typeof url === 'string' && url.length > 0)
              .map((url) => addCacheBuster(url, timestamp) as string)
          : [],
        tags: item.tags || [],
        customizationRemovals: item.customizationRemovals || [],
        customizationAddons: (item.customizationAddons as any) || [],
      };
    }),
  }));

  // If orphaned items exist, create "More Items" section
  if (orphanedItems.length > 0) {
    sections.push({
      id: 'orphaned-items',
      name: 'More Items',
      description: 'Additional menu items',
      type: 'OTHER',
      items: orphanedItems.map((item) => {
        const timestamp = new Date(item.updatedAt).getTime();
        return {
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          available: item.available,
          image: addCacheBuster(item.image, timestamp),
          gallery: Array.isArray(item.gallery)
            ? (item.gallery as unknown[])
                .filter((url): url is string => typeof url === 'string' && url.length > 0)
                .map((url) => addCacheBuster(url, timestamp) as string)
            : [],
          tags: item.tags || [],
          customizationRemovals: (item as any).customizationRemovals || [],
          customizationAddons: (item as any).customizationAddons || [],
        };
      }),
    });
  }

  return sections;
}

async function getFeaturedItems(tenantId: string): Promise<OrderMenuItem[]> {
  const featuredItems = await prisma.menuItem.findMany({
    where: {
      tenantId,
      available: true,
      isFeatured: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 10, // Limit to 10 featured items
  });

  return featuredItems.map((item) => {
    // Add cache-busting timestamp to image URLs
    const timestamp = new Date(item.updatedAt).getTime();
    const addCacheBuster = (url: string | null) => {
      if (!url) return null;
      return url.includes('?') ? `${url}&t=${timestamp}` : `${url}?t=${timestamp}`;
    };

    return {
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
    };
  });
}

async function getCateringTabConfig(tenantId: string) {
  const settings = await prisma.tenantSettings.findUnique({
    where: { tenantId },
    select: { cateringTabConfig: true },
  });

  return (settings?.cateringTabConfig as any) || {
    enabled: true,
    label: 'Catering',
    icon: 'ChefHat',
    description: 'Full-service events, delivered',
  };
}

export default async function OrderPage() {
  const tenant = await requireTenant();
  const sections = await getMenuSections(tenant.id);
  const featuredItems = await getFeaturedItems(tenant.id);
  const cateringTabConfig = await getCateringTabConfig(tenant.id);

  return (
    <OrderPageClient
      sections={sections}
      featuredItems={featuredItems}
      tenantSlug={tenant.slug}
      cateringTabConfig={cateringTabConfig}
    />
  );
}
