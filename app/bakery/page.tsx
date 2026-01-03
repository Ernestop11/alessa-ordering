import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { validateOperatingHours } from '@/lib/hours-validator';
import OrderPageClientElHornito from '@/components/order/OrderPageClientElHornito';

// Force dynamic rendering to ensure data is always fresh
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await requireTenant();

  // Only La Poblanita has El Hornito bakery
  if (tenant.slug === 'lapoblanita') {
    return {
      title: 'El Hornito Bakery - Fresh Pan Dulce & Mexican Bread',
      description: 'Order fresh pan dulce, conchas, cuernos, and authentic Mexican bread from El Hornito Bakery. Part of La Poblanita Mexican Food.',
    };
  }

  return {
    title: `${tenant.name} - Bakery`,
    description: `Order fresh bakery items from ${tenant.name}.`,
  };
}

async function getElHornitoMenuSections(parentTenantId: string) {
  // Helper to add cache-busting timestamps
  const addCacheBuster = (url: string | null, timestamp: number) => {
    if (!url) return null;
    return url.includes('?') ? `${url}&t=${timestamp}` : `${url}?t=${timestamp}`;
  };

  // Find El Hornito sub-tenant
  const elHornito = await prisma.tenant.findFirst({
    where: {
      slug: 'elhornito',
      parentTenantId: parentTenantId,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      primaryColor: true,
      secondaryColor: true,
    },
  });

  if (!elHornito) {
    console.log('[bakery-page] El Hornito sub-tenant not found for parent:', parentTenantId);
    return { sections: [], tenant: null };
  }

  // Get sections WITH items
  const sectionsWithItems = await prisma.menuSection.findMany({
    where: { tenantId: elHornito.id },
    orderBy: { position: 'asc' },
    include: {
      menuItems: {
        where: { available: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  // Map sections with items
  const sections = sectionsWithItems.map((section) => ({
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

  return { sections, tenant: elHornito };
}

async function getFeaturedItems(tenantId: string) {
  const featuredItems = await prisma.menuItem.findMany({
    where: {
      tenantId,
      available: true,
      isFeatured: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  return featuredItems.map((item) => {
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
            take: 10,
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

export default async function BakeryPage() {
  const parentTenant = await requireTenant();

  // Only La Poblanita has El Hornito bakery - redirect others
  if (parentTenant.slug !== 'lapoblanita') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
        <div className="text-center p-8">
          <p className="text-white/70 text-lg">Bakery not available for this location.</p>
          <a href="/order" className="text-amber-400 hover:underline mt-4 inline-block">
            ← Back to Menu
          </a>
        </div>
      </div>
    );
  }

  // Get El Hornito menu sections and tenant info
  const { sections, tenant: elHornitoTenant } = await getElHornitoMenuSections(parentTenant.id);

  if (!elHornitoTenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-white mb-4">El Hornito Bakery</h1>
          <p className="text-white/70 mb-6">Our bakery is being set up. Check back soon!</p>
          <a href="/order" className="text-amber-400 hover:underline">
            ← Back to La Poblanita Menu
          </a>
        </div>
      </div>
    );
  }

  // Get featured items from El Hornito
  const featuredItems = await getFeaturedItems(elHornitoTenant.id);

  // Get customer rewards data (uses parent tenant since cart is shared)
  const customerRewardsData = await getCustomerRewardsData(parentTenant.id);

  // Check if parent restaurant is open
  const tenantSettings = await prisma.tenantSettings.findUnique({
    where: { tenantId: parentTenant.id },
    select: { operatingHours: true, isOpen: true, membershipProgram: true, rewardsGallery: true },
  });

  const hoursValidation = validateOperatingHours(
    tenantSettings?.operatingHours as any,
    tenantSettings?.isOpen ?? false
  );

  const rewardsData = {
    membershipProgram: (tenantSettings?.membershipProgram as any) || null,
    rewardsGallery: (tenantSettings?.rewardsGallery as string[]) || [],
  };

  console.log('[bakery-page] 🥐 Rendering El Hornito with', sections.length, 'sections,',
    sections.reduce((sum, s) => sum + s.items.length, 0), 'items');

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-950/50 via-neutral-900 to-neutral-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto mb-4"></div>
          <p className="text-amber-100 text-lg">Loading bakery menu...</p>
        </div>
      </div>
    }>
      <OrderPageClientElHornito
        sections={sections}
        featuredItems={featuredItems}
        tenantSlug={parentTenant.slug}
        elHornitoTenant={elHornitoTenant}
        rewardsData={rewardsData}
        customerRewardsData={customerRewardsData}
        isOpen={hoursValidation.isOpen}
        closedMessage={hoursValidation.message}
      />
    </Suspense>
  );
}
