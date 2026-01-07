import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Common extras for Mexican food
const COMMON_EXTRAS = [
  { id: 'extra_cheese', label: 'Extra Cheese', price: 1 },
  { id: 'extra_guac', label: 'Guacamole', price: 2 },
  { id: 'extra_sour_cream', label: 'Sour Cream', price: 0.75 },
  { id: 'extra_jalapenos', label: 'Jalapeños', price: 0.50 },
  { id: 'extra_pico', label: 'Pico de Gallo', price: 0.75 },
];

// Items that should get common extras (plates, burritos, tacos, etc.)
const NEEDS_EXTRAS = [
  // Breakfast
  'BREAKFAST TACOS PLATE',
  'SINGLE BREAKFAST TACO',
  'BREAKFAST BURRITO',
  'CHILAQUILES',
  'HUEVOS CON CHORIZO PLATE',
  // Plates
  'ENCHILADAS ROJAS PLATE',
  'PLATO DE TAMALES',
  'PLATO HUEVO RANCHERO',
  'PLATO DE 3 TACOS',
  'PLATO DE FLAUTAS',
  'CRISPY TACO PLATE',
  'PLATO DE CHILE VERDE',
  'POLLO A LA CREMA',
  'CARNE ASADA PLATE',
  'POLLO A LA PLANCHA',
  'PLATO DE CHILE RELLENO',
  'PLATO DE PUPUSAS',
  'STEAK FAJITAS',
  'FAJITAS DE POLLO PLATE',
  'QUESABIRRIA PLATE',
  // Burritos
  'VEGGIE BURRITO',
  'BEAN AND CHEESE BURRITO',
  'BURRITO BOWL',
  'BURRITO REGULAR',
  'SUPER BURRITO',
  // A La Carta
  'SOPE',
  'PUPUSA',
  'QUESADILLA W/ MEAT',
  'CHEESE QUESADILLA',
  'QUESABIRRIA (1)',
  'CRISPY TACO INDIVIDUAL',
  // Tacos
  'Keto Taco',
  'TACOS REGULAR',
  'CRISPY TACOS',
  // Nachos
  'MEDIOS NACHOS',
  'NACHOS REGULARES',
  // Tortas
  'TORTA REGULAR',
];

async function main() {
  const tenant = await prisma.tenant.findFirst({ where: { slug: 'lasreinas' } });
  console.log('Tenant:', tenant?.id);

  const items = await prisma.menuItem.findMany({
    where: { tenantId: tenant.id },
  });

  let updated = 0;

  for (const item of items) {
    if (!NEEDS_EXTRAS.includes(item.name)) continue;

    let newAddons = item.customizationAddons ? [...item.customizationAddons] : [];

    // Check which extras are missing
    const missingExtras = COMMON_EXTRAS.filter(extra => {
      return !newAddons.some(a =>
        a.id === extra.id ||
        a.label?.toLowerCase().includes(extra.label.toLowerCase().split(' ')[0])
      );
    });

    if (missingExtras.length > 0) {
      // Add missing extras at the end
      newAddons = [...newAddons, ...missingExtras];
      await prisma.menuItem.update({
        where: { id: item.id },
        data: { customizationAddons: newAddons }
      });
      updated++;
      console.log(`Added ${missingExtras.length} extras to: ${item.name}`);
    }
  }

  console.log(`\nUpdated ${updated} items with common extras`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
