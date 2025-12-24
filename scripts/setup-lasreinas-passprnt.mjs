#!/usr/bin/env node
/**
 * Set up Star TSP100III with PassPRNT for Las Reinas
 *
 * This script configures the Las Reinas tenant to use the Star PassPRNT app
 * for receipt printing via URL scheme.
 *
 * Requirements:
 * 1. Star PassPRNT app installed on iPad from App Store
 * 2. Star TSP100III Bluetooth printer paired with iPad in Settings > Bluetooth
 * 3. PassPRNT app configured with the printer
 *
 * Usage:
 *   node scripts/setup-lasreinas-passprnt.mjs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🖨️  Setting up Star TSP100III with PassPRNT for Las Reinas\n');

  // Find Las Reinas tenant
  const tenant = await prisma.tenant.findUnique({
    where: { slug: 'lasreinas' },
    include: { integrations: true },
  });

  if (!tenant) {
    console.error('❌ Las Reinas tenant not found');
    process.exit(1);
  }

  console.log(`✓ Found tenant: ${tenant.name} (${tenant.id})`);

  // Printer configuration for PassPRNT
  const printerConfig = {
    type: 'passprnt',
    name: 'Star TSP100III',
    model: 'TSP143III',
    profile: 'escpos-80mm',
    // PassPRNT doesn't need deviceId or IP - it uses URL scheme
  };

  // Update or create tenant integration
  const existingIntegration = await prisma.tenantIntegration.findUnique({
    where: { tenantId: tenant.id },
  });

  if (existingIntegration) {
    await prisma.tenantIntegration.update({
      where: { tenantId: tenant.id },
      data: {
        autoPrintOrders: true,
        printerType: 'passprnt',
        printerConfig: printerConfig,
      },
    });
    console.log('✓ Updated existing integration with PassPRNT config');
  } else {
    await prisma.tenantIntegration.create({
      data: {
        tenantId: tenant.id,
        autoPrintOrders: true,
        printerType: 'passprnt',
        printerConfig: printerConfig,
      },
    });
    console.log('✓ Created new integration with PassPRNT config');
  }

  // Verify the configuration
  const verifyIntegration = await prisma.tenantIntegration.findUnique({
    where: { tenantId: tenant.id },
    select: {
      autoPrintOrders: true,
      printerType: true,
      printerConfig: true,
    },
  });

  console.log('\n📋 Configuration saved:');
  console.log(JSON.stringify(verifyIntegration, null, 2));

  console.log('\n✅ PassPRNT setup complete!\n');
  console.log('Next steps:');
  console.log('1. Install Star PassPRNT app on iPad from App Store');
  console.log('2. Pair Star TSP100III with iPad in Settings > Bluetooth');
  console.log('3. Open PassPRNT app and configure the printer');
  console.log('4. Open fulfillment dashboard on iPad Safari');
  console.log('5. Enable auto-print in the dashboard');
  console.log('6. When orders come in, PassPRNT app will launch and print!\n');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
