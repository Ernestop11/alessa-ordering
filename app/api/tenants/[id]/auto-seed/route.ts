import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Optional API key validation
function validateApiKey(req: Request): boolean {
  const apiKey = req.headers.get('X-API-Key');
  const validKey = process.env.ALESSACLOUD_API_KEY;
  if (!validKey) {
    return true; // If no key configured, allow access
  }
  return apiKey === validKey;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    
    // Optional validation
    if (process.env.ALESSACLOUD_API_KEY && !validateApiKey(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: resolvedParams.id },
      include: {
        menuItems: {
          include: {
            section: {
              select: {
                id: true,
                name: true,
                type: true,
                position: true,
              },
            },
          },
          orderBy: [
            { section: { position: 'asc' } },
            { createdAt: 'asc' },
          ],
        },
        tenantSyncs: {
          where: { productType: 'SMP' },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Check if products exist
    if (tenant.menuItems.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No products found',
          message: 'Sync products first before auto-seeding',
        },
        { status: 400 }
      );
    }

    // Check sync status
    const syncRecord = tenant.tenantSyncs[0];
    if (!syncRecord || syncRecord.syncStatus !== 'success') {
      return NextResponse.json(
        {
          success: false,
          error: 'Products not synced',
          message: 'Sync products first before auto-seeding',
        },
        { status: 400 }
      );
    }

    // Prepare products data for auto-seeding
    // Group by section
    const productsBySection = new Map<string, typeof tenant.menuItems>();
    
    for (const item of tenant.menuItems) {
      const sectionId = item.menuSectionId || 'uncategorized';
      if (!productsBySection.has(sectionId)) {
        productsBySection.set(sectionId, []);
      }
      productsBySection.get(sectionId)!.push(item);
    }

    // Format products for response
    const formattedProducts = tenant.menuItems.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      image: item.image,
      gallery: item.gallery,
      available: item.available,
      menuSectionId: item.menuSectionId,
      section: item.section
        ? {
            id: item.section.id,
            name: item.section.name,
            type: item.section.type,
            position: item.section.position,
          }
        : null,
      timeSpecificEnabled: item.timeSpecificEnabled,
      timeSpecificDays: item.timeSpecificDays,
      timeSpecificStartTime: item.timeSpecificStartTime,
      timeSpecificEndTime: item.timeSpecificEndTime,
      timeSpecificPrice: item.timeSpecificPrice,
      timeSpecificLabel: item.timeSpecificLabel,
      isFeatured: item.isFeatured,
      tags: item.tags,
      customizationRemovals: item.customizationRemovals,
      customizationAddons: item.customizationAddons,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }));

    // Update sync config to mark as auto-seeded
    await prisma.tenantSync.update({
      where: {
        tenantId_productType: {
          tenantId: resolvedParams.id,
          productType: 'SMP',
        },
      },
      data: {
        syncConfig: {
          ...((syncRecord.syncConfig as any) || {}),
          autoSeeded: true,
          autoSeededAt: new Date().toISOString(),
          productCount: tenant.menuItems.length,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Menu auto-seeded with ${tenant.menuItems.length} products`,
      productCount: tenant.menuItems.length,
      sectionCount: productsBySection.size,
      products: formattedProducts,
      // Note: menuId would be created in SwitchMenu system, not here
      // This endpoint provides the data needed for auto-seeding
    });
  } catch (error: any) {
    console.error('[Sync API] Error during auto-seed:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}









