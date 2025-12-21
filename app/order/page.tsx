import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';
import OrderPageClient, { type OrderMenuSection, type OrderMenuItem } from '../../components/order/OrderPageClient';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import OrderPageWrapper from '../../components/order/OrderPageWrapper';
import { cookies } from 'next/headers';
import { validateOperatingHours } from '@/lib/hours-validator';
import { getTemplateSettings, type TemplateSettings } from '@/lib/template-renderer';

// Force dynamic rendering to ensure tenant data is always fresh
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store' // Disable fetch caching

// Add cache headers to prevent any caching
export const runtime = 'nodejs'

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
        // Time-specific fields
        timeSpecificEnabled: (item as any).timeSpecificEnabled || false,
        timeSpecificDays: (item as any).timeSpecificDays || [],
        timeSpecificStartTime: (item as any).timeSpecificStartTime || null,
        timeSpecificEndTime: (item as any).timeSpecificEndTime || null,
        timeSpecificPrice: (item as any).timeSpecificPrice || null,
        timeSpecificLabel: (item as any).timeSpecificLabel || null,
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
          // Time-specific fields
          timeSpecificEnabled: (item as any).timeSpecificEnabled || false,
          timeSpecificDays: (item as any).timeSpecificDays || [],
          timeSpecificStartTime: (item as any).timeSpecificStartTime || null,
          timeSpecificEndTime: (item as any).timeSpecificEndTime || null,
          timeSpecificPrice: (item as any).timeSpecificPrice || null,
          timeSpecificLabel: (item as any).timeSpecificLabel || null,
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
      // Time-specific fields
      timeSpecificEnabled: (item as any).timeSpecificEnabled || false,
      timeSpecificDays: (item as any).timeSpecificDays || [],
      timeSpecificStartTime: (item as any).timeSpecificStartTime || null,
      timeSpecificEndTime: (item as any).timeSpecificEndTime || null,
      timeSpecificPrice: (item as any).timeSpecificPrice || null,
      timeSpecificLabel: (item as any).timeSpecificLabel || null,
    };
  });
}

async function getCateringTabConfig(tenantId: string) {
  const settings = await prisma.tenantSettings.findUnique({
    where: { tenantId },
    select: { cateringTabConfig: true },
  });

  const config = (settings?.cateringTabConfig as any) || {
    enabled: false, // Default to disabled - must be explicitly enabled in CateringTabEditor
    label: 'Catering',
    icon: 'ChefHat',
    description: 'Full-service events, delivered',
  };

  // Add default modal text if not set
  if (!config.modalTagline) {
    config.modalTagline = 'Authentic Mexican Cuisine';
  }
  if (!config.modalHeading) {
    config.modalHeading = 'Catering for Every Occasion';
  }

  return config;
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

  // Debug logging
  console.log('========================================');
  console.log('[getCateringPackages] Tenant ID:', tenantId);
  console.log('[getCateringPackages] Raw packages from DB:', packages.length);
  packages.forEach(p => {
    console.log(`  - ${p.name}: category="${p.category}", available=${p.available}`);
  });
  console.log('========================================');

  // Add cache-busting timestamp to images
  const timestamp = Date.now();
  const addCacheBuster = (url: string | null) => {
    if (!url) return null;
    return url.includes('?') ? `${url}&t=${timestamp}` : `${url}?t=${timestamp}`;
  };

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
      image: addCacheBuster(pkg.image),
      gallery: gallery && gallery.length > 0 ? gallery.map(url => addCacheBuster(url) || url) : null,
      badge: pkg.badge,
      customizationRemovals: pkg.customizationRemovals || [],
      customizationAddons: customizationAddons,
      available: pkg.available,
      displayOrder: pkg.displayOrder,
    };
  });
}

async function getRewardsData(tenantId: string) {
  const settings = await prisma.tenantSettings.findUnique({
    where: { tenantId },
    select: { 
      membershipProgram: true,
      rewardsGallery: true,
    },
  });

  return {
    membershipProgram: (settings?.membershipProgram as any) || null,
    rewardsGallery: (settings?.rewardsGallery as string[]) || [],
  };
}

async function getCustomerRewardsData(tenantId: string) {
  const token = cookies().get('customer_session')?.value;
  
  if (!token) {
    return null;
  }

  const session = await prisma.customerSession.findFirst({
    where: {
      tenantId,
      token,
      expiresAt: { gt: new Date() },
    },
    include: {
      customer: {
        include: {
          orders: {
            orderBy: { createdAt: 'desc' },
            take: 10, // Get last 10 orders for re-order
            include: {
              items: {
                include: {
                  menuItem: {
                    select: {
                      id: true,
                      name: true,
                      description: true,
                      price: true,
                      image: true,
                      available: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!session?.customer) {
    return null;
  }

  return {
    id: session.customer.id,
    name: session.customer.name,
    email: session.customer.email,
    phone: session.customer.phone,
    loyaltyPoints: session.customer.loyaltyPoints ?? 0,
    membershipTier: session.customer.membershipTier,
    orders: session.customer.orders.map((order) => ({
      id: order.id,
      createdAt: order.createdAt.toISOString(),
      totalAmount: Number(order.totalAmount ?? 0),
      status: order.status,
      fulfillmentMethod: order.fulfillmentMethod,
      items: order.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: Number(item.price),
        menuItem: item.menuItem ? {
          id: item.menuItem.id,
          name: item.menuItem.name,
          description: item.menuItem.description,
          price: Number(item.menuItem.price),
          image: item.menuItem.image,
          available: item.menuItem.available,
        } : null,
      })),
    })),
  };
}

export default async function OrderPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }> | { preview?: string }
}) {
  const tenant = await requireTenant();
  const params = await Promise.resolve(searchParams || {})
  const isPreview = params.preview === 'true'

  // Force fresh data on every request
  const sections = await getMenuSections(tenant.id);
  const featuredItems = await getFeaturedItems(tenant.id);
  const cateringTabConfig = await getCateringTabConfig(tenant.id);
  const cateringPackages = await getCateringPackages(tenant.id);
  const rewardsData = await getRewardsData(tenant.id);
  const customerRewardsData = await getCustomerRewardsData(tenant.id);

  // Fetch template settings for preview mode
  const templateSettings = await getTemplateSettings(tenant.id);

  // Check if restaurant is open and get frontend UI sections
  const tenantSettings = await prisma.tenantSettings.findUnique({
    where: { tenantId: tenant.id },
    select: { operatingHours: true, isOpen: true, frontendConfig: true, enabledAddOns: true },
  });

  // Get frontend UI sections from TenantSettings.frontendConfig
  const frontendConfig = (tenantSettings?.frontendConfig || {}) as any;
  const frontendUISections = frontendConfig.frontendUISections || [];
  const enabledAddOns = tenantSettings?.enabledAddOns || [];

  const hoursValidation = validateOperatingHours(
    tenantSettings?.operatingHours as any,
    tenantSettings?.isOpen ?? false // Default to closed if not set
  );

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
        rewardsData={rewardsData}
        customerRewardsData={customerRewardsData}
        isOpen={hoursValidation.isOpen}
        closedMessage={hoursValidation.message}
        frontendConfig={tenantSettings?.frontendConfig as any}
        frontendUISections={frontendUISections}
        enabledAddOns={enabledAddOns}
        templateSettings={templateSettings}
        isPreview={isPreview}
      />
    </Suspense>
  );
}
