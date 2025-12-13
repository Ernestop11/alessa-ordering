#!/usr/bin/env tsx
/**
 * Check if tenant exists in database
 */

import dotenv from 'dotenv';
dotenv.config();

import prisma from '../lib/prisma';

async function checkTenant(slug: string) {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      include: {
        settings: true,
        integrations: true,
        productSubscriptions: {
          include: {
            product: true,
          },
        },
        _count: {
          select: {
            menuItems: true,
            orders: true,
            menuSections: true,
          },
        },
      },
    });

    if (!tenant) {
      console.log(`❌ Tenant "${slug}" not found`);
      return null;
    }

    console.log(`✅ Tenant found: ${tenant.name}`);
    console.log(`   ID: ${tenant.id}`);
    console.log(`   Slug: ${tenant.slug}`);
    console.log(`   Status: ${tenant.status}`);
    console.log(`   Subscription Plan: ${tenant.subscriptionPlan || 'N/A'}`);
    console.log(`   Monthly Fee: $${tenant.subscriptionMonthlyFee}`);
    console.log(`   Menu Items: ${tenant._count.menuItems}`);
    console.log(`   Menu Sections: ${tenant._count.menuSections}`);
    console.log(`   Orders: ${tenant._count.orders}`);
    console.log(`\n   Product Subscriptions:`);
    tenant.productSubscriptions.forEach((sub) => {
      console.log(`     - ${sub.product.name} (${sub.status})`);
      if (sub.expiresAt) {
        console.log(`       Expires: ${sub.expiresAt.toLocaleDateString()}`);
      }
    });

    return tenant;
  } catch (error: any) {
    console.error('❌ Error checking tenant:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

const slug = process.argv[2] || 'lapoblanita';
checkTenant(slug);

