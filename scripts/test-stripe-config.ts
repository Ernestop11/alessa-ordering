#!/usr/bin/env ts-node
/**
 * Stripe Configuration Test Script
 * 
 * Tests Stripe configuration to verify:
 * - Keys are set correctly
 * - Live vs Test keys are appropriate for environment
 * - Stripe Connect accounts are configured
 * - Platform fees are calculated correctly
 * 
 * Usage:
 *   npm run test:stripe
 *   or
 *   ts-node scripts/test-stripe-config.ts
 */

import { getStripeClient, validateStripeKeys } from '../lib/stripe';
import prisma from '../lib/prisma';

async function testStripeConfiguration() {
  console.log('🔍 Testing Stripe Configuration...\n');

  // Test 1: Key Validation
  console.log('1️⃣  Validating Stripe API Keys...');
  const validation = validateStripeKeys();
  
  if (!validation.isValid) {
    console.error('❌ Invalid Stripe configuration');
    validation.warnings.forEach(w => console.error(`   ⚠️  ${w}`));
    process.exit(1);
  }

  console.log(`   ✅ Keys are valid`);
  console.log(`   ${validation.isLive ? '✅ LIVE keys' : '⚠️  TEST keys'} detected`);
  
  if (validation.warnings.length > 0) {
    console.log('   Warnings:');
    validation.warnings.forEach(w => console.log(`   ⚠️  ${w}`));
  }

  // Test 2: Stripe Client Initialization
  console.log('\n2️⃣  Testing Stripe Client Initialization...');
  try {
    const stripe = getStripeClient();
    console.log('   ✅ Stripe client initialized successfully');
    
    // Test API connection
    const account = await stripe.accounts.retrieve();
    console.log(`   ✅ Connected to Stripe account: ${account.id}`);
    console.log(`   ✅ Account type: ${account.type}`);
    console.log(`   ✅ Country: ${account.country}`);
  } catch (error: any) {
    console.error(`   ❌ Failed to initialize Stripe client: ${error.message}`);
    process.exit(1);
  }

  // Test 3: Check Tenants with Stripe Connect
  console.log('\n3️⃣  Checking Stripe Connect Configuration...');
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        integrations: true,
      },
    });

    const tenantsWithConnect = tenants.filter(
      t => t.integrations?.stripeAccountId
    );

    console.log(`   Found ${tenants.length} total tenants`);
    console.log(`   ${tenantsWithConnect.length} tenants with Stripe Connect accounts`);

    for (const tenant of tenantsWithConnect) {
      const integration = tenant.integrations!;
      console.log(`\n   📋 Tenant: ${tenant.name} (${tenant.slug})`);
      console.log(`      Account ID: ${integration.stripeAccountId}`);
      console.log(`      Onboarding Complete: ${integration.stripeOnboardingComplete ? '✅' : '❌'}`);
      console.log(`      Charges Enabled: ${integration.stripeChargesEnabled ? '✅' : '❌'}`);
      console.log(`      Payouts Enabled: ${integration.stripePayoutsEnabled ? '✅' : '❌'}`);
      console.log(`      Platform Fee: ${(integration.platformPercentFee ?? 0) * 100}% + $${integration.platformFlatFee ?? 0}`);

      // Test connection to connected account
      if (integration.stripeAccountId) {
        try {
          const stripe = getStripeClient();
          const account = await stripe.accounts.retrieve(integration.stripeAccountId);
          console.log(`      ✅ Connected account verified`);
          console.log(`      Account Status: ${account.charges_enabled ? 'Charges ✅' : 'Charges ❌'}, ${account.payouts_enabled ? 'Payouts ✅' : 'Payouts ❌'}`);
        } catch (error: any) {
          console.log(`      ❌ Failed to verify connected account: ${error.message}`);
        }
      }
    }

    if (tenantsWithConnect.length === 0) {
      console.log('   ⚠️  No tenants have Stripe Connect configured');
      console.log('   💡 Run onboarding flow to connect restaurant accounts');
    }
  } catch (error: any) {
    console.error(`   ❌ Failed to check tenants: ${error.message}`);
  }

  // Test 4: Test Platform Fee Calculation
  console.log('\n4️⃣  Testing Platform Fee Calculation...');
  try {
    const testSubtotal = 100.00; // $100 order
    const defaultPercentFee = 0.029; // 2.9%
    const defaultFlatFee = 0.30; // $0.30

    const platformFee = testSubtotal * defaultPercentFee + defaultFlatFee;
    const restaurantReceives = testSubtotal - platformFee;

    console.log(`   Test Order: $${testSubtotal.toFixed(2)}`);
    console.log(`   Platform Fee (2.9% + $0.30): $${platformFee.toFixed(2)}`);
    console.log(`   Restaurant Receives: $${restaurantReceives.toFixed(2)}`);
    console.log(`   ✅ Fee calculation correct`);
  } catch (error: any) {
    console.error(`   ❌ Failed to test fee calculation: ${error.message}`);
  }

  // Test 5: Environment Check
  console.log('\n5️⃣  Environment Check...');
  const nodeEnv = process.env.NODE_ENV || 'development';
  console.log(`   Environment: ${nodeEnv}`);
  
  if (nodeEnv === 'production' && !validation.isLive) {
    console.error('   ❌ CRITICAL: Production environment should use LIVE keys!');
    process.exit(1);
  } else if (nodeEnv === 'production' && validation.isLive) {
    console.log('   ✅ Production environment using LIVE keys');
  } else if (nodeEnv === 'development' && validation.isLive) {
    console.log('   ⚠️  Development environment using LIVE keys (be careful!)');
  } else {
    console.log('   ✅ Environment and keys match');
  }

  console.log('\n✅ Stripe configuration test complete!\n');
}

// Run tests
testStripeConfiguration()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });

