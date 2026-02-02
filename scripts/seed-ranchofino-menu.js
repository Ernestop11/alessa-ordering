const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TENANT_SLUG = 'ranchofino';

const menuData = {
  sections: [
    {
      name: 'Breakfast',
      description: 'Desayunos - Breakfast plates and burritos',
      type: 'RESTAURANT',
      position: 1,
      items: [
        {
          name: 'Breakfast Burrito',
          description: 'Choice of Meat, Refried Beans, Scrambled Eggs, Salsa Fresca, Cheese and Sour Cream.',
          price: 15.00,
          category: 'breakfast',
          image: null,
          tags: ['popular'],
        },
        {
          name: 'Machaca Burrito',
          description: 'Carnitas, Scrambled Eggs, Refried Beans, Diced Tomato, Onion, Cilantro, Cheese and Sour Cream. NO SUBSTITUTIONS.',
          price: 15.00,
          category: 'breakfast',
          image: null,
          tags: [],
        },
        {
          name: 'Plato De Machaca',
          description: 'Scrambled Eggs with Carnitas, Tomato, Onion, Cilantro, Cheese and Sour Cream.',
          price: 18.00,
          category: 'breakfast',
          image: null,
          tags: [],
        },
        {
          name: 'Chilaquiles',
          description: 'Your Choice of Green or Red Salsa. Two Eggs your way. Topped with Onions, Sour Cream, Cotija Cheese and Cilantro.',
          price: 16.00,
          category: 'breakfast',
          image: null,
          tags: ['popular'],
          isFeatured: true,
        },
        {
          name: 'Huevos Rancheros',
          description: 'Two House made Tostadas. Topped with Refried Beans, Two Eggs your way, Green or Red Salsa, Sour Cream, Cotija Cheese and Cilantro.',
          price: 16.00,
          category: 'breakfast',
          image: null,
          tags: [],
        },
        {
          name: 'Breakfast Taco',
          description: 'Scrambled Eggs with your choice of Meat, Topped with Salsa Fresca, Sour Cream and Cheese.',
          price: 8.25,
          category: 'breakfast',
          image: null,
          tags: [],
        },
      ],
    },
    {
      name: 'Huevos',
      description: 'Egg plates served with refried beans and your choice of side',
      type: 'RESTAURANT',
      position: 2,
      items: [
        {
          name: 'Huevos A La Mexicana',
          description: 'Tomato, Onion, Cilantro and Spicy Serrano Peppers Scramble. Served with Refried Beans. Your Choice of Tortillas.',
          price: 19.00,
          category: 'breakfast',
          image: null,
          tags: [],
        },
        {
          name: 'Huevos Con Chorizo',
          description: 'Chorizo Scramble Served with Refried Beans. Side of Shredded Lettuce, Dice Tomatoes, Cotija Cheese, Sour Cream and Cilantro.',
          price: 19.00,
          category: 'breakfast',
          image: null,
          tags: [],
        },
        {
          name: 'Chips & Salsa',
          description: 'Chips & Salsa',
          price: 3.50,
          category: 'appetizers',
          image: null,
          tags: [],
        },
      ],
    },
    {
      name: 'Tacos',
      description: 'Tacos served on corn tortillas',
      type: 'RESTAURANT',
      position: 3,
      items: [
        {
          name: 'Tacos',
          description: 'Corn Tortilla, Choice of Meat, Onion, Cilantro, and Salsa.',
          price: 3.50,
          category: 'tacos',
          image: null,
          tags: ['popular'],
        },
        {
          name: 'Taco Fino',
          description: 'Large Corn Tortilla, Choice of Meat, Onion, Cilantro, Salsa, Black Beans, Guacamole, Jack Cheese, and Sour Cream.',
          price: 7.45,
          category: 'tacos',
          image: null,
          tags: ['signature'],
        },
        {
          name: 'Valle Verde Crispy Taco',
          description: 'Hard Shell Taco with Your Choice of Meat, Lettuce, Sour Cream, Salsa Verde, and Cotija Cheese.',
          price: 4.55,
          category: 'tacos',
          image: null,
          tags: [],
        },
        {
          name: 'Taco de Camarón',
          description: 'Shrimp Taco with Cabbage Slaw, Chipotle Aioli, and Guacamole. Served on a Corn Tortilla.',
          price: 7.45,
          category: 'tacos',
          image: null,
          tags: [],
        },
        {
          name: 'Taco Salad',
          description: 'Choice of Meat, Rice, Refried Beans, Topped with Lettuce, Salsa Fresca, Guacamole, Sour Cream, and Cheese. Served in a Fried Tortilla Bowl.',
          price: 17.25,
          category: 'tacos',
          image: null,
          tags: [],
        },
      ],
    },
    {
      name: 'Taqueria Items',
      description: 'Traditional taqueria favorites',
      type: 'RESTAURANT',
      position: 4,
      items: [
        {
          name: 'Quesadilla',
          description: 'Choice of Meat, Jack Cheese, Lettuce, Fresh Tomatoes, Salsa Fresca and Sour Cream.',
          price: 14.15,
          category: 'taqueria',
          image: null,
          tags: [],
        },
        {
          name: 'Nachos del Rancho',
          description: 'House Made Chips Topped with Your Choice of Meat, Refried Beans, Nacho Cheese, Guacamole, Salsa Fresca, Sour Cream.',
          price: 17.45,
          category: 'taqueria',
          image: null,
          tags: [],
        },
        {
          name: 'Torta',
          description: 'Choice of Meat, Refried Beans, Jack Cheese, Lettuce, Onion, Tomato, and Jalapeños.',
          price: 14.05,
          category: 'taqueria',
          image: null,
          tags: [],
          available: false,
        },
      ],
    },
    {
      name: 'Burritos',
      description: 'Mexican Burritos',
      type: 'RESTAURANT',
      position: 5,
      items: [
        {
          name: 'Regular Burrito',
          description: 'Choice of Meat, Onion, Cilantro, Salsa, Rice and Whole Pinto Beans.',
          price: 11.95,
          category: 'burritos',
          image: null,
          tags: [],
        },
        {
          name: 'Super Burrito',
          description: 'Choice of Meat, Onion, Cilantro, Salsa, Rice and Whole Pinto Beans Plus Lettuce, Jack Cheese, and Sour Cream.',
          price: 13.95,
          category: 'burritos',
          image: null,
          tags: ['popular'],
        },
        {
          name: 'Wet Burrito',
          description: 'Choice of Meat, Onion, Cilantro, Salsa, Rice and Whole Pinto Beans Plus Lettuce, Jack Cheese, and Sour Cream. Served with salsa on top.',
          price: 14.95,
          category: 'burritos',
          image: null,
          tags: [],
        },
        {
          name: 'RBC Burrito',
          description: 'Rice, bean & cheese burrito.',
          price: 10.00,
          category: 'burritos',
          image: null,
          tags: [],
        },
      ],
    },
    {
      name: 'Specialties Plates',
      description: 'Specialty plates and house favorites',
      type: 'RESTAURANT',
      position: 6,
      items: [
        {
          name: 'Chile Relleno',
          description: 'Chile Poblano Stuffed with Queso Cotija and Jack Cheese, Battered and Topped with Paty\'s Tomato Sauce.',
          price: 18.95,
          category: 'specialties',
          image: null,
          tags: [],
        },
        {
          name: 'Enchiladas Finas',
          description: 'Your Choice of Meat. Topped with Green, Red or Both Salsas and Cheese.',
          price: 18.15,
          category: 'specialties',
          image: null,
          tags: [],
        },
        {
          name: 'Paty\'s Tamales',
          description: 'Your Choice of Pork or Chicken. Topped with Green Salsa and Sour Cream. No Tortillas (ORDER AT RESTAURANT OR CALL).',
          price: 17.95,
          category: 'specialties',
          image: null,
          tags: [],
          available: false,
        },
        {
          name: 'Plato de Birria',
          description: 'Beef Birria with Onion and Cilantro.',
          price: 19.95,
          category: 'specialties',
          image: null,
          tags: [],
        },
        {
          name: 'Pozole Verde or Rojo',
          description: 'Served with Cabbage, Onion, and Radish.',
          price: 17.15,
          category: 'specialties',
          image: null,
          tags: [],
        },
        {
          name: 'Quesabirria',
          description: 'Corn Tortilla with Beef Birria, Cheese, Cilantro and Onion. Salsa and "Consume" on the Side. Does NOT Include Side of Rice.',
          price: 6.25,
          category: 'specialties',
          image: null,
          tags: ['popular'],
        },
        {
          name: 'Carne Asada',
          description: 'Marinated Rib Eye with Grilled Onions and Roasted Jalapeños.',
          price: 24.95,
          category: 'specialties',
          image: null,
          tags: [],
        },
        {
          name: 'Chile Verde',
          description: 'Pork in Green Tomatillo Salsa.',
          price: 17.25,
          category: 'specialties',
          image: null,
          tags: [],
        },
        {
          name: 'Fajitas Finas',
          description: 'Bell Peppers and Onions Marinated with Our Secret Spices Mix.',
          price: 20.95,
          category: 'specialties',
          image: null,
          tags: [],
        },
        {
          name: 'Camarones a la diabla',
          description: 'Prawns in Our Spicy Tomato Sauce.',
          price: 22.95,
          category: 'specialties',
          image: null,
          tags: [],
        },
        {
          name: 'Camarones al mojo de ajo',
          description: 'Prawns Sauteed in Fresh Garlic and Butter.',
          price: 21.95,
          category: 'specialties',
          image: null,
          tags: [],
        },
        {
          name: 'Camarones a la plancha',
          description: 'Griddled Prawns in Garlic Salt Chili Flakes and Grilled Onions.',
          price: 21.95,
          category: 'specialties',
          image: null,
          tags: [],
        },
      ],
    },
    {
      name: 'For The Kiddos',
      description: 'Kids menu',
      type: 'RESTAURANT',
      position: 7,
      items: [
        {
          name: 'Kids Quesadilla',
          description: 'Kids Quesadilla.',
          price: 5.00,
          category: 'kids',
          image: null,
          tags: [],
        },
        {
          name: 'Mini Burrito',
          description: 'Comes with rice, beans & cheese.',
          price: 9.00,
          category: 'kids',
          image: null,
          tags: [],
        },
        {
          name: 'Little Nachos (No Meat)',
          description: 'Little Nachos (No Meat).',
          price: 5.00,
          category: 'kids',
          image: null,
          tags: [],
        },
        {
          name: 'Kids Cheese Enchilada',
          description: 'Kids Cheese Enchilada.',
          price: 5.00,
          category: 'kids',
          image: null,
          tags: [],
        },
      ],
    },
    {
      name: 'Sides & Extras',
      description: 'Sides and extras',
      type: 'RESTAURANT',
      position: 8,
      items: [
        {
          name: 'Chips & Salsa',
          description: 'Chips & Salsa.',
          price: 3.50,
          category: 'sides',
          image: null,
          tags: [],
        },
        {
          name: 'Beans',
          description: 'Side of beans.',
          price: 4.00,
          category: 'sides',
          image: null,
          tags: [],
        },
        {
          name: 'Rice',
          description: 'Side of rice.',
          price: 4.00,
          category: 'sides',
          image: null,
          tags: [],
        },
        {
          name: 'Guacamole',
          description: 'Fresh guacamole.',
          price: 8.50,
          category: 'sides',
          image: null,
          tags: [],
        },
        {
          name: 'Cheese',
          description: 'Side of cheese.',
          price: 1.50,
          category: 'sides',
          image: null,
          tags: [],
        },
        {
          name: 'Sour Cream',
          description: 'Side of sour cream.',
          price: 1.50,
          category: 'sides',
          image: null,
          tags: [],
        },
        {
          name: 'Flour Tortillas',
          description: 'Flour tortillas.',
          price: 2.50,
          category: 'sides',
          image: null,
          tags: [],
        },
        {
          name: 'Corn Tortillas',
          description: 'Corn tortillas.',
          price: 3.50,
          category: 'sides',
          image: null,
          tags: [],
        },
        {
          name: '8oz Salsa',
          description: '8oz salsa.',
          price: 5.00,
          category: 'sides',
          image: null,
          tags: [],
        },
      ],
    },
  ],
};

