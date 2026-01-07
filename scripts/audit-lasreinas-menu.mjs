import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findFirst({ where: { slug: 'lasreinas' } });
  console.log('Tenant:', tenant?.id);

  const sections = await prisma.menuSection.findMany({
    where: { tenantId: tenant.id },
    include: {
      menuItems: true
    },
    orderBy: { position: 'asc' }
  });

  for (const section of sections) {
    console.log('\n=== ' + section.name + ' ===');
    for (const item of section.menuItems) {
      const addons = item.customizationAddons;
      const addonCount = addons ? (Array.isArray(addons) ? addons.length : Object.keys(addons).length) : 0;
      const mods = addonCount > 0 ? ` [${addonCount} addons]` : '';
      console.log(`  - ${item.name} ($${item.price})${mods}`);
      if (addons && addonCount > 0) {
        console.log(`      Addons: ${JSON.stringify(addons)}`);
      }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
