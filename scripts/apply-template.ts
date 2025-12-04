#!/usr/bin/env tsx
/**
 * Apply Tenant Template
 * 
 * Creates a new tenant from a template JSON file.
 * This can be used manually or integrated into the onboarding flow.
 * 
 * Usage:
 *   tsx scripts/apply-template.ts new-tenant-slug lasreinas-template.json
 *   or
 *   tsx scripts/apply-template.ts new-tenant-slug (uses lasreinas-template.json by default)
 */

import dotenv from 'dotenv';
dotenv.config();

import prisma from '../lib/prisma';
import fs from 'fs';
import path from 'path';

interface TenantTemplate {
  metadata: {
    name: string;
    slug: string;
    extractedAt: string;
    version: string;
  };
  tenant: any;
  settings: any;
  integrations: any;
  menuSections: any[];
  cateringSections: any[];
}

async function applyTemplate(newTenantSlug: string, templatePath?: string) {
  console.log(`🚀 Applying template to create tenant: ${newTenantSlug}\n`);

  try {
    // Check if tenant already exists
    const existing = await prisma.tenant.findUnique({
      where: { slug: newTenantSlug },
    });

    if (existing) {
      console.error(`❌ Tenant "${newTenantSlug}" already exists`);
      process.exit(1);
    }

    // Load template
    const defaultTemplate = path.join(process.cwd(), 'templates', 'lasreinas-template.json');
    const templateFile = templatePath || defaultTemplate;

    if (!fs.existsSync(templateFile)) {
      console.error(`❌ Template file not found: ${templateFile}`);
      process.exit(1);
    }

    const template: TenantTemplate = JSON.parse(fs.readFileSync(templateFile, 'utf-8'));
    console.log(`✅ Loaded template: ${template.metadata.name}`);
    console.log(`   Original tenant: ${template.metadata.slug}`);
    console.log(`   Extracted: ${new Date(template.metadata.extractedAt).toLocaleDateString()}\n`);

    // Get new tenant name (prompt or use slug)
    const newTenantName = process.argv[3] || newTenantSlug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');

    // Create tenant with template data
    console.log('📝 Creating tenant...');
    const tenant = await prisma.tenant.create({
      data: {
        name: newTenantName,
        slug: newTenantSlug,
        contactEmail: template.tenant.contactEmail,
        contactPhone: template.tenant.contactPhone,
        addressLine1: template.tenant.addressLine1,
        addressLine2: template.tenant.addressLine2,
        city: template.tenant.city,
        state: template.tenant.state,
        postalCode: template.tenant.postalCode,
        country: template.tenant.country,
        logoUrl: template.tenant.logoUrl, // Will need to be updated with new tenant's logo
        heroImageUrl: template.tenant.heroImageUrl, // Will need to be updated
        heroTitle: template.tenant.heroTitle,
        heroSubtitle: template.tenant.heroSubtitle,
        primaryColor: template.tenant.primaryColor,
        secondaryColor: template.tenant.secondaryColor,
        subscriptionPlan: template.tenant.subscriptionPlan,
        subscriptionMonthlyFee: template.tenant.subscriptionMonthlyFee,
        subscriptionAddons: template.tenant.subscriptionAddons,
        featureFlags: template.tenant.featureFlags,
        settings: {
          create: {
            tagline: template.settings.tagline,
            about: template.settings.about,
            socialInstagram: template.settings.socialInstagram,
            socialFacebook: template.settings.socialFacebook,
            socialTikTok: template.settings.socialTikTok,
            socialYouTube: template.settings.socialYouTube,
            deliveryRadiusMi: template.settings.deliveryRadiusMi,
            minimumOrderValue: template.settings.minimumOrderValue,
            currency: template.settings.currency,
            timeZone: template.settings.timeZone,
            operatingHours: template.settings.operatingHours,
            membershipProgram: template.settings.membershipProgram,
            upsellBundles: template.settings.upsellBundles,
            accessibilityDefaults: template.settings.accessibilityDefaults,
            branding: template.settings.branding,
            cateringTabConfig: template.settings.cateringTabConfig,
            cateringGallery: template.settings.cateringGallery,
            rewardsGallery: template.settings.rewardsGallery,
            isOpen: template.settings.isOpen,
          },
        },
        integrations: {
          create: {
            platformPercentFee: template.integrations.platformPercentFee,
            platformFlatFee: template.integrations.platformFlatFee,
            defaultTaxRate: template.integrations.defaultTaxRate,
            deliveryBaseFee: template.integrations.deliveryBaseFee,
            taxProvider: template.integrations.taxProvider,
            paymentProcessor: template.integrations.paymentProcessor,
            autoAcceptOrders: template.integrations.autoAcceptOrders,
            autoPrintOrders: template.integrations.autoPrintOrders,
            fulfillmentNotificationsEnabled: template.integrations.fulfillmentNotificationsEnabled,
          },
        },
      },
    });

    console.log(`✅ Created tenant: ${tenant.name} (${tenant.slug})`);

    // Create menu sections and items
    console.log('\n📋 Creating menu sections and items...');
    for (const sectionTemplate of template.menuSections) {
      const section = await prisma.menuSection.create({
        data: {
          tenantId: tenant.id,
          name: sectionTemplate.name,
          description: sectionTemplate.description,
          type: sectionTemplate.type,
          position: sectionTemplate.position,
          hero: sectionTemplate.hero,
          imageUrl: sectionTemplate.imageUrl,
          menuItems: {
            create: sectionTemplate.menuItems.map((item: any) => ({
              tenantId: tenant.id,
              name: item.name,
              description: item.description,
              price: item.price,
              category: item.category,
              image: item.image,
              gallery: item.gallery,
              available: item.available,
              isFeatured: item.isFeatured,
              tags: item.tags,
              customizationRemovals: item.customizationRemovals,
              customizationAddons: item.customizationAddons,
            })),
          },
        },
      });
      console.log(`   ✅ ${section.name} (${sectionTemplate.menuItems.length} items)`);
    }

    // Create catering sections and packages
    console.log('\n🍽️  Creating catering sections and packages...');
    for (const sectionTemplate of template.cateringSections) {
      const section = await prisma.cateringSection.create({
        data: {
          tenantId: tenant.id,
          name: sectionTemplate.name,
          description: sectionTemplate.description,
          position: sectionTemplate.position,
          imageUrl: sectionTemplate.imageUrl || null,
          packages: {
            create: sectionTemplate.cateringPackages.map((pkg: any) => ({
              tenantId: tenant.id,
              name: pkg.name,
              description: pkg.description,
              pricePerGuest: pkg.pricePerGuest,
              price: pkg.price,
              category: pkg.category,
              image: pkg.image,
              gallery: pkg.gallery,
              badge: pkg.badge,
              customizationRemovals: pkg.customizationRemovals,
              customizationAddons: pkg.customizationAddons,
              available: pkg.available,
              displayOrder: pkg.displayOrder,
            })),
          },
        },
      });
      console.log(`   ✅ ${section.name} (${sectionTemplate.cateringPackages.length} packages)`);
    }

    const totalMenuItems = template.menuSections.reduce((sum, s) => sum + s.menuItems.length, 0);
    const totalPackages = template.cateringSections.reduce((sum, s) => sum + s.cateringPackages.length, 0);

    console.log('\n' + '='.repeat(70));
    console.log('✅ TENANT CREATED SUCCESSFULLY');
    console.log('='.repeat(70));
    console.log(`\n📋 Tenant: ${tenant.name} (${tenant.slug})`);
    console.log(`📊 Summary:`);
    console.log(`   - Menu Sections: ${template.menuSections.length}`);
    console.log(`   - Menu Items: ${totalMenuItems}`);
    console.log(`   - Catering Sections: ${template.cateringSections.length}`);
    console.log(`   - Catering Packages: ${totalPackages}`);
    console.log(`\n🌐 Access URLs:`);
    const rootDomain = process.env.ROOT_DOMAIN || 'alessacloud.com';
    console.log(`   - Order Page: https://${newTenantSlug}.${rootDomain}/order`);
    console.log(`   - Admin: https://${newTenantSlug}.${rootDomain}/admin`);
    console.log(`\n💡 Next steps:`);
    console.log(`   1. Update logo and hero images for the new tenant`);
    console.log(`   2. Customize menu items and pricing`);
    console.log(`   3. Set up Stripe Connect account`);
    console.log(`   4. Configure DNS for ${newTenantSlug}.${rootDomain}\n`);

    return tenant;
  } catch (error: any) {
    console.error('\n❌ Error applying template:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Get arguments
const newTenantSlug = process.argv[2];
const templatePath = process.argv[3];

if (!newTenantSlug) {
  console.error('❌ Usage: tsx scripts/apply-template.ts <new-tenant-slug> [template-path]');
  console.error('   Example: tsx scripts/apply-template.ts newrestaurant');
  console.error('   Example: tsx scripts/apply-template.ts newrestaurant templates/custom-template.json');
  process.exit(1);
}

applyTemplate(newTenantSlug, templatePath)
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

