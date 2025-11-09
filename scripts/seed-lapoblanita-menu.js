const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TENANT_SLUG = 'lapoblanita';

const menuData = {
  sections: [
    {
      name: 'Tacos Tradicionales',
      description: 'Authentic tacos from Puebla, served on fresh handmade tortillas',
      type: 'RESTAURANT',
      position: 1,
      items: [
        {
          name: 'Pastor Taco',
          description: 'Marinated pork with pineapple, onions, cilantro, and our secret pastor sauce',
          price: 5.14,
          category: 'tacos',
          image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',
          tags: ['popular', 'spicy'],
        },
        {
          name: 'Birria Taco',
          description: 'Slow-braised beef in rich guajillo chile broth, with consommé for dipping',
          price: 5.14,
          category: 'tacos',
          image: 'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?auto=format&fit=crop&w=800&q=80',
          tags: ['popular', 'signature'],
        },
        {
          name: 'Arrachera Taco',
          description: 'Grilled skirt steak with chimichurri, pickled onions, and queso fresco',
          price: 5.14,
          category: 'tacos',
          image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=800&q=80',
          tags: ['popular'],
        },
        {
          name: 'Carnitas Taco',
          description: 'Slow-cooked pork shoulder with onions, cilantro, and salsa verde',
          price: 4.99,
          category: 'tacos',
          image: 'https://images.unsplash.com/photo-1542691457-cbe4df041eb2?auto=format&fit=crop&w=800&q=80',
          tags: [],
        },
        {
          name: 'Cabeza Taco',
          description: 'Tender beef head meat with onions, cilantro, and salsa roja',
          price: 4.99,
          category: 'tacos',
          image: 'https://images.unsplash.com/photo-1521302080490-8c39d3a088e0?auto=format&fit=crop&w=800&q=80',
          tags: ['traditional'],
        },
        {
          name: 'Lengua Taco',
          description: 'Tender beef tongue with salsa verde and diced onions',
          price: 5.29,
          category: 'tacos',
          image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',
          tags: ['traditional'],
        },
        {
          name: 'Pollo Asado Taco',
          description: 'Grilled chicken with chipotle crema and pickled jalapeños',
          price: 4.49,
          category: 'tacos',
          image: 'https://images.unsplash.com/photo-1613514785940-daed07799d9b?auto=format&fit=crop&w=800&q=80',
          tags: [],
        },
      ],
    },
    {
      name: 'Antojitos Poblanos',
      description: 'Traditional Puebla street food favorites',
      type: 'RESTAURANT',
      position: 2,
      items: [
        {
          name: 'Cemitas Poblanas',
          description: 'Sesame seed bun with breaded pork, avocado, Oaxaca cheese, papalo, and chipotle',
          price: 11.99,
          category: 'sandwiches',
          image: 'https://images.unsplash.com/photo-1619881589935-92c3e56e5a2d?auto=format&fit=crop&w=800&q=80',
          tags: ['signature', 'popular'],
        },
        {
          name: 'Chicken Flautas',
          description: 'Crispy rolled tortillas filled with shredded chicken, topped with crema and queso fresco',
          price: 11.99,
          category: 'entrees',
          image: 'https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=800&q=80',
          tags: ['popular'],
        },
        {
          name: 'Chalupas Poblanas',
          description: 'Fried masa boats topped with salsa verde, shredded chicken, crema, and cheese',
          price: 10.99,
          category: 'entrees',
          image: 'https://images.unsplash.com/photo-1604467715878-83e57e08adc3?auto=format&fit=crop&w=800&q=80',
          tags: ['traditional'],
        },
        {
          name: 'Quesadilla Grande',
          description: 'Large flour tortilla with Oaxaca cheese, choice of protein, and pico de gallo',
          price: 9.99,
          category: 'entrees',
          image: 'https://images.unsplash.com/photo-1618040996337-56904b7850b9?auto=format&fit=crop&w=800&q=80',
          tags: [],
        },
        {
          name: 'Tamales de Mole',
          description: 'Steamed corn masa filled with chicken and our house mole poblano',
          price: 8.99,
          category: 'entrees',
          image: 'https://images.unsplash.com/photo-1601311281776-c7eaa0a2b146?auto=format&fit=crop&w=800&q=80',
          tags: ['traditional', 'signature'],
        },
      ],
    },
    {
      name: 'Panadería',
      description: 'Fresh baked goods made daily',
      type: 'BAKERY',
      position: 3,
      items: [
        {
          name: 'Conchas (4 piezas)',
          description: 'Sweet bread with vanilla or chocolate shell topping',
          price: 5.99,
          category: 'bakery',
          image: 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?auto=format&fit=crop&w=800&q=80',
          tags: ['bakery', 'sweet'],
        },
        {
          name: 'Pan Dulce Surtido',
          description: 'Assorted sweet breads - cuernitos, orejas, polvorones (6 pieces)',
          price: 8.99,
          category: 'bakery',
          image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80',
          tags: ['bakery', 'sweet'],
        },
        {
          name: 'Bolillos (6 piezas)',
          description: 'Traditional Mexican bread rolls, perfect for tortas',
          price: 3.99,
          category: 'bakery',
          image: 'https://images.unsplash.com/photo-1598373182133-52452f7691ef?auto=format&fit=crop&w=800&q=80',
          tags: ['bakery'],
        },
      ],
    },
    {
      name: 'Bebidas',
      description: 'Authentic Mexican beverages',
      type: 'BEVERAGE',
      position: 4,
      items: [
        {
          name: 'Horchata',
          description: 'Refreshing rice and cinnamon drink',
          price: 3.99,
          category: 'drinks',
          image: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?auto=format&fit=crop&w=800&q=80',
          tags: ['popular'],
        },
        {
          name: 'Jamaica',
          description: 'Hibiscus flower agua fresca',
          price: 3.99,
          category: 'drinks',
          image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80',
          tags: [],
        },
        {
          name: 'Tamarindo',
          description: 'Sweet and tangy tamarind drink',
          price: 3.99,
          category: 'drinks',
          image: 'https://images.unsplash.com/photo-1582106245687-0040f0ec6b66?auto=format&fit=crop&w=800&q=80',
          tags: [],
        },
        {
          name: 'Café de Olla',
          description: 'Traditional Mexican coffee with cinnamon and piloncillo',
          price: 3.49,
          category: 'drinks',
          image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=800&q=80',
          tags: [],
        },
        {
          name: 'Mexican Coca-Cola',
          description: 'Made with real cane sugar (glass bottle)',
          price: 2.99,
          category: 'drinks',
          image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?auto=format&fit=crop&w=800&q=80',
          tags: [],
        },
      ],
    },
    {
      name: 'Postres',
      description: 'Traditional Mexican desserts',
      type: 'SPECIAL',
      position: 5,
      items: [
        {
          name: 'Churros con Cajeta',
          description: 'Crispy cinnamon sugar churros with goat milk caramel',
          price: 6.99,
          category: 'desserts',
          image: 'https://images.unsplash.com/photo-1608039755401-28912c8341d6?auto=format&fit=crop&w=800&q=80',
          tags: ['sweet', 'popular'],
        },
        {
          name: 'Flan Casero',
          description: 'Homemade vanilla custard with caramel',
          price: 5.99,
          category: 'desserts',
          image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?auto=format&fit=crop&w=800&q=80',
          tags: ['sweet'],
        },
        {
          name: 'Tres Leches Cake',
          description: 'Classic Mexican milk cake soaked in three milks',
          price: 6.49,
          category: 'desserts',
          image: 'https://images.unsplash.com/photo-1624559410647-124e0eb2e537?auto=format&fit=crop&w=800&q=80',
          tags: ['sweet', 'signature'],
        },
      ],
    },
  ],
};

