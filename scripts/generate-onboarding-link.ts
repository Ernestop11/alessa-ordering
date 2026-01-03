#!/usr/bin/env tsx
/**
 * Generate Stripe Connect Onboarding Link
 * 
 * Generates an onboarding link for a specific tenant
 * 
 * Usage:
 *   tsx scripts/generate-onboarding-link.ts lasreinas
 *   or
 *   npm run generate:onboarding lasreinas
 */

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

import { getStripeClient } from '../lib/stripe';
import prisma from '../lib/prisma';

async function generateOnboardingLink(tenantSlug: string) {
  console.log(`🔗 Generating Stripe Connect onboarding link for: ${tenantSlug}\n`);

  try {
    // Find tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      include: { integrations: true },
    });

    if (!tenant) {
      console.error(`❌ Tenant "${tenantSlug}" not found`);
      process.exit(1);
    }

    console.log(`✅ Found tenant: ${tenant.name}`);
    console.log(`   Email: ${tenant.contactEmail || 'Not set'}`);
    console.log(`   Address: ${tenant.addressLine1 || 'Not set'}, ${tenant.city || ''}, ${tenant.state || ''}\n`);

    const stripe = getStripeClient();
    let accountId = tenant.integrations?.stripeAccountId;

    // Build company information from tenant data
    const companyInfo: any = {};
    if (tenant.name) companyInfo.name = tenant.name;
    if (tenant.contactPhone) companyInfo.phone = tenant.contactPhone;
    
    if (tenant.addressLine1 || tenant.city || tenant.state || tenant.postalCode) {
      companyInfo.address = {};
      if (tenant.addressLine1) companyInfo.address.line1 = tenant.addressLine1;
      if (tenant.addressLine2) companyInfo.address.line2 = tenant.addressLine2;
      if (tenant.city) companyInfo.address.city = tenant.city;
      if (tenant.state) companyInfo.address.state = tenant.state;
      if (tenant.postalCode) companyInfo.address.postal_code = tenant.postalCode;
      if (tenant.country) companyInfo.address.country = tenant.country;
    }

    // Create or update Stripe Connect account
    if (!accountId) {
      console.log('📝 Creating new Stripe Connect Express account...');
      
      const accountData: any = {
        type: 'express',
        country: tenant.country || 'US',
        email: tenant.contactEmail || undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'company',
        business_profile: {
          name: tenant.name,
          mcc: '5812', // Restaurant
          product_description: `Online ordering for ${tenant.name}`,
        },
        metadata: {
          tenantId: tenant.id,
          tenantSlug: tenant.slug,
          platform: 'alessa-ordering',
        },
      };

      if (Object.keys(companyInfo).length > 0) {
        accountData.company = companyInfo;
      }

      const account = await stripe.accounts.create(accountData);
      accountId = account.id;

      await prisma.tenantIntegration.upsert({
        where: { tenantId: tenant.id },
        create: {
          tenantId: tenant.id,
          stripeAccountId: accountId,
          stripeOnboardingComplete: false,
          stripeChargesEnabled: false,
          stripePayoutsEnabled: false,
        },
        update: {
          stripeAccountId: accountId,
        },
      });

      console.log(`✅ Created Stripe Connect account: ${accountId}\n`);
    } else {
      console.log(`✅ Using existing Stripe Connect account: ${accountId}\n`);
      
      // Update account with latest tenant info
      try {
        const updateData: any = {};
        if (Object.keys(companyInfo).length > 0) {
          updateData.company = companyInfo;
        }
        if (Object.keys(updateData).length > 0) {
          await stripe.accounts.update(accountId, updateData);
          console.log('✅ Updated account with latest tenant information\n');
        }
      } catch (updateError: any) {
        console.warn(`⚠️  Could not update account: ${updateError.message}\n`);
      }
    }

    // Get the base URL from tenant's configured domain
    // For LIVE keys, Stripe requires HTTPS - use production URL
    const isLiveMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_');
    const ROOT_DOMAIN = process.env.ROOT_DOMAIN || 'alessacloud.com';

    // Build URL from tenant's domain config
    let baseUrl: string;
    if (tenant.customDomain) {
      baseUrl = `https://${tenant.customDomain}`;
    } else if (tenant.domain) {
      baseUrl = `https://${tenant.domain}`;
    } else {
      baseUrl = `https://${tenant.slug}.${ROOT_DOMAIN}`;
    }

    // Override with env if explicitly set
    if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.includes('localhost')) {
      baseUrl = process.env.NEXTAUTH_URL;
    }

    // If using live keys, ensure HTTPS (Stripe requirement)
    if (isLiveMode) {
      baseUrl = baseUrl.replace(/^http:\/\//, 'https://');
      if (baseUrl.includes('localhost')) {
        console.error('❌ Cannot use localhost with live Stripe keys!');
        console.log(`   Use the tenant domain instead: https://${tenant.customDomain || tenant.domain || tenant.slug + '.' + ROOT_DOMAIN}`);
        process.exit(1);
      }
    } else {
      // Test mode can use localhost if explicitly set
      if (process.env.NEXTAUTH_URL?.includes('localhost')) {
        baseUrl = 'http://localhost:3001';
      }
    }
    
    const redirectUrl = baseUrl;

    console.log(`🌐 Using redirect URL: ${redirectUrl}\n`);

    // Generate onboarding link
    console.log('🔗 Generating onboarding link...');
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${redirectUrl}/admin/stripe-connect/refresh`,
      return_url: `${redirectUrl}/admin/stripe-connect/complete`,
      type: 'account_onboarding',
    });

    console.log('\n' + '='.repeat(70));
    console.log('✅ ONBOARDING LINK GENERATED');
    console.log('='.repeat(70));
    console.log(`\n📋 Tenant: ${tenant.name} (${tenantSlug})`);
    console.log(`🔗 Account ID: ${accountId}`);
    console.log(`\n🌐 Onboarding URL:`);
    console.log(`\n${accountLink.url}\n`);
    console.log('='.repeat(70));
    console.log('\n💡 Instructions:');
    console.log('   1. Copy the URL above');
    console.log('   2. Open it in a browser (or send to restaurant owner)');
    console.log('   3. Complete Stripe onboarding form');
    console.log('   4. After completion, you\'ll be redirected back');
    console.log('   5. Run the test again to verify connection\n');

    // Log to database
    await prisma.integrationLog.create({
      data: {
        tenantId: tenant.id,
        source: 'stripe-connect',
        level: 'info',
        message: 'Onboarding link generated',
        payload: {
          accountId,
          onboardingUrl: accountLink.url,
          generatedAt: new Date().toISOString(),
        },
      },
    });

    return accountLink.url;
  } catch (error: any) {
    console.error('\n❌ Error generating onboarding link:', error.message);
    if (error.type === 'StripeAuthenticationError') {
      console.error('\n⚠️  Authentication error - check your Stripe keys are correct');
    }
    process.exit(1);
  }
}

// Get tenant slug from command line
const tenantSlug = process.argv[2];

if (!tenantSlug) {
  console.error('❌ Usage: tsx scripts/generate-onboarding-link.ts <tenant-slug>');
  console.error('   Example: tsx scripts/generate-onboarding-link.ts lasreinas');
  process.exit(1);
}

generateOnboardingLink(tenantSlug)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });

