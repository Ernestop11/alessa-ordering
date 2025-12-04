import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/prisma';
import type { MenuSectionType } from '@prisma/client';
import { TenantStatus } from '@prisma/client';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const TEMPLATE_SECTIONS: Record<string, Array<{
  name: string;
  type: MenuSectionType;
  description: string;
  items: Array<{ name: string; description: string; price: number; category: string }>;
}>> = {
  taqueria: [
    {
      name: 'Tacos',
      type: 'FOOD' as MenuSectionType,
      description: 'Authentic Mexican tacos',
      items: [
        { name: 'Carne Asada Taco', description: 'Grilled beef with onions and cilantro', price: 3.99, category: 'tacos' },
        { name: 'Al Pastor Taco', description: 'Marinated pork with pineapple', price: 3.99, category: 'tacos' },
        { name: 'Carnitas Taco', description: 'Slow-cooked pork', price: 3.99, category: 'tacos' },
        { name: 'Birria Tacos', description: 'Crispy tacos with consommé dip', price: 16.49, category: 'tacos' },
      ],
    },
    {
      name: 'Burritos',
      type: 'FOOD' as MenuSectionType,
      description: 'Large burritos with your choice of filling',
      items: [
        { name: 'Beef Burrito', description: 'Large burrito with beef, rice, beans, and cheese', price: 8.99, category: 'burritos' },
        { name: 'Chicken Burrito', description: 'Large burrito with chicken, rice, beans, and cheese', price: 8.99, category: 'burritos' },
      ],
    },
    {
      name: 'Beverages',
      type: 'BEVERAGE' as MenuSectionType,
      description: 'Refreshing drinks',
      items: [
        { name: 'Horchata', description: 'Traditional rice drink with cinnamon', price: 2.99, category: 'beverages' },
        { name: 'Jamaica', description: 'Hibiscus tea', price: 2.99, category: 'beverages' },
      ],
    },
  ],
  panaderia: [
    {
      name: 'Panadería',
      type: 'BAKERY' as MenuSectionType,
      description: 'Fresh baked goods daily',
      items: [
        { name: 'Conchas', description: 'Traditional Mexican sweet bread', price: 2.50, category: 'bakery' },
        { name: 'Pan Dulce', description: 'Assorted sweet breads', price: 3.00, category: 'bakery' },
        { name: 'Churros', description: 'Crispy fried dough with cinnamon sugar', price: 4.50, category: 'bakery' },
        { name: 'Tres Leches Cake', description: 'Traditional three milk cake', price: 5.99, category: 'bakery' },
      ],
    },
  ],
  coffee: [
    {
      name: 'Coffee',
      type: 'BEVERAGE' as MenuSectionType,
      description: 'Fresh brewed coffee and espresso',
      items: [
        { name: 'Espresso', description: 'Single shot of espresso', price: 2.50, category: 'coffee' },
        { name: 'Americano', description: 'Espresso with hot water', price: 3.00, category: 'coffee' },
        { name: 'Cappuccino', description: 'Espresso with steamed milk and foam', price: 4.50, category: 'coffee' },
        { name: 'Latte', description: 'Espresso with steamed milk', price: 4.75, category: 'coffee' },
      ],
    },
    {
      name: 'Pastries',
      type: 'BAKERY' as MenuSectionType,
      description: 'Fresh pastries and baked goods',
      items: [
        { name: 'Croissant', description: 'Buttery flaky pastry', price: 3.50, category: 'pastries' },
        { name: 'Muffin', description: 'Fresh baked muffin', price: 3.00, category: 'pastries' },
        { name: 'Scone', description: 'Traditional scone', price: 3.25, category: 'pastries' },
      ],
    },
  ],
  pizza: [
    {
      name: 'Pizza',
      type: 'FOOD' as MenuSectionType,
      description: 'Handmade pizzas with fresh ingredients',
      items: [
        { name: 'Margherita Pizza', description: 'Tomato, mozzarella, basil', price: 12.99, category: 'pizza' },
        { name: 'Pepperoni Pizza', description: 'Pepperoni and mozzarella', price: 14.99, category: 'pizza' },
        { name: 'Supreme Pizza', description: 'Pepperoni, sausage, peppers, onions', price: 16.99, category: 'pizza' },
      ],
    },
    {
      name: 'Sides',
      type: 'FOOD' as MenuSectionType,
      description: 'Delicious sides and appetizers',
      items: [
        { name: 'Garlic Bread', description: 'Fresh baked with garlic butter', price: 4.99, category: 'sides' },
        { name: 'Wings', description: 'Buffalo wings with your choice of sauce', price: 9.99, category: 'sides' },
        { name: 'Caesar Salad', description: 'Fresh romaine with caesar dressing', price: 7.99, category: 'sides' },
      ],
    },
  ],
  grocery: [
    {
      name: 'Produce',
      type: 'GROCERY' as MenuSectionType,
      description: 'Fresh fruits and vegetables',
      items: [
        { name: 'Fresh Bananas', description: 'Organic bananas per lb', price: 1.99, category: 'produce' },
        { name: 'Organic Tomatoes', description: 'Fresh organic tomatoes per lb', price: 3.99, category: 'produce' },
        { name: 'Mixed Greens', description: 'Fresh salad mix', price: 4.99, category: 'produce' },
      ],
    },
    {
      name: 'Packaged Goods',
      type: 'GROCERY' as MenuSectionType,
      description: 'Pantry essentials and packaged items',
      items: [
        { name: 'Organic Pasta', description: '1 lb package', price: 3.99, category: 'packaged' },
        { name: 'Olive Oil', description: 'Extra virgin olive oil 500ml', price: 8.99, category: 'packaged' },
        { name: 'Canned Beans', description: 'Organic black beans', price: 2.99, category: 'packaged' },
      ],
    },
  ],
};

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'super_admin') return unauthorized();

  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      settings: true,
      integrations: true,
    },
  });

  return NextResponse.json(
    tenants.map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      contactEmail: tenant.contactEmail,
      contactPhone: tenant.contactPhone,
      addressLine1: tenant.addressLine1,
      addressLine2: tenant.addressLine2,
      city: tenant.city,
      state: tenant.state,
      postalCode: tenant.postalCode,
      primaryColor: tenant.primaryColor,
      secondaryColor: tenant.secondaryColor,
      logoUrl: tenant.logoUrl,
      heroImageUrl: tenant.heroImageUrl,
      heroTitle: tenant.heroTitle,
      heroSubtitle: tenant.heroSubtitle,
      status: tenant.status,
      statusUpdatedAt: tenant.statusUpdatedAt?.toISOString() ?? null,
      statusNotes: tenant.statusNotes,
      subscriptionPlan: tenant.subscriptionPlan,
      subscriptionMonthlyFee: tenant.subscriptionMonthlyFee,
      subscriptionAddons: tenant.subscriptionAddons,
      stripeAccountId: tenant.integrations?.stripeAccountId,
      doorDashStoreId: tenant.integrations?.doorDashStoreId ?? null,
      platformPercentFee: tenant.integrations?.platformPercentFee ?? null,
      platformFlatFee: tenant.integrations?.platformFlatFee ?? null,
      defaultTaxRate: tenant.integrations?.defaultTaxRate ?? null,
      deliveryBaseFee: tenant.integrations?.deliveryBaseFee ?? null,
      autoPrintOrders: tenant.integrations?.autoPrintOrders ?? false,
      fulfillmentNotificationsEnabled: tenant.integrations?.fulfillmentNotificationsEnabled ?? true,
      cloverMerchantId: tenant.integrations?.cloverMerchantId ?? null,
      cloverApiKey: tenant.integrations?.cloverApiKey ?? null,
      isOpen: tenant.settings?.isOpen ?? true,
      deliveryRadiusMi: tenant.settings?.deliveryRadiusMi ?? null,
      minimumOrderValue: tenant.settings?.minimumOrderValue ?? null,
      currency: tenant.settings?.currency ?? 'USD',
      timeZone: tenant.settings?.timeZone ?? 'America/Los_Angeles',
      tagline: tenant.settings?.tagline ?? null,
      socialInstagram: tenant.settings?.socialInstagram ?? null,
      socialFacebook: tenant.settings?.socialFacebook ?? null,
      socialTikTok: tenant.settings?.socialTikTok ?? null,
      socialYouTube: tenant.settings?.socialYouTube ?? null,
      createdAt: tenant.createdAt.toISOString(),
      updatedAt: tenant.updatedAt.toISOString(),
    })),
  );
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'super_admin') return unauthorized();

  const body = await req.json();
  const name = (body.name || '').trim();
  const slugInput = (body.slug || name) as string;
  if (!name || !slugInput) {
    return NextResponse.json({ error: 'Name (and slug) required.' }, { status: 400 });
  }

  const slug = slugify(slugInput);
  if (!slug) {
    return NextResponse.json({ error: 'Invalid slug.' }, { status: 400 });
  }

  const existing = await prisma.tenant.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: 'Slug already in use.' }, { status: 409 });
  }

  const primaryColor = body.primaryColor || '#dc2626';
  const secondaryColor = body.secondaryColor || '#f59e0b';
  const isOpen = body.isOpen !== undefined ? Boolean(body.isOpen) : true;
  const autoPrintOrders = body.autoPrintOrders !== undefined ? Boolean(body.autoPrintOrders) : false;
  const fulfillmentNotificationsEnabled =
    body.fulfillmentNotificationsEnabled !== undefined ? Boolean(body.fulfillmentNotificationsEnabled) : true;
  const platformPercentFee = body.platformPercentFee ? Number(body.platformPercentFee) : 0.029;
  const platformFlatFee = body.platformFlatFee ? Number(body.platformFlatFee) : 0.3;
  const defaultTaxRate = body.defaultTaxRate ? Number(body.defaultTaxRate) : 0.0825;
  const deliveryBaseFee = body.deliveryBaseFee ? Number(body.deliveryBaseFee) : 4.99;
  const requestedStatus = typeof body.status === 'string' ? body.status.trim().toUpperCase() : TenantStatus.PENDING_REVIEW;
  const status = Object.values(TenantStatus).includes(requestedStatus as TenantStatus)
    ? (requestedStatus as TenantStatus)
    : TenantStatus.PENDING_REVIEW;
  const statusNotes = typeof body.statusNotes === 'string' ? body.statusNotes : null;
  const subscriptionPlan = typeof body.subscriptionPlan === 'string' ? body.subscriptionPlan : 'alessa-starter';
  const subscriptionMonthlyFee =
    body.subscriptionMonthlyFee !== undefined ? Number(body.subscriptionMonthlyFee) || 0 : 0;
  const subscriptionAddons = Array.isArray(body.subscriptionAddons)
    ? body.subscriptionAddons.map((addon: unknown) => String(addon))
    : [];

  const tenant = await prisma.tenant.create({
    data: {
      name,
      slug,
      contactEmail: body.contactEmail || null,
      contactPhone: body.contactPhone || null,
      addressLine1: body.addressLine1 || null,
      addressLine2: body.addressLine2 || null,
      city: body.city || null,
      state: body.state || null,
      postalCode: body.postalCode || null,
      logoUrl: body.logoUrl || null,
      heroImageUrl: body.heroImageUrl || null,
      heroTitle: body.heroTitle || `${name} Restaurant`,
      heroSubtitle: body.heroSubtitle || body.tagline || 'Order direct for pickup or delivery.',
      primaryColor,
      secondaryColor,
      status,
      statusNotes,
      subscriptionPlan,
      subscriptionMonthlyFee,
      subscriptionAddons,
      featureFlags: [],
      settings: {
        create: {
          tagline: body.tagline || '',
          socialInstagram: body.socialInstagram || null,
          socialFacebook: body.socialFacebook || null,
          socialTikTok: body.socialTikTok || null,
          socialYouTube: body.socialYouTube || null,
          deliveryRadiusMi: body.deliveryRadiusMi ? Number(body.deliveryRadiusMi) : 5,
          minimumOrderValue: body.minimumOrderValue ? Number(body.minimumOrderValue) : 0,
          currency: body.currency || 'USD',
          timeZone: body.timeZone || 'America/Los_Angeles',
          isOpen,
        },
      },
      integrations: {
        create: {
          stripeAccountId: body.stripeAccountId || null,
          platformPercentFee,
          platformFlatFee,
          defaultTaxRate,
          deliveryBaseFee,
          autoPrintOrders,
          fulfillmentNotificationsEnabled,
          cloverMerchantId: body.cloverMerchantId || null,
          cloverApiKey: body.cloverApiKey || null,
        },
      },
    },
    include: { integrations: true, settings: true },
  });

  // Apply template if provided
  if (body.templateFile) {
    const fs = await import('fs');
    const path = await import('path');
    const templatePath = path.join(process.cwd(), 'templates', body.templateFile);
    
    if (fs.existsSync(templatePath)) {
      const template = JSON.parse(fs.readFileSync(templatePath, 'utf-8'));
      
      // Create menu sections and items from template
      for (const sectionTemplate of template.menuSections || []) {
        const createdSection = await prisma.menuSection.create({
          data: {
            tenantId: tenant.id,
            name: sectionTemplate.name,
            description: sectionTemplate.description || null,
            type: sectionTemplate.type,
            position: sectionTemplate.position,
            hero: sectionTemplate.hero || false,
            imageUrl: sectionTemplate.imageUrl || null,
            menuItems: {
              create: (sectionTemplate.menuItems || []).map((item: any) => ({
                tenantId: tenant.id,
                name: item.name,
                description: item.description,
                price: item.price,
                category: item.category,
                image: item.image || null,
                gallery: item.gallery || null,
                available: item.available !== false,
                isFeatured: item.isFeatured || false,
                tags: item.tags || [],
                customizationRemovals: item.customizationRemovals || [],
                customizationAddons: item.customizationAddons || null,
              })),
            },
          },
        });
      }

      // Create catering sections and packages from template
      for (const sectionTemplate of template.cateringSections || []) {
        await prisma.cateringSection.create({
          data: {
            tenantId: tenant.id,
            name: sectionTemplate.name,
            description: sectionTemplate.description || null,
            position: sectionTemplate.position,
            imageUrl: sectionTemplate.imageUrl || null,
            packages: {
              create: (sectionTemplate.cateringPackages || []).map((pkg: any) => ({
                tenantId: tenant.id,
                name: pkg.name,
                description: pkg.description,
                pricePerGuest: pkg.pricePerGuest || null,
                price: pkg.price || null,
                category: pkg.category,
                image: pkg.image || null,
                gallery: pkg.gallery || null,
                badge: pkg.badge || null,
                customizationRemovals: pkg.customizationRemovals || [],
                customizationAddons: pkg.customizationAddons || null,
                available: pkg.available !== false,
                displayOrder: pkg.displayOrder || 0,
              })),
            },
          },
        });
      }
    }
  } else if (body.seedDemo) {
    // Fallback to old template system
    const templateId = body.templateId || 'taqueria';
    const sections = TEMPLATE_SECTIONS[templateId] || TEMPLATE_SECTIONS.taqueria;
    
    for (let i = 0; i < sections.length; i += 1) {
      const section = sections[i];
      const createdSection = await prisma.menuSection.create({
        data: {
          tenantId: tenant.id,
          name: section.name,
          description: section.description,
          type: section.type,
          position: i,
        },
      });

      for (const item of section.items) {
        await prisma.menuItem.create({
          data: {
            tenantId: tenant.id,
            menuSectionId: createdSection.id,
            name: item.name,
            description: item.description,
            price: item.price,
            category: item.category,
            available: true,
          },
        });
      }
    }
  }

  return NextResponse.json({
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    status: tenant.status,
    stripeAccountId: tenant.integrations?.stripeAccountId || null,
    autoPrintOrders: tenant.integrations?.autoPrintOrders ?? false,
  });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'super_admin') return unauthorized();

  const body = await req.json();
  const tenantId = body.id as string | undefined;
  if (!tenantId) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }

  const tenantData: Record<string, any> = {};
  const settingsData: Record<string, any> = {};
  const integrationsData: Record<string, any> = {};

  if (body.name !== undefined) tenantData.name = body.name;
  if (body.contactEmail !== undefined) tenantData.contactEmail = body.contactEmail || null;
  if (body.contactPhone !== undefined) tenantData.contactPhone = body.contactPhone || null;
  if (body.addressLine1 !== undefined) tenantData.addressLine1 = body.addressLine1 || null;
  if (body.addressLine2 !== undefined) tenantData.addressLine2 = body.addressLine2 || null;
  if (body.city !== undefined) tenantData.city = body.city || null;
  if (body.state !== undefined) tenantData.state = body.state || null;
  if (body.postalCode !== undefined) tenantData.postalCode = body.postalCode || null;
  if (body.logoUrl !== undefined) tenantData.logoUrl = body.logoUrl || null;
  if (body.heroImageUrl !== undefined) tenantData.heroImageUrl = body.heroImageUrl || null;
  if (body.heroTitle !== undefined) tenantData.heroTitle = body.heroTitle || null;
  if (body.heroSubtitle !== undefined) tenantData.heroSubtitle = body.heroSubtitle || null;
  if (body.primaryColor !== undefined) tenantData.primaryColor = body.primaryColor || null;
  if (body.secondaryColor !== undefined) tenantData.secondaryColor = body.secondaryColor || null;
  if (body.status !== undefined) {
    const requestedStatus = String(body.status).trim().toUpperCase();
    if (!Object.values(TenantStatus).includes(requestedStatus as TenantStatus)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }
    tenantData.status = requestedStatus as TenantStatus;
    tenantData.statusUpdatedAt = new Date();
  }
  if (body.statusNotes !== undefined) tenantData.statusNotes = body.statusNotes || null;
  if (body.subscriptionPlan !== undefined) tenantData.subscriptionPlan = body.subscriptionPlan || null;
  if (body.subscriptionMonthlyFee !== undefined)
    tenantData.subscriptionMonthlyFee = Number(body.subscriptionMonthlyFee) || 0;
  if (body.subscriptionAddons !== undefined) {
    tenantData.subscriptionAddons = Array.isArray(body.subscriptionAddons)
      ? body.subscriptionAddons.map((addon: unknown) => String(addon))
      : [];
  }

  if (body.slug !== undefined) {
    const newSlug = slugify(body.slug);
    if (!newSlug) return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
    const existingSlug = await prisma.tenant.findUnique({ where: { slug: newSlug } });
    if (existingSlug && existingSlug.id !== tenantId) {
      return NextResponse.json({ error: 'Slug already in use.' }, { status: 409 });
    }
    tenantData.slug = newSlug;
  }

  if (body.tagline !== undefined) settingsData.tagline = body.tagline || null;
  if (body.socialInstagram !== undefined) settingsData.socialInstagram = body.socialInstagram || null;
  if (body.socialFacebook !== undefined) settingsData.socialFacebook = body.socialFacebook || null;
  if (body.socialTikTok !== undefined) settingsData.socialTikTok = body.socialTikTok || null;
  if (body.socialYouTube !== undefined) settingsData.socialYouTube = body.socialYouTube || null;
  if (body.deliveryRadiusMi !== undefined) settingsData.deliveryRadiusMi = Number(body.deliveryRadiusMi) || 0;
  if (body.minimumOrderValue !== undefined) settingsData.minimumOrderValue = Number(body.minimumOrderValue) || 0;
  if (body.currency !== undefined) settingsData.currency = body.currency || 'USD';
  if (body.timeZone !== undefined) settingsData.timeZone = body.timeZone || 'America/Los_Angeles';
  if (body.isOpen !== undefined) settingsData.isOpen = Boolean(body.isOpen);

  if (body.stripeAccountId !== undefined) integrationsData.stripeAccountId = body.stripeAccountId || null;
  if (body.platformPercentFee !== undefined) integrationsData.platformPercentFee = Number(body.platformPercentFee) || 0;
  if (body.platformFlatFee !== undefined) integrationsData.platformFlatFee = Number(body.platformFlatFee) || 0;
  if (body.defaultTaxRate !== undefined) integrationsData.defaultTaxRate = Number(body.defaultTaxRate) || 0;
  if (body.deliveryBaseFee !== undefined) integrationsData.deliveryBaseFee = Number(body.deliveryBaseFee) || 0;
  if (body.autoPrintOrders !== undefined) integrationsData.autoPrintOrders = Boolean(body.autoPrintOrders);
  if (body.fulfillmentNotificationsEnabled !== undefined)
    integrationsData.fulfillmentNotificationsEnabled = Boolean(body.fulfillmentNotificationsEnabled);
  if (body.cloverMerchantId !== undefined) integrationsData.cloverMerchantId = body.cloverMerchantId || null;
  if (body.cloverApiKey !== undefined) integrationsData.cloverApiKey = body.cloverApiKey || null;

  await prisma.$transaction(async (tx) => {
    if (Object.keys(tenantData).length > 0) {
      await tx.tenant.update({ where: { id: tenantId }, data: tenantData });
    }

    if (Object.keys(settingsData).length > 0) {
      await tx.tenantSettings.upsert({
        where: { tenantId },
        update: settingsData,
        create: { tenantId, ...settingsData },
      });
    }

    if (Object.keys(integrationsData).length > 0) {
      await tx.tenantIntegration.upsert({
        where: { tenantId },
        update: integrationsData,
        create: { tenantId, ...integrationsData },
      });
    }
  });

  const updated = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { settings: true, integrations: true },
  });

  if (!updated) {
    return NextResponse.json({ error: 'Failed to load updated tenant' }, { status: 500 });
  }

  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    slug: updated.slug,
    status: updated.status,
    statusUpdatedAt: updated.statusUpdatedAt?.toISOString() ?? null,
    statusNotes: updated.statusNotes,
    subscriptionPlan: updated.subscriptionPlan,
    subscriptionMonthlyFee: updated.subscriptionMonthlyFee,
    subscriptionAddons: updated.subscriptionAddons,
    contactEmail: updated.contactEmail,
    contactPhone: updated.contactPhone,
    primaryColor: updated.primaryColor,
    secondaryColor: updated.secondaryColor,
    stripeAccountId: updated.integrations?.stripeAccountId ?? null,
    doorDashStoreId: updated.integrations?.doorDashStoreId ?? null,
    platformPercentFee: updated.integrations?.platformPercentFee ?? null,
    platformFlatFee: updated.integrations?.platformFlatFee ?? null,
    defaultTaxRate: updated.integrations?.defaultTaxRate ?? null,
    deliveryBaseFee: updated.integrations?.deliveryBaseFee ?? null,
    autoPrintOrders: updated.integrations?.autoPrintOrders ?? false,
    fulfillmentNotificationsEnabled: updated.integrations?.fulfillmentNotificationsEnabled ?? true,
    cloverMerchantId: updated.integrations?.cloverMerchantId ?? null,
    cloverApiKey: updated.integrations?.cloverApiKey ?? null,
    isOpen: updated.settings?.isOpen ?? true,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'super_admin') return unauthorized();

  const searchParams = new URL(req.url).searchParams;
  const tenantId = searchParams.get('id');

  if (!tenantId) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }

  // Delete tenant and all related data (cascade delete)
  await prisma.tenant.delete({
    where: { id: tenantId },
  });

  return NextResponse.json({ success: true, message: 'Tenant deleted successfully' });
}