async function seedMenu() {
  try {
    console.log('🌮 Starting La Poblanita menu seed...\n');

    // Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: TENANT_SLUG },
    });

    if (!tenant) {
      console.error(`❌ Tenant "${TENANT_SLUG}" not found`);
      process.exit(1);
    }

    console.log(`✅ Found tenant: ${tenant.name}\n`);

    // Clear existing menu
    console.log('🗑️  Clearing existing menu...');
    await prisma.menuItem.deleteMany({
      where: { tenantId: tenant.id },
    });
    await prisma.menuSection.deleteMany({
      where: { tenantId: tenant.id },
    });
    console.log('✅ Existing menu cleared\n');

    // Seed new menu
    let totalItems = 0;
    for (const sectionData of menuData.sections) {
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
        totalItems++;
      }
      console.log('');
    }

    console.log(`\n🎉 Success! Seeded ${menuData.sections.length} sections with ${totalItems} items\n`);
    console.log('📝 Summary:');
    console.log(`   - Tacos Tradicionales: 7 items`);
    console.log(`   - Antojitos Poblanos: 5 items`);
    console.log(`   - Panadería: 3 items`);
    console.log(`   - Bebidas: 5 items`);
    console.log(`   - Postres: 3 items`);
    console.log(`\n✅ Menu seeding complete!\n`);

  } catch (error) {
    console.error('❌ Error seeding menu:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedMenu();
