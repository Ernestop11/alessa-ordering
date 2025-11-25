const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Mapping of section names to image file names
const SECTION_IMAGE_MAP = {
  'DESAYUNO (BREAKFAST)': '/tenant/lasreinas/images/menu-items/desayuno.jpg',
  'Desayuno (Breakfast)': '/tenant/lasreinas/images/menu-items/desayuno.jpg',
  'PLATILLOS/PLATES': '/tenant/lasreinas/images/menu-items/platillos-plates.jpg',
  'Platillos/Plates': '/tenant/lasreinas/images/menu-items/platillos-plates.jpg',
  'BURRITOS': '/tenant/lasreinas/images/menu-items/burritos.jpg',
  'Burritos': '/tenant/lasreinas/images/menu-items/burritos.jpg',
  'A LA CARTA': '/tenant/lasreinas/images/menu-items/a-la-carta.jpg',
  'A La Carta': '/tenant/lasreinas/images/menu-items/a-la-carta.jpg',
  'TACOS': '/tenant/lasreinas/images/menu-items/tacos.jpg',
  'Tacos': '/tenant/lasreinas/images/menu-items/tacos.jpg',
  'NACHOS Y QUESADILLAS': '/tenant/lasreinas/images/menu-items/nachos-y-quesadillas.jpg',
  'Nachos y Quesadillas': '/tenant/lasreinas/images/menu-items/nachos-y-quesadillas.jpg',
  'TORTAS': '/tenant/lasreinas/images/menu-items/tortas.jpg',
  'Tortas': '/tenant/lasreinas/images/menu-items/tortas.jpg',
  'MEAT BY THE POUND': '/tenant/lasreinas/images/menu-items/meat-by-the-pound.jpg',
  'Meat by the pound': '/tenant/lasreinas/images/menu-items/meat-by-the-pound.jpg',
  'SIDES': '/tenant/lasreinas/images/menu-items/sides.jpg',
  'Sides': '/tenant/lasreinas/images/menu-items/sides.jpg',
  'DRINKS': '/tenant/lasreinas/images/menu-items/sides.jpg', // No drinks image, using sides as fallback
  'Drinks': '/tenant/lasreinas/images/menu-items/sides.jpg',
};

async function main() {
  console.log('🖼️  Seeding Las Reinas menu item images...\n');
  
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
  console.log(`📊 Sections: ${tenant.menuSections.length}`);
  console.log(`📊 Total items: ${tenant.menuSections.reduce((sum, s) => sum + s.menuItems.length, 0)}\n`);
  
  let updatedCount = 0;
  let skippedCount = 0;
  
  for (const section of tenant.menuSections) {
    const imagePath = SECTION_IMAGE_MAP[section.name];
    
    if (!imagePath) {
      console.log(`⚠️  No image mapping for section: "${section.name}"`);
      skippedCount += section.menuItems.length;
      continue;
    }
    
    console.log(`\n📁 Section: ${section.name}`);
    console.log(`   Image: ${imagePath}`);
    console.log(`   Items: ${section.menuItems.length}`);
    
    // Update all items in this section
    for (const item of section.menuItems) {
      // Only update if image is different (avoid unnecessary updates)
      if (item.image !== imagePath) {
        await prisma.menuItem.update({
          where: { id: item.id },
          data: { image: imagePath }
        });
        updatedCount++;
      }
    }
    
    console.log(`   ✅ Updated ${section.menuItems.length} items`);
  }
  
  console.log(`\n✨ Summary:`);
  console.log(`   ✅ Updated: ${updatedCount} items`);
  console.log(`   ⏭️  Skipped: ${skippedCount} items (no mapping)`);
  console.log(`\n✅ Image seeding complete!\n`);
  
  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  });

