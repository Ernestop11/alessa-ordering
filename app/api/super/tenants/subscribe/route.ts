import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenantId, productSlug, status = 'active', expiresAt } = await req.json();

    if (!tenantId || !productSlug) {
      return NextResponse.json(
        { error: 'tenantId and productSlug required' },
        { status: 400 }
      );
    }

    // Get product
    const product = await prisma.product.findUnique({
      where: { slug: productSlug },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Create or update subscription
    const subscription = await prisma.tenantProduct.upsert({
      where: {
        tenantId_productId: {
          tenantId,
          productId: product.id,
        },
      },
      create: {
        tenantId,
        productId: product.id,
        status,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      update: {
        status,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        cancelledAt: status === 'cancelled' ? new Date() : null,
      },
    });

    // If subscribing to SMP, trigger sync asynchronously
    if (productSlug === 'switchmenu-pro' && (status === 'active' || status === 'prepaid')) {
      // Trigger sync asynchronously (don't wait for it)
      const baseUrl = process.env.NEXTAUTH_URL || 'https://alessacloud.com';
      const apiKey = process.env.ALESSACLOUD_API_KEY;
      
      if (apiKey) {
        fetch(`${baseUrl}/api/sync/smp/trigger`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey,
          },
          body: JSON.stringify({ tenantId }),
        }).catch(err => {
          console.error('[SMP Sync] Failed to trigger sync on subscription:', err);
        });
      } else {
        console.warn('[SMP Sync] ALESSACLOUD_API_KEY not set, cannot trigger sync');
      }
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        tenantId: subscription.tenantId,
        productId: subscription.productId,
        productSlug: product.slug,
        productName: product.name,
        status: subscription.status,
        subscribedAt: subscription.subscribedAt,
        expiresAt: subscription.expiresAt,
      },
    });
  } catch (error: any) {
    console.error('[Subscribe] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}













