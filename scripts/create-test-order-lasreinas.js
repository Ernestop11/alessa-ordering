const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestOrder() {
  try {
    // Get Las Reinas tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: 'lasreinas' },
      include: {
        settings: true,
        integrations: true,
        menuSections: {
          include: {
            menuItems: {
              where: { available: true },
              take: 2,
            },
          },
        },
      },
    });

    if (!tenant) {
      console.error('❌ Las Reinas tenant not found');
      process.exit(1);
    }

    console.log('✅ Found tenant:', tenant.name);

    // Get first 2 menu items
    const menuItems = [];
    for (const section of tenant.menuSections || []) {
      for (const item of section.menuItems || []) {
        if (menuItems.length < 2) {
          menuItems.push(item);
        }
      }
    }

    if (menuItems.length === 0) {
      console.error('❌ No menu items found');
      process.exit(1);
    }

    console.log(`✅ Found ${menuItems.length} menu items`);

    // Calculate totals
    const subtotalAmount = menuItems.reduce((sum, item) => sum + Number(item.price || 0), 0);
    const taxRate = tenant.integrations?.defaultTaxRate || 0.0825;
    const taxAmount = subtotalAmount * taxRate;
    const totalAmount = subtotalAmount + taxAmount;

    // Create customer
    let customer = await prisma.customer.findFirst({
      where: {
        tenantId: tenant.id,
        email: 'test@example.com',
      },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          tenantId: tenant.id,
          name: 'Test Customer',
          email: 'test@example.com',
          phone: '(555) 123-4567',
        },
      });
      console.log('✅ Created test customer');
    } else {
      console.log('✅ Using existing test customer');
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        tenantId: tenant.id,
        customerId: customer.id,
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        customerPhone: '(555) 123-4567',
        subtotalAmount,
        taxAmount,
        totalAmount,
        fulfillmentMethod: 'pickup',
        status: 'confirmed',
        paymentMethod: 'card',
        paymentIntentId: `pi_test_${Date.now()}`,
        items: {
          create: menuItems.map((item) => ({
            tenantId: tenant.id,
            menuItemId: item.id,
            quantity: 1,
            price: Number(item.price || 0),
          })),
        },
      },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        customer: true,
      },
    });

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ TEST ORDER CREATED SUCCESSFULLY!');
    console.log('');
    console.log(`Order ID: ${order.id}`);
    console.log(`Customer: ${order.customerName}`);
    console.log(`Items: ${order.items.length}`);
    console.log(`Total: $${totalAmount.toFixed(2)}`);
    console.log('');
    console.log('📋 Order Details:');
    order.items.forEach((item) => {
      console.log(`  • ${item.quantity}x ${item.menuItem.name} - $${item.price.toFixed(2)}`);
    });
    console.log('');
    console.log('✅ Order should appear in fulfillment dashboard now!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return order;
  } catch (error) {
    console.error('❌ Error creating test order:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTestOrder()
  .then(() => {
    console.log('');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });

