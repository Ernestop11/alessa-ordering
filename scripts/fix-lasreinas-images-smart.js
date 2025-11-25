const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Smart mapping: Try to match item names to appropriate images
// Falls back to section images if no match found
const ITEM_IMAGE_MAP = {
  // Breakfast items
  'CHILAQUILES': '/tenant/lasreinas/images/menu-items/desayuno.jpg',
  'BREAKFAST BURRITO': '/tenant/lasreinas/images/menu-items/desayuno.jpg',
  'BREAKFAST TACOS PLATE': '/tenant/lasreinas/images/menu-items/desayuno.jpg',
  'SINGLE BREAKFAST TACO': '/tenant/lasreinas/images/menu-items/desayuno.jpg',
  'HUEVOS CON CHORIZO PLATE': '/tenant/lasreinas/images/menu-items/desayuno.jpg',
  
  // Tacos - use tacos image
  'TACOS REGULAR': '/tenant/lasreinas/images/menu-items/tacos.jpg',
  'CRISPY TACOS': '/tenant/lasreinas/images/menu-items/tacos.jpg',
  'SHRIMP TACO': '/tenant/lasreinas/images/menu-items/tacos.jpg',
  'CRISPY TACOS W/SHRIMP': '/tenant/lasreinas/images/menu-items/tacos.jpg',
  'Keto Taco': '/tenant/lasreinas/images/menu-items/tacos.jpg',
  
  // Burritos
  'BURRITO REGULAR': '/tenant/lasreinas/images/menu-items/burritos.jpg',
  'SUPER BURRITO': '/tenant/lasreinas/images/menu-items/burritos.jpg',
  'BURRITO DE CAMARON REGULAR': '/tenant/lasreinas/images/menu-items/burritos.jpg',
  'VEGGIE BURRITO': '/tenant/lasreinas/images/menu-items/burritos.jpg',
  'BURRITO BOWL': '/tenant/lasreinas/images/menu-items/burritos.jpg',
  'BEAN AND CHEESE BURRITO': '/tenant/lasreinas/images/menu-items/burritos.jpg',
  'BEAN AND CHEESE MINI BURRITO': '/tenant/lasreinas/images/menu-items/burritos.jpg',
  'SUPER SHRIMP BURRITO': '/tenant/lasreinas/images/menu-items/burritos.jpg',
  
  // Plates
  'POLLO A LA PLANCHA': '/tenant/lasreinas/images/menu-items/platillos-plates.jpg',
  'POLLO A LA CREMA': '/tenant/lasreinas/images/menu-items/platillos-plates.jpg',
  'CARNE ASADA PLATE': '/tenant/lasreinas/images/menu-items/platillos-plates.jpg',
  'CAMARONES A LA DIABLA': '/tenant/lasreinas/images/menu-items/platillos-plates.jpg',
  'CAMARONES A LA CREMA': '/tenant/lasreinas/images/menu-items/platillos-plates.jpg',
  'ENCHILADAS ROJAS PLATE': '/tenant/lasreinas/images/menu-items/platillos-plates.jpg',
  'FAJITAS DE CAMARÓN': '/tenant/lasreinas/images/menu-items/platillos-plates.jpg',
  'PLATO HUEVO RANCHERO': '/tenant/lasreinas/images/menu-items/platillos-plates.jpg',
  'PLATO DE 3 TACOS': '/tenant/lasreinas/images/menu-items/platillos-plates.jpg',
  'PLATO DE FLAUTAS': '/tenant/lasreinas/images/menu-items/platillos-plates.jpg',
  'CRISPY TACO PLATE': '/tenant/lasreinas/images/menu-items/platillos-plates.jpg',
  'PLATO DE CHILE VERDE': '/tenant/lasreinas/images/menu-items/platillos-plates.jpg',
  'PLATO DE TAMALES': '/tenant/lasreinas/images/menu-items/platillos-plates.jpg',
  'QUESABIRRIA PLATE': '/tenant/lasreinas/images/menu-items/platillos-plates.jpg',
  'PLATO DE CHILE RELLENO': '/tenant/lasreinas/images/menu-items/platillos-plates.jpg',
  'PLATO DE PUPUSAS': '/tenant/lasreinas/images/menu-items/platillos-plates.jpg',
  'STEAK FAJITAS': '/tenant/lasreinas/images/menu-items/platillos-plates.jpg',
  'FAJITAS DE POLLO PLATE': '/tenant/lasreinas/images/menu-items/platillos-plates.jpg',
  
  // A La Carta
  'ENCHILADA A LA CARTA': '/tenant/lasreinas/images/menu-items/a-la-carta.jpg',
  'FLAUTA INDIVIDUAL': '/tenant/lasreinas/images/menu-items/a-la-carta.jpg',
  'CRISPY TACO INDIVIDUAL': '/tenant/lasreinas/images/menu-items/a-la-carta.jpg',
  'CHILE RELLENO': '/tenant/lasreinas/images/menu-items/a-la-carta.jpg',
  'PUPUSA': '/tenant/lasreinas/images/menu-items/a-la-carta.jpg',
  'TAMALE (1)': '/tenant/lasreinas/images/menu-items/a-la-carta.jpg',
  'SOPE': '/tenant/lasreinas/images/menu-items/a-la-carta.jpg',
  'CHEESE QUESADILLA': '/tenant/lasreinas/images/menu-items/a-la-carta.jpg',
  'FISH TACO': '/tenant/lasreinas/images/menu-items/a-la-carta.jpg',
  'QUESABIRRIA (1)': '/tenant/lasreinas/images/menu-items/a-la-carta.jpg',
  
  // Nachos
  'MEDIOS NACHOS': '/tenant/lasreinas/images/menu-items/nachos-y-quesadillas.jpg',
  'NACHOS REGULARES': '/tenant/lasreinas/images/menu-items/nachos-y-quesadillas.jpg',
  'QUESADILLA W/ MEAT': '/tenant/lasreinas/images/menu-items/nachos-y-quesadillas.jpg',
  
  // Tortas
  'TORTA REGULAR': '/tenant/lasreinas/images/menu-items/tortas.jpg',
  
  // Meat by pound
  'Pollo/Chicken': '/tenant/lasreinas/images/menu-items/meat-by-the-pound.jpg',
  'Asada/Steak': '/tenant/lasreinas/images/menu-items/meat-by-the-pound.jpg',
  'Adobada': '/tenant/lasreinas/images/menu-items/meat-by-the-pound.jpg',
  'Barbacoa(BIRRIA)': '/tenant/lasreinas/images/menu-items/meat-by-the-pound.jpg',
  'FAJITA DE POLLO': '/tenant/lasreinas/images/menu-items/meat-by-the-pound.jpg',
  'LENGUA': '/tenant/lasreinas/images/menu-items/meat-by-the-pound.jpg',
  
  // Sides
  'Arroz (Mexican Rice)': '/tenant/lasreinas/images/menu-items/sides.jpg',
  'Frijoles (Beans)': '/tenant/lasreinas/images/menu-items/sides.jpg',
  
  // Drinks - using sides as placeholder (no drink image available)
  'JARITOS': '/tenant/lasreinas/images/menu-items/sides.jpg',
  'MEXICAN COCA COLA 500ML': '/tenant/lasreinas/images/menu-items/sides.jpg',
  'Bottled Water small': '/tenant/lasreinas/images/menu-items/sides.jpg',
  'MEXICAN COCA COLA 355ML': '/tenant/lasreinas/images/menu-items/sides.jpg',
};