async function seedMenu() {
  try {
    console.log('Starting Rancho Fino menu seed...\n');

    // Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: TENANT_SLUG },
    });

    if (!tenant) {
      console.error(`Tenant "${TENANT_SLUG}" not found`);
      process.exit(1);
    }

    console.log(`Found tenant: ${tenant.name}\n`);

    // Clear existing menu
    console.log('Clearing existing menu...');
    await prisma.menuItem.deleteMany({
      where: { tenantId: tenant.id },
    });
    await prisma.menuSection.deleteMany({
      where: { tenantId: tenant.id },
    });
    console.log('Existing menu cleared\n');

    // Seed new menu
    let totalItems = 0;
    for (const sectionData of menuData.sections) {
      console.log(`Creating section: ${sectionData.name}`);

      const section = await prisma.menuSection.create({
        data: {
          tenantId: tenant.id,
          name: sectionData.name,
          description: sectionData.description,
          type: sectionData.type,
          position: sectionData.position,
        },
      });

      console.log(`  Created section with ${sectionData.items.length} items:`);

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
            isFeatured: itemData.isFeatured || false,
            available: true,
          },
        });
        console.log(`  + ${itemData.name} - $${itemData.price.toFixed(2)}`);
        totalItems++;
      }
      console.log('');
    }

    console.log(`\nSuccess! Seeded ${menuData.sections.length} sections with ${totalItems} items`);
    for (const section of menuData.sections) {
      console.log(`  - ${section.name}: ${section.items.length} items`);
    }
    console.log('\nMenu seeding complete!\n');

  } catch (error) {
    console.error('Error seeding menu:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedMenu();
