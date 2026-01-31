#!/usr/bin/env tsx
/**
 * Setup Tacos Jalisco Vallejo tenant
 * Clones menu structure from lasreinas with Tacos Jalisco branding
 *
 * Usage (on VPS only):
 *   npx tsx scripts/setup-tacosjalisco.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import prisma from '../lib/prisma';

async function setup() {
  console.log('🌮 Setting up Tacos Jalisco Vallejo tenant...\n');

  // 1. Check if already exists
  const existing = await prisma.tenant.findUnique({ where: { slug: 'tacosjalisco' } });
  if (existing) {
    console.log(`⚠️  Tenant "tacosjalisco" already exists (${existing.id})`);
    console.log('   Delete it first if you want to recreate.');
    await prisma.$disconnect();
    return;
  }

  // 2. Get lasreinas as source for menu/settings mold
  const source = await prisma.tenant.findUnique({
    where: { slug: 'lasreinas' },
    include: {
      settings: true,
      integrations: true,
      menuSections: {
        include: { menuItems: { orderBy: { createdAt: 'asc' } } },
        orderBy: { position: 'asc' },
      },
      cateringSections: {
        include: { packages: { orderBy: { displayOrder: 'asc' } } },
        orderBy: { position: 'asc' },
      },
    },
  });

  if (!source) {
    console.error('❌ Source tenant "lasreinas" not found');
    process.exit(1);
  }

  console.log(`✅ Found source mold: ${source.name}`);
  console.log(`   Menu Sections: ${source.menuSections.length}`);
  console.log(`   Menu Items: ${source.menuSections.reduce((sum, s) => sum + s.menuItems.length, 0)}\n`);

  // 3. Create the tenant with Tacos Jalisco branding
  console.log('📝 Creating tenant record...');
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Tacos Jalisco Vallejo',
      slug: 'tacosjalisco',
      domain: 'tacosjalisco.alessacloud.com',
      customDomain: null,
      contactEmail: 'info@tacosjalisco.com',
      contactPhone: '(707) 555-0000',
      addressLine1: 'Vallejo, CA',
      city: 'Vallejo',
      state: 'CA',
      postalCode: '94590',
      country: 'USA',
      logoUrl: '/tenant/tacosjalisco/logo.png',
      heroImageUrl: '/tenant/tacosjalisco/hero.jpg',
      heroTitle: 'TACOS JALISCO',
      heroSubtitle: 'Authentic Jalisco-Style Tacos in Vallejo',
      primaryColor: '#166534',
      secondaryColor: '#f59e0b',
      status: 'LIVE',
      subscriptionPlan: 'alessa-starter',
      subscriptionMonthlyFee: 0,
      featureFlags: ['restaurant'],

      // Settings - fresh for Tacos Jalisco, structure from lasreinas mold
      settings: {
        create: {
          tagline: 'Authentic Jalisco-Style Tacos',
          about: 'Tacos Jalisco Vallejo - Authentic Jalisco-style Mexican street food in the heart of Vallejo, CA.',
          deliveryRadiusMi: 5,
          minimumOrderValue: 15,
          currency: 'USD',
          timeZone: 'America/Los_Angeles',
          isOpen: true,
          templateType: 'restaurant',
          gradientFrom: '#14532d',
          gradientVia: '#166534',
          gradientTo: '#15803d',
          operatingHours: {
            timezone: 'America/Los_Angeles',
            storeHours: {
              monday:    { open: '09:00', close: '21:00', closed: false },
              tuesday:   { open: '09:00', close: '21:00', closed: false },
              wednesday: { open: '09:00', close: '21:00', closed: false },
              thursday:  { open: '09:00', close: '21:00', closed: false },
              friday:    { open: '09:00', close: '22:00', closed: false },
              saturday:  { open: '09:00', close: '22:00', closed: false },
              sunday:    { open: '10:00', close: '20:00', closed: false },
            },
            holidays: [],
            temporarilyClosed: false,
          },
          membershipProgram: {
            enabled: true,
            heroCopy: 'Earn points with every order and unlock exclusive rewards!',
            pointsPerDollar: 10,
            featuredMemberName: 'Gold Member',
            tiers: [
              {
                id: 'tier-tj-bronze',
                name: 'Bronze',
                perks: ['Earn 10 points per $1 spent', 'Monthly specials via email'],
                sortOrder: 0,
                threshold: 0,
                badgeColor: '#b45309',
                rewardDescription: 'Welcome! Start earning points today.',
              },
              {
                id: 'tier-tj-silver',
                name: 'Silver',
                perks: ['Free drink on orders over $25', 'Birthday surprise'],
                sortOrder: 1,
                threshold: 250,
                badgeColor: '#6b7280',
                rewardDescription: 'Unlock exclusive rewards.',
              },
              {
                id: 'tier-tj-gold',
                name: 'Gold',
                perks: ['10% off all orders', 'Free dessert on birthdays', 'Priority support'],
                sortOrder: 2,
                threshold: 500,
                badgeColor: '#d97706',
                rewardDescription: 'VIP perks for our best customers.',
              },
            ],
          },
          accessibilityDefaults: {
            largeText: true,
            highContrast: false,
            reducedMotion: false,
          },
          branding: {
            logo: '/tenant/tacosjalisco/logo.png',
            hours: 'Mon-Thu 9AM-9PM\nFri-Sat 9AM-10PM\nSun 10AM-8PM',
            location: 'Tacos Jalisco Vallejo\nVallejo, CA',
            heroImages: ['/tenant/tacosjalisco/hero.jpg'],
            highlights: [
              'Authentic Jalisco recipes',
              'Fresh ingredients daily',
              'Family-owned and operated',
            ],
          },
          frontendConfig: {
            layoutConfig: { preset: 'normal' },
            frontendUISections: [
              {
                id: 'hero',
                name: 'Hero Section',
                type: 'hero',
                content: {
                  title: '',
                  subtitle: 'Authentic Jalisco flavors crafted with passion',
                  buttonLink: '#menu',
                  buttonText: 'ORDER NOW',
                },
                enabled: true,
                position: 0,
              },
              {
                id: 'featuredCarousel',
                name: 'Featured Carousel',
                type: 'featuredCarousel',
                content: {
                  title: 'Our Favorites',
                  subtitle: 'Handpicked by our chef',
                },
                enabled: true,
                position: 1,
              },
              {
                id: 'quickInfo',
                name: 'Quick Info Bar',
                type: 'quickInfo',
                content: {},
                enabled: true,
                position: 2,
              },
              {
                id: 'menuSections',
                name: 'Menu Sections',
                type: 'menuSections',
                content: {},
                enabled: true,
                position: 3,
              },
            ],
          },
          upsellBundles: [],
          cateringGallery: [],
          rewardsGallery: [],
        },
      },

      // Integrations - basic defaults, no Stripe yet
      integrations: {
        create: {
          platformPercentFee: 0.029,
          platformFlatFee: 0.30,
          defaultTaxRate: 0.0875,
          deliveryBaseFee: 5.99,
          taxProvider: 'builtin',
          taxFilingState: 'CA',
          paymentProcessor: 'stripe',
          autoAcceptOrders: false,
          autoPrintOrders: false,
          fulfillmentNotificationsEnabled: true,
        },
      },
    },
  });

  console.log(`✅ Created tenant: ${tenant.name} (${tenant.id})\n`);

  // 4. Clone menu sections and items from lasreinas
  console.log('📋 Cloning menu sections and items from lasreinas...');
  let totalItems = 0;
  for (const section of source.menuSections) {
    const newSection = await prisma.menuSection.create({
      data: {
        tenantId: tenant.id,
        name: section.name,
        description: section.description,
        type: section.type,
        position: section.position,
        hero: section.hero,
        imageUrl: section.imageUrl,
      },
    });

    for (const item of section.menuItems) {
      await prisma.menuItem.create({
        data: {
          tenantId: tenant.id,
          menuSectionId: newSection.id,
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          image: item.image,
          gallery: item.gallery as any,
          available: item.available,
          isFeatured: item.isFeatured,
          tags: item.tags,
          customizationRemovals: item.customizationRemovals,
          customizationAddons: item.customizationAddons as any,
          timeSpecificEnabled: (item as any).timeSpecificEnabled || false,
          timeSpecificDays: (item as any).timeSpecificDays || [],
          timeSpecificStartTime: (item as any).timeSpecificStartTime || null,
          timeSpecificEndTime: (item as any).timeSpecificEndTime || null,
          timeSpecificPrice: (item as any).timeSpecificPrice || null,
          timeSpecificLabel: (item as any).timeSpecificLabel || null,
        },
      });
      totalItems++;
    }
    console.log(`   ✓ ${section.name}: ${section.menuItems.length} items`);
  }

  // 5. Create product subscription
  console.log('\n💳 Creating product subscription...');
  const orderingProduct = await prisma.product.findUnique({
    where: { slug: 'alessa-ordering' },
  });

  if (orderingProduct) {
    await prisma.tenantProduct.create({
      data: {
        tenantId: tenant.id,
        productId: orderingProduct.id,
        status: 'active',
        subscribedAt: new Date(),
      },
    });
    console.log('   ✓ Subscribed to Alessa Ordering');
  } else {
    console.log('   ⚠️  Ordering product not found - skipping subscription');
  }

  // Summary
  console.log('\n🎉 Tacos Jalisco Vallejo is ready!\n');
  console.log('📊 Summary:');
  console.log(`   - Tenant ID: ${tenant.id}`);
  console.log(`   - Slug: tacosjalisco`);
  console.log(`   - Domain: tacosjalisco.alessacloud.com`);
  console.log(`   - Status: LIVE`);
  console.log(`   - Menu Sections: ${source.menuSections.length}`);
  console.log(`   - Menu Items: ${totalItems}`);
  console.log('\n💡 Next steps:');
  console.log('   1. Visit: https://tacosjalisco.alessacloud.com/order');
  console.log('   2. Admin: https://tacosjalisco.alessacloud.com/admin');
  console.log('   3. Upload logo/hero to /public/tenant/tacosjalisco/');

  await prisma.$disconnect();
}

setup().catch((e) => {
  console.error('❌ Setup failed:', e.message);
  process.exit(1);
});
