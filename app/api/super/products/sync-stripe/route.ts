import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import prisma from '@/lib/prisma';
import { getStripeClient } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

/**
 * POST /api/super/products/sync-stripe
 * 
 * Sync products and pricing tiers with Stripe
 * Creates Stripe products and prices if missing
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session || role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stripe = getStripeClient();
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        pricingTiers: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    const results = [];

    for (const product of products) {
      try {
        // Create or update Stripe product
        let stripeProduct;
        if (product.stripeProductId) {
          try {
            stripeProduct = await stripe.products.retrieve(product.stripeProductId);
          } catch (e) {
            // Product not found, create new one
            stripeProduct = null;
          }
        }

        if (!stripeProduct) {
          stripeProduct = await stripe.products.create({
            name: product.name,
            description: product.description || undefined,
            metadata: {
              productId: product.id,
              slug: product.slug,
            },
          });

          await prisma.product.update({
            where: { id: product.id },
            data: { stripeProductId: stripeProduct.id },
          });
        }

        // Sync pricing tiers
        for (const tier of product.pricingTiers) {
          try {
            // Create monthly price if missing
            if (!tier.stripePriceId) {
              const monthlyPrice = await stripe.prices.create({
                product: stripeProduct.id,
                unit_amount: Math.round(tier.monthlyPrice * 100), // Convert to cents
                currency: 'usd',
                recurring: {
                  interval: 'month',
                },
                metadata: {
                  tierId: tier.id,
                  tierSlug: tier.slug,
                },
              });

              await prisma.productPricingTier.update({
                where: { id: tier.id },
                data: { stripePriceId: monthlyPrice.id },
              });
            }

            // Create yearly price if missing and yearly price exists
            if (tier.yearlyPrice && !tier.stripeYearlyPriceId) {
              const yearlyPrice = await stripe.prices.create({
                product: stripeProduct.id,
                unit_amount: Math.round(tier.yearlyPrice * 100),
                currency: 'usd',
                recurring: {
                  interval: 'year',
                },
                metadata: {
                  tierId: tier.id,
                  tierSlug: tier.slug,
                },
              });

              await prisma.productPricingTier.update({
                where: { id: tier.id },
                data: { stripeYearlyPriceId: yearlyPrice.id },
              });
            }
          } catch (tierError) {
            console.error(`Error syncing tier ${tier.id}:`, tierError);
          }
        }

        results.push({
          productId: product.id,
          productName: product.name,
          stripeProductId: stripeProduct.id,
          success: true,
        });
      } catch (productError: any) {
        console.error(`Error syncing product ${product.id}:`, productError);
        results.push({
          productId: product.id,
          productName: product.name,
          success: false,
          error: productError.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      synced: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    });
  } catch (error: any) {
    console.error('[sync-stripe] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync with Stripe' },
      { status: 500 }
    );
  }
}

