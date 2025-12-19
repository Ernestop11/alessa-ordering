import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/prisma';
import { SubscriptionManager } from '@/lib/stripe/subscription-manager';

export const dynamic = 'force-dynamic';

/**
 * POST /api/super/tenants/[id]/subscribe
 * 
 * Add product to tenant subscription
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session || role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { productId, tierId, billingCycle = 'monthly' } = body;

    if (!productId) {
      return NextResponse.json(
        { error: 'productId is required' },
        { status: 400 }
      );
    }

    const subscriptionManager = new SubscriptionManager();
    const tenantProduct = await subscriptionManager.addProduct(
      params.id,
      productId,
      tierId,
      billingCycle
    );

    return NextResponse.json({
      success: true,
      tenantProduct,
    });
  } catch (error: any) {
    console.error('[subscribe] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add product to subscription' },
      { status: 500 }
    );
  }
}

