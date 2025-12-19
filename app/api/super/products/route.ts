import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/super/products
 * 
 * List all products with tiers
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session || role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        pricingTiers: {
          orderBy: { sortOrder: 'asc' },
        },
        subscriptions: {
          where: { status: 'active' },
          select: { id: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    // Count active subscriptions per product
    const productsWithCounts = products.map((product) => ({
      ...product,
      subscriptionCount: product.subscriptions.length,
    }));

    return NextResponse.json({ products: productsWithCounts });
  } catch (error: any) {
    console.error('[super-products] GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/super/products
 * 
 * Create new product (super admin only)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session || role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      slug,
      name,
      description,
      category,
      icon,
      color,
      monthlyPrice,
      setupFee,
      features,
      type,
    } = body;

    if (!slug || !name) {
      return NextResponse.json(
        { error: 'slug and name are required' },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        slug,
        name,
        description: description || null,
        category: category || 'addon',
        icon: icon || null,
        color: color || null,
        monthlyPrice: monthlyPrice || null,
        setupFee: setupFee || 0,
        features: features || [],
        type: type || 'ORDERING_SYSTEM',
        isActive: true,
        status: 'active',
      },
      include: {
        pricingTiers: true,
      },
    });

    return NextResponse.json({ product });
  } catch (error: any) {
    console.error('[super-products] POST error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Product with this slug already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to create product' },
      { status: 500 }
    );
  }
}

