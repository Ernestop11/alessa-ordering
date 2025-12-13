import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function validateApiKey(req: Request): boolean {
  const apiKey = req.headers.get('X-API-Key');
  return apiKey === process.env.ALESSACLOUD_API_KEY;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> | { tenantId: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    if (!validateApiKey(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const products = await prisma.menuItem.findMany({
      where: { tenantId: resolvedParams.tenantId },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        category: true,
        image: true,
        gallery: true,
        available: true,
        menuSectionId: true,
        timeSpecificEnabled: true,
        timeSpecificDays: true,
        timeSpecificStartTime: true,
        timeSpecificEndTime: true,
        timeSpecificPrice: true,
        timeSpecificLabel: true,
        isFeatured: true,
        tags: true,
        customizationRemovals: true,
        customizationAddons: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(products);
  } catch (error: any) {
    console.error('[Sync API] Error fetching products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Sync products FROM Alessa Ordering (or update single product if body provided)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> | { tenantId: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    
    // Optional API key validation (for external calls)
    const apiKey = req.headers.get('X-API-Key');
    const validKey = process.env.ALESSACLOUD_API_KEY;
    if (validKey && apiKey !== validKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if request has body (single product update) or empty (full sync)
    let body;
    try {
      body = await req.json();
    } catch {
      body = null;
    }

    // If body provided with id, update single product (bidirectional sync)
    if (body && body.id) {
      const { id, ...updateData } = body;

      // Verify tenant owns this product
      const existing = await prisma.menuItem.findFirst({
        where: { id, tenantId: resolvedParams.tenantId },
      });

      if (!existing) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }

      const updated = await prisma.menuItem.update({
        where: { id },
        data: {
          name: updateData.name,
          description: updateData.description,
          price: updateData.price,
          image: updateData.image,
          available: updateData.available,
          ...updateData,
        },
      });

      return NextResponse.json(updated);
    }

    // Otherwise, sync all products FROM Alessa Ordering
    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: resolvedParams.tenantId },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Fetch all products for this tenant
    const products = await prisma.menuItem.findMany({
      where: { tenantId: resolvedParams.tenantId },
      include: {
        section: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Update sync status
    await prisma.tenantSync.upsert({
      where: {
        tenantId_productType: {
          tenantId: resolvedParams.tenantId,
          productType: 'SMP',
        },
      },
      create: {
        tenantId: resolvedParams.tenantId,
        productType: 'SMP',
        lastSyncAt: new Date(),
        syncStatus: 'success',
        syncConfig: {
          productCount: products.length,
          syncedAt: new Date().toISOString(),
        },
      },
      update: {
        lastSyncAt: new Date(),
        syncStatus: 'success',
        syncConfig: {
          productCount: products.length,
          syncedAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      count: products.length,
      message: `Synced ${products.length} products from Alessa Ordering`,
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        category: p.category,
        image: p.image,
        gallery: p.gallery,
        available: p.available,
        menuSectionId: p.menuSectionId,
        section: p.section ? {
          id: p.section.id,
          name: p.section.name,
          type: p.section.type,
        } : null,
        timeSpecificEnabled: p.timeSpecificEnabled,
        timeSpecificDays: p.timeSpecificDays,
        timeSpecificStartTime: p.timeSpecificStartTime,
        timeSpecificEndTime: p.timeSpecificEndTime,
        timeSpecificPrice: p.timeSpecificPrice,
        timeSpecificLabel: p.timeSpecificLabel,
        isFeatured: p.isFeatured,
        tags: p.tags,
        customizationRemovals: p.customizationRemovals,
        customizationAddons: p.customizationAddons,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
    });
  } catch (error: any) {
    console.error('[Sync API] Error syncing products:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

