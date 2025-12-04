#!/usr/bin/env tsx
/**
 * Test MLM Associate Program Flow
 * 
 * Tests the complete MLM flow:
 * 1. Register associate
 * 2. Login associate
 * 3. View associate data
 * 4. Create referral
 * 5. Create commission
 * 6. View downline
 */

import dotenv from 'dotenv';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { authenticateAssociate } from '../lib/mlm/auth';

dotenv.config();

// Generate unique referral code
function generateReferralCode(name: string, email: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 6);
  const emailPart = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 4);
  const random = Math.random().toString(36).substring(2, 6);
  return `${base}${emailPart}${random}`.toUpperCase();
}

async function calculateLevel(sponsorId: string | null): Promise<number> {
  if (!sponsorId) return 1;
  const sponsor = await prisma.associate.findUnique({
    where: { id: sponsorId },
    select: { level: true },
  });
  return (sponsor?.level || 0) + 1;
}

async function testMLMFlow() {
  console.log('🧪 Testing MLM Associate Program Flow (Direct Database)\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // 1. Test Associate Registration
    console.log('📝 [1/6] Testing Associate Registration...');
    const testEmail = `test-associate-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    // Check if email already exists
    const existing = await prisma.associate.findUnique({
      where: { email: testEmail },
    });

    if (existing) {
      await prisma.associate.delete({ where: { id: existing.id } });
    }

    // Generate referral code
    let referralCode = generateReferralCode('Test Associate', testEmail);
    let attempts = 0;
    while (await prisma.associate.findUnique({ where: { referralCode } })) {
      referralCode = generateReferralCode('Test Associate', testEmail) + Math.random().toString(36).substring(2, 4).toUpperCase();
      attempts++;
      if (attempts > 10) {
        throw new Error('Failed to generate unique referral code');
      }
    }

    const level = await calculateLevel(null);
    const hashedPassword = await bcrypt.hash(testPassword, 10);

    const associate = await prisma.associate.create({
      data: {
        name: 'Test Associate',
        email: testEmail,
        phone: '555-1234',
        password: hashedPassword,
        referralCode,
        sponsorId: null,
        level,
        status: 'ACTIVE',
      },
    });

    console.log(`✅ Associate registered: ${associate.name}`);
    console.log(`   ID: ${associate.id}`);
    console.log(`   Referral Code: ${associate.referralCode}`);
    console.log(`   Level: ${associate.level}\n`);

    const associateId = associate.id;

    // 2. Test Associate Login
    console.log('🔐 [2/6] Testing Associate Login...');
    const loginResult = await authenticateAssociate(testEmail, testPassword);

    if (!loginResult.success || !loginResult.associate) {
      throw new Error(`Login failed: ${loginResult.error}`);
    }

    console.log(`✅ Login successful`);
    console.log(`   Associate: ${loginResult.associate.name}`);
    console.log(`   Email: ${loginResult.associate.email}`);
    console.log(`   Referral Code: ${loginResult.associate.referralCode}\n`);

    // 3. Test Get Associate Data
    console.log('📊 [3/6] Testing Get Associate Data...');
    const associateData = await prisma.associate.findUnique({
      where: { id: associateId },
      include: {
        _count: {
          select: { downline: true, referrals: true, commissions: true },
        },
      },
    });

    if (!associateData) {
      throw new Error('Failed to get associate data');
    }

    console.log(`✅ Associate data retrieved`);
    console.log(`   Total Earnings: $${associateData.totalEarnings.toFixed(2)}`);
    console.log(`   Total Commissions: $${associateData.totalCommissions.toFixed(2)}`);
    console.log(`   Status: ${associateData.status}`);
    console.log(`   Downline Count: ${associateData._count.downline}`);
    console.log(`   Referrals Count: ${associateData._count.referrals}`);
    console.log(`   Commissions Count: ${associateData._count.commissions}\n`);

    // 4. Test Create Referral (need a tenant first)
    console.log('🔗 [4/6] Testing Tenant Referral Creation...');
    
    // Find or create a test tenant
    let testTenant = await prisma.tenant.findFirst({
      where: { slug: 'lasreinas' },
    });

    if (!testTenant) {
      console.log('   Creating test tenant...');
      testTenant = await prisma.tenant.create({
        data: {
          name: 'Test Restaurant',
          slug: `test-restaurant-${Date.now()}`,
          status: 'LIVE',
        },
      });
    }

    // Check if referral already exists
    const existingReferral = await prisma.tenantReferral.findUnique({
      where: {
        tenantId_associateId: {
          tenantId: testTenant.id,
          associateId: associateId,
        },
      },
    });

    let referral;
    if (existingReferral) {
      referral = existingReferral;
      console.log(`⚠️  Referral already exists, using existing one`);
    } else {
      referral = await prisma.tenantReferral.create({
        data: {
          tenantId: testTenant.id,
          associateId: associateId,
          referralCode: referralCode,
          commissionRate: 0.10,
          status: 'pending',
        },
        include: {
          tenant: {
            select: { id: true, name: true, slug: true },
          },
        },
      });
    }

    console.log(`✅ Referral created/found`);
    console.log(`   Tenant: ${referral.tenant.name}`);
    console.log(`   Status: ${referral.status}`);
    console.log(`   Commission Rate: ${(referral.commissionRate * 100).toFixed(1)}%\n`);

    // 5. Test Create Commission
    console.log('💰 [5/6] Testing Commission Creation...');
    const commission = await prisma.commission.create({
      data: {
        associateId: associateId,
        tenantId: testTenant.id,
        amount: 25.00,
        type: 'SUBSCRIPTION',
        status: 'PENDING',
        description: 'Test commission for subscription',
      },
    });

    // Update associate earnings
    await prisma.associate.update({
      where: { id: associateId },
      data: {
        totalCommissions: { increment: 25.00 },
        totalPending: { increment: 25.00 },
        lifetimeEarnings: { increment: 25.00 },
      },
    });

    console.log(`✅ Commission created`);
    console.log(`   Amount: $${commission.amount.toFixed(2)}`);
    console.log(`   Type: ${commission.type}`);
    console.log(`   Status: ${commission.status}\n`);

    // 6. Test Get Downline (recursive function)
    console.log('🌳 [6/6] Testing Downline Tree...');
    
    async function buildDownlineTree(id: string, depth: number = 0, maxDepth: number = 5): Promise<any> {
      if (depth >= maxDepth) return null;

      const associate = await prisma.associate.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              downline: true,
              referrals: true,
              commissions: true,
            },
          },
        },
      });

      if (!associate) return null;

      const downline = await prisma.associate.findMany({
        where: { sponsorId: id },
        include: {
          _count: {
            select: {
              downline: true,
              referrals: true,
              commissions: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      const { password, ...associateWithoutPassword } = associate;

      const children = await Promise.all(
        downline.map((child) => buildDownlineTree(child.id, depth + 1, maxDepth))
      );

      return {
        ...associateWithoutPassword,
        children: children.filter(Boolean),
        downlineCount: associate._count.downline,
        referralsCount: associate._count.referrals,
        commissionsCount: associate._count.commissions,
      };
    }

    const downline = await buildDownlineTree(associateId);
    console.log(`✅ Downline tree retrieved`);
    console.log(`   Associate: ${downline.name}`);
    console.log(`   Level: ${downline.level}`);
    console.log(`   Downline Count: ${downline.downlineCount || 0}`);
    console.log(`   Referrals Count: ${downline.referralsCount || 0}`);
    console.log(`   Commissions Count: ${downline.commissionsCount || 0}\n`);

    // Get updated associate data
    const updatedAssociate = await prisma.associate.findUnique({
      where: { id: associateId },
    });

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ ALL TESTS PASSED!\n');
    console.log('Summary:');
    console.log(`  - Associate: ${associate.name} (${associate.email})`);
    console.log(`  - Referral Code: ${referralCode}`);
    console.log(`  - Total Earnings: $${updatedAssociate?.totalEarnings.toFixed(2) || '0.00'}`);
    console.log(`  - Commissions: $${updatedAssociate?.totalCommissions.toFixed(2) || '0.00'}`);
    console.log(`  - Pending: $${updatedAssociate?.totalPending.toFixed(2) || '0.00'}`);
    console.log(`  - Status: ${updatedAssociate?.status}\n`);

  } catch (error: any) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
testMLMFlow();

