/**
 * Seed Products and Pricing Tiers
 * 
 * Run with: npx tsx scripts/seed-products.ts
 */

import { PrismaClient, ProductType } from '@prisma/client';

const prisma = new PrismaClient();

const products = [
  {
    slug: 'ordering',
    name: 'Alessa Ordering',
    description: 'Complete online ordering solution with mobile-optimized checkout',
    category: 'core',
    type: 'ORDERING_SYSTEM' as ProductType,
    icon: 'shopping-cart',
    color: '#dc2626',
    monthlyPrice: 99,
    setupFee: 0,
    features: [
      'Online ordering website',
      'Mobile-optimized checkout',
      'Order management dashboard',
      'Basic analytics',
      'Email notifications',
      'Customer loyalty program',
    ],
    tiers: [
      {
        name: 'Starter',
        slug: 'starter',
        monthlyPrice: 49,
        yearlyPrice: 470, // ~20% discount
        setupFee: 0,
        features: [
          'Up to 100 orders/mo',
          'Basic support',
          'Email notifications',
          'Mobile ordering',
        ],
        limits: { orders: 100 },
        isPopular: false,
        sortOrder: 1,
      },
      {
        name: 'Professional',
        slug: 'pro',
        monthlyPrice: 99,
        yearlyPrice: 950, // ~20% discount
        setupFee: 0,
        features: [
          'Unlimited orders',
          'Priority support',
          'Custom domain',
          'Advanced analytics',
          'Loyalty program',
        ],
        limits: {},
        isPopular: true,
        sortOrder: 2,
      },
      {
        name: 'Enterprise',
        slug: 'enterprise',
        monthlyPrice: 199,
        yearlyPrice: 1910, // ~20% discount
        setupFee: 0,
        features: [
          'Multi-location support',
          'API access',
          'Dedicated support',
          'Custom integrations',
          'White-label options',
        ],
        limits: {},
        isPopular: false,
        sortOrder: 3,
      },
    ],
  },
  {
    slug: 'smp',
    name: 'SwitchMenu Pro',
    description: 'Real-time menu synchronization across multiple platforms',
    category: 'addon',
    type: 'ORDERING_SYSTEM' as ProductType,
    icon: 'menu',
    color: '#10b981',
    monthlyPrice: 249,
    setupFee: 0,
    features: [
      'Real-time menu sync',
      'Multi-platform publishing',
      'Image optimization',
      'Nutrition info management',
      'Allergen tracking',
      'Bulk updates',
    ],
    tiers: [
      {
        name: 'Basic',
        slug: 'basic',
        monthlyPrice: 199,
        yearlyPrice: 1910,
        setupFee: 0,
        features: [
          'Basic menu sync',
          'Up to 3 platforms',
          'Standard support',
        ],
        limits: { platforms: 3 },
        isPopular: false,
        sortOrder: 1,
      },
      {
        name: 'Pro',
        slug: 'pro',
        monthlyPrice: 299,
        yearlyPrice: 2870,
        setupFee: 0,
        features: [
          'Unlimited platforms',
          'Priority sync',
          'Advanced analytics',
          'Priority support',
        ],
        limits: {},
        isPopular: true,
        sortOrder: 2,
      },
      {
        name: 'Enterprise',
        slug: 'enterprise',
        monthlyPrice: 499,
        yearlyPrice: 4790,
        setupFee: 0,
        features: [
          'Custom integrations',
          'Dedicated support',
          'SLA guarantees',
          'API access',
        ],
        limits: {},
        isPopular: false,
        sortOrder: 3,
      },
    ],
  },
  {
    slug: 'tax-manager',
    name: 'Alessa Tax Manager',
    description: 'Automated tax tracking and remittance with accountant portal',
    category: 'addon',
    type: 'ORDERING_SYSTEM' as ProductType,
    icon: 'receipt-tax',
    color: '#8b5cf6',
    monthlyPrice: 49,
    setupFee: 0,
    features: [
      'Automated tax tracking',
      'Monthly/quarterly reports',
      'Accountant portal access',
      'PDF report generation',
      'Check printing',
      'ACH remittance',
    ],
    tiers: [
      {
        name: 'Essential',
        slug: 'essential',
        monthlyPrice: 49,
        yearlyPrice: 470,
        setupFee: 0,
        features: [
          'Tax tracking',
          'Basic reports',
          'Accountant access',
        ],
        limits: {},
        isPopular: false,
        sortOrder: 1,
      },
      {
        name: 'Professional',
        slug: 'pro',
        monthlyPrice: 79,
        yearlyPrice: 760,
        setupFee: 0,
        features: [
          'All Essential features',
          '+ ACH remittance',
          '+ Multi-jurisdiction',
          '+ Audit trail',
          '+ Priority support',
        ],
        limits: {},
        isPopular: true,
        sortOrder: 2,
      },
    ],
  },
  {
    slug: 'marketing',
    name: 'Marketing App',
    description: 'Email campaigns, SMS marketing, and loyalty programs',
    category: 'addon',
    type: 'MARKETING_APP' as ProductType,
    icon: 'megaphone',
    color: '#f59e0b',
    monthlyPrice: 79,
    setupFee: 0,
    features: [
      'Email campaigns',
      'SMS marketing',
      'Loyalty program',
      'Customer segmentation',
      'Automated promotions',
    ],
    tiers: [
      {
        name: 'Standard',
        slug: 'standard',
        monthlyPrice: 79,
        yearlyPrice: 760,
        setupFee: 0,
        features: [
          'Email campaigns',
          'SMS marketing',
          'Basic loyalty program',
        ],
        limits: { emails: 10000, sms: 500 },
        isPopular: true,
        sortOrder: 1,
      },
    ],
  },
  {
    slug: 'grocery',
    name: 'Grocery App',
    description: 'Grocery ordering and delivery integration',
    category: 'addon',
    type: 'ORDERING_SYSTEM' as ProductType,
    icon: 'shopping-bag',
    color: '#06b6d4',
    monthlyPrice: 0, // Grandfathered free for Las Reinas
    setupFee: 0,
    features: [
      'Grocery ordering',
      'Delivery integration',
      'Inventory management',
      'Bulk ordering',
    ],
    tiers: [
      {
        name: 'Standard',
        slug: 'standard',
        monthlyPrice: 0,
        yearlyPrice: 0,
        setupFee: 0,
        features: [
          'Grocery ordering',
          'Delivery integration',
        ],
        limits: {},
        isPopular: true,
        sortOrder: 1,
      },
    ],
  },
];

