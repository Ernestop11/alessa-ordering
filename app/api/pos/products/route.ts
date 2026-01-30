import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET - List POS products (InventoryItems with salePrice set)
 * These are items available for sale at the checkout counter
 */
export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get('tenantSlug');
    if (!slug) {
      return NextResponse.json({ error: 'tenantSlug is required' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const category = request.nextUrl.searchParams.get('category');
    const departmentId = request.nextUrl.searchParams.get('departmentId');
    const search = request.nextUrl.searchParams.get('search');

    const where: any = {
      tenantId: tenant.id,
      active: true,
      salePrice: { not: null },
    };

    if (category) where.category = category;
    if (departmentId) where.menuSectionId = departmentId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ];
    }

    const products = await prisma.inventoryItem.findMany({
      where,
      select: {
        id: true,
        name: true,
        sku: true,
        barcode: true,
        category: true,
        unit: true,
        salePrice: true,
        costPerUnit: true,
        currentStock: true,
        image: true,
        menuSection: { select: { id: true, name: true } },
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    // Get unique categories for filter
    const categories = [...new Set(products.map((p) => p.category))];

    return NextResponse.json({ products, categories });
  } catch (error: any) {
    console.error('[POS Products GET]', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch products' }, { status: 500 });
  }
}