const SECTION_FALLBACK_IMAGE_MAP = {
  'Desayuno (Breakfast)': '/tenant/lasreinas/images/menu-items/desayuno.jpg',
  'DESAYUNO (BREAKFAST)': '/tenant/lasreinas/images/menu-items/desayuno.jpg',
  'Platillos/Plates': '/tenant/lasreinas/images/menu-items/platillos-plates.jpg',
  'PLATILLOS/PLATES': '/tenant/lasreinas/images/menu-items/platillos-plates.jpg',
  'Burritos': '/tenant/lasreinas/images/menu-items/burritos.jpg',
  'BURRITOS': '/tenant/lasreinas/images/menu-items/burritos.jpg',
  'A La Carta': '/tenant/lasreinas/images/menu-items/a-la-carta.jpg',
  'A LA CARTA': '/tenant/lasreinas/images/menu-items/a-la-carta.jpg',
  'Tacos': '/tenant/lasreinas/images/menu-items/tacos.jpg',
  'TACOS': '/tenant/lasreinas/images/menu-items/tacos.jpg',
  'Nachos y Quesadillas': '/tenant/lasreinas/images/menu-items/nachos-y-quesadillas.jpg',
  'NACHOS Y QUESADILLAS': '/tenant/lasreinas/images/menu-items/nachos-y-quesadillas.jpg',
  'Tortas': '/tenant/lasreinas/images/menu-items/tortas.jpg',
  'TORTAS': '/tenant/lasreinas/images/menu-items/tortas.jpg',
  'Meat by the pound': '/tenant/lasreinas/images/menu-items/meat-by-the-pound.jpg',
  'MEAT BY THE POUND': '/tenant/lasreinas/images/menu-items/meat-by-the-pound.jpg',
  'Sides': '/tenant/lasreinas/images/menu-items/sides.jpg',
  'SIDES': '/tenant/lasreinas/images/menu-items/sides.jpg',
  'Drinks': '/tenant/lasreinas/images/menu-items/sides.jpg',
  'DRINKS': '/tenant/lasreinas/images/menu-items/sides.jpg',
};

async function main() {
  console.log('🖼️  Smart image mapping for Las Reinas menu items...\n');
  
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
  
  let exactMatchCount = 0;
  let fallbackCount = 0;
  let alreadyCorrectCount = 0;
  
  for (const section of tenant.menuSections) {
    const sectionFallback = SECTION_FALLBACK_IMAGE_MAP[section.name] || null;
    
    console.log(`\n📁 Section: ${section.name}`);
    console.log(`   Fallback image: ${sectionFallback || 'none'}`);
    
    for (const item of section.menuItems) {
      // Try exact match first
      const exactMatch = ITEM_IMAGE_MAP[item.name];
      const imageToUse = exactMatch || sectionFallback || item.image;
      
      // Only update if different
      if (item.image !== imageToUse && imageToUse) {
        await prisma.menuItem.update({
          where: { id: item.id },
          data: { image: imageToUse }
        });
        
        if (exactMatch) {
          exactMatchCount++;
          console.log(`   ✅ ${item.name} → ${exactMatch.split('/').pop()} (exact match)`);
        } else if (sectionFallback) {
          fallbackCount++;
          console.log(`   📍 ${item.name} → ${sectionFallback.split('/').pop()} (section fallback)`);
        }
      } else if (item.image === imageToUse) {
        alreadyCorrectCount++;
      }
    }
  }
  
  console.log(`\n✨ Summary:`);
  console.log(`   ✅ Exact matches: ${exactMatchCount} items`);
  console.log(`   📍 Section fallbacks: ${fallbackCount} items`);
  console.log(`   ✓ Already correct: ${alreadyCorrectCount} items`);
  console.log(`\n✅ Image mapping complete!\n`);
  
  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  });

