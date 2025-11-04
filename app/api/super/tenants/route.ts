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
      primaryColor: tenant.primaryColor,
      secondaryColor: tenant.secondaryColor,
      stripeAccountId: tenant.integrations?.stripeAccountId,
      createdAt: tenant.createdAt,
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
        },
      },
      integrations: {
        create: {
          stripeAccountId: body.stripeAccountId || null,
          platformPercentFee: body.platformPercentFee ? Number(body.platformPercentFee) : 0.029,
          platformFlatFee: body.platformFlatFee ? Number(body.platformFlatFee) : 0.3,
          defaultTaxRate: body.defaultTaxRate ? Number(body.defaultTaxRate) : 0.0825,
          deliveryBaseFee: body.deliveryBaseFee ? Number(body.deliveryBaseFee) : 4.99,
        },
      },
    },
    include: { integrations: true },
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
  });
}
