const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Enabling catering feature for Las Reinas...');

  const tenant = await prisma.tenant.findFirst({
    where: {
      slug: 'lasreinas',
    },
  });

  if (!tenant) {
    console.error('Las Reinas tenant not found!');
    process.exit(1);
  }

  console.log('Found tenant:', tenant.name);
  console.log('Current feature flags:', tenant.featureFlags);

  // Add 'catering' to featureFlags if not already present
  const updatedFlags = tenant.featureFlags.includes('catering')
    ? tenant.featureFlags
    : [...tenant.featureFlags, 'catering'];

  const updated = await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      featureFlags: updatedFlags,
    },
  });

  console.log('✅ Catering feature enabled for Las Reinas!');
  console.log('Updated feature flags:', updated.featureFlags);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