async function main() {
  console.log('Seeding products...');

  for (const productData of products) {
    const { tiers, ...productFields } = productData;

    // Create or update product
    const product = await prisma.product.upsert({
      where: { slug: productData.slug },
      update: {
        name: productFields.name,
        description: productFields.description,
        category: productFields.category,
        type: productFields.type,
        icon: productFields.icon,
        color: productFields.color,
        monthlyPrice: productFields.monthlyPrice,
        setupFee: productFields.setupFee,
        features: productFields.features,
        isActive: true,
      },
      create: {
        slug: productFields.slug,
        name: productFields.name,
        description: productFields.description,
        category: productFields.category,
        type: productFields.type,
        icon: productFields.icon,
        color: productFields.color,
        monthlyPrice: productFields.monthlyPrice,
        setupFee: productFields.setupFee,
        features: productFields.features,
        isActive: true,
        status: 'active',
      },
    });

    console.log(`✓ Product: ${product.name}`);

    // Create or update tiers
    for (const tierData of tiers) {
      const tier = await prisma.productPricingTier.upsert({
        where: {
          productId_slug: {
            productId: product.id,
            slug: tierData.slug,
          },
        },
        update: {
          name: tierData.name,
          monthlyPrice: tierData.monthlyPrice,
          yearlyPrice: tierData.yearlyPrice || null,
          setupFee: tierData.setupFee,
          features: tierData.features,
          limits: tierData.limits || null,
          isPopular: tierData.isPopular,
          sortOrder: tierData.sortOrder,
        },
        create: {
          productId: product.id,
          slug: tierData.slug,
          name: tierData.name,
          monthlyPrice: tierData.monthlyPrice,
          yearlyPrice: tierData.yearlyPrice || null,
          setupFee: tierData.setupFee,
          features: tierData.features,
          limits: tierData.limits || null,
          isPopular: tierData.isPopular,
          sortOrder: tierData.sortOrder,
        },
      });

      console.log(`  ✓ Tier: ${tier.name} - $${tier.monthlyPrice}/mo`);
    }
  }

  console.log('\n✅ Products seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding products:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
