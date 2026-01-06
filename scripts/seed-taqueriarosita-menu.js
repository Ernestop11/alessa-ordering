const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TENANT_SLUG = 'taqueriarosita';

const menuData = {
  sections: [
    {
      name: 'Burritos',
      description: 'Chicken, beef, pork, carne asada, carnitas, chile verde & beans or all the above prices add $1.50',
      type: 'RESTAURANT',
      position: 1,
      items: [
        {
          name: 'Super Deluxe Burrito',
          description: 'Rice, beans, meat, cream, guacamole, cheese & salsa',
          price: 16.00,
          priceBaby: 13.00,
          category: 'burritos',
          tags: ['popular'],
        },
        {
          name: 'Deluxe Burrito',
          description: 'Rice, beans, meat, cream, cheese & salsa',
          price: 14.00,
          priceBaby: 10.50,
          category: 'burritos',
          tags: [],
        },
        {
          name: 'Super Burrito',
          description: 'Rice, beans, meat & salsa',
          price: 14.00,
          priceBaby: 10.50,
          category: 'burritos',
          tags: [],
        },
        {
          name: 'Regular Burrito',
          description: 'Beans, meat & salsa',
          price: 13.00,
          priceBaby: 10.00,
          category: 'burritos',
          tags: [],
        },
        {
          name: 'Vegetarian Burrito',
          description: 'Rice, beans, cream, guacamole, cheese & salsa',
          price: 13.00,
          priceBaby: 10.00,
          category: 'burritos',
          tags: ['vegetarian'],
        },
        {
          name: 'Bean, Cheese & Rice Burrito',
          description: 'Beans, cheese and rice',
          price: 11.00,
          priceBaby: null,
          category: 'burritos',
          tags: ['vegetarian'],
        },
        {
          name: 'Bean & Cheese Burrito',
          description: 'Beans and cheese',
          price: 10.00,
          priceBaby: 9.00,
          category: 'burritos',
          tags: ['vegetarian'],
        },
      ],
    },
    {
      name: 'Tacos',
      description: 'Cilantro, onion, tomato & salsa. Meats: carne asada, chicken, carnitas, chorizo, lengua, cabeza, al pastor, birria, tripa',
      type: 'RESTAURANT',
      position: 2,
      items: [
        {
          name: 'Soft or Hard Shell Taco',
          description: 'Your choice of meat with cilantro, onion, tomato & salsa',
          price: 3.50,
          category: 'tacos',
          tags: ['popular'],
        },
        {
          name: 'Street Tacos',
          description: 'Meat, onion, cilantro on corn tortilla',
          price: 3.50,
          category: 'tacos',
          tags: ['popular'],
        },
      ],
    },
    {
      name: 'Sombreros',
      description: 'Crispy flour tortilla bowl',
      type: 'RESTAURANT',
      position: 3,
      items: [
        {
          name: 'Super Sombrero',
          description: 'Rice, beans, meat, lettuce, cream, guacamole, cheese, tomato & salsa',
          price: 16.00,
          category: 'sombreros',
          tags: ['popular'],
        },
        {
          name: 'Sombrero',
          description: 'Rice, beans, meat, lettuce, cheese, tomato & salsa',
          price: 14.00,
          category: 'sombreros',
          tags: [],
        },
        {
          name: 'Vegetarian Sombrero',
          description: 'Rice, beans, lettuce, cream, guacamole, cheese, tomato & salsa',
          price: 14.00,
          category: 'sombreros',
          tags: ['vegetarian'],
        },
        {
          name: 'Bean Sombrero',
          description: 'Beans, lettuce, cream, cheese, tomato & salsa',
          price: 10.00,
          category: 'sombreros',
          tags: ['vegetarian'],
        },
      ],
    },
    {
      name: 'Nachos',
      description: 'Fresh tortilla chips topped with your favorite ingredients',
      type: 'RESTAURANT',
      position: 4,
      items: [
        {
          name: 'Super Nachos',
          description: 'Chips, beans, meat, cheese, cream, guacamole, jalapenos & tomato',
          price: 16.50,
          priceMedium: 14.50,
          category: 'nachos',
          tags: ['popular'],
        },
        {
          name: 'Nachos',
          description: 'Chips, beans, meat, cheese, jalapenos & tomato',
          price: 14.50,
          priceMedium: 11.50,
          category: 'nachos',
          tags: [],
        },
      ],
    },
    {
      name: 'A La Carte',
      description: 'Individual items and sides',
      type: 'RESTAURANT',
      position: 5,
      items: [
        {
          name: 'Chicken Tortilla Soup',
          description: 'Traditional chicken tortilla soup',
          price: 8.00,
          category: 'a-la-carte',
          tags: [],
        },
        {
          name: 'Taquitos (3)',
          description: 'Three crispy rolled tacos',
          price: 9.50,
          category: 'a-la-carte',
          tags: [],
        },
        {
          name: 'Chalupa',
          description: 'Fried tortilla boat with toppings',
          price: 6.00,
          category: 'a-la-carte',
          tags: [],
        },
        {
          name: 'Rice & Beans',
          description: 'Side of rice and beans',
          price: 5.50,
          category: 'a-la-carte',
          tags: ['vegetarian'],
        },
        {
          name: 'Quesadilla',
          description: 'Cheese quesadilla',
          price: 5.00,
          category: 'a-la-carte',
          tags: ['vegetarian'],
        },
        {
          name: 'Chile Relleno',
          description: 'Stuffed poblano pepper',
          price: 6.50,
          category: 'a-la-carte',
          tags: ['vegetarian'],
        },
        {
          name: 'Tamale',
          description: 'Traditional tamale',
          price: 4.00,
          category: 'a-la-carte',
          tags: [],
        },
        {
          name: 'Sopapillas',
          description: 'Fried dough with honey',
          price: 4.50,
          category: 'a-la-carte',
          tags: ['vegetarian'],
        },
        {
          name: 'Guacamole (8 oz)',
          description: 'Fresh guacamole',
          price: 8.50,
          category: 'a-la-carte',
          tags: ['vegetarian'],
        },
        {
          name: 'Jalapenos',
          description: 'Side of jalapenos',
          price: 1.00,
          category: 'a-la-carte',
          tags: ['vegetarian'],
        },
        {
          name: 'Chips & Salsa',
          description: 'Fresh chips with salsa',
          price: 4.00,
          category: 'a-la-carte',
          tags: ['vegetarian'],
        },
        {
          name: 'Anthony\'s Secret Salsa',
          description: 'House special salsa',
          price: 5.00,
          category: 'a-la-carte',
          tags: ['vegetarian'],
        },
      ],
    },
    {
      name: 'Lunches & Dinners',
      description: 'Served with rice and beans',
      type: 'RESTAURANT',
      position: 6,
      items: [
        {
          name: 'Tamaoli',
          description: 'Traditional tamales served with rice and beans',
          price: 14.50,
          category: 'entrees',
          tags: [],
        },
        {
          name: 'Enchiladas',
          description: 'Three enchiladas with your choice of sauce, served with rice and beans',
          price: 15.75,
          category: 'entrees',
          tags: ['popular'],
        },
        {
          name: 'Quesadilla Dinner',
          description: 'Large quesadilla served with rice and beans',
          price: 14.00,
          category: 'entrees',
          tags: [],
        },
        {
          name: 'Tostada',
          description: 'Crispy tostada with toppings, served with rice and beans',
          price: 10.75,
          category: 'entrees',
          tags: [],
        },
        {
          name: 'Taco Combo',
          description: 'Two tacos served with rice and beans',
          price: 14.25,
          category: 'entrees',
          tags: [],
        },
        {
          name: 'Chile Relleno Dinner',
          description: 'Stuffed poblano pepper served with rice and beans',
          price: 15.50,
          category: 'entrees',
          tags: [],
        },
        {
          name: 'Carnitas',
          description: 'Slow cooked pork served with rice and beans',
          price: 17.00,
          category: 'entrees',
          tags: ['popular'],
        },
        {
          name: 'Carne Asada',
          description: 'Grilled steak served with rice and beans',
          price: 18.00,
          category: 'entrees',
          tags: ['popular'],
        },
        {
          name: 'Fajitas',
          description: 'Sizzling fajitas with peppers and onions, served with rice and beans',
          price: 17.50,
          category: 'entrees',
          tags: ['popular'],
        },
        {
          name: 'Pollo Asado',
          description: 'Grilled chicken served with rice and beans',
          price: 16.00,
          category: 'entrees',
          tags: [],
        },
      ],
    },
    {
      name: 'Catering',
      description: 'Catering available - Call 707-255-9208',
      type: 'SPECIAL',
      position: 7,
      items: [
        {
          name: 'Catering Inquiry',
          description: 'Contact us for catering packages and pricing. Call 707-255-9208',
          price: 0,
          category: 'catering',
          tags: ['catering'],
        },
      ],
    },
  ],
};

async function seedMenu() {
  try {
    console.log('🌮 Starting Taqueria Rosita menu seed...\n');

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
    menuData.sections.forEach(s => {
      console.log(`   - ${s.name}: ${s.items.length} items`);
    });
    console.log(`\n✅ Menu seeding complete!\n`);

  } catch (error) {
    console.error('❌ Error seeding menu:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedMenu();
