#!/usr/bin/env tsx
/**
 * Update La Poblanita with Las Reinas menu and subscription
 */

import dotenv from 'dotenv';
dotenv.config();

import prisma from '../lib/prisma';

async function updateLaPoblanita() {
  console.log('🔄 Updating La Poblanita...\n');

  try {
    // 1. Find both tenants
    const lasReinas = await prisma.tenant.findUnique({
      where: { slug: 'lasreinas' },
      include: {
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

    const laPoblanita = await prisma.tenant.findUnique({
      where: { slug: 'lapoblanita' },
      include: {
        menuSections: true,
        cateringSections: true,
      },
    });

    if (!lasReinas) {
      throw new Error('Las Reinas tenant not found');
    }

    if (!laPoblanita) {
      throw new Error('La Poblanita tenant not found');
    }

    console.log(`✅ Found Las Reinas: ${lasReinas.menuSections.length} sections, ${lasReinas.menuSections.reduce((sum, s) => sum + s.menuItems.length, 0)} items`);
    console.log(`✅ Found La Poblanita: ${laPoblanita.menuSections.length} sections\n`);

    // 2. Clear existing menu
    console.log('🗑️  Clearing existing menu...');
    await prisma.menuItem.deleteMany({
      where: { tenantId: laPoblanita.id },
    });
    await prisma.menuSection.deleteMany({
      where: { tenantId: laPoblanita.id },
    });
    await prisma.cateringPackage.deleteMany({
      where: { tenantId: laPoblanita.id },
    });
    await prisma.cateringSection.deleteMany({
      where: { tenantId: laPoblanita.id },
    });
    console.log('✅ Cleared existing menu\n');

    // 3. Copy menu sections and items
    console.log('📋 Copying menu sections and items...');
    for (const section of lasReinas.menuSections) {
      const newSection = await prisma.menuSection.create({
        data: {
          tenantId: laPoblanita.id,
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
            tenantId: laPoblanita.id,
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

    // 4. Copy catering sections and packages
    console.log('\n🍽️  Copying catering sections and packages...');
    for (const section of lasReinas.cateringSections) {
      const newSection = await prisma.cateringSection.create({
        data: {
          tenantId: laPoblanita.id,
          name: section.name,
          description: section.description,
          position: section.position,
        },
      });

      for (const pkg of section.packages) {
        await prisma.cateringPackage.create({
          data: {
            tenantId: laPoblanita.id,
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

    // 5. Update custom domain
    console.log('\n🌐 Updating custom domain...');
    await prisma.tenant.update({
      where: { id: laPoblanita.id },
      data: {
        customDomain: 'lapoblanitamexicanfood.com',
        status: 'LIVE',
        subscriptionMonthlyFee: 54.0, // $54/mo with ADA
      },
    });
    console.log('   ✓ Custom domain: lapoblanitamexicanfood.com');
    console.log('   ✓ Status: LIVE');
    console.log('   ✓ Monthly fee: $54.00\n');

    // 6. Create/update product subscription
    console.log('💳 Creating product subscription...');
    const orderingProduct = await prisma.product.findUnique({
      where: { slug: 'alessa-ordering' },
    });

    if (!orderingProduct) {
      console.log('   ⚠️  Ordering product not found - creating it...');
      // Create product if it doesn't exist
      const newProduct = await prisma.product.create({
        data: {
          name: 'Alessa Ordering System',
          slug: 'alessa-ordering',
          type: 'ORDERING_SYSTEM',
          description: 'Complete restaurant ordering system',
          status: 'active',
          monthlyPrice: 40.0,
          setupFee: 0.0,
          features: ['Online Ordering', 'Payment Processing', 'Order Management'],
          icon: '🍽️',
          color: '#dc2626',
          order: 1,
        },
      });
      console.log('   ✓ Created ordering product');
    }

    const product = orderingProduct || await prisma.product.findUnique({
      where: { slug: 'alessa-ordering' },
    });

    if (product) {
      // Check if subscription exists
      const existingSub = await prisma.tenantProduct.findUnique({
        where: {
          tenantId_productId: {
            tenantId: laPoblanita.id,
            productId: product.id,
          },
        },
      });

      if (existingSub) {
        // Update existing subscription
        await prisma.tenantProduct.update({
          where: { id: existingSub.id },
          data: {
            status: 'prepaid',
            expiresAt: new Date('2027-09-09'),
          },
        });
        console.log('   ✓ Updated subscription (prepaid, expires Sept 9, 2027)');
      } else {
        // Create new subscription
        await prisma.tenantProduct.create({
          data: {
            tenantId: laPoblanita.id,
            productId: product.id,
            status: 'prepaid',
            expiresAt: new Date('2027-09-09'),
            subscribedAt: new Date(),
          },
        });
        console.log('   ✓ Created subscription (prepaid, expires Sept 9, 2027)');
      }
    }

    console.log('\n🎉 La Poblanita updated successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Menu Sections: ${lasReinas.menuSections.length}`);
    console.log(`   - Menu Items: ${lasReinas.menuSections.reduce((sum, s) => sum + s.menuItems.length, 0)}`);
    console.log(`   - Catering Sections: ${lasReinas.cateringSections.length}`);
    console.log(`   - Catering Packages: ${lasReinas.cateringSections.reduce((sum, s) => sum + s.packages.length, 0)}`);
    console.log(`   - Custom Domain: lapoblanitamexicanfood.com`);
    console.log(`   - Subscription: Prepaid until Sept 9, 2027`);
    console.log(`\n💡 Next steps:`);
    console.log(`   1. Update CUSTOM_DOMAIN_MAP in .env: {"lapoblanitamexicanfood.com":"lapoblanita"}`);
    console.log(`   2. Visit: https://lapoblanitamexicanfood.com/order`);
    console.log(`   3. Admin: /admin?tenant=lapoblanita\n`);

  } catch (error: any) {
    console.error('\n❌ Error updating La Poblanita:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateLaPoblanita()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });

