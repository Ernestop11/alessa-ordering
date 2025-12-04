#!/usr/bin/env tsx
/**
 * Check Stripe Account Mode
 * 
 * Verifies if Stripe Connect accounts are in live or test mode
 * 
 * Usage:
 *   tsx scripts/check-stripe-account-mode.ts lasreinas
 */

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

import { getStripeClient } from '../lib/stripe';
import prisma from '../lib/prisma';

async function checkAccountMode(tenantSlug: string) {
  console.log(`🔍 Checking Stripe account mode for: ${tenantSlug}\n`);

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
      console.error(`❌ No Stripe Connect account found for ${tenantSlug}`);
      process.exit(1);
    }

    const stripe = getStripeClient();
    
    // Check platform account mode
    const platformAccount = await stripe.accounts.retrieve();
    console.log('📋 Platform Account:');
    console.log(`   Account ID: ${platformAccount.id}`);
    console.log(`   Type: ${platformAccount.type}`);
    console.log(`   Livemode: ${platformAccount.livemode ? '✅ LIVE' : '❌ TEST'}`);
    console.log(`   Country: ${platformAccount.country}\n`);

    // Check connected account mode
    const connectedAccount = await stripe.accounts.retrieve(accountId);
    console.log('📋 Connected Account (Las Reinas):');
    console.log(`   Account ID: ${connectedAccount.id}`);
    console.log(`   Type: ${connectedAccount.type}`);
    console.log(`   Livemode: ${connectedAccount.livemode ? '✅ LIVE' : '❌ TEST'}`);
    console.log(`   Charges Enabled: ${connectedAccount.charges_enabled ? '✅' : '❌'}`);
    console.log(`   Payouts Enabled: ${connectedAccount.payouts_enabled ? '✅' : '❌'}`);
    console.log(`   Details Submitted: ${connectedAccount.details_submitted ? '✅' : '❌'}\n`);

    if (!connectedAccount.livemode) {
      console.log('⚠️  WARNING: Connected account is in TEST mode!');
      console.log('   This means it was created with test keys.');
      console.log('   You need to delete this account and create a new one with live keys.\n');
      
      console.log('💡 Solution:');
      console.log('   1. Run: tsx scripts/reset-stripe-account.ts lasreinas');
      console.log('   2. This will clear the old account and create a new one');
      console.log('   3. Generate a new onboarding link\n');
    } else {
      console.log('✅ Connected account is in LIVE mode - correct!\n');
    }

    // Check if keys match account mode
    const isLiveKey = process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_');
    if (isLiveKey && !connectedAccount.livemode) {
      console.log('❌ MISMATCH: Using LIVE keys but account is in TEST mode!');
      console.log('   The account was created before switching to live keys.');
      console.log('   You need to create a new account.\n');
    } else if (!isLiveKey && connectedAccount.livemode) {
      console.log('❌ MISMATCH: Using TEST keys but account is in LIVE mode!');
      console.log('   This should not happen. Check your keys.\n');
    } else {
      console.log('✅ Keys and account mode match!\n');
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

const tenantSlug = process.argv[2] || 'lasreinas';
checkAccountMode(tenantSlug)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

