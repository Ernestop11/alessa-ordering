#!/usr/bin/env node

/**
 * Website Data Scraper Helper
 * 
 * This script helps extract branding, menu, and contact info from restaurant websites
 * to populate tenant seed files.
 * 
 * Usage:
 *   node scripts/scrape-website-data.mjs --url=https://lasreinascolusa.com --output=scripts/seed-data/lasreinas.json
 * 
 * Note: This is a helper script. You may need to manually review and adjust the extracted data.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    url: null,
    output: null,
    slug: null,
  };

  for (const arg of args) {
    if (arg.startsWith('--url=')) {
      options.url = arg.split('=')[1]?.trim();
    } else if (arg.startsWith('--output=')) {
      options.output = arg.split('=')[1]?.trim();
    } else if (arg.startsWith('--slug=')) {
      options.slug = arg.split('=')[1]?.trim();
    }
  }

  if (!options.url) {
    throw new Error('Missing required --url option.');
  }

  return options;
}

async function extractColorsFromUrl(url) {
  // Common Mexican restaurant color schemes
  // You'll need to manually inspect the website and update these
  const colorSchemes = {
    'lasreinascolusa.com': { primary: '#dc2626', secondary: '#f59e0b' },
    'taqueriarosita.com': { primary: '#ea580c', secondary: '#f97316' },
    'villacoronacatering.com': { primary: '#b91c1c', secondary: '#fbbf24' },
  };

  const domain = new URL(url).hostname.replace('www.', '');
  return colorSchemes[domain] || { primary: '#dc2626', secondary: '#f59e0b' };
}

function generateSeedTemplate(url, slug) {
  const domain = new URL(url).hostname.replace('www.', '');
  const colors = extractColorsFromUrl(url);

  return {
    tenant: {
      name: `[Extract from ${domain}]`,
      heroTitle: `[Extract hero title from ${domain}]`,
      heroSubtitle: `[Extract tagline/subtitle]`,
      contactEmail: `[Extract email from ${domain}]`,
      contactPhone: `[Extract phone from ${domain}]`,
      addressLine1: `[Extract address]`,
      city: `[Extract city]`,
      state: `[Extract state]`,
      postalCode: `[Extract zip]`,
      heroImageUrl: `[Extract hero image URL from ${domain}]`,
      logoUrl: `[Extract logo URL from ${domain}]`,
      primaryColor: colors.primary,
      secondaryColor: colors.secondary,
      featureFlags: [],
    },
    status: 'PENDING_REVIEW',
    statusNotes: `Auto-seeded from ${domain} on ${new Date().toISOString().split('T')[0]}.`,
    subscription: {
      plan: 'alessa-starter',
      monthlyFee: 30,
      addons: ['ada-compliance'],
    },
    settings: {
      tagline: `[Extract tagline from ${domain}]`,
      about: `[Extract about section]`,
      socialInstagram: `[Extract Instagram handle]`,
      socialFacebook: `[Extract Facebook URL]`,
      deliveryRadiusMi: 5,
      minimumOrderValue: 15,
      currency: 'USD',
      timeZone: 'America/Los_Angeles',
      branding: {
        heroImages: [
          `[Extract hero image 1 from ${domain}]`,
          `[Extract hero image 2 from ${domain}]`,
        ],
      },
      operatingHours: {
        timezone: 'America/Los_Angeles',
        storeHours: {
          monday: { open: '09:00', close: '21:00', closed: false },
          tuesday: { open: '09:00', close: '21:00', closed: false },
          wednesday: { open: '09:00', close: '21:00', closed: false },
          thursday: { open: '09:00', close: '22:00', closed: false },
          friday: { open: '09:00', close: '23:00', closed: false },
          saturday: { open: '09:00', close: '23:00', closed: false },
          sunday: { open: '10:00', close: '21:00', closed: false },
        },
        serviceMode: {
          pickup: true,
          delivery: true,
          dineIn: false,
        },
      },
    },
    integrations: {
      platformPercentFee: 0.029,
      platformFlatFee: 0.3,
      defaultTaxRate: 0.0825,
      deliveryBaseFee: 4.99,
      fulfillmentNotificationsEnabled: true,
      autoPrintOrders: false,
    },
    heroGallery: [],
    menu: [
      {
        name: '[Menu Section 1]',
        description: '[Section description]',
        type: 'RESTAURANT',
        items: [
          {
            name: '[Item name]',
            description: '[Item description]',
            price: 0,
            category: '[category]',
            image: '[Image URL]',
            tags: [],
          },
        ],
      },
    ],
  };
}

async function main() {
  try {
    const options = parseArgs();
    const slug = options.slug || options.url.split('//')[1]?.split('.')[0] || 'tenant';
    const template = generateSeedTemplate(options.url, slug);

    const outputPath = options.output
      ? path.isAbsolute(options.output)
        ? options.output
        : path.join(process.cwd(), options.output)
      : path.join(process.cwd(), 'scripts', 'seed-data', `${slug}.json`);

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(template, null, 2), 'utf8');

    console.log(`✅ Seed template created: ${outputPath}`);
    console.log(`\n📝 Next steps:`);
    console.log(`   1. Visit ${options.url} and extract:`);
    console.log(`      - Restaurant name, tagline, contact info`);
    console.log(`      - Logo URL (right-click logo → Copy image address)`);
    console.log(`      - Hero images`);
    console.log(`      - Menu items with prices and descriptions`);
    console.log(`      - Brand colors (use browser dev tools → Elements → Styles)`);
    console.log(`   2. Update ${outputPath} with extracted data`);
    console.log(`   3. Run: node scripts/seed-tenant.mjs --slug=${slug} --input=${outputPath}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

