import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';

/**
 * GET /api/sub-tenant/menu?slug=elhornito
 *
 * Fetches menu items from a sub-tenant (e.g., El Hornito Bakery)
 * Only accessible from parent tenant context (e.g., La Poblanita can access El Hornito)
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const subTenantSlug = searchParams.get('slug');

    if (!subTenantSlug) {
      return NextResponse.json({ error: 'Missing slug parameter' }, { status: 400 });
    }

    // Get the current (parent) tenant
    const parentTenant = await requireTenant();

    // Find the sub-tenant by slug
    const subTenant = await prisma.tenant.findUnique({
      where: { slug: subTenantSlug },
      select: {
        id: true,
        name: true,
        slug: true,
        parentTenantId: true,
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true,
      },
    });

    if (!subTenant) {
      return NextResponse.json({ error: 'Sub-tenant not found' }, { status: 404 });
    }

    // Verify this sub-tenant belongs to the current parent tenant
    // This security check ensures La Poblanita can only access El Hornito,
    // and Las Reinas cannot access El Hornito
    if (subTenant.parentTenantId !== parentTenant.id) {
      return NextResponse.json(
        { error: 'Unauthorized: Sub-tenant does not belong to this tenant' },
        { status: 403 }
      );
    }

    // Fetch menu sections with items from the sub-tenant
    const sections = await prisma.menuSection.findMany({
      where: { tenantId: subTenant.id },
      orderBy: { position: 'asc' },
      include: {
        menuItems: {
          where: { available: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    // Flatten items for simple display
    const items = sections.flatMap(section =>
      section.menuItems.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        available: item.available,
        image: item.image,
        gallery: item.gallery,
        tags: item.tags,
        sectionId: section.id,
        sectionName: section.name,
        customizationRemovals: item.customizationRemovals,
        customizationAddons: item.customizationAddons,
      }))
    );

    return NextResponse.json({
      tenant: {
        id: subTenant.id,
        name: subTenant.name,
        slug: subTenant.slug,
        logoUrl: subTenant.logoUrl,
        primaryColor: subTenant.primaryColor,
        secondaryColor: subTenant.secondaryColor,
      },
      sections: sections.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        type: s.type,
        itemCount: s.menuItems.length,
      })),
      items,
    });
  } catch (error) {
    console.error('[Sub-Tenant Menu API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sub-tenant menu' },
      { status: 500 }
    );
  }
}
