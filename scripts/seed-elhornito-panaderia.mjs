/**
 * Seed El Hornito Bakery with Mexican Panaderia Items
 *
 * Creates menu sections and items for:
 * - Pan Dulce (sweet bread)
 * - Pasteles (cakes)
 * - Galletas (cookies)
 * - Pan Salado (savory bread)
 * - Bundles (combos)
 *
 * Run with: node scripts/seed-elhornito-panaderia.mjs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedElHornitoPanaderia() {
  console.log('🥐 Seeding El Hornito Panaderia...\n');

  // Find La Poblanita tenant
  const laPoblanita = await prisma.tenant.findUnique({
    where: { slug: 'lapoblanita' },
  });

  if (!laPoblanita) {
    console.error('❌ La Poblanita tenant not found!');
    process.exit(1);
  }

  console.log(`✅ Found La Poblanita: ${laPoblanita.name} (${laPoblanita.id})`);

  // Find El Hornito sub-tenant
  const elHornito = await prisma.tenant.findFirst({
    where: {
      slug: 'elhornito',
      parentTenantId: laPoblanita.id,
    },
  });

  if (!elHornito) {
    console.error('❌ El Hornito sub-tenant not found! Run the create script first.');
    process.exit(1);
  }

  console.log(`✅ Found El Hornito: ${elHornito.name} (${elHornito.id})\n`);

  // Define menu sections
  // Valid types: RESTAURANT, BAKERY, GROCERY, BEVERAGE, SPECIAL, OTHER
  const sections = [
    {
      name: 'Pan Dulce',
      description: 'Tradicional pan dulce mexicano, horneado fresco cada dia',
      type: 'BAKERY',
      position: 1,
    },
    {
      name: 'Pasteles',
      description: 'Pasteles para toda ocasion - personalizables!',
      type: 'SPECIAL',
      position: 2,
    },
    {
      name: 'Galletas',
      description: 'Galletas caseras con recetas tradicionales',
      type: 'BAKERY',
      position: 3,
    },
    {
      name: 'Pan Salado',
      description: 'Bolillos, teleras y mas para tu mesa',
      type: 'BAKERY',
      position: 4,
    },
    {
      name: 'Combos Panaderos',
      description: 'Paquetes especiales para compartir',
      type: 'SPECIAL',
      position: 5,
    },
  ];

  // Define items per section
  const panDulceItems = [
    {
      name: 'Concha',
      description: 'Pan dulce clasico con cubierta de azucar. Disponible en vainilla, chocolate, o fresa.',
      price: 1.50,
      category: 'pan-dulce',
      tags: ['popular', 'clasico'],
      isFeatured: true,
    },
    {
      name: 'Cuerno',
      description: 'Suave croissant mexicano con glaseado de azucar. Perfecto para el cafe.',
      price: 1.75,
      category: 'pan-dulce',
      tags: ['clasico'],
      isFeatured: true,
    },
    {
      name: 'Oreja',
      description: 'Pan hojaldrado en forma de oreja, crujiente y dulce. Tradicion pura.',
      price: 1.50,
      category: 'pan-dulce',
      tags: ['crujiente', 'clasico'],
    },
    {
      name: 'Polvoron',
      description: 'Pan de mantequilla con cobertura de azucar glass. Se deshace en la boca.',
      price: 1.25,
      category: 'pan-dulce',
      tags: ['clasico'],
    },
    {
      name: 'Cochinito',
      description: 'Galleta de jengibre en forma de cochinito. Favorito de los ninos!',
      price: 1.00,
      category: 'pan-dulce',
      tags: ['ninos', 'clasico'],
    },
    {
      name: 'Puerquito',
      description: 'Pan de piloncillo en forma de puerquito. Sabor a canela y piloncillo.',
      price: 1.25,
      category: 'pan-dulce',
      tags: ['clasico'],
    },
    {
      name: 'Novio',
      description: 'Pan en forma de persona con glaseado blanco. Tradicion de bodas.',
      price: 1.75,
      category: 'pan-dulce',
      tags: ['especial'],
    },
    {
      name: 'Campechana',
      description: 'Pan hojaldrado con azucar caramelizada encima. Crujiente y delicioso.',
      price: 1.50,
      category: 'pan-dulce',
      tags: ['crujiente'],
    },
    {
      name: 'Bigote',
      description: 'Pan largo con forma de bigote. Suave y ligeramente dulce.',
      price: 1.25,
      category: 'pan-dulce',
      tags: ['clasico'],
    },
    {
      name: 'Banderilla',
      description: 'Pan largo con glaseado de colores. Alegre y festivo.',
      price: 1.50,
      category: 'pan-dulce',
      tags: ['colorido'],
    },
    {
      name: 'Rebanada',
      description: 'Pan en forma de triangulo con glaseado rosa o blanco.',
      price: 1.25,
      category: 'pan-dulce',
      tags: ['clasico'],
    },
    {
      name: 'Moño',
      description: 'Pan en forma de mono con azucar. Delicado y elegante.',
      price: 1.50,
      category: 'pan-dulce',
      tags: ['especial'],
    },
  ];

  const pastelesItems = [
    {
      name: 'Pastel de Tres Leches',
      description: 'El clasico pastel mexicano bañado en tres leches. Humedo, cremoso, irresistible.',
      price: 35.00,
      category: 'pasteles',
      tags: ['popular', 'personalizable'],
      isFeatured: true,
    },
    {
      name: 'Pastel de Chocolate',
      description: 'Rico pastel de chocolate con ganache. Perfecto para los amantes del chocolate.',
      price: 32.00,
      category: 'pasteles',
      tags: ['personalizable'],
    },
    {
      name: 'Pastel de Fresa',
      description: 'Pastel de vainilla con fresas frescas y crema batida. Fresco y delicioso.',
      price: 38.00,
      category: 'pasteles',
      tags: ['frutas', 'personalizable'],
      isFeatured: true,
    },
    {
      name: 'Pastel de Cajeta',
      description: 'Pastel con relleno y cobertura de cajeta. El sabor de Mexico.',
      price: 36.00,
      category: 'pasteles',
      tags: ['mexicano', 'personalizable'],
    },
    {
      name: 'Pastel Red Velvet',
      description: 'Pastel rojo terciopelo con frosting de queso crema. Elegante y delicioso.',
      price: 40.00,
      category: 'pasteles',
      tags: ['especial', 'personalizable'],
    },
    {
      name: 'Pastel de Durazno',
      description: 'Pastel con duraznos frescos y crema. Perfecto para el verano.',
      price: 38.00,
      category: 'pasteles',
      tags: ['frutas', 'personalizable'],
    },
    {
      name: 'Pastel de Zanahoria',
      description: 'Pastel humedo de zanahoria con nueces y frosting de queso crema.',
      price: 34.00,
      category: 'pasteles',
      tags: ['personalizable'],
    },
    {
      name: 'Pastel de Cumpleanos',
      description: 'Pastel decorado para tu celebracion especial. Personalizable al gusto.',
      price: 45.00,
      category: 'pasteles',
      tags: ['celebracion', 'personalizable'],
      isFeatured: true,
    },
  ];

  const galletasItems = [
    {
      name: 'Galleta de Mantequilla',
      description: 'Galleta clasica de mantequilla. Suave y crujiente.',
      price: 0.75,
      category: 'galletas',
      tags: ['clasico'],
    },
    {
      name: 'Galleta de Chocolate',
      description: 'Galleta con chips de chocolate. Irresistible.',
      price: 1.00,
      category: 'galletas',
      tags: ['chocolate'],
      isFeatured: true,
    },
    {
      name: 'Polvorones de Nuez',
      description: 'Galletas de nuez que se deshacen en la boca. Cubiertas de azucar glass.',
      price: 1.25,
      category: 'galletas',
      tags: ['nuez', 'mexicano'],
    },
    {
      name: 'Galletas de Avena',
      description: 'Galletas de avena con pasas. Nutritivas y deliciosas.',
      price: 0.85,
      category: 'galletas',
      tags: ['saludable'],
    },
    {
      name: 'Hojarascas',
      description: 'Galletas tradicionales de canela. Perfectas con cafe.',
      price: 1.00,
      category: 'galletas',
      tags: ['mexicano', 'canela'],
    },
    {
      name: 'Galletas de Piloncillo',
      description: 'Galletas con sabor a piloncillo y canela. Tradicion mexicana.',
      price: 1.00,
      category: 'galletas',
      tags: ['mexicano'],
    },
  ];

  const panSaladoItems = [
    {
      name: 'Bolillo',
      description: 'Pan crujiente tradicional para tortas y acompanar comidas.',
      price: 0.50,
      category: 'pan-salado',
      tags: ['basico'],
    },
    {
      name: 'Telera',
      description: 'Pan suave perfecto para tortas. La textura ideal.',
      price: 0.60,
      category: 'pan-salado',
      tags: ['basico'],
    },
    {
      name: 'Birote',
      description: 'Pan tipo baguette mexicano. Crujiente por fuera, suave por dentro.',
      price: 0.75,
      category: 'pan-salado',
      tags: ['crujiente'],
    },
    {
      name: 'Pan de Muerto',
      description: 'Pan tradicional de Dia de Muertos con sabor a naranja y anis.',
      price: 3.50,
      category: 'pan-salado',
      tags: ['temporal', 'especial'],
    },
    {
      name: 'Rosca de Reyes',
      description: 'Rosca tradicional para Dia de Reyes. Con frutas cristalizadas.',
      price: 18.00,
      category: 'pan-salado',
      tags: ['temporal', 'especial'],
    },
  ];

  const bundlesItems = [
    {
      name: 'Docena de Pan Dulce',
      description: '12 piezas de pan dulce variado. Conchas, cuernos, orejas y mas.',
      price: 15.00,
      category: 'bundles',
      tags: ['combo', 'familia'],
      isFeatured: true,
    },
    {
      name: 'Media Docena Variada',
      description: '6 piezas de pan dulce surtido. Perfecto para compartir.',
      price: 8.00,
      category: 'bundles',
      tags: ['combo'],
    },
    {
      name: 'Combo Cafe y Pan',
      description: '2 conchas + 1 cafe de olla. El desayuno perfecto.',
      price: 5.50,
      category: 'bundles',
      tags: ['combo', 'desayuno'],
    },
    {
      name: 'Paquete Fiesta',
      description: '2 docenas de pan dulce + 1 pastel pequeno. Para 20 personas.',
      price: 55.00,
      category: 'bundles',
      tags: ['combo', 'fiesta'],
    },
    {
      name: 'Canasta Familiar',
      description: 'Bolillos, teleras y pan dulce variado. Para toda la semana.',
      price: 22.00,
      category: 'bundles',
      tags: ['combo', 'familia'],
    },
  ];

  // Create sections and items
  console.log('📦 Creating menu sections...\n');

  for (const sectionData of sections) {
    // Check if section exists
    let section = await prisma.menuSection.findFirst({
      where: {
        tenantId: elHornito.id,
        name: sectionData.name,
      },
    });

    if (!section) {
      section = await prisma.menuSection.create({
        data: {
          tenantId: elHornito.id,
          ...sectionData,
        },
      });
      console.log(`  ✅ Created section: ${section.name}`);
    } else {
      console.log(`  ⏭️  Section exists: ${section.name}`);
    }

    // Get items for this section
    let items = [];
    switch (sectionData.name) {
      case 'Pan Dulce':
        items = panDulceItems;
        break;
      case 'Pasteles':
        items = pastelesItems;
        break;
      case 'Galletas':
        items = galletasItems;
        break;
      case 'Pan Salado':
        items = panSaladoItems;
        break;
      case 'Combos Panaderos':
        items = bundlesItems;
        break;
    }

    // Create items
    for (const itemData of items) {
      const existingItem = await prisma.menuItem.findFirst({
        where: {
          tenantId: elHornito.id,
          name: itemData.name,
        },
      });

      if (!existingItem) {
        await prisma.menuItem.create({
          data: {
            tenantId: elHornito.id,
            menuSectionId: section.id,
            name: itemData.name,
            description: itemData.description,
            price: itemData.price,
            category: itemData.category,
            tags: itemData.tags || [],
            available: true,
            isFeatured: itemData.isFeatured || false,
          },
        });
        console.log(`      + ${itemData.name} - $${itemData.price.toFixed(2)}`);
      }
    }
  }

  // Summary
  const totalSections = await prisma.menuSection.count({
    where: { tenantId: elHornito.id },
  });

  const totalItems = await prisma.menuItem.count({
    where: { tenantId: elHornito.id },
  });

  const featuredItems = await prisma.menuItem.count({
    where: { tenantId: elHornito.id, isFeatured: true },
  });

  console.log('\n' + '='.repeat(50));
  console.log('🥐 El Hornito Panaderia Seeded Successfully!');
  console.log('='.repeat(50));
  console.log(`  📦 Total Sections: ${totalSections}`);
  console.log(`  🍞 Total Items: ${totalItems}`);
  console.log(`  ⭐ Featured Items: ${featuredItems}`);
  console.log('='.repeat(50));
  console.log('\nVisit https://lapoblanitamexicanfood.com/bakery to see the menu!');
}

seedElHornitoPanaderia()
  .catch((e) => {
    console.error('❌ Error seeding panaderia:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
