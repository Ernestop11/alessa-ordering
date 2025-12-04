/**
 * Multi-Product Commission System
 * 
 * Handles commission calculation for different product types
 */

import prisma from '../prisma';
import { ProductType } from '@prisma/client';

export interface ProductCommissionRates {
  subscription?: number; // % of subscription fee
  platformFee?: number; // % of platform fees
  orderVolume?: number; // % of order volume
  monthly?: number; // % of monthly fees
  setup?: number; // % of setup fees
  domain?: number; // % of domain fees
  sale?: number; // % of one-time sale
  transaction?: number; // % of transaction
  license?: number; // % of license fee
  wholesale?: number; // % of wholesale order
  hosting?: number; // % of hosting fees (alias for monthly, used in templates)
}

export const COMMISSION_RATES: Record<ProductType, ProductCommissionRates> = {
  ORDERING_SYSTEM: {
    subscription: 0.10, // 10% of monthly subscription
    platformFee: 0.05, // 5% of platform fees
    orderVolume: 0.02, // 2% of order volume (bonus)
  },
  WEB_HOSTING: {
    monthly: 0.15, // 15% of hosting fees
    setup: 0.50, // 50% of setup fees
    domain: 0.20, // 20% of domain renewals
    subscription: 0.15, // Alias for monthly
  },
  DIGITAL_MENU: {
    subscription: 0.12, // 12% of subscription
    license: 0.10, // 10% of license fees
  },
  MARKETING_APP: {
    subscription: 0.10, // 10% of subscription
    transaction: 0.03, // 3% of transactions
  },
  WEBSITE_TEMPLATE: {
    sale: 0.30, // 30% of template sale
    hosting: 0.15, // 15% of hosting (if bundled)
  },
  MINI_BODEGA: {
    transaction: 0.05, // 5% of transactions
    wholesale: 0.10, // 10% of wholesale orders
  },
};

/**
 * Calculate commission for a product sale
 */
export function calculateProductCommission(
  productType: ProductType,
  amount: number,
  commissionType: keyof ProductCommissionRates
): number {
  const rates = COMMISSION_RATES[productType];
  const rate = rates[commissionType];

  if (!rate) {
    return 0;
  }

  return amount * rate;
}

/**
 * Create commission for ordering system subscription
 */
export async function createOrderingSystemCommission(
  tenantId: string,
  subscriptionAmount: number,
  description?: string
): Promise<void> {
  const referral = await prisma.tenantReferral.findFirst({
    where: {
      tenantId,
      status: { in: ['approved', 'active'] },
    },
    include: {
      associate: true,
      tenant: {
        select: { id: true, name: true },
      },
    },
  });

  if (!referral) {
    return;
  }

  const commissionAmount = calculateProductCommission(
    'ORDERING_SYSTEM',
    subscriptionAmount,
    'subscription'
  );

  await prisma.commission.create({
    data: {
      associateId: referral.associateId,
      tenantId: tenantId,
      referralId: referral.id,
      productType: 'ORDERING_SYSTEM',
      amount: commissionAmount,
      type: 'SUBSCRIPTION',
      status: 'PENDING',
      description: description || `Commission for ${referral.tenant.name} subscription`,
    },
  });

  // Update associate earnings
  await prisma.associate.update({
    where: { id: referral.associateId },
    data: {
      totalEarnings: { increment: commissionAmount },
      totalCommissions: { increment: commissionAmount },
      totalPending: { increment: commissionAmount },
      lifetimeEarnings: { increment: commissionAmount },
    },
  });
}

/**
 * Create commission for platform fees (ordering system)
 */
export async function createPlatformFeeCommission(
  tenantId: string,
  platformFeeAmount: number,
  orderId: string,
  description?: string
): Promise<void> {
  const referral = await prisma.tenantReferral.findFirst({
    where: {
      tenantId,
      status: { in: ['approved', 'active'] },
    },
  });

  if (!referral) {
    return;
  }

  const commissionAmount = calculateProductCommission(
    'ORDERING_SYSTEM',
    platformFeeAmount,
    'platformFee'
  );

  if (commissionAmount <= 0) {
    return;
  }

  await prisma.commission.create({
    data: {
      associateId: referral.associateId,
      tenantId: tenantId,
      orderId: orderId,
      referralId: referral.id,
      productType: 'ORDERING_SYSTEM',
      amount: commissionAmount,
      type: 'ORDER_VOLUME',
      status: 'PENDING',
      description: description || `Platform fee commission for order ${orderId}`,
    },
  });

  // Update associate earnings
  await prisma.associate.update({
    where: { id: referral.associateId },
    data: {
      totalEarnings: { increment: commissionAmount },
      totalCommissions: { increment: commissionAmount },
      totalPending: { increment: commissionAmount },
      lifetimeEarnings: { increment: commissionAmount },
    },
  });
}

/**
 * Create commission for web hosting
 */
export async function createHostingCommission(
  associateId: string,
  hostingAccountId: string,
  amount: number,
  commissionType: 'monthly' | 'setup' | 'domain',
  description?: string
): Promise<void> {
  const rate = COMMISSION_RATES.WEB_HOSTING[commissionType];
  if (!rate) {
    return;
  }

  const commissionAmount = amount * rate;

  await prisma.commission.create({
    data: {
      associateId,
      productType: 'WEB_HOSTING',
      amount: commissionAmount,
      type: 'HOSTING' as any, // Using HOSTING from CommissionType enum
      status: 'PENDING',
      description: description || `Hosting commission (${commissionType})`,
    },
  });

  // Also create a sale record
  await prisma.sale.create({
    data: {
      associateId,
      productType: 'WEB_HOSTING',
      productId: hostingAccountId,
      customerName: 'Hosting Customer',
      amount: amount,
      commission: commissionAmount,
      status: 'completed',
    },
  });

  // Update associate earnings
  await prisma.associate.update({
    where: { id: associateId },
    data: {
      totalEarnings: { increment: commissionAmount },
      totalCommissions: { increment: commissionAmount },
      totalPending: { increment: commissionAmount },
      lifetimeEarnings: { increment: commissionAmount },
    },
  });
}

/**
 * Create commission for template sale
 */
export async function createTemplateSaleCommission(
  associateId: string,
  templateId: string,
  saleAmount: number,
  description?: string
): Promise<void> {
  const commissionAmount = calculateProductCommission(
    'WEBSITE_TEMPLATE',
    saleAmount,
    'sale'
  );

  await prisma.commission.create({
    data: {
      associateId,
      productType: 'WEBSITE_TEMPLATE',
      amount: commissionAmount,
      type: 'TEMPLATE_SALE' as any, // Using TEMPLATE_SALE from CommissionType enum
      status: 'PENDING',
      description: description || `Template sale commission`,
    },
  });

  // Create sale record
  await prisma.sale.create({
    data: {
      associateId,
      productType: 'WEBSITE_TEMPLATE',
      productId: templateId,
      customerName: 'Template Customer',
      amount: saleAmount,
      commission: commissionAmount,
      status: 'completed',
    },
  });

  // Update associate earnings
  await prisma.associate.update({
    where: { id: associateId },
    data: {
      totalEarnings: { increment: commissionAmount },
      totalCommissions: { increment: commissionAmount },
      totalPending: { increment: commissionAmount },
      lifetimeEarnings: { increment: commissionAmount },
    },
  });
}

