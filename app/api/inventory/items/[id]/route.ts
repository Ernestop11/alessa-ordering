import { NextRequest, NextResponse } from 'next/server';
import { resolveInventoryAuth } from '@/lib/inventory-auth';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await resolveInventoryAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const item = await prisma.inventoryItem.findFirst({
      where: { id: params.id, tenantId: auth.tenantId },
      include: {
        menuSection: { select: { id: true, name: true, type: true } },
        movements: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error: any) {
    console.error('[Inventory Item GET]', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch item' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await resolveInventoryAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Verify item belongs to tenant
    const existing = await prisma.inventoryItem.findFirst({
      where: { id: params.id, tenantId: auth.tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const {
      name, sku, category, unit, costPerUnit, salePrice,
      reorderPoint, expirationDate, menuSectionId,
      vendorName, barcode, image, active,
    } = body;

    const item = await prisma.inventoryItem.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(sku !== undefined && { sku: sku || null }),
        ...(category !== undefined && { category }),
        ...(unit !== undefined && { unit }),
        ...(costPerUnit !== undefined && { costPerUnit }),
        ...(salePrice !== undefined && { salePrice: salePrice || null }),
        ...(reorderPoint !== undefined && { reorderPoint: reorderPoint || null }),
        ...(expirationDate !== undefined && { expirationDate: expirationDate ? new Date(expirationDate) : null }),
        ...(menuSectionId !== undefined && { menuSectionId: menuSectionId || null }),
        ...(vendorName !== undefined && { vendorName: vendorName || null }),
        ...(barcode !== undefined && { barcode: barcode || null }),
        ...(image !== undefined && { image: image || null }),
        ...(active !== undefined && { active }),
      },
      include: {
        menuSection: { select: { id: true, name: true, type: true } },
      },
    });

    return NextResponse.json({ item });
  } catch (error: any) {
    console.error('[Inventory Item PUT]', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'An item with this SKU already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await resolveInventoryAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existing = await prisma.inventoryItem.findFirst({
      where: { id: params.id, tenantId: auth.tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    await prisma.inventoryItem.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Inventory Item DELETE]', error);
    return NextResponse.json({ error: error.message || 'Failed to delete item' }, { status: 500 });
  }
}
