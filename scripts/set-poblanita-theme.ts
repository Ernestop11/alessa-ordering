#!/usr/bin/env tsx
/**
 * Set La Poblanita's theme (template and gradient colors)
 */

import dotenv from 'dotenv';
dotenv.config();

import prisma from '../lib/prisma';

async function setPoblanitaTheme() {
  console.log('🎨 Setting La Poblanita theme...\n');

  try {
    // 1. Find La Poblanita tenant by slug
    const tenant = await prisma.tenant.findFirst({
      where: {
        OR: [
          { slug: 'lapoblanita' },
          { slug: 'la-poblanita' },
        ],
      },
      include: {
        settings: true,
      },
    });

    if (!tenant) {
      throw new Error('La Poblanita tenant not found. Tried slugs: lapoblanita, la-poblanita');
    }

    console.log(`✅ Found tenant: ${tenant.name} (${tenant.slug})`);
    console.log(`   ID: ${tenant.id}\n`);

    // 2. Update TenantSettings with theme values
    console.log('🎨 Updating theme settings...');
    const updatedSettings = await prisma.tenantSettings.upsert({
      where: { tenantId: tenant.id },
      update: {
        templateType: 'restaurant',
        gradientFrom: '#0f172a', // Dark navy
        gradientVia: '#1e3a8a',   // Dark indigo
        gradientTo: '#3730a3',    // Purple indigo
      },
      create: {
        tenantId: tenant.id,
        templateType: 'restaurant',
        gradientFrom: '#0f172a',
        gradientVia: '#1e3a8a',
        gradientTo: '#3730a3',
      },
    });

    console.log('✅ Theme settings updated successfully!\n');
    console.log('📋 Updated values:');
    console.log(`   - templateType: ${updatedSettings.templateType}`);
    console.log(`   - gradientFrom: ${updatedSettings.gradientFrom}`);
    console.log(`   - gradientVia: ${updatedSettings.gradientVia}`);
    console.log(`   - gradientTo: ${updatedSettings.gradientTo}\n`);

    console.log('💡 Next steps:');
    console.log('   1. Visit: https://lapoblanita.alessacloud.com/order');
    console.log('   2. Check that the gradient is applied correctly');
    console.log('   3. The gradient should show: Dark Navy → Dark Indigo → Purple Indigo\n');

  } catch (error: any) {
    console.error('\n❌ Error setting theme:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setPoblanitaTheme()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });

