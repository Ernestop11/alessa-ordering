const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking VPS menu for Las Reinas...\n');
  
  const tenant = await prisma.tenant.findUnique({
    where: { slug: 'lasreinas' },
    include: {
      menuSections: {
        include: {
          menuItems: true
        },
        orderBy: { position: 'asc' }
      }
    }
  });

  if (!tenant) {
    console.error('❌ Las Reinas tenant not found!');
    process.exit(1);
  }

  console.log(`✅ Found tenant: ${tenant.name}`);
  console.log(`📊 Total sections: ${tenant.menuSections.length}`);
  console.log(`📊 Total items: ${tenant.menuSections.reduce((sum, s) => sum + s.menuItems.length, 0)}\n`);

  tenant.menuSections.forEach((section, idx) => {
    console.log(`\n${idx + 1}. ${section.name.toUpperCase()}`);
    console.log(`   Type: ${section.type}`);
    if (section.description) console.log(`   ${section.description}`);
    console.log(`   Items (${section.menuItems.length}):`);
    section.menuItems.forEach((item, itemIdx) => {
      console.log(`      ${itemIdx + 1}. ${item.name} - $${item.price}`);
      if (item.image) {
        console.log(`         Image: ${item.image}`);
      }
    });
  });

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});

