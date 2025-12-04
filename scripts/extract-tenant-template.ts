#!/usr/bin/env tsx
/**
 * Extract Tenant Template
 * 
 * Extracts a tenant's complete configuration (settings, menu, branding, etc.)
 * and saves it as a JSON template that can be used to create new tenants.
 * 
 * Usage:
 *   tsx scripts/extract-tenant-template.ts lasreinas
 *   or
 *   npm run extract:template lasreinas
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
  tenant: {
    name: string;
    slug: string;
    contactEmail: string | null;
    contactPhone: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string | null;
    logoUrl: string | null;
    heroImageUrl: string | null;
    heroTitle: string | null;
    heroSubtitle: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
    subscriptionPlan: string | null;
    subscriptionMonthlyFee: number;
    subscriptionAddons: string[];
    featureFlags: string[];
  };
  settings: {
    tagline: string | null;
    about: string | null;
    socialInstagram: string | null;
    socialFacebook: string | null;
    socialTikTok: string | null;
    socialYouTube: string | null;
    deliveryRadiusMi: number | null;
    minimumOrderValue: number | null;
    currency: string | null;
    timeZone: string | null;
    operatingHours: any;
    membershipProgram: any;
    upsellBundles: any;
    rewards: any;
    emailOffers: any;
    accessibilityDefaults: any;
    branding: any;
    cateringTabConfig: any;
    cateringGallery: string[];
    rewardsGallery: string[];
    isOpen: boolean | null;
  };
  integrations: {
    platformPercentFee: number | null;
    platformFlatFee: number | null;
    defaultTaxRate: number | null;
    deliveryBaseFee: number | null;
    taxProvider: string | null;
    paymentProcessor: string | null;
    autoAcceptOrders: boolean | null;
    autoPrintOrders: boolean | null;
    fulfillmentNotificationsEnabled: boolean | null;
  };
  menuSections: Array<{
    name: string;
    description: string | null;
    type: string;
    position: number;
    hero: boolean;
    imageUrl: string | null;
    menuItems: Array<{
      name: string;
      description: string;
      price: number;
      category: string;
      image: string | null;
      gallery: any;
      available: boolean;
      isFeatured: boolean;
      tags: string[];
      customizationRemovals: string[];
      customizationAddons: any;
    }>;
  }>;
  cateringSections: Array<{
    name: string;
    description: string | null;
    position: number;
    cateringPackages: Array<{
      name: string;
      description: string;
      pricePerGuest: number | null;
      price: number | null;
      category: string;
      image: string | null;
      gallery: any;
      badge: string | null;
      customizationRemovals: string[];
      customizationAddons: any;
      available: boolean;
      displayOrder: number;
    }>;
  }>;
}

async function extractTenantTemplate(tenantSlug: string) {
  console.log(`📦 Extracting template from tenant: ${tenantSlug}\n`);

  try {
    // Find tenant with all related data
    // Use select for settings to avoid issues with missing columns
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      include: {
        settings: {
          select: {
            id: true,
            tenantId: true,
            tagline: true,
            about: true,
            socialInstagram: true,
            socialFacebook: true,
            socialTikTok: true,
            socialYouTube: true,
            deliveryRadiusMi: true,
            minimumOrderValue: true,
            currency: true,
            timeZone: true,
            operatingHours: true,
            membershipProgram: true,
            upsellBundles: true,
            accessibilityDefaults: true,
            branding: true,
            cateringTabConfig: true,
            cateringGallery: true,
            rewardsGallery: true,
            isOpen: true,
            createdAt: true,
            updatedAt: true,
          },
        },
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

    if (!tenant) {
      console.error(`❌ Tenant "${tenantSlug}" not found`);
      process.exit(1);
    }

    console.log(`✅ Found tenant: ${tenant.name}`);
    console.log(`   Sections: ${tenant.menuSections.length}`);
    console.log(`   Menu Items: ${tenant.menuSections.reduce((sum, s) => sum + s.menuItems.length, 0)}`);
    console.log(`   Catering Sections: ${tenant.cateringSections.length}`);
    console.log(`   Catering Packages: ${tenant.cateringSections.reduce((sum, s) => sum + s.packages.length, 0)}\n`);

    // Build template structure
    const template: TenantTemplate = {
      metadata: {
        name: `${tenant.name} Template`,
        slug: tenantSlug,
        extractedAt: new Date().toISOString(),
        version: '1.0.0',
      },
      tenant: {
        name: tenant.name,
        slug: tenant.slug,
        contactEmail: tenant.contactEmail,
        contactPhone: tenant.contactPhone,
        addressLine1: tenant.addressLine1,
        addressLine2: tenant.addressLine2,
        city: tenant.city,
        state: tenant.state,
        postalCode: tenant.postalCode,
        country: tenant.country,
        logoUrl: tenant.logoUrl,
        heroImageUrl: tenant.heroImageUrl,
        heroTitle: tenant.heroTitle,
        heroSubtitle: tenant.heroSubtitle,
        primaryColor: tenant.primaryColor,
        secondaryColor: tenant.secondaryColor,
        subscriptionPlan: tenant.subscriptionPlan,
        subscriptionMonthlyFee: tenant.subscriptionMonthlyFee,
        subscriptionAddons: tenant.subscriptionAddons,
        featureFlags: tenant.featureFlags,
      },
      settings: {
        tagline: tenant.settings?.tagline || null,
        about: tenant.settings?.about || null,
        socialInstagram: tenant.settings?.socialInstagram || null,
        socialFacebook: tenant.settings?.socialFacebook || null,
        socialTikTok: tenant.settings?.socialTikTok || null,
        socialYouTube: tenant.settings?.socialYouTube || null,
        deliveryRadiusMi: tenant.settings?.deliveryRadiusMi || null,
        minimumOrderValue: tenant.settings?.minimumOrderValue || null,
        currency: tenant.settings?.currency || null,
        timeZone: tenant.settings?.timeZone || null,
        operatingHours: (tenant.settings as any)?.operatingHours || null,
        membershipProgram: (tenant.settings as any)?.membershipProgram || null,
        upsellBundles: (tenant.settings as any)?.upsellBundles || null,
        rewards: (tenant.settings as any)?.rewards || null,
        emailOffers: (tenant.settings as any)?.emailOffers || null,
        accessibilityDefaults: (tenant.settings as any)?.accessibilityDefaults || null,
        branding: (tenant.settings as any)?.branding || null,
        cateringTabConfig: (tenant.settings as any)?.cateringTabConfig || null,
        cateringGallery: (tenant.settings as any)?.cateringGallery || [],
        rewardsGallery: (tenant.settings as any)?.rewardsGallery || [],
        isOpen: tenant.settings?.isOpen ?? true,
      },
      integrations: {
        platformPercentFee: tenant.integrations?.platformPercentFee ?? null,
        platformFlatFee: tenant.integrations?.platformFlatFee ?? null,
        defaultTaxRate: tenant.integrations?.defaultTaxRate ?? null,
        deliveryBaseFee: tenant.integrations?.deliveryBaseFee ?? null,
        taxProvider: tenant.integrations?.taxProvider ?? null,
        paymentProcessor: tenant.integrations?.paymentProcessor ?? null,
        autoAcceptOrders: tenant.integrations?.autoAcceptOrders ?? null,
        autoPrintOrders: tenant.integrations?.autoPrintOrders ?? null,
        fulfillmentNotificationsEnabled: tenant.integrations?.fulfillmentNotificationsEnabled ?? null,
      },
      menuSections: tenant.menuSections.map((section) => ({
        name: section.name,
        description: section.description,
        type: section.type,
        position: section.position,
        hero: section.hero,
        imageUrl: section.imageUrl,
        menuItems: section.menuItems.map((item) => ({
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
      })),
      cateringSections: tenant.cateringSections.map((section) => ({
        name: section.name,
        description: section.description,
        position: section.position,
        cateringPackages: section.packages.map((pkg) => ({
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
      })),
    };

    // Create templates directory if it doesn't exist
    const templatesDir = path.join(process.cwd(), 'templates');
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
      console.log(`📁 Created templates directory: ${templatesDir}`);
    }

    // Save template to file
    const templateFileName = `${tenantSlug}-template.json`;
    const templatePath = path.join(templatesDir, templateFileName);
    fs.writeFileSync(templatePath, JSON.stringify(template, null, 2));

    console.log(`\n✅ Template extracted successfully!`);
    console.log(`📄 Saved to: ${templatePath}`);
    console.log(`\n📊 Template Summary:`);
    console.log(`   - Tenant: ${template.tenant.name}`);
    console.log(`   - Menu Sections: ${template.menuSections.length}`);
    console.log(`   - Menu Items: ${template.menuSections.reduce((sum, s) => sum + s.menuItems.length, 0)}`);
    console.log(`   - Catering Sections: ${template.cateringSections.length}`);
    console.log(`   - Catering Packages: ${template.cateringSections.reduce((sum, s) => sum + s.cateringPackages.length, 0)}`);
    console.log(`\n💡 Next steps:`);
    console.log(`   1. Review the template file: ${templatePath}`);
    console.log(`   2. Use it to create new tenants with: tsx scripts/apply-template.ts <new-tenant-slug>`);
    console.log(`   3. Or use it in the OnboardingWizard component\n`);

    return template;
  } catch (error: any) {
    console.error('\n❌ Error extracting template:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Get tenant slug from command line
const tenantSlug = process.argv[2];

if (!tenantSlug) {
  console.error('❌ Usage: tsx scripts/extract-tenant-template.ts <tenant-slug>');
  console.error('   Example: tsx scripts/extract-tenant-template.ts lasreinas');
  process.exit(1);
}

extractTenantTemplate(tenantSlug)
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

