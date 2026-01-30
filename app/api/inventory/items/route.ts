import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session || (role !== 'admin' && role !== 'super_admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await requireTenant();
    const { searchParams } = request.nextUrl;
    const departmentId = searchParams.get('departmentId');
    const category = searchParams.get('category');
    const active = searchParams.get('active');

    const where: any = { tenantId: tenant.id };
    if (departmentId) where.menuSectionId = departmentId;
    if (category) where.category = category;
    if (active !== null) where.active = active !== 'false';

    const items = await prisma.inventoryItem.findMany({
      where,
      include: {
        menuSection: { select: { id: true, name: true, type: true } },
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error('[Inventory Items GET]', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch items' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session || (role !== 'admin' && role !== 'super_admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await requireTenant();
    const body = await request.json();

    const {
      name, sku, category, unit, costPerUnit, salePrice,
      currentStock, reorderPoint, expirationDate,
      menuSectionId, vendorName, barcode, image,
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const item = await prisma.inventoryItem.create({
      data: {
        tenantId: tenant.id,
        name,
        sku: sku || null,
        category: category || 'general',
        unit: unit || 'each',
        costPerUnit: costPerUnit || 0,
        salePrice: salePrice || null,
        currentStock: currentStock || 0,
        reorderPoint: reorderPoint || null,
        expirationDate: expirationDate ? new Date(expirationDate) : null,
        menuSectionId: menuSectionId || null,
        vendorName: vendorName || null,
        barcode: barcode || null,
        image: image || null,
      },
      include: {
        menuSection: { select: { id: true, name: true, type: true } },
      },
    });

    // If initial stock > 0, create a PURCHASE movement
    if (currentStock && currentStock > 0) {
      await prisma.inventoryMovement.create({
        data: {
          tenantId: tenant.id,
          itemId: item.id,
          type: 'PURCHASE',
          quantity: currentStock,
          costPerUnit: costPerUnit || 0,
          notes: 'Initial stock entry',
          createdBy: session.user?.name || session.user?.email || 'admin',
        },
      });
    }

    return NextResponse.json({ item }, { status: 201 });
  } catch (error: any) {
    console.error('[Inventory Items POST]', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'An item with this SKU already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || 'Failed to create item' }, { status: 500 });
  }
}
