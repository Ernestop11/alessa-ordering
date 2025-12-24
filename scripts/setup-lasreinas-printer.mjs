#!/usr/bin/env node
/**
 * Setup Network Printer for Las Reinas Tenant
 * 
 * Usage:
 *   node scripts/setup-lasreinas-printer.mjs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'lasreinas';
const PRINTER_CONFIG = {
  type: 'network',
  name: 'MUNBYN WiFi Printer',
  ipAddress: '10.10.100.254',
  port: 9100,
  model: 'ESC/POS',
  updatedAt: new Date().toISOString(),
};

async function setupPrinter() {
  console.log('🔧 Setting up network printer for Las Reinas tenant...\n');

  try {
    // Find tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: TENANT_SLUG },
      select: { id: true, name: true, slug: true },
    });

    if (!tenant) {
      console.error(`❌ Tenant "${TENANT_SLUG}" not found!`);
      process.exit(1);
    }

    console.log(`✅ Found tenant: ${tenant.name} (${tenant.slug})`);
    console.log(`   Tenant ID: ${tenant.id}\n`);

    // Update or create tenant integration with printer config
    const integration = await prisma.tenantIntegration.upsert({
      where: { tenantId: tenant.id },
      update: {
        printerConfig: PRINTER_CONFIG,
        autoPrintOrders: true, // Enable auto-print
      },
      create: {
        tenantId: tenant.id,
        printerConfig: PRINTER_CONFIG,
        autoPrintOrders: true, // Enable auto-print
      },
    });

    console.log('✅ Printer configuration saved:');
    console.log(`   Type: ${PRINTER_CONFIG.type}`);
    console.log(`   Name: ${PRINTER_CONFIG.name}`);
    console.log(`   IP: ${PRINTER_CONFIG.ipAddress}:${PRINTER_CONFIG.port}`);
    console.log(`   Model: ${PRINTER_CONFIG.model}`);
    console.log(`   Auto-Print: ${integration.autoPrintOrders ? '✅ Enabled' : '❌ Disabled'}\n`);

    // Log the configuration change
    await prisma.integrationLog.create({
      data: {
        tenantId: tenant.id,
        source: 'printer',
        message: `Printer configuration set: ${PRINTER_CONFIG.type} - ${PRINTER_CONFIG.name} at ${PRINTER_CONFIG.ipAddress}:${PRINTER_CONFIG.port}`,
        payload: PRINTER_CONFIG,
      },
    });

    console.log('✅ Integration log created\n');

    // Verify configuration
    const verify = await prisma.tenantIntegration.findUnique({
      where: { tenantId: tenant.id },
      select: {
        printerConfig: true,
        autoPrintOrders: true,
      },
    });

    if (verify) {
      console.log('📋 Verification:');
      console.log(`   Printer Config: ${verify.printerConfig ? '✅ Set' : '❌ Missing'}`);
      console.log(`   Auto-Print: ${verify.autoPrintOrders ? '✅ Enabled' : '❌ Disabled'}\n`);
    }

    console.log('🎉 Setup complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Test the printer connection');
    console.log('   2. Place a test order to verify auto-print');
    console.log('   3. Check fulfillment dashboard for alarm notifications\n');

  } catch (error) {
    console.error('❌ Error setting up printer:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupPrinter();

