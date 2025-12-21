/**
 * Register Apple Pay domain with Stripe Connect account
 *
 * Usage: npx ts-node scripts/register-apple-pay-domain.ts
 *
 * For Stripe Connect, domains must be registered on the CONNECTED account,
 * not the platform account.
 */

import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_CONNECT_ACCOUNT_ID = 'acct_1Sfp0eBmqcNiYSKM'; // Las Reinas
const DOMAINS_TO_REGISTER = [
  'lasreinascolusa.com',
  'lasreinas.alessacloud.com',
];

async function registerApplePayDomains() {
  if (!STRIPE_SECRET_KEY) {
    console.error('❌ STRIPE_SECRET_KEY not set');
    process.exit(1);
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2022-11-15',
  });

  console.log('🍎 Registering Apple Pay domains for Stripe Connect account:', STRIPE_CONNECT_ACCOUNT_ID);
  console.log('');

  for (const domain of DOMAINS_TO_REGISTER) {
    try {
      console.log(`📝 Registering domain: ${domain}`);

      // Register on the connected account
      const result = await stripe.applePayDomains.create(
        { domain_name: domain },
        { stripeAccount: STRIPE_CONNECT_ACCOUNT_ID }
      );

      console.log(`✅ Successfully registered: ${domain}`);
      console.log(`   ID: ${result.id}`);
      console.log(`   Live Mode: ${result.livemode}`);
      console.log('');
    } catch (error: any) {
      if (error.code === 'domain_already_exists' || error.message?.includes('already registered')) {
        console.log(`ℹ️  Domain already registered: ${domain}`);
        console.log('');
      } else {
        console.error(`❌ Failed to register ${domain}:`, error.message);
        console.log('');
      }
    }
  }

  // List all registered domains
  console.log('📋 Listing all registered Apple Pay domains...');
  try {
    const domains = await stripe.applePayDomains.list(
      { limit: 100 },
      { stripeAccount: STRIPE_CONNECT_ACCOUNT_ID }
    );

    if (domains.data.length === 0) {
      console.log('   No domains registered yet.');
    } else {
      for (const domain of domains.data) {
        console.log(`   - ${domain.domain_name} (${domain.livemode ? 'live' : 'test'})`);
      }
    }
  } catch (error: any) {
    console.error('❌ Failed to list domains:', error.message);
  }

  console.log('');
  console.log('✅ Done!');
}

registerApplePayDomains();
