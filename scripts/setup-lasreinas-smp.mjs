import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupLasReinasSMP() {
  const tenantId = '79bd3027-5520-480b-8979-2e37b21e58d0';
  const productId = '59b0d94b-8443-4a40-b4b3-4a3d7eea71f3';

  try {
    // 1. Create TenantProduct subscription for SMP
    const subscription = await prisma.tenantProduct.upsert({
      where: {
        tenantId_productId: {
          tenantId,
          productId,
        },
      },
      create: {
        tenantId,
        productId,
        status: 'active',
        billingCycle: 'monthly',
        monthlyAmount: 30,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      update: {
        status: 'active',
      },
    });
    console.log('SMP Subscription created:', subscription.id);

    // 2. Enable SMP add-on in TenantSettings
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId },
    });

    let enabledAddOns = settings?.enabledAddOns || [];
    if (!enabledAddOns.includes('smp')) {
      enabledAddOns.push('smp');
    }

    await prisma.tenantSettings.upsert({
      where: { tenantId },
      create: {
        tenantId,
        enabledAddOns,
      },
      update: {
        enabledAddOns,
      },
    });
    console.log('SMP add-on enabled in tenant settings');

    // 3. Create TenantSync record for SMP
    await prisma.tenantSync.upsert({
      where: {
        tenantId_productType: {
          tenantId,
          productType: 'SMP',
        },
      },
      create: {
        tenantId,
        productType: 'SMP',
        syncStatus: 'pending',
        syncConfig: { autoSync: true, syncInterval: 30 },
      },
      update: {
        syncStatus: 'pending',
      },
    });
    console.log('TenantSync record created for SMP');

    // 4. Update tenant feature flags
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    let featureFlags = tenant?.featureFlags || [];
    if (!featureFlags.includes('smp')) {
      featureFlags.push('smp');
    }

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        featureFlags,
      },
    });
    console.log('SMP feature flag added to tenant');

    console.log('\nLas Reinas SMP setup complete!');
  } catch (error) {
    console.error('Error setting up SMP:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupLasReinasSMP();
