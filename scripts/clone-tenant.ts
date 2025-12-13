#!/usr/bin/env tsx
/**
 * Clone Tenant Script
 * Clones Las Reinas tenant to La Poblanita (or any source to target)
 * 
 * Usage:
 *   tsx scripts/clone-tenant.ts lasreinas lapoblanita
 *   or
 *   npm run clone:tenant lasreinas lapoblanita
 */

import dotenv from 'dotenv';
dotenv.config();

import prisma from '../lib/prisma';

async function cloneTenant(sourceSlug: string, targetSlug: string, expiresAt?: string) {
  console.log(`📦 Cloning tenant: ${sourceSlug} → ${targetSlug}\n`);

  try {
    // 1. Find source tenant
    const source = await prisma.tenant.findUnique({
      where: { slug: sourceSlug },
      include: {
        settings: true,
        integrations: true,
        menuSections: {
          include: {
            menuItems: {
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { position: 'asc' },
        },
        cateringSections: {
          include: {
            packages: {
              orderBy: { displayOrder: 'asc' },
            },
          },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!source) {
      console.error(`❌ Source tenant "${sourceSlug}" not found`);
      process.exit(1);
    }

    console.log(`✅ Found source tenant: ${source.name}`);
    console.log(`   Menu Sections: ${source.menuSections.length}`);
    console.log(`   Menu Items: ${source.menuSections.reduce((sum, s) => sum + s.menuItems.length, 0)}`);
    console.log(`   Catering Sections: ${source.cateringSections.length}`);
    console.log(`   Catering Packages: ${source.cateringSections.reduce((sum, s) => sum + s.packages.length, 0)}\n`);

    // 2. Check if target exists
    const existing = await prisma.tenant.findUnique({
      where: { slug: targetSlug },
    });

    if (existing) {
      console.log(`⚠️  Tenant "${targetSlug}" already exists`);
      console.log(`   ID: ${existing.id}`);
      console.log(`   Name: ${existing.name}`);
      console.log(`\n   Do you want to update it? (This will overwrite existing data)`);
      // For now, we'll skip if exists - you can add confirmation logic later
      console.log(`   Skipping clone...`);
      return existing;
    }

    // 3. Create new tenant (copy basic data)
    console.log(`📝 Creating new tenant: ${targetSlug}`);
    const newTenant = await prisma.tenant.create({
      data: {
        name: `La Poblanita Mexican Food`, // You can customize this
        slug: targetSlug,
        domain: `${targetSlug}.alessacloud.com`,
        contactEmail: source.contactEmail ? source.contactEmail.replace('lasreinas', 'lapoblanita') : null,
        contactPhone: source.contactPhone,
        addressLine1: source.addressLine1,
        addressLine2: source.addressLine2,
        city: source.city,
        state: source.state,
        postalCode: source.postalCode,
        country: source.country,
        logoUrl: source.logoUrl,
        heroImageUrl: source.heroImageUrl,
        heroTitle: source.heroTitle,
        heroSubtitle: source.heroSubtitle,
        primaryColor: source.primaryColor,
        secondaryColor: source.secondaryColor,
        status: source.status,
        subscriptionPlan: source.subscriptionPlan,
        subscriptionMonthlyFee: source.subscriptionMonthlyFee,
        subscriptionAddons: source.subscriptionAddons,
        featureFlags: source.featureFlags,
        // Copy settings
        settings: source.settings
          ? {
              create: {
                tagline: source.settings.tagline,
                about: source.settings.about,
                socialInstagram: source.settings.socialInstagram,
                socialFacebook: source.settings.socialFacebook,
                socialTikTok: source.settings.socialTikTok,
                socialYouTube: source.settings.socialYouTube,
                deliveryRadiusMi: source.settings.deliveryRadiusMi,
                minimumOrderValue: source.settings.minimumOrderValue,
                currency: source.settings.currency,
                timeZone: source.settings.timeZone,
                operatingHours: source.settings.operatingHours as any,
                membershipProgram: source.settings.membershipProgram as any,
                upsellBundles: source.settings.upsellBundles as any,
                rewards: source.settings.rewards as any,
                emailOffers: source.settings.emailOffers as any,
                accessibilityDefaults: source.settings.accessibilityDefaults as any,
                branding: source.settings.branding as any,
                cateringTabConfig: source.settings.cateringTabConfig as any,
                cateringGallery: source.settings.cateringGallery,
                rewardsGallery: source.settings.rewardsGallery,
                isOpen: source.settings.isOpen,
              },
            }
          : undefined,
        // Copy integrations
        integrations: source.integrations
          ? {
              create: {
                platformPercentFee: source.integrations.platformPercentFee,
                platformFlatFee: source.integrations.platformFlatFee,
                defaultTaxRate: source.integrations.defaultTaxRate,
                deliveryBaseFee: source.integrations.deliveryBaseFee,
                taxProvider: source.integrations.taxProvider,
                paymentProcessor: source.integrations.paymentProcessor,
                autoAcceptOrders: source.integrations.autoAcceptOrders,
                autoPrintOrders: source.integrations.autoPrintOrders,
                fulfillmentNotificationsEnabled: source.integrations.fulfillmentNotificationsEnabled,
              },
            }
          : undefined,
      },
    });

    console.log(`✅ Created tenant: ${newTenant.name} (${newTenant.id})\n`);

    // 4. Copy menu sections and items
    console.log(`📋 Copying menu sections and items...`);
    for (const section of source.menuSections) {
      const newSection = await prisma.menuSection.create({
        data: {
          tenantId: newTenant.id,
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
            tenantId: newTenant.id,
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
      }
      console.log(`   ✓ ${section.name}: ${section.menuItems.length} items`);
    }

    // 5. Copy catering sections and packages
    console.log(`\n🍽️  Copying catering sections and packages...`);
    for (const section of source.cateringSections) {
      const newSection = await prisma.cateringSection.create({
        data: {
          tenantId: newTenant.id,
          name: section.name,
          description: section.description,
          position: section.position,
        },
      });

      for (const pkg of section.packages) {
        await prisma.cateringPackage.create({
          data: {
            tenantId: newTenant.id,
            cateringSectionId: newSection.id,
            name: pkg.name,
            description: pkg.description,
            pricePerGuest: pkg.pricePerGuest,
            price: pkg.price,
            category: pkg.category,
            image: pkg.image,
            gallery: pkg.gallery as any,
            badge: pkg.badge,
            customizationRemovals: pkg.customizationRemovals,
            customizationAddons: pkg.customizationAddons as any,
            available: pkg.available,
            displayOrder: pkg.displayOrder,
            timeSpecificEnabled: (pkg as any).timeSpecificEnabled || false,
            timeSpecificDays: (pkg as any).timeSpecificDays || [],
            timeSpecificStartTime: (pkg as any).timeSpecificStartTime || null,
            timeSpecificEndTime: (pkg as any).timeSpecificEndTime || null,
            timeSpecificPrice: (pkg as any).timeSpecificPrice || null,
            timeSpecificLabel: (pkg as any).timeSpecificLabel || null,
          },
        });
      }
      console.log(`   ✓ ${section.name}: ${section.packages.length} packages`);
    }

    // 6. Create product subscription for Alessa Ordering
    console.log(`\n💳 Creating product subscription...`);
    const orderingProduct = await prisma.product.findUnique({
      where: { slug: 'alessa-ordering' },
    });

    if (orderingProduct) {
      const subscriptionData: any = {
        tenantId: newTenant.id,
        productId: orderingProduct.id,
        status: expiresAt ? 'prepaid' : 'active',
        subscribedAt: new Date(),
      };

      if (expiresAt) {
        subscriptionData.expiresAt = new Date(expiresAt);
      }

      await prisma.tenantProduct.create({
        data: subscriptionData,
      });
      console.log(`   ✓ Subscribed to ${orderingProduct.name}`);
      if (expiresAt) {
        console.log(`   ✓ Expires: ${new Date(expiresAt).toLocaleDateString()}`);
      }
    } else {
      console.log(`   ⚠️  Ordering product not found - skipping subscription`);
    }

    console.log(`\n🎉 Tenant cloned successfully!`);
    console.log(`\n📊 Summary:`);
    console.log(`   - Tenant: ${newTenant.name}`);
    console.log(`   - Slug: ${newTenant.slug}`);
    console.log(`   - Menu Sections: ${source.menuSections.length}`);
    console.log(`   - Menu Items: ${source.menuSections.reduce((sum, s) => sum + s.menuItems.length, 0)}`);
    console.log(`   - Catering Sections: ${source.cateringSections.length}`);
    console.log(`   - Catering Packages: ${source.cateringSections.reduce((sum, s) => sum + s.packages.length, 0)}`);
    console.log(`\n💡 Next steps:`);
    console.log(`   1. Visit: https://${targetSlug}.alessacloud.com/order`);
    console.log(`   2. Admin: /admin?tenant=${targetSlug}`);
    console.log(`   3. Update tenant-specific info (name, contact, etc.)\n`);

    return newTenant;
  } catch (error: any) {
    console.error('\n❌ Error cloning tenant:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Get arguments from command line
const sourceSlug = process.argv[2] || 'lasreinas';
const targetSlug = process.argv[3] || 'lapoblanita';
const expiresAt = process.argv[4] || '2027-09-09'; // Default to Sept 9, 2027

if (!sourceSlug || !targetSlug) {
  console.error('❌ Usage: tsx scripts/clone-tenant.ts <source-slug> <target-slug> [expires-at]');
  console.error('   Example: tsx scripts/clone-tenant.ts lasreinas lapoblanita 2027-09-09');
  process.exit(1);
}

cloneTenant(sourceSlug, targetSlug, expiresAt)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });

