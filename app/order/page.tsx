import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';
import OrderPageClient, { type OrderMenuSection, type OrderMenuItem } from '../../components/order/OrderPageClient';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import OrderPageWrapper from '../../components/order/OrderPageWrapper';

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

async function getCateringPackages(tenantId: string) {
  const packages = await prisma.cateringPackage.findMany({
    where: {
      tenantId,
      available: true,
    },
    orderBy: [
      { displayOrder: 'asc' },
      { createdAt: 'asc' },
    ],
  });

  return packages.map((pkg) => {
    // Handle gallery - it's stored as JSON in the database
    let gallery: string[] | null = null;
    if (pkg.gallery) {
      if (Array.isArray(pkg.gallery)) {
        gallery = pkg.gallery.filter((url): url is string => typeof url === 'string' && url.length > 0);
      } else if (typeof pkg.gallery === 'string') {
        try {
          const parsed = JSON.parse(pkg.gallery);
          if (Array.isArray(parsed)) {
            gallery = parsed.filter((url): url is string => typeof url === 'string' && url.length > 0);
          }
        } catch {
          gallery = [pkg.gallery];
        }
      }
    }

    // Handle customizationAddons
    let customizationAddons: { id: string; label: string; price: number }[] | undefined = undefined;
    if (pkg.customizationAddons) {
      if (Array.isArray(pkg.customizationAddons)) {
        customizationAddons = pkg.customizationAddons.filter((addon): addon is { id: string; label: string; price: number } => {
          return typeof addon === 'object' && addon !== null && 'label' in addon && 'price' in addon;
        }) as { id: string; label: string; price: number }[];
      } else if (typeof pkg.customizationAddons === 'string') {
        try {
          const parsed = JSON.parse(pkg.customizationAddons);
          if (Array.isArray(parsed)) {
            customizationAddons = parsed;
          }
        } catch {
          // If parsing fails, leave as undefined
        }
      }
    }

    // Ensure category is set - default to 'popular' if null/empty
    const category = (pkg.category && pkg.category.trim() !== '') ? pkg.category : 'popular';

    return {
      id: pkg.id,
      name: pkg.name,
      description: pkg.description,
      pricePerGuest: pkg.pricePerGuest,
      price: pkg.price,
      category: category,
      image: pkg.image,
      gallery: gallery && gallery.length > 0 ? gallery : null,
      badge: pkg.badge,
      customizationRemovals: pkg.customizationRemovals || [],
      customizationAddons: customizationAddons,
      available: pkg.available,
      displayOrder: pkg.displayOrder,
    };
  });
}

export default async function OrderPage() {
  const tenant = await requireTenant();
  const sections = await getMenuSections(tenant.id);
  const featuredItems = await getFeaturedItems(tenant.id);
  const cateringTabConfig = await getCateringTabConfig(tenant.id);
  const cateringPackages = await getCateringPackages(tenant.id);

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-red-800 to-orange-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading menu...</p>
        </div>
      </div>
    }>
      <OrderPageWrapper
        sections={sections}
        featuredItems={featuredItems}
        tenantSlug={tenant.slug}
        cateringTabConfig={cateringTabConfig}
        cateringPackages={cateringPackages}
      />
    </Suspense>
  );
}
