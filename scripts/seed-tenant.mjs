#!/usr/bin/env node

/**
 * Tenant auto-seeding script.
 *
 * Usage:
 *   node scripts/seed-tenant.mjs --slug=mixta --input=scripts/seed-data/mixta.json [--domain=mixta.alessacloud.com] [--force]
 *
 * The input JSON should contain:
 * {
 *   "tenant": { "name": "...", "heroTitle": "...", ... },
 *   "settings": { "tagline": "...", ... },
 *   "integrations": { "platformPercentFee": 0.029, ... },
 *   "menu": [
 *     {
 *       "name": "Tacos",
 *       "description": "...",
 *       "type": "RESTAURANT",
 *       "items": [
 *         {
 *           "name": "Pastor Taco",
 *           "description": "...",
 *           "price": 5.5,
 *           "category": "tacos",
 *           "image": "https://example.com/pastor.jpg",
 *           "tags": ["popular"]
 *         }
 *       ]
 *     }
 *   ],
 *   "heroGallery": ["https://..."]
 * }
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import process from 'process';
import { PrismaClient, TenantStatus } from '@prisma/client';

const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_DOMAIN_SUFFIX = 'alessacloud.com';
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    slug: null,
    input: null,
    domain: null,
    force: false,
  };

  for (const arg of args) {
    if (arg.startsWith('--slug=')) {
      options.slug = arg.split('=')[1]?.trim();
    } else if (arg.startsWith('--input=')) {
      options.input = arg.split('=')[1]?.trim();
    } else if (arg.startsWith('--domain=')) {
      options.domain = arg.split('=')[1]?.trim();
    } else if (arg === '--force') {
      options.force = true;
    }
  }

  if (!options.slug) {
    throw new Error('Missing required --slug option.');
  }
  if (!options.input) {
    throw new Error('Missing required --input option.');
  }

  if (!options.domain) {
    options.domain = `${options.slug}.${DEFAULT_DOMAIN_SUFFIX}`;
  }

  return options;
}

function resolveInputPath(input) {
  if (path.isAbsolute(input)) {
    return input;
  }
  return path.join(process.cwd(), input);
}

async function readSeedFile(inputPath) {
  const fileContent = await fs.readFile(inputPath, 'utf8');
  try {
    return JSON.parse(fileContent);
  } catch (error) {
    throw new Error(`Failed to parse JSON from ${inputPath}: ${error.message}`);
  }
}

function getFileExtension(urlOrPath) {
  try {
    const parsed = new URL(urlOrPath);
    const ext = path.extname(parsed.pathname);
    if (ext) return ext;
  } catch {
    // Not a valid URL, fall back to path parsing
  }

  const pathExt = path.extname(urlOrPath);
  if (pathExt) return pathExt;
  return '.jpg';
}

async function ensureLocalAsset(urlOrPath) {
  if (!urlOrPath) return null;

  if (urlOrPath.startsWith('/uploads/')) {
    return urlOrPath;
  }

  // Handle base64 inline data
  if (urlOrPath.startsWith('data:')) {
    const [meta, data] = urlOrPath.split(',');
    if (!data) return null;
    const mime = meta.split(';')[0]?.split(':')[1] ?? 'image/jpeg';
    const extension = mime === 'image/png' ? '.png' : '.jpg';
    const filename = `${Date.now()}-${randomUUID()}${extension}`;
    const outputPath = path.join(uploadsDir, filename);
    const buffer = Buffer.from(data, 'base64');
    await fs.writeFile(outputPath, buffer);
    return `/uploads/${filename}`;
  }

  // Remote URL - fetch and store
  if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
    const response = await fetch(urlOrPath);
    if (!response.ok) {
      console.warn(
        `⚠️  Failed to fetch remote asset ${urlOrPath}: ${response.status} ${response.statusText}. Using remote URL directly.`,
      );
      return urlOrPath;
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const extension = getFileExtension(urlOrPath);
    const filename = `${Date.now()}-${randomUUID()}${extension}`;
    const outputPath = path.join(uploadsDir, filename);
    await fs.writeFile(outputPath, buffer);
    return `/uploads/${filename}`;
  }

  // Local relative asset
  const absolutePath = path.isAbsolute(urlOrPath) ? urlOrPath : path.join(process.cwd(), urlOrPath);
  const data = await fs.readFile(absolutePath);
  const extension = getFileExtension(urlOrPath);
  const filename = `${Date.now()}-${randomUUID()}${extension}`;
  const outputPath = path.join(uploadsDir, filename);
  await fs.writeFile(outputPath, data);
  return `/uploads/${filename}`;
}

function normaliseMenuSection(section, index) {
  if (!section?.name) {
    throw new Error(`Menu section at index ${index} is missing a name.`);
  }
  const items = Array.isArray(section.items) ? section.items : [];
  if (items.length === 0) {
    console.warn(`⚠️  Section "${section.name}" has no menu items. It will still be created.`);
  }
  return {
    name: section.name,
    description: section.description ?? '',
    type: section.type ?? 'RESTAURANT',
    position: Number.isFinite(section.position) ? section.position : index,
    items,
  };
}

async function createTenant({ slug, domain, seed, force }) {
  const existingTenant = await prisma.tenant.findUnique({ where: { slug } });
  if (existingTenant) {
    if (!force) {
      throw new Error(`Tenant with slug "${slug}" already exists. Re-run with --force to overwrite.`);
    }
    console.log(`♻️  Tenant "${slug}" already exists. Existing data will be replaced.`);
  }

  const tenantPayload = seed.tenant ?? {};
  if (!tenantPayload.name) {
    throw new Error('Seed file is missing tenant.name');
  }

  const allowedStatuses = new Set(Object.values(TenantStatus));
  const requestedStatus =
    typeof seed.status === 'string' ? seed.status.trim().toUpperCase() : TenantStatus.PENDING_REVIEW;
  const status = allowedStatuses.has(requestedStatus) ? requestedStatus : TenantStatus.PENDING_REVIEW;
  const statusNotes = typeof seed.statusNotes === 'string' ? seed.statusNotes : null;

  const subscription = seed.subscription ?? {};
  const subscriptionPlan = typeof subscription.plan === 'string' ? subscription.plan : 'alessa-starter';
  const subscriptionMonthlyFee = Number(subscription.monthlyFee ?? 0) || 0;
  const subscriptionAddons = Array.isArray(subscription.addons)
    ? subscription.addons.map((addon) => String(addon))
    : [];

  const logoUrl = await ensureLocalAsset(tenantPayload.logoUrl);
  const heroImageUrl = await ensureLocalAsset(tenantPayload.heroImageUrl);

  const data = {
    name: tenantPayload.name,
    slug,
    domain,
    customDomain: tenantPayload.customDomain ?? null,
    contactEmail: tenantPayload.contactEmail ?? null,
    contactPhone: tenantPayload.contactPhone ?? null,
    addressLine1: tenantPayload.addressLine1 ?? null,
    addressLine2: tenantPayload.addressLine2 ?? null,
    city: tenantPayload.city ?? null,
    state: tenantPayload.state ?? null,
    postalCode: tenantPayload.postalCode ?? null,
    country: tenantPayload.country ?? 'US',
    heroTitle: tenantPayload.heroTitle ?? tenantPayload.name,
    heroSubtitle: tenantPayload.heroSubtitle ?? null,
    primaryColor: tenantPayload.primaryColor ?? '#38c4ff',
    secondaryColor: tenantPayload.secondaryColor ?? '#071836',
    logoUrl,
    heroImageUrl,
    status,
    statusNotes,
    subscriptionPlan,
    subscriptionMonthlyFee,
    subscriptionAddons,
    featureFlags: tenantPayload.featureFlags ?? [],
  };

  if (existingTenant) {
    await prisma.menuItem.deleteMany({ where: { tenantId: existingTenant.id } });
    await prisma.menuSection.deleteMany({ where: { tenantId: existingTenant.id } });
    await prisma.tenantIntegration.deleteMany({ where: { tenantId: existingTenant.id } });
    await prisma.tenantSettings.deleteMany({ where: { tenantId: existingTenant.id } });
    await prisma.tenant.update({ where: { id: existingTenant.id }, data });
    return prisma.tenant.findUnique({ where: { slug } });
  }

  return prisma.tenant.create({ data });
}

async function upsertSettings(tenantId, seed) {
  const settingsPayload = seed.settings ?? {};

  const branding = settingsPayload.branding ?? {};
  const heroImages = Array.isArray(seed.heroGallery)
    ? seed.heroGallery
    : Array.isArray(branding.heroImages)
      ? branding.heroImages
      : [];

  const processedHeroImages = [];
  for (const image of heroImages) {
    processedHeroImages.push(await ensureLocalAsset(image));
  }

  const payload = {
    tagline: settingsPayload.tagline ?? null,
    about: settingsPayload.about ?? null,
    socialInstagram: settingsPayload.socialInstagram ?? null,
    socialFacebook: settingsPayload.socialFacebook ?? null,
    socialTikTok: settingsPayload.socialTikTok ?? null,
    socialYouTube: settingsPayload.socialYouTube ?? null,
    deliveryRadiusMi: Number.isFinite(settingsPayload.deliveryRadiusMi)
      ? settingsPayload.deliveryRadiusMi
      : null,
    minimumOrderValue: Number.isFinite(settingsPayload.minimumOrderValue)
      ? settingsPayload.minimumOrderValue
      : null,
    currency: settingsPayload.currency ?? 'USD',
    timeZone: settingsPayload.timeZone ?? 'America/Los_Angeles',
    membershipProgram: settingsPayload.membershipProgram ?? null,
    upsellBundles: settingsPayload.upsellBundles ?? [],
    accessibilityDefaults: settingsPayload.accessibilityDefaults ?? null,
    isOpen: settingsPayload.isOpen ?? true,
    operatingHours: settingsPayload.operatingHours ?? null,
    branding: {
      ...(branding ?? {}),
      heroImages: processedHeroImages.filter(Boolean),
    },
  };

  await prisma.tenantSettings.upsert({
    where: { tenantId },
    update: payload,
    create: {
      tenantId,
      ...payload,
    },
  });

  return payload;
}

async function upsertIntegrations(tenantId, seed) {
  const integrations = seed.integrations ?? {};

  const payload = {
    platformPercentFee:
      typeof integrations.platformPercentFee === 'number'
        ? integrations.platformPercentFee
        : 0.029,
    platformFlatFee:
      typeof integrations.platformFlatFee === 'number'
        ? integrations.platformFlatFee
        : 0.3,
    defaultTaxRate:
      typeof integrations.defaultTaxRate === 'number'
        ? integrations.defaultTaxRate
        : 0.0825,
    deliveryBaseFee:
      typeof integrations.deliveryBaseFee === 'number'
        ? integrations.deliveryBaseFee
        : 4.99,
    taxProvider: integrations.taxProvider ?? 'builtin',
    paymentProcessor: integrations.paymentProcessor ?? 'stripe',
    fulfillmentNotificationsEnabled:
      integrations.fulfillmentNotificationsEnabled ?? true,
    autoPrintOrders: integrations.autoPrintOrders ?? false,
    stripeAccountId: integrations.stripeAccountId ?? null,
    stripeOnboardingComplete: integrations.stripeOnboardingComplete ?? false,
    stripeChargesEnabled: integrations.stripeChargesEnabled ?? false,
    stripePayoutsEnabled: integrations.stripePayoutsEnabled ?? false,
    taxConfig: integrations.taxConfig ?? null,
    paymentConfig: integrations.paymentConfig ?? null,
    doorDashStoreId: integrations.doorDashStoreId ?? null,
    printerType: integrations.printerType ?? 'bluetooth',
    printerEndpoint: integrations.printerEndpoint ?? null,
    tenantId,
  };

  await prisma.tenantIntegration.upsert({
    where: { tenantId },
    update: payload,
    create: payload,
  });
}

async function seedMenu(tenantId, seed) {
  const sections = Array.isArray(seed.menu) ? seed.menu.map(normaliseMenuSection) : [];
  if (sections.length === 0) {
    console.warn('⚠️  No menu sections found in seed file. Skipping menu provisioning.');
    return { sections: 0, items: 0 };
  }

  let sectionCount = 0;
  let itemCount = 0;

  for (const section of sections) {
    const createdSection = await prisma.menuSection.create({
      data: {
        tenantId,
        name: section.name,
        description: section.description,
        type: section.type,
        position: section.position,
      },
    });
    sectionCount += 1;

    for (const item of section.items) {
      if (!item?.name) {
        console.warn(`   ⚠️  Skipping menu item without a name in section "${section.name}".`);
        continue;
      }
      const image = await ensureLocalAsset(item.image);
      const gallery = Array.isArray(item.gallery) ? item.gallery : [];
      const processedGallery = [];
      for (const galleryImage of gallery) {
        processedGallery.push(await ensureLocalAsset(galleryImage));
      }

      await prisma.menuItem.create({
        data: {
          tenantId,
          menuSectionId: createdSection.id,
          name: item.name,
          description: item.description ?? '',
          price: Number(item.price ?? 0),
          category: item.category ?? 'general',
          image,
          gallery: processedGallery.filter(Boolean),
          tags: Array.isArray(item.tags) ? item.tags : [],
          available: item.available !== false,
          isFeatured: item.isFeatured ?? false,
        },
      });
      itemCount += 1;
    }
  }

  return { sections: sectionCount, items: itemCount };
}

async function main() {
  const start = Date.now();
  const options = parseArgs();
  const inputPath = resolveInputPath(options.input);

  console.log(`🚀 Seeding tenant "${options.slug}" from ${inputPath}`);
  await fs.mkdir(uploadsDir, { recursive: true });

  const seed = await readSeedFile(inputPath);

  const tenant = await createTenant({
    slug: options.slug,
    domain: options.domain,
    seed,
    force: options.force,
  });

  console.log(`✅ Tenant ready: ${tenant.name} (${tenant.slug})`);
  console.log(`   Subdomain: https://${tenant.domain}`);

  await upsertSettings(tenant.id, seed);
  await upsertIntegrations(tenant.id, seed);

  const menuResult = await seedMenu(tenant.id, seed);
  console.log(`🍽️  Menu seeded: ${menuResult.sections} sections, ${menuResult.items} items`);

  if (!options.force) {
    await prisma.integrationLog.create({
      data: {
        tenantId: tenant.id,
        source: 'seed-tenant',
        level: 'info',
        message: 'Tenant auto-seeded via CLI',
        payload: {
          seedFile: inputPath,
          sections: menuResult.sections,
          items: menuResult.items,
        },
      },
    });
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(2);
  console.log(`🎉 Finished in ${elapsed}s`);
  console.log('Next steps:');
  console.log(`  • Preview storefront: https://${tenant.slug}.${DEFAULT_DOMAIN_SUFFIX}`);
  console.log('  • Review in super admin and flip status to “Ready”');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

