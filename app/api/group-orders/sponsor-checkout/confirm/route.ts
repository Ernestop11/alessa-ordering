import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantByRequest } from '@/lib/tenant';
import { sendGroupOrderSummaryEmail, getTenantFromAddress, getTenantReplyTo } from '@/lib/email-service';

export async function POST(request: NextRequest) {
  try {
    const tenant = await getTenantByRequest(request);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const body = await request.json();
    const { sessionCode, paymentIntentId } = body;

    if (!sessionCode || !paymentIntentId) {
      return NextResponse.json(
        { error: 'Session code and payment intent ID are required' },
        { status: 400 }
      );
    }

    // Find the group order with orders and items
    const groupOrder = await prisma.groupOrder.findFirst({
      where: {
        sessionCode,
        tenantId: tenant.id,
      },
      include: {
        orders: {
          include: {
            items: {
              include: {
                menuItem: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    });

    if (!groupOrder) {
      return NextResponse.json(
        { error: 'Group order not found' },
        { status: 404 }
      );
    }

    if (groupOrder.sponsorPaidAt) {
      return NextResponse.json(
        { error: 'This group order has already been paid' },
        { status: 400 }
      );
    }

    // Update the group order as paid
    await prisma.groupOrder.update({
      where: { id: groupOrder.id },
      data: {
        sponsorPaidAt: new Date(),
        status: 'closed', // Close the group order after payment
        closedAt: new Date(),
      },
    });

    // Update all participant orders to 'pending' (ready for kitchen)
    await prisma.order.updateMany({
      where: {
        groupOrderId: groupOrder.id,
        status: 'pending_sponsor_payment',
      },
      data: {
        status: 'pending',
        paymentIntentId: paymentIntentId,
      },
    });

    // Send organizer summary email (fire and forget)
    if (groupOrder.organizerEmail) {
      const tenantForEmail = {
        name: tenant.name,
        emailDomainVerified: (tenant as { emailDomainVerified?: boolean }).emailDomainVerified,
        customDomain: tenant.customDomain,
        contactEmail: tenant.contactEmail,
      };
      const fromAddress = getTenantFromAddress(tenantForEmail);
      const replyTo = getTenantReplyTo(tenantForEmail);

      // Build participants array from orders
      const participants = groupOrder.orders.map((order) => ({
        name: order.participantName || order.customerName || 'Guest',
        items: order.items.map((item) => ({
          name: item.menuItem?.name || item.menuItemName || 'Item',
          quantity: item.quantity,
          price: item.price,
        })),
        total: order.totalAmount,
      }));

      sendGroupOrderSummaryEmail({
        to: groupOrder.organizerEmail,
        organizerName: groupOrder.organizerName,
        companyName: groupOrder.companyName || groupOrder.name || 'Team',
        tenantName: tenant.name,
        tenantLogo: tenant.logoUrl,
        sessionCode: groupOrder.sessionCode,
        participants,
        grandTotal: groupOrder.totalAmount || 0,
        fulfillmentMethod: (groupOrder.fulfillmentMethod as 'pickup' | 'delivery') || 'pickup',
        primaryColor: tenant.primaryColor || '#dc2626',
        fromAddress,
        replyTo,
      })
        .then(() => {
          console.log(`[Group Orders] Summary email sent to ${groupOrder.organizerEmail}`);
        })
        .catch((err) => {
          console.error(`[Group Orders] Failed to send summary email to ${groupOrder.organizerEmail}:`, err);
        });
    }

    return NextResponse.json({
      success: true,
      message: 'Payment confirmed for all orders',
      orderCount: groupOrder.orders.length,
      totalAmount: groupOrder.totalAmount,
    });
  } catch (error) {
    console.error('[Sponsor Checkout] Confirm payment error:', error);
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    );
  }
}
