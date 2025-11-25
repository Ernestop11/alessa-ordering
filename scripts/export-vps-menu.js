const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  console.log('📥 Exporting VPS menu for Las Reinas...\n');
  
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

  const exportData = {
    tenant: {
      slug: tenant.slug,
      name: tenant.name,
      featureFlags: tenant.featureFlags,
    },
    sections: tenant.menuSections.map(section => ({
      name: section.name,
      description: section.description,
      type: section.type,
      position: section.position,
      hero: section.hero,
      imageUrl: section.imageUrl,
      items: section.menuItems.map(item => ({
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        image: item.image,
        gallery: item.gallery,
        available: item.available,
        isFeatured: item.isFeatured,
        tags: item.tags,
      }))
    }))
  };

  fs.writeFileSync(
    'lasreinas-menu-export.json',
    JSON.stringify(exportData, null, 2)
  );

  console.log(`✅ Exported ${tenant.menuSections.length} sections with ${tenant.menuSections.reduce((sum, s) => sum + s.menuItems.length, 0)} items`);
  console.log(`📄 Saved to: lasreinas-menu-export.json`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});

