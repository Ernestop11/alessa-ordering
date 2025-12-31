import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantByRequest } from '@/lib/tenant';

export async function POST(request: NextRequest) {
  try {
    const tenant = await getTenantByRequest(request);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      groupSessionCode,
      participantName,
      customerName,
      customerEmail,
      customerPhone,
      fulfillmentMethod,
      deliveryAddress,
      items,
      subtotalAmount,
      totalAmount,
    } = body;

    // Validate required fields
    if (!groupSessionCode) {
      return NextResponse.json(
        { error: 'Group session code is required' },
        { status: 400 }
      );
    }

    if (!participantName) {
      return NextResponse.json(
        { error: 'Participant name is required' },
        { status: 400 }
      );
    }

    if (!customerName || !customerEmail || !customerPhone) {
      return NextResponse.json(
        { error: 'Customer information is required' },
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'At least one item is required' },
        { status: 400 }
      );
    }

    // Find the group order
    const groupOrder = await prisma.groupOrder.findFirst({
      where: {
        sessionCode: groupSessionCode,
        tenantId: tenant.id,
      },
    });

    if (!groupOrder) {
      return NextResponse.json(
        { error: 'Group order not found' },
        { status: 404 }
      );
    }

    // Check if group order is still open
    if (groupOrder.status !== 'open') {
      return NextResponse.json(
        { error: 'Group order is no longer accepting orders' },
        { status: 400 }
      );
    }

    // Check if expired
    if (groupOrder.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Group order has expired' },
        { status: 400 }
      );
    }

    // Check if this is a sponsored order
    if (!groupOrder.isSponsoredOrder) {
      return NextResponse.json(
        { error: 'This group order requires individual payment' },
        { status: 400 }
      );
    }

    // Create the order with pending_sponsor_payment status
    const order = await prisma.order.create({
      data: {
        tenantId: tenant.id,
        groupOrderId: groupOrder.id,
        participantName,
        customerName,
        customerEmail,
        customerPhone,
        fulfillmentMethod: fulfillmentMethod || groupOrder.fulfillmentMethod,
        deliveryAddress: deliveryAddress ? { address: deliveryAddress } : undefined,
        subtotalAmount: subtotalAmount || totalAmount,
        totalAmount: totalAmount,
        status: 'pending_sponsor_payment', // Special status for sponsored orders
        items: {
          create: items.map((item: {
            menuItemId: string;
            quantity: number;
            price: number;
            name: string;
            modifiers?: string[];
            addons?: { id: string; name: string; price: number }[];
            note?: string | null;
          }) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: item.price,
            menuItemName: item.name,
            modifiers: item.modifiers || [],
            addons: item.addons ? JSON.stringify(item.addons) : null,
            notes: item.note || null,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // Update group order aggregates
    await prisma.groupOrder.update({
      where: { id: groupOrder.id },
      data: {
        orderCount: { increment: 1 },
        totalAmount: { increment: totalAmount },
      },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      message: `Order added to group. ${groupOrder.sponsorName || 'The organizer'} will pay for everyone.`,
    });
  } catch (error) {
    console.error('[Group Orders] Add participant order error:', error);
    return NextResponse.json(
      { error: 'Failed to add order to group' },
      { status: 500 }
    );
  }
}
