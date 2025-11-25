const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: 'lasreinas' },
  });
  
  if (!tenant) {
    console.log('❌ Tenant not found');
    return;
  }
  
  console.log(`✅ Tenant: ${tenant.name}\n`);
  
  // Get menu items for this tenant
  const menuItems = await prisma.menuItem.findMany({
    where: { tenantId: tenant.id },
    include: {
      section: true
    },
    orderBy: [
      { section: { position: 'asc' } },
      { name: 'asc' }
    ]
  });
  
  console.log(`Found ${menuItems.length} menu items:\n`);
  
  let currentSection = '';
  menuItems.forEach(item => {
    const sectionName = item.section?.name || 'No Section';
    if (sectionName !== currentSection) {
      currentSection = sectionName;
      console.log(`\n📁 ${sectionName}`);
    }
    console.log(`   - ${item.name}`);
    console.log(`     Image: ${item.image || 'NO IMAGE'}\n`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

