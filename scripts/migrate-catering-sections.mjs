#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Migrating catering packages to sections...');

  // Find Las Reinas tenant
  const tenant = await prisma.tenant.findUnique({
    where: { slug: 'lasreinas' }
  });

  if (!tenant) {
    throw new Error('Las Reinas tenant not found!');
  }

  console.log(`✓ Found tenant: ${tenant.name} (${tenant.id})`);

  // Check if sections already exist
  const existingSections = await prisma.cateringSection.findMany({
    where: { tenantId: tenant.id }
  });

  if (existingSections.length > 0) {
    console.log(`✓ Found ${existingSections.length} existing sections`);
  } else {
    console.log('📦 Creating default sections...');

    // Create Popular Catering Options section
    const popularSection = await prisma.cateringSection.create({
      data: {
        tenantId: tenant.id,
        name: 'Popular Catering Options',
        description: 'Our most requested catering packages for any occasion',
        position: 0,
      }
    });
    console.log(`  ✓ Created: ${popularSection.name}`);

    // Create Holiday & Event Bundles section
    const holidaySection = await prisma.cateringSection.create({
      data: {
        tenantId: tenant.id,
        name: 'Holiday & Event Bundles',
        description: 'Special packages for celebrations and holidays',
        position: 1,
      }
    });
    console.log(`  ✓ Created: ${holidaySection.name}`);

    // Update existing packages to assign them to sections based on category
    const packages = await prisma.cateringPackage.findMany({
      where: { tenantId: tenant.id }
    });

    console.log(`\n📋 Assigning ${packages.length} packages to sections...`);

    for (const pkg of packages) {
      const sectionId = pkg.category === 'popular' ? popularSection.id : holidaySection.id;
      await prisma.cateringPackage.update({
        where: { id: pkg.id },
        data: { cateringSectionId: sectionId }
      });
      console.log(`  ✓ Assigned "${pkg.name}" to ${pkg.category === 'popular' ? 'Popular' : 'Holiday'} section`);
    }
  }

  // Verify assignment
  const sections = await prisma.cateringSection.findMany({
    where: { tenantId: tenant.id },
    include: {
      _count: {
        select: { packages: true }
      }
    }
  });

  console.log('\n✅ Migration complete! Summary:');
  sections.forEach(section => {
    console.log(`   - ${section.name}: ${section._count.packages} packages`);
  });

  console.log('\n🎯 Next steps:');
  console.log('   1. Go to https://lasreinas.alessacloud.com/admin/menu?tenant=lasreinas');
  console.log('   2. Click on "Catering Packages" tab');
  console.log('   3. You should now see your sections with assigned packages!');
}

main()
  .catch((e) => {
    console.error('❌ Error migrating catering sections:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
