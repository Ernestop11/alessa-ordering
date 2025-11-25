#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Seeding Las Reinas catering packages...');

  // Find Las Reinas tenant
  const tenant = await prisma.tenant.findUnique({
    where: { slug: 'lasreinas' }
  });

  if (!tenant) {
    throw new Error('Las Reinas tenant not found! Make sure the tenant exists.');
  }

  console.log(`✓ Found tenant: ${tenant.name} (${tenant.id})`);

  // Popular Catering Options
  const popularPackages = [
    {
      name: 'Taco Bar Catering',
      description: 'Choice of 3 proteins, fresh toppings, salsas, tortillas. Perfect for events and parties.',
      pricePerGuest: 12,
      price: null,
      category: 'popular',
      badge: null,
      customizationRemovals: ['Onions', 'Cilantro', 'Spicy Salsa'],
      customizationAddons: [
        { id: 'guac', label: 'Add Guacamole', price: 2 },
        { id: 'queso', label: 'Add Queso', price: 1.5 },
        { id: 'churros', label: 'Add Churros Dessert', price: 3 },
      ],
      displayOrder: 0,
    },
    {
      name: 'Family Platters Catering',
      description: 'Enchiladas, rice, beans, salad. Serves 10-15 people.',
      pricePerGuest: 0,
      price: 120,
      category: 'popular',
      badge: null,
      customizationRemovals: ['Lettuce', 'Tomatoes', 'Sour Cream'],
      customizationAddons: [
        { id: 'extra-rice', label: 'Extra Rice & Beans', price: 15 },
        { id: 'flan', label: 'Add Flan Dessert', price: 20 },
        { id: 'drinks', label: 'Aguas Frescas (2 gal)', price: 25 },
      ],
      displayOrder: 1,
    },
    {
      name: 'Breakfast Catering',
      description: 'Breakfast burritos, chilaquiles, pan dulce. Start your event right!',
      pricePerGuest: 10,
      price: null,
      category: 'popular',
      badge: null,
      customizationRemovals: ['Eggs', 'Cheese', 'Beans'],
      customizationAddons: [
        { id: 'coffee', label: 'Add Coffee Service', price: 2.5 },
        { id: 'juice', label: 'Add Orange Juice', price: 1.5 },
        { id: 'fruit', label: 'Fruit Platter', price: 3 },
      ],
      displayOrder: 2,
    },
    {
      name: 'Dessert Packages',
      description: 'Tres leches, churros, conchas. Sweet endings for your celebration.',
      pricePerGuest: 4,
      price: null,
      category: 'popular',
      badge: null,
      customizationRemovals: ['Whipped Cream', 'Chocolate Drizzle'],
      customizationAddons: [
        { id: 'ice-cream', label: 'Add Ice Cream', price: 1.5 },
        { id: 'coffee-service', label: 'Coffee & Tea Service', price: 2 },
        { id: 'champurrado', label: 'Hot Champurrado', price: 1 },
      ],
      displayOrder: 3,
    },
  ];

  // Holiday & Event Bundles
  const holidayPackages = [
    {
      name: 'Thanksgiving Dinner Bundle',
      description: 'Complete feast: Roasted turkey, mole, rice, beans, tortillas, salsa verde, dessert tray. Serves 8-10.',
      pricePerGuest: 0,
      price: 280,
      category: 'holiday',
      badge: 'Popular',
      customizationRemovals: ['Mole Sauce', 'Cilantro', 'Turkey Gravy'],
      customizationAddons: [
        { id: 'extra-turkey', label: 'Extra Turkey (5 lbs)', price: 40 },
        { id: 'cranberry', label: 'Cranberry Sauce', price: 10 },
        { id: 'pumpkin-pie', label: 'Pumpkin Pie', price: 25 },
        { id: 'wine', label: 'Wine Pairing (2 bottles)', price: 50 },
      ],
      displayOrder: 0,
    },
    {
      name: 'Christmas Fiesta Bundle',
      description: 'Tamales (12), pozole (1 gallon), pan dulce assortment, champurrado. Serves 6-8.',
      pricePerGuest: 0,
      price: 180,
      category: 'holiday',
      badge: null,
      customizationRemovals: ['Pork Tamales', 'Spicy Pozole'],
      customizationAddons: [
        { id: 'extra-tamales', label: 'Extra Tamales (6)', price: 25 },
        { id: 'buñuelos', label: 'Add Buñuelos', price: 15 },
        { id: 'ponche', label: 'Ponche Navideño (1 gal)', price: 20 },
      ],
      displayOrder: 1,
    },
    {
      name: 'Birthday Party Bundle',
      description: 'Taco bar for 15, chips & salsa, tres leches cake, aguas frescas (2 gallons). Party ready!',
      pricePerGuest: 0,
      price: 220,
      category: 'holiday',
      badge: null,
      customizationRemovals: ['Spicy Options', 'Dairy', 'Nuts'],
      customizationAddons: [
        { id: 'decorations', label: 'Party Decorations', price: 30 },
        { id: 'extra-cake', label: 'Extra Cake (serves 10)', price: 35 },
        { id: 'balloons', label: 'Balloon Bouquet', price: 20 },
        { id: 'piñata', label: 'Add Piñata', price: 25 },
      ],
      displayOrder: 2,
    },
    {
      name: 'Office Lunch Bundle',
      description: 'Burrito bar for 20, chips, guac, salsa, cookies. Individual packaging available.',
      pricePerGuest: 0,
      price: 240,
      category: 'holiday',
      badge: null,
      customizationRemovals: ['Gluten', 'Dairy', 'Meat'],
      customizationAddons: [
        { id: 'utensils', label: 'Disposable Utensils & Plates', price: 15 },
        { id: 'individual-pack', label: 'Individual Packaging', price: 25 },
        { id: 'beverages', label: 'Soda & Water (20 ct)', price: 30 },
        { id: 'dessert-box', label: 'Dessert Box (20 cookies)', price: 35 },
      ],
      displayOrder: 3,
    },
  ];

  // Delete existing packages for Las Reinas
  const deleted = await prisma.cateringPackage.deleteMany({
    where: { tenantId: tenant.id }
  });
  console.log(`✓ Cleared ${deleted.count} existing packages`);

  // Create popular packages
  console.log('\n📦 Creating Popular Catering Options...');
  for (const pkg of popularPackages) {
    const created = await prisma.cateringPackage.create({
      data: {
        tenantId: tenant.id,
        ...pkg,
        available: true,
      }
    });
    console.log(`  ✓ Created: ${created.name}`);
  }

  // Create holiday packages
  console.log('\n🎉 Creating Holiday & Event Bundles...');
  for (const pkg of holidayPackages) {
    const created = await prisma.cateringPackage.create({
      data: {
        tenantId: tenant.id,
        ...pkg,
        available: true,
      }
    });
    console.log(`  ✓ Created: ${created.name}`);
  }

  const total = await prisma.cateringPackage.count({
    where: { tenantId: tenant.id }
  });

  console.log(`\n✅ Successfully created ${total} catering packages for Las Reinas!`);
  console.log('\n🎯 Next steps:');
  console.log('   1. Go to https://lasreinas.alessacloud.com/admin/menu?tenant=lasreinas');
  console.log('   2. Click on the "Catering Packages" tab');
  console.log('   3. Edit the packages as needed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding catering packages:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
