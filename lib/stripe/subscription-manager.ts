/**
 * Stripe Subscription Manager
 * 
 * Handles creating and managing Stripe subscriptions for tenants
 */

import Stripe from 'stripe';
import prisma from '@/lib/prisma';
import { getStripeClient } from '@/lib/stripe';
import type { Tenant } from '@prisma/client';

export class SubscriptionManager {
  private stripe: Stripe;

  constructor() {
    this.stripe = getStripeClient();
  }

  /**
   * Get or create Stripe customer for tenant
   */
  async getOrCreateCustomer(tenant: Tenant): Promise<string> {
    if (tenant.stripeCustomerId) {
      return tenant.stripeCustomerId;
    }

    const customer = await this.stripe.customers.create({
      email: tenant.contactEmail || undefined,
      name: tenant.name,
      metadata: {
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
      },
    });

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { stripeCustomerId: customer.id },
    });

    return customer.id;
  }

  /**
   * Add product to tenant subscription
   */
  async addProduct(
    tenantId: string,
    productId: string,
    tierId?: string,
    billingCycle: 'monthly' | 'yearly' = 'monthly'
  ): Promise<any> {
    // 1. Get tenant and verify Stripe customer exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const customerId = await this.getOrCreateCustomer(tenant);

    // 2. Get product and tier, verify stripePriceId exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        pricingTiers: true,
      },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    // Check if tenant already has this product
    const existing = await prisma.tenantProduct.findUnique({
      where: {
        tenantId_productId: {
          tenantId,
          productId,
        },
      },
    });

    if (existing && existing.status === 'active') {
      throw new Error('Tenant already has this product');
    }

    // Get price ID
    let priceId: string | null = null;
    if (tierId) {
      const tier = product.pricingTiers.find((t) => t.id === tierId);
      if (!tier) {
        throw new Error('Tier not found');
      }
      priceId = billingCycle === 'yearly' && tier.stripeYearlyPriceId
        ? tier.stripeYearlyPriceId
        : tier.stripePriceId;
    } else if (product.stripeProductId) {
      // Use base product price (if no tiers)
      // This would need to be set up separately
      throw new Error('Product requires a tier selection');
    }

    if (!priceId) {
      throw new Error('Stripe price ID not found. Please sync products with Stripe first.');
    }

    // 3. Check if tenant has existing subscription
    const existingSubscription = await prisma.tenantProduct.findFirst({
      where: {
        tenantId,
        status: 'active',
        stripeSubscriptionId: { not: null },
      },
    });

    let subscriptionId: string;
    let subscriptionItemId: string;
    let currentPeriodStart: Date;
    let currentPeriodEnd: Date;

    if (existingSubscription?.stripeSubscriptionId) {
      // Add item to existing subscription
      const subscriptionItem = await this.stripe.subscriptionItems.create({
        subscription: existingSubscription.stripeSubscriptionId,
        price: priceId,
        quantity: 1,
      });

      subscriptionId = existingSubscription.stripeSubscriptionId;
      subscriptionItemId = subscriptionItem.id;

      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      currentPeriodStart = new Date(subscription.current_period_start * 1000);
      currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    } else {
      // Create new subscription
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        metadata: {
          tenantId,
          tenantSlug: tenant.slug,
        },
      });

      subscriptionId = subscription.id;
      subscriptionItemId = subscription.items.data[0].id;
      currentPeriodStart = new Date(subscription.current_period_start * 1000);
      currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    }

    // Calculate monthly amount
    const tier = tierId ? product.pricingTiers.find((t) => t.id === tierId) : null;
    const monthlyAmount = tier
      ? billingCycle === 'yearly' && tier.yearlyPrice
        ? tier.yearlyPrice / 12
        : tier.monthlyPrice
      : product.monthlyPrice || 0;

    // 5. Create or update TenantProduct record
    const tenantProduct = await prisma.tenantProduct.upsert({
      where: {
        tenantId_productId: {
          tenantId,
          productId,
        },
      },
      create: {
        tenantId,
        productId,
        tierId: tierId || null,
        status: 'active',
        billingCycle,
        stripeSubscriptionId: subscriptionId,
        stripeSubscriptionItemId: subscriptionItemId,
        currentPeriodStart,
        currentPeriodEnd,
        monthlyAmount,
      },
      update: {
        tierId: tierId || undefined,
        status: 'active',
        billingCycle,
        stripeSubscriptionId: subscriptionId,
        stripeSubscriptionItemId: subscriptionItemId,
        currentPeriodStart,
        currentPeriodEnd,
        monthlyAmount,
        cancelledAt: null,
        cancelReason: null,
      },
    });

    return tenantProduct;
  }

  /**
   * Remove product from subscription
   */
  async removeProduct(tenantId: string, productId: string): Promise<void> {
    const tenantProduct = await prisma.tenantProduct.findUnique({
      where: {
        tenantId_productId: {
          tenantId,
          productId,
        },
      },
    });

    if (!tenantProduct) {
      throw new Error('Tenant product not found');
    }

    if (tenantProduct.stripeSubscriptionItemId) {
      // Delete subscription item from Stripe
      await this.stripe.subscriptionItems.del(tenantProduct.stripeSubscriptionItemId);
    }

    // Update TenantProduct status to cancelled
    await prisma.tenantProduct.update({
      where: { id: tenantProduct.id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelReason: 'Removed by admin',
      },
    });
  }

  /**
   * Change tier (upgrade/downgrade)
   */
  async changeTier(
    tenantProductId: string,
    newTierId: string,
    billingCycle?: 'monthly' | 'yearly'
  ): Promise<any> {
    const tenantProduct = await prisma.tenantProduct.findUnique({
      where: { id: tenantProductId },
      include: {
        product: {
          include: {
            pricingTiers: true,
          },
        },
      },
    });

    if (!tenantProduct) {
      throw new Error('Tenant product not found');
    }

    const newTier = tenantProduct.product.pricingTiers.find((t) => t.id === newTierId);
    if (!newTier) {
      throw new Error('Tier not found');
    }

    const cycle = billingCycle || tenantProduct.billingCycle;
    const newPriceId = cycle === 'yearly' && newTier.stripeYearlyPriceId
      ? newTier.stripeYearlyPriceId
      : newTier.stripePriceId;

    if (!newPriceId) {
      throw new Error('Stripe price ID not found for tier');
    }

    if (!tenantProduct.stripeSubscriptionItemId) {
      throw new Error('No subscription item found');
    }

    // Update subscription item price
    await this.stripe.subscriptionItems.update(tenantProduct.stripeSubscriptionItemId, {
      price: newPriceId,
      proration_behavior: 'create_prorations',
    });

    // Update database
    const monthlyAmount = cycle === 'yearly' && newTier.yearlyPrice
      ? newTier.yearlyPrice / 12
      : newTier.monthlyPrice;

    const updated = await prisma.tenantProduct.update({
      where: { id: tenantProductId },
      data: {
        tierId: newTierId,
        billingCycle: cycle,
        monthlyAmount,
      },
    });

    return updated;
  }

  /**
   * Get tenant's current MRR (Monthly Recurring Revenue)
   */
  async getTenantMRR(tenantId: string): Promise<number> {
    const products = await prisma.tenantProduct.findMany({
      where: {
        tenantId,
        status: 'active',
      },
    });

    return products.reduce((sum, p) => sum + p.monthlyAmount, 0);
  }
}

