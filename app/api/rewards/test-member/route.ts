import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';
import { cookies } from 'next/headers';

/**
 * Test endpoint to create a sample rewards member for testing
 * POST /api/rewards/test-member
 */
export async function POST() {
  try {
    const tenant = await requireTenant();

    // Create or find test customer
    let customer = await prisma.customer.findFirst({
      where: {
        tenantId: tenant.id,
        email: 'test-member@example.com',
      },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          tenantId: tenant.id,
          name: 'Test Rewards Member',
          email: 'test-member@example.com',
          phone: '+15551234567',
          loyaltyPoints: 750, // Gold tier
          membershipTier: 'Gold',
        },
      });

      // Create some sample orders
      const menuItems = await prisma.menuItem.findMany({
        where: { tenantId: tenant.id, available: true },
        take: 5,
      });

      if (menuItems.length > 0) {
        // Create 3 sample orders
        for (let i = 0; i < 3; i++) {
          const order = await prisma.order.create({
            data: {
              tenantId: tenant.id,
              customerId: customer.id,
              subtotalAmount: 25 + i * 10,
              totalAmount: 30 + i * 12,
              status: 'completed',
              fulfillmentMethod: i % 2 === 0 ? 'pickup' : 'delivery',
            },
          });

          // Add items to order
          const itemsToAdd = menuItems.slice(0, 2 + i);
          for (const menuItem of itemsToAdd) {
            await prisma.orderItem.create({
              data: {
                tenantId: tenant.id,
                orderId: order.id,
                menuItemId: menuItem.id,
                quantity: 1 + i,
                price: Number(menuItem.price),
              },
            });
          }
        }
      }
    }

    // Create customer session
    const sessionToken = crypto.randomUUID();
    
    // Delete old sessions
    await prisma.customerSession.deleteMany({
      where: {
        tenantId: tenant.id,
        customerId: customer.id,
      },
    });

    // Create new session
    await prisma.customerSession.create({
      data: {
        tenantId: tenant.id,
        customerId: customer.id,
        token: sessionToken,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      },
    });

    // Set cookie
    const response = NextResponse.json({ 
      success: true, 
      message: 'Test member created and logged in',
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        loyaltyPoints: customer.loyaltyPoints,
        membershipTier: customer.membershipTier,
      },
    });
    
    response.cookies.set('customer_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 90 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('[rewards-test-member] Error:', err);
    return NextResponse.json({ error: 'Failed to create test member' }, { status: 500 });
  }
}

/**
 * GET endpoint to check if test member exists
 */
export async function GET() {
  try {
    const tenant = await requireTenant();
    const customer = await prisma.customer.findFirst({
      where: {
        tenantId: tenant.id,
        email: 'test-member@example.com',
      },
      include: {
        orders: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            items: {
              include: {
                menuItem: true,
              },
            },
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ exists: false });
    }

    return NextResponse.json({
      exists: true,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        loyaltyPoints: customer.loyaltyPoints,
        membershipTier: customer.membershipTier,
        ordersCount: customer.orders.length,
      },
    });
  } catch (err) {
    console.error('[rewards-test-member] GET error:', err);
    return NextResponse.json({ error: 'Failed to check test member' }, { status: 500 });
  }
}

