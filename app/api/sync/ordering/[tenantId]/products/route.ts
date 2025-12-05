import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function validateApiKey(req: Request): boolean {
  const apiKey = req.headers.get('X-API-Key');
  return apiKey === process.env.ALESSACLOUD_API_KEY;
}

export async function GET(
  req: Request,
  { params }: { params: { tenantId: string } }
) {
  try {
    if (!validateApiKey(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const products = await prisma.menuItem.findMany({
      where: { tenantId: params.tenantId },
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

// Allow SMP to update products (bidirectional sync)
export async function POST(
  req: Request,
  { params }: { params: { tenantId: string } }
) {
  try {
    if (!validateApiKey(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    // Verify tenant owns this product
    const existing = await prisma.menuItem.findFirst({
      where: { id, tenantId: params.tenantId },
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
  } catch (error: any) {
    console.error('[Sync API] Error updating product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

