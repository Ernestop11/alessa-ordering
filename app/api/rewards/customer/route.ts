import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const tenant = await requireTenant();
    const token = cookies().get('customer_session')?.value;
    
    if (!token) {
      return NextResponse.json(null);
    }

    const session = await prisma.customerSession.findFirst({
      where: {
        tenantId: tenant.id,
        token,
        expiresAt: { gt: new Date() },
      },
      include: {
        customer: {
          include: {
            orders: {
              orderBy: { createdAt: 'desc' },
              take: 10, // Get last 10 orders for re-order
              include: {
                items: {
                  include: {
                    menuItem: {
                      select: {
                        id: true,
                        name: true,
                        description: true,
                        price: true,
                        image: true,
                        available: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!session?.customer) {
      return NextResponse.json(null);
    }

    const customerData = {
      id: session.customer.id,
      name: session.customer.name,
      email: session.customer.email,
      phone: session.customer.phone,
      loyaltyPoints: session.customer.loyaltyPoints ?? 0,
      membershipTier: session.customer.membershipTier,
      orders: session.customer.orders.map((order) => ({
        id: order.id,
        createdAt: order.createdAt.toISOString(),
        totalAmount: Number(order.totalAmount ?? 0),
        status: order.status,
        fulfillmentMethod: order.fulfillmentMethod,
        items: order.items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          price: Number(item.price),
          menuItem: item.menuItem ? {
            id: item.menuItem.id,
            name: item.menuItem.name,
            description: item.menuItem.description,
            price: Number(item.menuItem.price),
            image: item.menuItem.image,
            available: item.menuItem.available,
          } : null,
        })),
      })),
    };

    const response = NextResponse.json(customerData);
    // Prevent caching to ensure fresh data
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  } catch (err) {
    console.error('[rewards-customer] GET error:', err);
    const errorResponse = NextResponse.json({ error: 'Failed to fetch customer data' }, { status: 500 });
    errorResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return errorResponse;
  }
}


















