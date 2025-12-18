#!/usr/bin/env tsx
/**
 * Verify Stripe Mode
 * 
 * Deep check to verify Stripe is actually using live mode
 */

import dotenv from 'dotenv';
dotenv.config();

import { getStripeClient } from '../lib/stripe';

async function verifyStripeMode() {
  console.log('🔍 Verifying Stripe Mode...\n');

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  console.log('📋 Environment Check:');
  console.log(`   Key starts with: ${stripeSecret?.substring(0, 12)}`);
  console.log(`   Is live key: ${stripeSecret?.startsWith('sk_live_') ? '✅ YES' : '❌ NO'}`);
  console.log(`   Full key length: ${stripeSecret?.length} characters\n`);

  if (!stripeSecret?.startsWith('sk_live_')) {
    console.error('❌ ERROR: Not using live keys!');
    console.error('   Your STRIPE_SECRET_KEY should start with "sk_live_"');
    process.exit(1);
  }

  const stripe = getStripeClient();

  // Retrieve platform account
  console.log('📋 Platform Account Check:');
  try {
    const platformAccount = await stripe.accounts.retrieve();
    console.log(`   Account ID: ${platformAccount.id}`);
    console.log(`   Livemode: ${platformAccount.livemode ? '✅ LIVE' : '❌ TEST'}`);
    console.log(`   Type: ${platformAccount.type}`);
    console.log(`   Country: ${platformAccount.country}\n`);

    if (!platformAccount.livemode) {
      console.log('⚠️  WARNING: Platform account is in TEST mode!');
      console.log('   This might mean:');
      console.log('   1. The live keys belong to a different Stripe account');
      console.log('   2. There\'s a configuration issue');
      console.log('   3. The account needs to be activated for live mode\n');
    }
  } catch (error: any) {
    console.error(`   ❌ Error retrieving platform account: ${error.message}\n`);
  }

  // Test creating a Connect account (we'll delete it)
  console.log('📋 Testing Connect Account Creation:');
  try {
    const testAccount = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'company',
      business_profile: {
        name: 'Test Account - Will Delete',
        mcc: '5812',
      },
      metadata: {
        test: 'true',
        willDelete: 'true',
      },
    });

    console.log(`   Created test account: ${testAccount.id}`);
    console.log(`   Livemode: ${testAccount.livemode ? '✅ LIVE' : '❌ TEST'}\n`);

    if (testAccount.livemode) {
      console.log('✅ SUCCESS: New accounts are created in LIVE mode!');
      console.log('   Your live keys are working correctly.\n');
    } else {
      console.log('❌ PROBLEM: New accounts are being created in TEST mode!');
      console.log('   Even though you\'re using live keys.\n');
      console.log('   Possible causes:');
      console.log('   1. Stripe account needs activation for live mode');
      console.log('   2. Account restrictions or limitations');
      console.log('   3. Need to complete account verification\n');
    }

    // Delete the test account
    console.log('🗑️  Deleting test account...');
    await stripe.accounts.del(testAccount.id);
    console.log('   ✅ Test account deleted\n');

  } catch (error: any) {
    console.error(`   ❌ Error: ${error.message}\n`);
    if (error.type === 'StripePermissionError') {
      console.log('   This might mean your account needs additional permissions.\n');
    }
  }

  console.log('✅ Verification complete!\n');
}

verifyStripeMode()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });






















