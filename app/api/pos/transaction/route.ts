import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * POST - Process a POS sale
 * Validates stock, decrements inventory, records payment
 */
export async function POST(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get('tenantSlug');
    if (!slug) {
      return NextResponse.json({ error: 'tenantSlug is required' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      sessionId,
      items, // [{itemId, name, quantity, unitPrice, total}]
      subtotal,
      taxRate,
      taxAmount,
      discountAmount,
      total,
      paymentMethod, // 'cash' or 'card'
      cashReceived,
      cardLast4,
      notes,
    } = body;

    if (!sessionId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'sessionId and items[] are required' }, { status: 400 });
    }

    if (!total || total <= 0) {
      return NextResponse.json({ error: 'total must be positive' }, { status: 400 });
    }

    // Verify session is open
    const session = await prisma.pOSSession.findFirst({
      where: { id: sessionId, tenantId: tenant.id, status: 'open' },
    });

    if (!session) {
      return NextResponse.json({ error: 'No open session found' }, { status: 400 });
    }

    // Validate stock availability for all items
    const itemIds = items.filter((i: any) => i.itemId).map((i: any) => i.itemId);
    if (itemIds.length > 0) {
      const inventoryItems = await prisma.inventoryItem.findMany({
        where: { id: { in: itemIds }, tenantId: tenant.id },
        select: { id: true, name: true, currentStock: true, unit: true },
      });

      const stockMap = new Map(inventoryItems.map((i) => [i.id, i]));

      for (const cartItem of items) {
        if (!cartItem.itemId) continue;
        const inv = stockMap.get(cartItem.itemId);
        if (!inv) {
          return NextResponse.json({ error: `Item not found: ${cartItem.name}` }, { status: 400 });
        }
        if (inv.currentStock < cartItem.quantity) {
          return NextResponse.json(
            { error: `Insufficient stock for ${inv.name}. Available: ${inv.currentStock} ${inv.unit}` },
            { status: 400 }
          );
        }
      }
    }

    const changeGiven = paymentMethod === 'cash' && cashReceived
      ? Math.round((cashReceived - total) * 100) / 100
      : null;

    // Process transaction in a single atomic operation
    const transaction = await prisma.$transaction(async (tx) => {
      // Create transaction
      const txn = await tx.pOSTransaction.create({
        data: {
          tenantId: tenant.id,
          sessionId,
          items: items,
          subtotal: subtotal || total,
          taxRate: taxRate || 0,
          taxAmount: taxAmount || 0,
          discountAmount: discountAmount || 0,
          total,
          paymentMethod: paymentMethod || 'cash',
          cashReceived: cashReceived || null,
          changeGiven,
          cardLast4: cardLast4 || null,
          notes: notes || null,
        },
      });

      // Decrement inventory + create SALE movements for each item
      for (const cartItem of items) {
        if (!cartItem.itemId) continue;

        await tx.inventoryMovement.create({
          data: {
            tenantId: tenant.id,
            itemId: cartItem.itemId,
            type: 'SALE',
            quantity: -Math.abs(cartItem.quantity),
            costPerUnit: cartItem.unitPrice,
            notes: `POS Sale #${txn.id.slice(-6)}`,
            createdBy: session.employeeName,
          },
        });

        await tx.inventoryItem.update({
          where: { id: cartItem.itemId },
          data: { currentStock: { decrement: Math.abs(cartItem.quantity) } },
        });
      }

      // Record cash movement if cash payment
      if (paymentMethod === 'cash') {
        await tx.pOSCashMovement.create({
          data: {
            tenantId: tenant.id,
            sessionId,
            type: 'SALE',
            amount: total,
            notes: `Transaction ${txn.id.slice(-6)}`,
          },
        });
      }

      return txn;
    });

    return NextResponse.json({
      transaction,
      changeGiven,
    }, { status: 201 });
  } catch (error: any) {
    console.error('[POS Transaction POST]', error);
    return NextResponse.json({ error: error.message || 'Failed to process transaction' }, { status: 500 });
  }
}
