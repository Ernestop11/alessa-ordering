import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';

/**
 * Sub-Tenant Menu API
 *
 * Provides full CRUD operations for managing sub-tenant menus (e.g., El Hornito Bakery)
 * Only accessible from parent tenant context (e.g., La Poblanita can manage El Hornito)
 */

// Helper to verify sub-tenant ownership
async function verifySubTenantOwnership(subTenantSlug: string, parentTenantId: string) {
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
    return { error: 'Sub-tenant not found', status: 404 };
  }

  if (subTenant.parentTenantId !== parentTenantId) {
    return { error: 'Unauthorized: Sub-tenant does not belong to this tenant', status: 403 };
  }

  return { subTenant };
}

/**
 * GET /api/sub-tenant/menu?slug=elhornito
 * Fetches menu sections and items from a sub-tenant
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const subTenantSlug = searchParams.get('slug');
    const includeUnavailable = searchParams.get('includeUnavailable') === 'true';

    if (!subTenantSlug) {
      return NextResponse.json({ error: 'Missing slug parameter' }, { status: 400 });
    }

    const parentTenant = await requireTenant();
    const result = await verifySubTenantOwnership(subTenantSlug, parentTenant.id);

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { subTenant } = result;

    // Fetch menu sections with items from the sub-tenant
    const sections = await prisma.menuSection.findMany({
      where: { tenantId: subTenant.id },
      orderBy: { position: 'asc' },
      include: {
        menuItems: {
          where: includeUnavailable ? {} : { available: true },
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
        isFeatured: item.isFeatured,
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
        position: s.position,
        itemCount: s.menuItems.length,
      })),
      items,
    });
  } catch (error) {
    console.error('[Sub-Tenant Menu API] GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sub-tenant menu' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sub-tenant/menu
 * Creates a new menu item or section in the sub-tenant
 *
 * Body for item: { slug, type: 'item', sectionId, name, description, price, category, image, ... }
 * Body for section: { slug, type: 'section', name, description, sectionType }
 */
