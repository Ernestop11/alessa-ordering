import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Get La Poblanita settings
  const settings = await prisma.tenantSettings.findFirst({
    where: { tenant: { slug: 'lapoblanita' } }
  });

  if (!settings) {
    console.log('La Poblanita settings not found');
    return;
  }

  console.log('Current enabledAddOns:', settings.enabledAddOns);

  // Add panaderia to enabledAddOns if not already there
  const currentAddOns = settings.enabledAddOns || [];
  if (!currentAddOns.includes('panaderia')) {
    const updated = await prisma.tenantSettings.update({
      where: { id: settings.id },
      data: { enabledAddOns: [...currentAddOns, 'panaderia'] }
    });
    console.log('Updated enabledAddOns:', updated.enabledAddOns);
  } else {
    console.log('Panaderia already enabled');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
