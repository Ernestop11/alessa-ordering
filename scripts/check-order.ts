import prisma from '../lib/prisma';

async function main() {
  const tenant = await prisma.tenant.findUnique({ where: { slug: 'lasreinas' } });
  if (!tenant) { console.log('No tenant'); return; }

  const orders = await prisma.order.findMany({
    where: { tenantId: tenant.id },
    include: { items: true },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  for (const order of orders) {
    console.log('=== ORDER ' + order.id.slice(-6).toUpperCase() + ' ===');
    console.log('Customer:', order.customerName, '|', order.customerPhone);
    console.log('subtotalAmount:', order.subtotalAmount);
    console.log('taxAmount:', order.taxAmount);
    console.log('tipAmount:', order.tipAmount);
    console.log('deliveryFee:', order.deliveryFee);
    console.log('platformFee:', order.platformFee);
    console.log('totalAmount:', order.totalAmount);
    console.log('Items:', order.items.map(i => i.quantity + 'x ' + i.menuItemName).join(', '));
    console.log('Notes:', order.notes);
    console.log('Created:', order.createdAt);

    const subtotal = Number(order.subtotalAmount) || 0;
    const tax = Number(order.taxAmount) || 0;
    const tip = Number(order.tipAmount) || 0;
    const delivery = Number(order.deliveryFee) || 0;
    const platform = Number(order.platformFee) || 0;
    const total = Number(order.totalAmount) || 0;
    const calculated = subtotal + tax + tip + delivery + platform;

    console.log('');
    console.log('MATH: ' + subtotal + ' + ' + tax + ' + ' + tip + ' + ' + delivery + ' + ' + platform + ' = ' + calculated.toFixed(2));
    console.log('DB Total: ' + total.toFixed(2));
    console.log('Match:', Math.abs(calculated - total) < 0.01 ? 'YES ✓' : 'NO - DISCREPANCY OF $' + Math.abs(calculated - total).toFixed(2));
    console.log('');
  }

  await prisma.$disconnect();
}

main();
