import { NextRequest, NextResponse } from 'next/server';
import { resolveInventoryAuth } from '@/lib/inventory-auth';
import prisma from '@/lib/prisma';

/**
 * POST - Fulfill an approved inventory request
 * Creates TRANSFER_OUT from supplier dept, TRANSFER_IN to requesting dept
 * Updates stock on both sides
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await resolveInventoryAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fulfilledItems } = body; // Optional: [{itemId, quantityFulfilled}] for partial fulfillment

    const inventoryRequest = await prisma.inventoryRequest.findFirst({
      where: { id: params.id, tenantId: auth.tenantId },
      include: {
        items: {
          include: {
            item: { select: { id: true, name: true, currentStock: true, costPerUnit: true, unit: true } },
          },
        },
      },
    });

    if (!inventoryRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (inventoryRequest.status !== 'APPROVED') {
      return NextResponse.json(
        { error: `Cannot fulfill a request that is ${inventoryRequest.status}. Must be APPROVED first.` },
        { status: 400 }
      );
    }

    // Build fulfillment map (default to full requested quantity)
    const fulfillmentMap = new Map<string, number>();
    if (fulfilledItems && Array.isArray(fulfilledItems)) {
      for (const fi of fulfilledItems) {
        fulfillmentMap.set(fi.itemId, fi.quantityFulfilled);
      }
    }

    // Validate stock availability before processing
    for (const reqItem of inventoryRequest.items) {
      const qty = fulfillmentMap.get(reqItem.itemId) ?? reqItem.quantityRequested;
      if (qty > reqItem.item.currentStock) {
        return NextResponse.json(
          {
            error: `Insufficient stock for ${reqItem.item.name}. Available: ${reqItem.item.currentStock} ${reqItem.item.unit}, requested: ${qty} ${reqItem.item.unit}`,
          },
          { status: 400 }
        );
      }
    }

    // Process all transfers in a single transaction
    await prisma.$transaction(async (tx) => {
      for (const reqItem of inventoryRequest.items) {
        const qty = fulfillmentMap.get(reqItem.itemId) ?? reqItem.quantityRequested;

        if (qty <= 0) continue;

        // TRANSFER_OUT from supplier department (toSectionId is the supplier)
        await tx.inventoryMovement.create({
          data: {
            tenantId: auth.tenantId,
            itemId: reqItem.itemId,
            type: 'TRANSFER_OUT',
            quantity: -Math.abs(qty),
            costPerUnit: reqItem.item.costPerUnit,
            fromSectionId: inventoryRequest.toSectionId,
            toSectionId: inventoryRequest.fromSectionId,
            requestId: inventoryRequest.id,
            notes: `Transfer to ${inventoryRequest.fromSectionId} (request ${inventoryRequest.id.slice(-6)})`,
            createdBy: auth.userName,
          },
        });

        // TRANSFER_IN to requesting department
        await tx.inventoryMovement.create({
          data: {
            tenantId: auth.tenantId,
            itemId: reqItem.itemId,
            type: 'TRANSFER_IN',
            quantity: Math.abs(qty),
            costPerUnit: reqItem.item.costPerUnit,
            fromSectionId: inventoryRequest.toSectionId,
            toSectionId: inventoryRequest.fromSectionId,
            requestId: inventoryRequest.id,
            notes: `Received from ${inventoryRequest.toSectionId} (request ${inventoryRequest.id.slice(-6)})`,
            createdBy: auth.userName,
          },
        });

        // Decrement supplier stock
        await tx.inventoryItem.update({
          where: { id: reqItem.itemId },
          data: { currentStock: { decrement: Math.abs(qty) } },
        });

        // Update fulfilled quantity on request item
        await tx.inventoryRequestItem.update({
          where: { id: reqItem.id },
          data: { quantityFulfilled: qty },
        });
      }

      // Mark request as fulfilled
      await tx.inventoryRequest.update({
        where: { id: inventoryRequest.id },
        data: { status: 'FULFILLED', fulfilledAt: new Date() },
      });
    });

    // Return updated request
    const updated = await prisma.inventoryRequest.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            item: { select: { id: true, name: true, currentStock: true, unit: true } },
          },
        },
      },
    });

    return NextResponse.json({ request: updated });
  } catch (error: any) {
    console.error('[Inventory Fulfill POST]', error);
    return NextResponse.json({ error: error.message || 'Failed to fulfill request' }, { status: 500 });
  }
}
