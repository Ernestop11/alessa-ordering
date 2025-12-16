#!/usr/bin/env tsx
/**
 * Reset Stripe Connect Account
 * 
 * Clears the old Stripe Connect account ID and prepares for creating a new one
 * This is useful when you need to create a new account in LIVE mode
 * after having created one in TEST mode.
 * 
 * Usage:
 *   tsx scripts/reset-stripe-account.ts lasreinas
 */

import prisma from '../lib/prisma';

async function resetStripeAccount(tenantSlug: string) {
  console.log(`🔄 Resetting Stripe Connect account for: ${tenantSlug}\n`);

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      include: { integrations: true },
    });

    if (!tenant) {
      console.error(`❌ Tenant "${tenantSlug}" not found`);
      process.exit(1);
    }

    const accountId = tenant.integrations?.stripeAccountId;
    
    if (!accountId) {
      console.log('ℹ️  No Stripe Connect account found. Nothing to reset.\n');
      console.log('💡 You can generate a new onboarding link:');
      console.log(`   npm run generate:onboarding ${tenantSlug}\n`);
      process.exit(0);
    }

    console.log(`📋 Current account ID: ${accountId}`);
    console.log('⚠️  This will clear the account ID from the database.');
    console.log('   The old account will remain in Stripe (you can delete it manually if needed).');
    console.log('   A new account will be created when you generate a new onboarding link.\n');

    // Clear the account ID
    await prisma.tenantIntegration.update({
      where: { tenantId: tenant.id },
      data: {
        stripeAccountId: null,
        stripeOnboardingComplete: false,
        stripeChargesEnabled: false,
        stripePayoutsEnabled: false,
        stripeDetailsSubmitted: false,
      },
    });

    console.log('✅ Account ID cleared from database\n');
    console.log('📝 Next steps:');
    console.log(`   1. Generate new onboarding link: npm run generate:onboarding ${tenantSlug}`);
    console.log('   2. The new account will be created in LIVE mode (if using live keys)');
    console.log('   3. Complete the onboarding process\n');

    // Log the action
    await prisma.integrationLog.create({
      data: {
        tenantId: tenant.id,
        source: 'stripe-connect',
        level: 'info',
        message: 'Stripe Connect account reset',
        payload: {
          oldAccountId: accountId,
          resetAt: new Date().toISOString(),
          reason: 'Creating new account in live mode',
        },
      },
    });

    console.log('✅ Reset complete!\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

const tenantSlug = process.argv[2] || 'lasreinas';
resetStripeAccount(tenantSlug)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());




















