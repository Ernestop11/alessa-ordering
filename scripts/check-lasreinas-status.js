const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking Las Reinas tenant status...\n');

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug: 'lasreinas' },
      include: {
        integrations: true,
        settings: true,
        menuSections: {
          include: {
            menuItems: true
          }
        }
      }
    });

    if (!tenant) {
      console.log('❌ Tenant not found!');
      process.exit(1);
    }

    console.log('✅ Tenant found:', tenant.name);
    console.log('   Slug:', tenant.slug);
    console.log('   Contact Email:', tenant.contactEmail || 'Not set');
    console.log('   Feature Flags:', tenant.featureFlags.join(', ') || 'None');
    console.log('   Has Catering Flag:', tenant.featureFlags.includes('catering') ? 'Yes ✅' : 'No ❌');
    
    if (tenant.integrations) {
      console.log('\n💳 Stripe Integration:');
      console.log('   Account ID:', tenant.integrations.stripeAccountId || 'Not connected');
      console.log('   Charges Enabled:', tenant.integrations.stripeChargesEnabled ? 'Yes ✅' : 'No');
      console.log('   Onboarding Complete:', tenant.integrations.stripeOnboardingComplete ? 'Yes ✅' : 'No');
    }

    const totalItems = tenant.menuSections.reduce((sum, s) => sum + s.menuItems.length, 0);
    console.log('\n📋 Menu Status:');
    console.log('   Total Sections:', tenant.menuSections.length);
    console.log('   Total Menu Items:', totalItems);
    
    if (tenant.menuSections.length > 0) {
      console.log('\n   Sections:');
      tenant.menuSections.forEach(s => {
        console.log(`   - ${s.name}: ${s.menuItems.length} items`);
      });
    }

    // Check catering options
    if (tenant.settings?.upsellBundles) {
      const catering = (tenant.settings.upsellBundles || {}).catering || [];
      console.log('\n🍽️  Catering:');
      console.log('   Packages:', catering.length);
    }

    // Check catering gallery
    if (tenant.settings?.cateringGallery) {
      const gallery = tenant.settings.cateringGallery || [];
      console.log('   Gallery Images:', Array.isArray(gallery) ? gallery.length : 0);
    }

    console.log('\n✅ All checks complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

