#!/usr/bin/env node
/**
 * Script to manually complete a pending PaymentSession and create the order
 * Usage: node scripts/complete-pending-payment.mjs <paymentSessionId>
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const paymentSessionId = process.argv[2];

  if (!paymentSessionId) {
    // List pending sessions
    console.log('Usage: node scripts/complete-pending-payment.mjs <paymentSessionId>');
    console.log('\nPending PaymentSessions:');

    const sessions = await prisma.paymentSession.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    for (const s of sessions) {
      console.log(`  - ${s.id} | PI: ${s.paymentIntentId} | ${s.createdAt}`);
    }
    process.exit(0);
  }

  // Find the session
  const session = await prisma.paymentSession.findUnique({
    where: { id: paymentSessionId },
  });

  if (!session) {
    console.error('PaymentSession not found:', paymentSessionId);
    process.exit(1);
  }

  if (session.status === 'completed') {
    console.log('PaymentSession already completed');
    process.exit(0);
  }

  console.log('Found PaymentSession:', session.id);
  console.log('Payment Intent:', session.paymentIntentId);
  console.log('Order Data:', JSON.stringify(session.orderData, null, 2));

  // Get tenant
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    include: { settings: true, integrations: true },
  });

  if (!tenant) {
    console.error('Tenant not found:', session.tenantId);
    process.exit(1);
  }

  console.log('\nTenant:', tenant.name, `(${tenant.slug})`);

  const orderData = session.orderData;

  // Create the order
  const order = await prisma.order.create({
    data: {
      tenantId: tenant.id,
      subtotalAmount: orderData.subtotalAmount || 0,
      taxAmount: orderData.taxAmount || 0,
      deliveryFee: orderData.deliveryFee || 0,
      tipAmount: orderData.tipAmount || 0,
      platformFee: orderData.platformFee || 0,
      totalAmount: orderData.totalAmount,
      paymentIntentId: session.paymentIntentId,
      status: 'confirmed',
      fulfillmentMethod: orderData.fulfillmentMethod || 'pickup',
      paymentMethod: orderData.paymentMethod || 'card',
      customerName: orderData.customerName || null,
      customerEmail: orderData.customerEmail || null,
      customerPhone: orderData.customerPhone || null,
      notes: orderData.notes || null,
      deliveryAddress: orderData.destination || orderData.deliveryAddress || null,
    },
  });

  console.log('\n✅ Order created:', order.id);

  // Create order items
  if (orderData.items && Array.isArray(orderData.items)) {
    for (const item of orderData.items) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          price: item.price,
          notes: item.notes || null,
        },
      });
      console.log(`  - Item: ${item.menuItemId} x ${item.quantity}`);
    }
  }

  // Update payment session
  await prisma.paymentSession.update({
    where: { id: session.id },
    data: { status: 'completed' },
  });

  console.log('\n✅ PaymentSession marked as completed');
  console.log('\nOrder ID:', order.id);
  console.log('Total: $' + order.totalAmount.toFixed(2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
