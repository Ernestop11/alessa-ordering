/**
 * MLM Commission Automation
 * 
 * Automatically creates commissions when:
 * - Tenant subscription is paid
 * - Tenant goes LIVE (first month commission)
 * - Order volume milestones are reached
 */

import prisma from '../prisma';

/**
 * Create commission for tenant subscription payment
 */
export async function createSubscriptionCommission(
  tenantId: string,
  amount: number,
  description?: string
): Promise<void> {
  try {
    // Find active referral for this tenant
    const referral = await prisma.tenantReferral.findFirst({
      where: {
        tenantId,
        status: { in: ['approved', 'active'] },
      },
      include: {
        associate: true,
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!referral) {
      // No referral found, skip commission
      return;
    }

    // Calculate commission (10% of subscription fee by default)
    const commissionAmount = amount * referral.commissionRate;

    // Create commission
    await prisma.commission.create({
      data: {
        associateId: referral.associateId,
        tenantId: tenantId,
        referralId: referral.id,
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
  } catch (error) {
    console.error('Error creating subscription commission:', error);
    // Don't throw - commission creation shouldn't break tenant operations
  }
}

/**
 * Approve referral when tenant goes LIVE
 */
export async function approveReferralOnTenantLive(tenantId: string): Promise<void> {
  try {
    const referral = await prisma.tenantReferral.findFirst({
      where: {
        tenantId,
        status: 'pending',
      },
    });

    if (referral) {
      await prisma.tenantReferral.update({
        where: { id: referral.id },
        data: {
          status: 'approved',
          approvedAt: new Date(),
        },
      });
    }
  } catch (error) {
    console.error('Error approving referral:', error);
  }
}

/**
 * Activate referral when tenant starts paying
 */
export async function activateReferral(tenantId: string): Promise<void> {
  try {
    const referral = await prisma.tenantReferral.findFirst({
      where: {
        tenantId,
        status: { in: ['pending', 'approved'] },
      },
    });

    if (referral) {
      await prisma.tenantReferral.update({
        where: { id: referral.id },
        data: {
          status: 'active',
          activatedAt: new Date(),
        },
      });
    }
  } catch (error) {
    console.error('Error activating referral:', error);
  }
}

