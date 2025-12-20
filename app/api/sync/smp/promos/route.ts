import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * SMP Promos/Announcements Sync Endpoint
 * Returns active promotions, announcements, and featured items for TV display
 *
 * GET /api/sync/smp/promos?tenantId=xxx
 * Headers: X-API-Key: {ALESSACLOUD_API_KEY}
 */
export async function GET(req: NextRequest) {
  try {
    // Validate API key
    const apiKey = req.headers.get('X-API-Key');
    if (apiKey !== process.env.ALESSACLOUD_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    // Verify tenant has active SMP subscription
    const subscription = await prisma.tenantProduct.findFirst({
      where: {
        tenantId,
        product: { slug: 'switchmenu-pro' },
        status: { in: ['active', 'prepaid'] },
      },
    });

    if (!subscription) {
      return NextResponse.json({ error: 'No active SMP subscription' }, { status: 403 });
    }

    // Get tenant branding
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        name: true,
        logoUrl: true,
        heroImageUrl: true,
        primaryColor: true,
        secondaryColor: true,
      },
    });

    // Get frontend promo sections
    const promoSections = await prisma.frontendSection.findMany({
      where: {
        tenantId,
        enabled: true,
        type: { in: ['promoBanner1', 'dealStrip', 'promotional', 'weCookBanner'] },
      },
      orderBy: { position: 'asc' },
    });

    // Get featured menu items
    const featuredItems = await prisma.menuItem.findMany({
      where: {
        tenantId,
        isFeatured: true,
        available: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        image: true,
        tags: true,
        timeSpecificEnabled: true,
        timeSpecificLabel: true,
        timeSpecificPrice: true,
      },
      take: 10,
    });

    // Get time-specific specials (e.g., Taco Tuesday)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM

    const activeSpecials = await prisma.menuItem.findMany({
      where: {
        tenantId,
        available: true,
        timeSpecificEnabled: true,
        timeSpecificDays: { has: dayOfWeek },
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        image: true,
        timeSpecificLabel: true,
        timeSpecificPrice: true,
        timeSpecificStartTime: true,
        timeSpecificEndTime: true,
      },
    });

    // Filter specials by current time
    const currentSpecials = activeSpecials.filter(item => {
      if (!item.timeSpecificStartTime || !item.timeSpecificEndTime) return true;
      return currentTime >= item.timeSpecificStartTime && currentTime <= item.timeSpecificEndTime;
    });

    // Format promo banners for display
    const promoBanners = promoSections.map(section => ({
      id: section.id,
      type: section.type,
      name: section.name,
      content: section.content as Record<string, unknown>,
      position: section.position,
    }));

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      tenantId,
      branding: {
        name: tenant?.name,
        logo: tenant?.logoUrl,
        heroImage: tenant?.heroImageUrl,
        primaryColor: tenant?.primaryColor || '#dc2626',
        secondaryColor: tenant?.secondaryColor || '#f59e0b',
      },
      promos: {
        banners: promoBanners,
        featured: featuredItems.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          image: item.image,
          tags: item.tags,
          specialLabel: item.timeSpecificEnabled ? item.timeSpecificLabel : null,
          specialPrice: item.timeSpecificEnabled ? item.timeSpecificPrice : null,
        })),
        specials: currentSpecials.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          regularPrice: item.price,
          specialPrice: item.timeSpecificPrice,
          specialLabel: item.timeSpecificLabel,
          image: item.image,
          validUntil: item.timeSpecificEndTime,
        })),
      },
      summary: {
        totalBanners: promoBanners.length,
        totalFeatured: featuredItems.length,
        totalActiveSpecials: currentSpecials.length,
      },
    });
  } catch (error) {
    console.error('[SMP Promos] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch promos', details: String(error) },
      { status: 500 }
    );
  }
}
