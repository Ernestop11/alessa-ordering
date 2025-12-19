import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/prisma';
import { SubscriptionManager } from '@/lib/stripe/subscription-manager';

export const dynamic = 'force-dynamic';

/**
 * GET /api/super/tenants/[id]/products
 * 
 * List tenant's products with subscription details
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session || role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const products = await prisma.tenantProduct.findMany({
      where: { tenantId: params.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
            category: true,
          },
        },
        tier: {
          select: {
            id: true,
            name: true,
            monthlyPrice: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ products });
  } catch (error: any) {
    console.error('[tenant-products] GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tenant products' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/super/tenants/[id]/products?productId={productId}
 * 
 * Remove product from tenant subscription
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session || role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { error: 'productId query parameter is required' },
        { status: 400 }
      );
    }

    const subscriptionManager = new SubscriptionManager();
    await subscriptionManager.removeProduct(params.id, productId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[tenant-products] DELETE error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove product' },
      { status: 500 }
    );
  }
}

