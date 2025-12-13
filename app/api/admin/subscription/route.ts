import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tenant = await requireTenant();

    // Get all product subscriptions for this tenant
    const subscriptions = await prisma.tenantProduct.findMany({
      where: {
        tenantId: tenant.id,
      },
      include: {
        product: true,
      },
      orderBy: {
        subscribedAt: 'desc',
      },
    });

    // Find ordering subscription specifically
    const orderingSubscription = subscriptions.find(
      (sub) => sub.product.slug === 'alessa-ordering'
    );

    if (!orderingSubscription) {
      return Response.json({
        subscription: null,
        subscriptions: subscriptions.map((sub) => ({
          id: sub.id,
          productName: sub.product.name,
          productSlug: sub.product.slug,
          status: sub.status,
          subscribedAt: sub.subscribedAt,
          expiresAt: sub.expiresAt,
          trialEndsAt: sub.trialEndsAt,
          daysUntilExpiry: sub.expiresAt
            ? Math.ceil((sub.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : null,
        })),
      });
    }

    const daysUntilExpiry = orderingSubscription.expiresAt
      ? Math.ceil(
          (orderingSubscription.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        )
      : null;

    return Response.json({
      subscription: {
        id: orderingSubscription.id,
        productName: orderingSubscription.product.name,
        productSlug: orderingSubscription.product.slug,
        status: orderingSubscription.status,
        subscribedAt: orderingSubscription.subscribedAt,
        expiresAt: orderingSubscription.expiresAt,
        trialEndsAt: orderingSubscription.trialEndsAt,
        daysUntilExpiry,
      },
      subscriptions: subscriptions.map((sub) => ({
        id: sub.id,
        productName: sub.product.name,
        productSlug: sub.product.slug,
        status: sub.status,
        subscribedAt: sub.subscribedAt,
        expiresAt: sub.expiresAt,
        trialEndsAt: sub.trialEndsAt,
        daysUntilExpiry: sub.expiresAt
          ? Math.ceil((sub.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : null,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching subscription:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

