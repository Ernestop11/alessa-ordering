const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const STOCK = {
  menu: {
    carnitasPlate: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
    birria: 'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?auto=format&fit=crop&w=800&q=80',
    carneAsada: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=800&q=80',
    salsaRoja: 'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?auto=format&fit=crop&w=800&q=80',
  },
};

const MENU_DATA = {
  sections: [
    {
      name: 'Carnitas y Más',
      type: 'RESTAURANT',
      description: 'Plates from the taqueria line',
      position: 0,
      items: [
        {
          name: 'Carnitas Plate',
          description: 'Carnitas served with beans, rice, and handmade tortillas',
          price: 15.99,
          category: 'plates',
          image: '/tenant/lasreinas/images/menu-items/platillos-plates.jpg',
          tags: ['taqueria'],
        },
        {
          name: 'Birria Tacos',
          description: 'Crispy birria tacos served with consommé',
          price: 16.49,
          category: 'tacos',
          image: '/tenant/lasreinas/images/menu-items/tacos.jpg',
          tags: ['taqueria', 'special'],
        },
      ],
    },
    {
      name: 'Carnicería Grocery',
      type: 'GROCERY',
      description: 'Meats and grocery staples from the carnicería',
      position: 1,
      items: [
        {
          name: 'Carne Asada (1 lb)',
          description: 'Seasoned skirt steak ready for the grill',
          price: 11.99,
          category: 'grocery',
          image: '/tenant/lasreinas/images/menu-items/meat-by-the-pound.jpg',
          tags: ['grocery', 'butcher'],
        },
        {
          name: 'Homemade Salsa Roja (16oz)',
          description: 'House-made roja salsa perfect for tacos and chips',
          price: 6.5,
          category: 'grocery',
          image: '/tenant/lasreinas/images/menu-items/sides.jpg',
          tags: ['grocery', 'salsa'],
        },
      ],
    },
  ],
};

async function main() {
  console.log('🌮 Seeding Las Reinas menu...\n');
  
  const tenant = await prisma.tenant.findUnique({
    where: { slug: 'lasreinas' },
  });
  
  if (!tenant) {
    console.error('❌ Las Reinas tenant not found!');
    process.exit(1);
  }
  
  console.log(`✅ Found tenant: ${tenant.name}\n`);
  
  // Delete existing menu items and sections
  console.log('🗑️  Clearing existing menu...');
  await prisma.menuItem.deleteMany({
    where: { tenantId: tenant.id },
  });
  await prisma.menuSection.deleteMany({
    where: { tenantId: tenant.id },
  });
  console.log('✅ Cleared existing menu\n');
  
  // Create sections and items
  let totalItems = 0;
  for (const sectionData of MENU_DATA.sections) {
    console.log(`📁 Creating section: ${sectionData.name}`);
    
    const section = await prisma.menuSection.create({
      data: {
        tenantId: tenant.id,
        name: sectionData.name,
        description: sectionData.description,
        type: sectionData.type,
        position: sectionData.position,
      },
    });
    
    console.log(`   Created section with ${sectionData.items.length} items:`);
    
    for (const itemData of sectionData.items) {
      await prisma.menuItem.create({
        data: {
          tenantId: tenant.id,
          menuSectionId: section.id,
          name: itemData.name,
          description: itemData.description,
          price: itemData.price,
          category: itemData.category,
          image: itemData.image,
          tags: itemData.tags,
          available: true,
        },
      });
      console.log(`   ✓ ${itemData.name} - $${itemData.price}`);
      console.log(`     Image: ${itemData.image}`);
      totalItems++;
    }
    console.log('');
  }
  
  console.log(`\n🎉 Success! Seeded ${MENU_DATA.sections.length} sections with ${totalItems} items\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

