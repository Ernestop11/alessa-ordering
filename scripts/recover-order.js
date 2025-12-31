const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function createOrder() {
  const paymentSession = await prisma.paymentSession.findUnique({
    where: { id: "f9442ddc-d334-44f9-ab4b-d7271f41b24e" },
    include: { tenant: true }
  });

  if (!paymentSession) {
    console.log("Payment session not found");
    return;
  }

  console.log("Payment Session:", paymentSession.id);
  console.log("Status:", paymentSession.status);

  const orderData = paymentSession.orderData;

  // Fix menuItemId - cart adds timestamp suffix, need to strip it
  const fixedItems = orderData.items.map(item => {
    // The menuItemId has a timestamp suffix like "-1767145702750", strip it
    let menuItemId = item.menuItemId;
    const dashIndex = menuItemId.lastIndexOf("-");
    if (dashIndex > 36) { // UUID is 36 chars
      menuItemId = menuItemId.substring(0, dashIndex);
    }
    // If still invalid, try the base UUID (first 36 chars)
    if (menuItemId.length > 36) {
      menuItemId = menuItemId.substring(0, 36);
    }
    return {
      ...item,
      menuItemId
    };
  });

  console.log("Fixed items:", JSON.stringify(fixedItems, null, 2));

  // Create the order
  const order = await prisma.order.create({
    data: {
      tenantId: paymentSession.tenantId,
      paymentIntentId: paymentSession.paymentIntentId,
      subtotalAmount: orderData.subtotalAmount,
      taxAmount: orderData.taxAmount || 0,
      tipAmount: orderData.tipAmount || 0,
      platformFee: orderData.platformFee || 0,
      deliveryFee: orderData.deliveryFee || 0,
      totalAmount: orderData.totalAmount,
      fulfillmentMethod: orderData.fulfillmentMethod,
      paymentMethod: orderData.paymentMethod || "card",
      customerName: orderData.customerName,
      customerEmail: orderData.customerEmail,
      customerPhone: orderData.customerPhone,
      notes: orderData.notes || null,
      status: "pending",
      items: {
        create: fixedItems.map(item => ({
          tenantId: paymentSession.tenantId,
          menuItemId: item.menuItemId,
          menuItemName: item.menuItemName || "QUESABIRRIA (1)",
          quantity: item.quantity,
          price: item.price,
          notes: item.notes || null
        }))
      }
    },
    include: { items: true }
  });

  console.log("Order created successfully!");
  console.log("Order ID:", order.id);
  console.log("Customer:", order.customerName);
  console.log("Total:", order.totalAmount);
  console.log("Items:", order.items.length);

  // Update payment session to completed
  await prisma.paymentSession.update({
    where: { id: paymentSession.id },
    data: { status: "completed", orderId: order.id }
  });
  console.log("Payment session marked as completed");

  await prisma.$disconnect();
}

createOrder().catch(e => { console.error(e); process.exit(1); });
