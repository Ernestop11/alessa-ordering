#!/usr/bin/env tsx

import { PrismaClient, ProductType } from '@prisma/client';

const prisma = new PrismaClient();

const products = [
  {
    name: 'Alessa Ordering System',
    slug: 'alessa-ordering',
    type: 'ORDERING_SYSTEM' as ProductType,
    description: 'Complete restaurant ordering system with payments, fulfillment, and customer management',
    status: 'active',
    monthlyPrice: 40.0,
    setupFee: 0.0,
    features: ['Online Ordering', 'Payment Processing', 'Order Management', 'Customer Portal'],
    icon: '🍽️',
    color: '#dc2626',
    order: 1,
  },
  {
    name: 'SwitchMenu Pro',
    slug: 'switchmenu-pro',
    type: 'DIGITAL_MENU' as ProductType,
    description: 'Digital signage menu system for restaurants',
    status: 'active',
    monthlyPrice: 30.0,
    setupFee: 0.0,
    features: ['Digital Menu Display', 'Multi-Screen Support', 'Real-time Updates', 'Menu Builder'],
    icon: '📺',
    color: '#3b82f6',
    order: 2,
  },
  {
    name: 'Web Hosting',
    slug: 'web-hosting',
    type: 'WEB_HOSTING' as ProductType,
    description: 'Website hosting and domain management',
    status: 'active',
    monthlyPrice: 15.0,
    setupFee: 0.0,
    features: ['Domain Management', 'SSL Certificates', 'Email Hosting', 'CDN'],
    icon: '🌐',
    color: '#10b981',
    order: 3,
  },
  {
    name: 'Marketing App',
    slug: 'marketing-app',
    type: 'MARKETING_APP' as ProductType,
    description: 'Marketing automation and customer engagement tools',
    status: 'active',
    monthlyPrice: 25.0,
    setupFee: 0.0,
    features: ['Email Campaigns', 'SMS Marketing', 'Loyalty Programs', 'Analytics'],
    icon: '📱',
    color: '#8b5cf6',
    order: 4,
  },
  {
    name: 'Website Templates',
    slug: 'website-templates',
    type: 'WEBSITE_TEMPLATE' as ProductType,
    description: 'Pre-built website templates for restaurants and businesses',
    status: 'active',
    monthlyPrice: 0.0,
    setupFee: 99.0,
    features: ['Multiple Templates', 'Custom Branding', 'Mobile Responsive', 'SEO Optimized'],
    icon: '🎨',
    color: '#f59e0b',
    order: 5,
  },
  {
    name: 'Mini Bodega System',
    slug: 'mini-bodega',
    type: 'MINI_BODEGA' as ProductType,
    description: 'Wholesale and delivery system for mini markets',
    status: 'coming_soon',
    monthlyPrice: 50.0,
    setupFee: 0.0,
    features: ['Inventory Management', 'Wholesale Pricing', 'Delivery Integration', 'Point of Sale'],
    icon: '🏪',
    color: '#ef4444',
    order: 6,
  },
];

async function main() {
  console.log('🌱 Seeding products...');

  for (const product of products) {
    const existing = await prisma.product.findUnique({
      where: { slug: product.slug },
    });

    if (existing) {
      console.log(`  ⏭️  ${product.name} already exists, skipping...`);
      continue;
    }

    await prisma.product.create({
      data: product,
    });

    console.log(`  ✅ Created ${product.name}`);
  }

  console.log('✨ Products seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding products:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

