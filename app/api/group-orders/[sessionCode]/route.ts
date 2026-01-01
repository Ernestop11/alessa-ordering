import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTenantByRequest } from '@/lib/tenant';

interface RouteParams {
  params: Promise<{ sessionCode: string }>;
}

// GET - Get group order details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionCode } = await params;
    const tenant = await getTenantByRequest(request);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const groupOrder = await prisma.groupOrder.findFirst({
      where: {
        sessionCode,
        tenantId: tenant.id,
      },
      include: {
        orders: {
          select: {
            id: true,
            participantName: true,
            totalAmount: true,
            status: true,
            createdAt: true,
            items: {
              select: {
                id: true,
                quantity: true,
                price: true,
                menuItemName: true,
                notes: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        invitations: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
            invitedAt: true,
            orderedAt: true,
          },
          orderBy: {
            invitedAt: 'asc',
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

    // Check if expired
    const now = new Date();
    const isExpired = groupOrder.expiresAt < now && groupOrder.status === 'open';

    // Auto-close if expired
    if (isExpired) {
      await prisma.groupOrder.update({
        where: { id: groupOrder.id },
        data: {
          status: 'closed',
          closedAt: now,
        },
      });
      groupOrder.status = 'closed';
      groupOrder.closedAt = now;
    }

    // Calculate time remaining
    const timeRemainingMs = Math.max(0, groupOrder.expiresAt.getTime() - now.getTime());
    const timeRemainingMinutes = Math.floor(timeRemainingMs / 60000);

    // Check if sponsor has paid (for sponsored orders)
    const awaitingPayment = groupOrder.isSponsoredOrder && !groupOrder.sponsorPaidAt;

    // Calculate invitation stats
    const invitations = groupOrder.invitations || [];
    const orderedCount = invitations.filter((i) => i.status === 'ordered').length;
    const pendingCount = invitations.filter((i) => i.status === 'pending').length;

    return NextResponse.json({
      id: groupOrder.id,
      sessionCode: groupOrder.sessionCode,
      name: groupOrder.name,
      companyName: groupOrder.companyName,
      organizerName: groupOrder.organizerName,
      organizerEmail: groupOrder.organizerEmail,
      organizerPhone: groupOrder.organizerPhone,
      fulfillmentMethod: groupOrder.fulfillmentMethod,
      deliveryAddress: groupOrder.deliveryAddress,
      scheduledPickupTime: groupOrder.scheduledPickupTime,
      status: groupOrder.status,
      expiresAt: groupOrder.expiresAt,
      closedAt: groupOrder.closedAt,
      orderCount: groupOrder.orderCount,
      totalAmount: groupOrder.totalAmount,
      timeRemainingMinutes,
      // "I'm Buying" feature
      isSponsoredOrder: groupOrder.isSponsoredOrder,
      sponsorName: groupOrder.sponsorName,
      sponsorPaidAt: groupOrder.sponsorPaidAt,
      awaitingPayment,
      orders: groupOrder.orders.map((order) => ({
        id: order.id,
        participantName: order.participantName,
        total: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt,
        itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
        items: order.items,
      })),
      // Invitation tracking
      invitations: invitations.map((inv) => ({
        id: inv.id,
        name: inv.name,
        email: inv.email,
        status: inv.status,
        invitedAt: inv.invitedAt,
        orderedAt: inv.orderedAt,
      })),
      invitationStats: {
        total: invitations.length,
        ordered: orderedCount,
        pending: pendingCount,
      },
      createdAt: groupOrder.createdAt,
    });
  } catch (error) {
    console.error('[Group Orders] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group order' },
      { status: 500 }
    );
  }
}

// PATCH - Update group order (close, extend, etc.)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionCode } = await params;
    const tenant = await getTenantByRequest(request);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const groupOrder = await prisma.groupOrder.findFirst({
      where: {
        sessionCode,
        tenantId: tenant.id,
      },
    });

    if (!groupOrder) {
      return NextResponse.json(
        { error: 'Group order not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { action, extendHours } = body;

    let updateData: Record<string, unknown> = {};

    switch (action) {
      case 'close':
        updateData = {
          status: 'closed',
          closedAt: new Date(),
        };
        break;

      case 'cancel':
        updateData = {
          status: 'cancelled',
          closedAt: new Date(),
        };
        break;

      case 'extend':
        if (!extendHours || extendHours < 1 || extendHours > 4) {
          return NextResponse.json(
            { error: 'Extension must be between 1 and 4 hours' },
            { status: 400 }
          );
        }
        const newExpiry = new Date(groupOrder.expiresAt);
        newExpiry.setHours(newExpiry.getHours() + extendHours);
        updateData = {
          expiresAt: newExpiry,
          status: 'open', // Reopen if was expired
        };
        break;

      case 'reopen':
        // Reopen with 1 hour extension
        const reopenExpiry = new Date();
        reopenExpiry.setHours(reopenExpiry.getHours() + 1);
        updateData = {
          status: 'open',
          expiresAt: reopenExpiry,
          closedAt: null,
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    const updated = await prisma.groupOrder.update({
      where: { id: groupOrder.id },
      data: updateData,
    });

    return NextResponse.json({
      id: updated.id,
      sessionCode: updated.sessionCode,
      status: updated.status,
      expiresAt: updated.expiresAt,
      closedAt: updated.closedAt,
      message: `Group order ${action}ed successfully`,
    });
  } catch (error) {
    console.error('[Group Orders] PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update group order' },
      { status: 500 }
    );
  }
}
