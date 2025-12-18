import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';
import { createOrderFromPayload } from '@/lib/order-service';
import { emitOrderEvent } from '@/lib/order-events';
import { serializeOrder } from '@/lib/order-serializer';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  
  if (!session || role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tenant = await requireTenant();
    
    // Get a menu item to use for the test order
    const menuItem = await prisma.menuItem.findFirst({
      where: { tenantId: tenant.id, available: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!menuItem) {
      return NextResponse.json(
        { error: 'No menu items found. Please add menu items first.' },
        { status: 400 }
      );
    }

    // Create test order payload
    const testOrderPayload = {
      items: [
        {
          menuItemId: menuItem.id,
          quantity: 2,
          price: Number(menuItem.price || 10.99),
          notes: 'Test order - please ignore',
        },
      ],
      subtotalAmount: Number(menuItem.price || 10.99) * 2,
      totalAmount: Number(menuItem.price || 10.99) * 2 * 1.16, // Add 16% tax
      taxAmount: Number(menuItem.price || 10.99) * 2 * 0.16,
      fulfillmentMethod: 'pickup' as const,
      customerName: `Test Customer ${Date.now().toString().slice(-4)}`,
      customerEmail: `test${Date.now()}@example.com`,
      customerPhone: '(555) 123-4567',
      notes: '🧪 TEST ORDER - Testing fulfillment UI functionality',
      paymentMethod: 'test',
    };

    // Create the order
    const order = await createOrderFromPayload({
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        contactEmail: tenant.contactEmail,
        contactPhone: tenant.contactPhone,
        country: tenant.country,
        state: tenant.state,
        city: tenant.city,
        postalCode: tenant.postalCode,
        addressLine1: tenant.addressLine1,
        addressLine2: tenant.addressLine2,
        settings: null,
        integrations: null,
      },
      payload: testOrderPayload,
      paymentIntentId: `test_${Date.now()}`,
    });

    // Mark order as confirmed (paid)
    const confirmedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { status: 'confirmed' },
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
            slug: true,
            primaryColor: true,
            secondaryColor: true,
          },
        },
      },
    });

    // Emit order event to trigger fulfillment feed
    const serialized = serializeOrder(confirmedOrder, null);
    emitOrderEvent({
      type: 'order.created',
      order: serialized,
    });

    return NextResponse.json({
      success: true,
      message: 'Test order created successfully',
      order: {
        id: confirmedOrder.id,
        status: confirmedOrder.status,
        customerName: confirmedOrder.customer?.name || testOrderPayload.customerName,
        totalAmount: confirmedOrder.totalAmount,
        createdAt: confirmedOrder.createdAt,
      },
    });
  } catch (error: any) {
    console.error('[Test Order] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create test order',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}





