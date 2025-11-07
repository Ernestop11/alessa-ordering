import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/prisma';
import type { MenuSectionType } from '@prisma/client';

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

const DEMO_SECTIONS: Array<{
  name: string;
  type: MenuSectionType;
  description: string;
  items: Array<{ name: string; description: string; price: number; category: string }>;
}> = [
  {
    name: 'Taquería Favorites',
    type: 'RESTAURANT' as MenuSectionType,
    description: 'Classic tacos and plates inspired by our flagship stores.',
    items: [
      {
        name: 'Carnitas Plate',
        description: 'Slow braised pork, beans, rice, handmade tortillas.',
        price: 15.99,
        category: 'plates',
      },
      {
        name: 'Birria Tacos',
        description: 'Crispy tacos with consommé dip.',
        price: 16.49,
        category: 'tacos',
      },
    ],
  },
  {
    name: 'Panadería',
    type: 'BAKERY' as MenuSectionType,
    description: 'Fresh pastries baked each morning.',
    items: [
      {
        name: 'Conchas',
        description: 'Vanilla or chocolate shell sweet bread.',
        price: 2.99,
        category: 'bakery',
      },
      {
        name: 'Churros con Cajeta',
        description: 'Cinnamon sugar with warm caramel sauce.',
        price: 7.99,
        category: 'dessert',
      },
    ],
  },
];

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
      stripeAccountId: tenant.integrations?.stripeAccountId,
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

  if (body.seedDemo) {
    for (let i = 0; i < DEMO_SECTIONS.length; i += 1) {
      const section = DEMO_SECTIONS[i];
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
    contactEmail: updated.contactEmail,
    contactPhone: updated.contactPhone,
    primaryColor: updated.primaryColor,
    secondaryColor: updated.secondaryColor,
    stripeAccountId: updated.integrations?.stripeAccountId ?? null,
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
