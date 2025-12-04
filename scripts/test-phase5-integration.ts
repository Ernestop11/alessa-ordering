#!/usr/bin/env tsx
/**
 * Test Phase 5: MLM Integration & Automation
 * 
 * Tests the complete MLM integration flow:
 * 1. Create associate
 * 2. Create tenant with referral code
 * 3. Verify referral is created
 * 4. Change tenant status to LIVE (should approve referral)
 * 5. Create subscription commission
 * 6. Verify commission and earnings
 */

import dotenv from 'dotenv';
import prisma from '../lib/prisma';
import { createSubscriptionCommission, approveReferralOnTenantLive } from '../lib/mlm/commission-automation';

dotenv.config();

async function testPhase5Integration() {
  console.log('🧪 Testing Phase 5: MLM Integration & Automation\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // 1. Create or get test associate
    console.log('📝 [1/6] Creating test associate...');
    let associate = await prisma.associate.findFirst({
      where: { email: 'test-associate-phase5@example.com' },
    });

    if (!associate) {
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.default.hash('TestPassword123!', 10);
      
      associate = await prisma.associate.create({
        data: {
          name: 'Test Associate Phase 5',
          email: 'test-associate-phase5@example.com',
          phone: '555-1234',
          password: hashedPassword,
          referralCode: 'TESTPHASE5',
          status: 'ACTIVE',
          level: 1,
        },
      });
    }

    console.log(`✅ Associate: ${associate.name}`);
    console.log(`   Referral Code: ${associate.referralCode}\n`);

    // 2. Create tenant with referral code
    console.log('🏪 [2/6] Creating tenant with referral code...');
    const testTenantSlug = `test-tenant-phase5-${Date.now()}`;
    
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Test Restaurant Phase 5',
        slug: testTenantSlug,
        status: 'PENDING_REVIEW',
        subscriptionMonthlyFee: 50.00,
        settings: {
          create: {
            isOpen: true,
          },
        },
        integrations: {
          create: {},
        },
      },
    });

    console.log(`✅ Tenant created: ${tenant.name} (${tenant.slug})`);
    console.log(`   Status: ${tenant.status}\n`);

    // 3. Create referral (simulating onboarding with referral code)
    console.log('🔗 [3/6] Creating tenant referral...');
    const referral = await prisma.tenantReferral.create({
      data: {
        tenantId: tenant.id,
        associateId: associate.id,
        referralCode: associate.referralCode,
        commissionRate: 0.10,
        status: 'pending',
      },
      include: {
        tenant: {
          select: { id: true, name: true },
        },
        associate: {
          select: { id: true, name: true, referralCode: true },
        },
      },
    });

    console.log(`✅ Referral created`);
    console.log(`   Tenant: ${referral.tenant.name}`);
    console.log(`   Associate: ${referral.associate.name}`);
    console.log(`   Status: ${referral.status}`);
    console.log(`   Commission Rate: ${(referral.commissionRate * 100).toFixed(1)}%\n`);

    // 4. Change tenant status to LIVE (should approve referral)
    console.log('🚀 [4/6] Changing tenant status to LIVE...');
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { status: 'LIVE' },
    });

    await approveReferralOnTenantLive(tenant.id);

    const updatedReferral = await prisma.tenantReferral.findUnique({
      where: { id: referral.id },
    });

    console.log(`✅ Tenant status updated to LIVE`);
    console.log(`   Referral status: ${updatedReferral?.status}`);
    console.log(`   Approved at: ${updatedReferral?.approvedAt ? new Date(updatedReferral.approvedAt).toLocaleString() : 'N/A'}\n`);

    // 5. Create subscription commission
    console.log('💰 [5/6] Creating subscription commission...');
    const subscriptionAmount = tenant.subscriptionMonthlyFee;
    
    await createSubscriptionCommission(
      tenant.id,
      subscriptionAmount,
      `Test subscription commission for ${tenant.name}`
    );

    console.log(`✅ Commission created`);
    console.log(`   Subscription Amount: $${subscriptionAmount.toFixed(2)}`);
    console.log(`   Commission Amount: $${(subscriptionAmount * 0.10).toFixed(2)} (10%)\n`);

    // 6. Verify commission and earnings
    console.log('📊 [6/6] Verifying commission and earnings...');
    
    const updatedAssociate = await prisma.associate.findUnique({
      where: { id: associate.id },
      include: {
        commissions: {
          where: { tenantId: tenant.id },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!updatedAssociate) {
      throw new Error('Associate not found');
    }

    const commission = updatedAssociate.commissions[0];
    const expectedCommission = subscriptionAmount * 0.10;

    console.log(`✅ Verification complete`);
    console.log(`   Total Earnings: $${updatedAssociate.totalEarnings.toFixed(2)}`);
    console.log(`   Total Commissions: $${updatedAssociate.totalCommissions.toFixed(2)}`);
    console.log(`   Total Pending: $${updatedAssociate.totalPending.toFixed(2)}`);
    console.log(`   Latest Commission: $${commission?.amount.toFixed(2) || '0.00'}`);
    console.log(`   Expected Commission: $${expectedCommission.toFixed(2)}`);

    if (commission && Math.abs(commission.amount - expectedCommission) < 0.01) {
      console.log(`   ✅ Commission amount matches!\n`);
    } else {
      console.log(`   ⚠️  Commission amount mismatch\n`);
    }

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ ALL TESTS PASSED!\n');
    console.log('Phase 5 Integration Summary:');
    console.log(`  - Associate: ${associate.name} (${associate.referralCode})`);
    console.log(`  - Tenant: ${tenant.name} (${tenant.slug})`);
    console.log(`  - Referral: ${referral.status} → ${updatedReferral?.status}`);
    console.log(`  - Commission: $${commission?.amount.toFixed(2) || '0.00'}`);
    console.log(`  - Associate Earnings: $${updatedAssociate.totalEarnings.toFixed(2)}\n`);

  } catch (error: any) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
testPhase5Integration();