export async function POST(req: Request) {
  try {
    const parentTenant = await requireTenant();
    const body = await req.json();
    const { slug, type, ...data } = body;

    if (!slug) {
      return NextResponse.json({ error: 'Missing slug parameter' }, { status: 400 });
    }

    const result = await verifySubTenantOwnership(slug, parentTenant.id);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { subTenant } = result;

    if (type === 'section') {
      // Create a new section
      const { name, description, sectionType = 'BAKERY' } = data;

      if (!name) {
        return NextResponse.json({ error: 'Section name is required' }, { status: 400 });
      }

      // Get the highest position
      const lastSection = await prisma.menuSection.findFirst({
        where: { tenantId: subTenant.id },
        orderBy: { position: 'desc' },
      });

      const section = await prisma.menuSection.create({
        data: {
          tenantId: subTenant.id,
          name,
          description: description || null,
          type: sectionType,
          position: (lastSection?.position ?? -1) + 1,
        },
      });

      return NextResponse.json({ success: true, section });
    } else {
      // Create a new menu item
      const {
        sectionId,
        name,
        description,
        price,
        category = 'Pan Dulce',
        image,
        gallery,
        tags,
        isFeatured,
        customizationRemovals,
        customizationAddons,
      } = data;

      if (!name || price === undefined) {
        return NextResponse.json({ error: 'Name and price are required' }, { status: 400 });
      }

      // Verify section belongs to sub-tenant if provided
      if (sectionId) {
        const section = await prisma.menuSection.findUnique({
          where: { id: sectionId },
        });
        if (!section || section.tenantId !== subTenant.id) {
          return NextResponse.json({ error: 'Invalid section' }, { status: 400 });
        }
      }

      const item = await prisma.menuItem.create({
        data: {
          tenantId: subTenant.id,
          menuSectionId: sectionId || null,
          name,
          description: description || '',
          price: parseFloat(price),
          category,
          image: image || null,
          gallery: gallery || [],
          tags: tags || [],
          isFeatured: isFeatured || false,
          available: true,
          customizationRemovals: customizationRemovals || [],
          customizationAddons: customizationAddons || [],
        },
      });

      return NextResponse.json({ success: true, item });
    }
  } catch (error) {
    console.error('[Sub-Tenant Menu API] POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to create menu item/section' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/sub-tenant/menu
 * Updates an existing menu item or section
 *
 * Body: { slug, type: 'item'|'section', id, ...updates }
 */
export async function PUT(req: Request) {
  try {
    const parentTenant = await requireTenant();
    const body = await req.json();
    const { slug, type, id, ...updates } = body;

    if (!slug || !id) {
      return NextResponse.json({ error: 'Missing slug or id parameter' }, { status: 400 });
    }

    const result = await verifySubTenantOwnership(slug, parentTenant.id);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { subTenant } = result;

    if (type === 'section') {
      // Update section
      const section = await prisma.menuSection.findUnique({
        where: { id },
      });

      if (!section || section.tenantId !== subTenant.id) {
        return NextResponse.json({ error: 'Section not found' }, { status: 404 });
      }

      const { name, description, sectionType, position } = updates;

      const updatedSection = await prisma.menuSection.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
          ...(sectionType !== undefined && { type: sectionType }),
          ...(position !== undefined && { position }),
        },
      });

      return NextResponse.json({ success: true, section: updatedSection });
    } else {
      // Update menu item
      const item = await prisma.menuItem.findUnique({
        where: { id },
      });

      if (!item || item.tenantId !== subTenant.id) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }

      const {
        sectionId,
        name,
        description,
        price,
        category,
        image,
        gallery,
        tags,
        isFeatured,
        available,
        customizationRemovals,
        customizationAddons,
      } = updates;

      // Verify new section belongs to sub-tenant if provided
      if (sectionId) {
        const section = await prisma.menuSection.findUnique({
          where: { id: sectionId },
        });
        if (!section || section.tenantId !== subTenant.id) {
          return NextResponse.json({ error: 'Invalid section' }, { status: 400 });
        }
      }

      const updatedItem = await prisma.menuItem.update({
        where: { id },
        data: {
          ...(sectionId !== undefined && { menuSectionId: sectionId }),
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
          ...(price !== undefined && { price: parseFloat(price) }),
          ...(category !== undefined && { category }),
          ...(image !== undefined && { image }),
          ...(gallery !== undefined && { gallery }),
          ...(tags !== undefined && { tags }),
          ...(isFeatured !== undefined && { isFeatured }),
          ...(available !== undefined && { available }),
          ...(customizationRemovals !== undefined && { customizationRemovals }),
          ...(customizationAddons !== undefined && { customizationAddons }),
        },
      });

      return NextResponse.json({ success: true, item: updatedItem });
    }
  } catch (error) {
    console.error('[Sub-Tenant Menu API] PUT Error:', error);
    return NextResponse.json(
      { error: 'Failed to update menu item/section' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sub-tenant/menu
 * Deletes a menu item or section
 *
 * Body: { slug, type: 'item'|'section', id }
 */
export async function DELETE(req: Request) {
  try {
    const parentTenant = await requireTenant();
    const body = await req.json();
    const { slug, type, id } = body;

    if (!slug || !id) {
      return NextResponse.json({ error: 'Missing slug or id parameter' }, { status: 400 });
    }

    const result = await verifySubTenantOwnership(slug, parentTenant.id);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const { subTenant } = result;

    if (type === 'section') {
      // Delete section (and optionally its items)
      const section = await prisma.menuSection.findUnique({
        where: { id },
        include: { menuItems: true },
      });

      if (!section || section.tenantId !== subTenant.id) {
        return NextResponse.json({ error: 'Section not found' }, { status: 404 });
      }

      // First, unlink items from section (set menuSectionId to null)
      await prisma.menuItem.updateMany({
        where: { menuSectionId: id },
        data: { menuSectionId: null },
      });

      // Then delete the section
      await prisma.menuSection.delete({
        where: { id },
      });

      return NextResponse.json({ success: true, deleted: 'section', itemsUnlinked: section.menuItems.length });
    } else {
      // Delete menu item
      const item = await prisma.menuItem.findUnique({
        where: { id },
      });

      if (!item || item.tenantId !== subTenant.id) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }

      await prisma.menuItem.delete({
        where: { id },
      });

      return NextResponse.json({ success: true, deleted: 'item' });
    }
  } catch (error) {
    console.error('[Sub-Tenant Menu API] DELETE Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete menu item/section' },
      { status: 500 }
    );
  }
}
