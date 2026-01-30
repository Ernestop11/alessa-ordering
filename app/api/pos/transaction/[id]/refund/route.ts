import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * POST - Refund a POS transaction
 * Restores inventory and records cash movement
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { reason } = body;

    const transaction = await prisma.pOSTransaction.findFirst({
      where: { id: params.id, tenantId: tenant.id },
      include: { session: true },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (transaction.refunded) {
      return NextResponse.json({ error: 'Transaction already refunded' }, { status: 400 });
    }

    const items = transaction.items as any[];

    await prisma.$transaction(async (tx) => {
      // Mark transaction as refunded
      await tx.pOSTransaction.update({
        where: { id: params.id },
        data: {
          refunded: true,
          refundedAt: new Date(),
          refundReason: reason || null,
        },
      });

      // Restore inventory for each item
      for (const cartItem of items) {
        if (!cartItem.itemId) continue;

        await tx.inventoryMovement.create({
          data: {
            tenantId: tenant.id,
            itemId: cartItem.itemId,
            type: 'RETURN',
            quantity: Math.abs(cartItem.quantity),
            costPerUnit: cartItem.unitPrice,
            notes: `POS Refund #${params.id.slice(-6)}: ${reason || 'No reason'}`,
            createdBy: transaction.session.employeeName,
          },
        });

        await tx.inventoryItem.update({
          where: { id: cartItem.itemId },
          data: { currentStock: { increment: Math.abs(cartItem.quantity) } },
        });
      }

      // Record refund cash movement
      if (transaction.paymentMethod === 'cash') {
        await tx.pOSCashMovement.create({
          data: {
            tenantId: tenant.id,
            sessionId: transaction.sessionId,
            type: 'REFUND',
            amount: -transaction.total,
            notes: `Refund for transaction ${params.id.slice(-6)}`,
          },
        });
      }
    });

    const updated = await prisma.pOSTransaction.findUnique({
      where: { id: params.id },
    });

    return NextResponse.json({ transaction: updated });
  } catch (error: any) {
    console.error('[POS Refund POST]', error);
    return NextResponse.json({ error: error.message || 'Failed to process refund' }, { status: 500 });
  }
}
