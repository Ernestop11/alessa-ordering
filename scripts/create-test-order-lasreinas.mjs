#!/usr/bin/env node
/**
 * Create Test Order for Las Reinas to Test Auto-Print
 * 
 * Usage:
 *   node scripts/create-test-order-lasreinas.mjs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_SLUG = 'lasreinas';

async function createTestOrder() {
  console.log('📦 Creating test order for Las Reinas...\n');

  try {
    // Find tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: TENANT_SLUG },
      select: { id: true, name: true },
    });

    if (!tenant) {
      console.error(`❌ Tenant "${TENANT_SLUG}" not found!`);
      process.exit(1);
    }

    console.log(`✅ Found tenant: ${tenant.name}\n`);

    // Get a menu item to use in the test order
    const menuItem = await prisma.menuItem.findFirst({
      where: { tenantId: tenant.id, available: true },
      select: { id: true, name: true, price: true },
    });

    if (!menuItem) {
      console.error('❌ No menu items found for this tenant!');
      console.error('   Please add menu items first.\n');
      process.exit(1);
    }

    console.log(`✅ Using menu item: ${menuItem.name} ($${menuItem.price})\n`);

    // Create test order
    const order = await prisma.order.create({
      data: {
        tenantId: tenant.id,
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        customerPhone: '(555) 123-4567',
        fulfillmentMethod: 'pickup',
        status: 'pending',
        subtotalAmount: menuItem.price,
        taxAmount: menuItem.price * 0.0825, // 8.25% tax
        totalAmount: menuItem.price * 1.0825,
        notes: 'Test order for auto-print verification',
        items: {
          create: {
            menuItemId: menuItem.id,
            quantity: 1,
            price: menuItem.price,
            menuItemName: menuItem.name,
            tenantId: tenant.id,
          },
        },
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        customer: true,
        tenant: {
          select: {
            id: true,
            name: true,
            addressLine1: true,
            addressLine2: true,
            city: true,
            state: true,
            postalCode: true,
            contactPhone: true,
          },
        },
      },
    });

    console.log('✅ Test order created!');
    console.log(`   Order ID: ${order.id}`);
    console.log(`   Customer: ${order.customerName}`);
    console.log(`   Total: $${order.totalAmount.toFixed(2)}`);
    console.log(`   Status: ${order.status}\n`);

    // Import and call auto-print
    console.log('🖨️  Triggering auto-print...\n');
    
    // We need to serialize the order first
    const serializedOrder = {
      id: order.id,
      tenantId: order.tenantId,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      fulfillmentMethod: order.fulfillmentMethod,
      status: order.status,
      subtotalAmount: order.subtotalAmount,
      taxAmount: order.taxAmount,
      totalAmount: order.totalAmount,
      notes: order.notes,
      createdAt: order.createdAt.toISOString(),
      items: order.items.map(item => ({
        menuItemId: item.menuItemId,
        menuItemName: item.menuItemName || menuItem.name,
        quantity: item.quantity,
        price: item.price,
      })),
      customer: order.customer ? {
        id: order.customer.id,
        name: order.customer.name,
        email: order.customer.email,
        phone: order.customer.phone,
      } : null,
    };

    // Import auto-print function
    const { autoPrintOrder } = await import('../lib/printer-dispatcher.js');
    
    try {
      const printResult = await autoPrintOrder(serializedOrder, { reason: 'order.created' });
      if (printResult) {
        console.log('✅ Auto-print triggered successfully!');
        console.log('   Check the printer for the receipt.\n');
      } else {
        console.log('⚠️  Auto-print returned false (may be disabled or no printer configured)\n');
      }
    } catch (printError) {
      console.error('❌ Auto-print error:', printError.message);
      console.error('   This is expected if the printer is not reachable from the server.\n');
    }

    console.log('📋 Order Details:');
    console.log(`   View in admin: /admin/fulfillment?tenant=${TENANT_SLUG}`);
    console.log(`   Order ID: ${order.id}\n`);

    console.log('🎉 Test order created!');
    console.log('\n📝 Next steps:');
    console.log('   1. Check the fulfillment dashboard for the new order');
    console.log('   2. Verify alarm notification appears');
    console.log('   3. Check if receipt printed (if printer is reachable)\n');

  } catch (error) {
    console.error('❌ Error creating test order:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createTestOrder();

