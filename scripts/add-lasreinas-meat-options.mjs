import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Standard meat options for Mexican restaurant
const MEAT_OPTIONS = [
  { id: 'meat_asada', label: 'Asada (Steak)', price: 0 },
  { id: 'meat_pollo', label: 'Pollo (Chicken)', price: 0 },
  { id: 'meat_carnitas', label: 'Carnitas (Pork)', price: 0 },
  { id: 'meat_chorizo', label: 'Chorizo', price: 0 },
  { id: 'meat_al_pastor', label: 'Al Pastor', price: 0 },
  { id: 'meat_barbacoa', label: 'Barbacoa (Birria)', price: 1 },
  { id: 'meat_lengua', label: 'Lengua (Tongue)', price: 1.50 },
  { id: 'meat_cabeza', label: 'Cabeza', price: 0 },
];

const BREAKFAST_MEAT_OPTIONS = [
  { id: 'meat_chorizo', label: 'Chorizo', price: 0 },
  { id: 'meat_bacon', label: 'Bacon', price: 1 },
  { id: 'meat_ham', label: 'Ham', price: 0 },
  { id: 'meat_machaca', label: 'Machaca', price: 1 },
];

const PROTEIN_OPTIONS = [
  { id: 'protein_asada', label: 'Asada (Steak)', price: 0 },
  { id: 'protein_pollo', label: 'Pollo (Chicken)', price: 0 },
  { id: 'protein_carnitas', label: 'Carnitas', price: 0 },
  { id: 'protein_chorizo', label: 'Chorizo', price: 0 },
  { id: 'protein_al_pastor', label: 'Al Pastor', price: 0 },
  { id: 'protein_shrimp', label: 'Shrimp', price: 2 },
  { id: 'protein_fish', label: 'Fish', price: 1.50 },
];

// Items that need meat selection (by name patterns)
const NEEDS_MEAT_SELECTION = [
  // Tacos
  'TACOS REGULAR',
  'CRISPY TACOS',
  'PLATO DE 3 TACOS',
  'CRISPY TACO PLATE',
  'CRISPY TACO INDIVIDUAL',
  'Keto Taco',
  // Burritos
  'BURRITO REGULAR',
  'SUPER BURRITO',
  'BURRITO BOWL',
  // Other
  'SOPE',
  'PUPUSA',
  'QUESADILLA W/ MEAT',
  'TORTA REGULAR',
  'FLAUTA INDIVIDUAL',
  'PLATO DE FLAUTAS',
  'NACHOS REGULARES',
  'MEDIOS NACHOS',
];

const NEEDS_BREAKFAST_MEAT = [
  'BREAKFAST TACOS PLATE',
  'SINGLE BREAKFAST TACO',
  'BREAKFAST BURRITO',
];

async function main() {
  const tenant = await prisma.tenant.findFirst({ where: { slug: 'lasreinas' } });
  console.log('Tenant:', tenant?.id);

  const items = await prisma.menuItem.findMany({
    where: { tenantId: tenant.id },
  });

  let updated = 0;

  for (const item of items) {
    let newAddons = item.customizationAddons ? [...item.customizationAddons] : [];
    let needsUpdate = false;

    // Check if item needs meat options
    if (NEEDS_MEAT_SELECTION.includes(item.name)) {
      // Add meat options if not already present
      const hasMeatOptions = newAddons.some(a => a.id?.startsWith('meat_') || a.id?.startsWith('protein_'));
      if (!hasMeatOptions) {
        newAddons = [...MEAT_OPTIONS, ...newAddons];
        needsUpdate = true;
        console.log(`Adding meat options to: ${item.name}`);
      }
    }

    // Check if breakfast item needs chorizo option
    if (NEEDS_BREAKFAST_MEAT.includes(item.name)) {
      const hasChorizoOrFullBreakfastMeat = newAddons.some(a =>
        a.label?.toLowerCase().includes('chorizo') ||
        a.label?.toLowerCase().includes('ham') ||
        a.label?.toLowerCase().includes('machaca')
      );
      if (!hasChorizoOrFullBreakfastMeat) {
        // Keep existing bacon addon, add other breakfast meats
        const existingBacon = newAddons.find(a => a.label?.toLowerCase().includes('bacon'));
        const otherAddons = newAddons.filter(a => !a.label?.toLowerCase().includes('bacon'));
        newAddons = [...BREAKFAST_MEAT_OPTIONS, ...otherAddons];
        needsUpdate = true;
        console.log(`Adding breakfast meat options to: ${item.name}`);
      }
    }

    if (needsUpdate) {
      await prisma.menuItem.update({
        where: { id: item.id },
        data: { customizationAddons: newAddons }
      });
      updated++;
    }
  }

  console.log(`\nUpdated ${updated} items`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
