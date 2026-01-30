import { NextRequest, NextResponse } from 'next/server';
import { resolveInventoryAuth } from '@/lib/inventory-auth';
import prisma from '@/lib/prisma';

const VALID_TYPES = ['PURCHASE', 'SALE', 'TRANSFER_OUT', 'TRANSFER_IN', 'SPOILAGE', 'RETURN', 'ADJUSTMENT'] as const;

export async function GET(request: NextRequest) {
  try {
    const auth = await resolveInventoryAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const itemId = searchParams.get('itemId');
    const type = searchParams.get('type');
    const departmentId = searchParams.get('departmentId');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = { tenantId: auth.tenantId };
    if (itemId) where.itemId = itemId;
    if (type && VALID_TYPES.includes(type as any)) where.type = type;
    if (departmentId) {
      where.item = { menuSectionId: departmentId };
    }

    const [movements, total] = await Promise.all([
      prisma.inventoryMovement.findMany({
        where,
        include: {
          item: { select: { id: true, name: true, unit: true, category: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.inventoryMovement.count({ where }),
    ]);

    return NextResponse.json({ movements, total });
  } catch (error: any) {
    console.error('[Inventory Movements GET]', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch movements' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await resolveInventoryAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const { itemId, type, quantity, costPerUnit, notes } = body;

    if (!itemId || !type || quantity === undefined) {
      return NextResponse.json(
        { error: 'itemId, type, and quantity are required' },
        { status: 400 }
      );
    }

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `type must be one of: ${VALID_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Verify item belongs to tenant
    const item = await prisma.inventoryItem.findFirst({
      where: { id: itemId, tenantId: auth.tenantId },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Determine stock change direction
    const stockDelta = (() => {
      switch (type) {
        case 'PURCHASE':
        case 'TRANSFER_IN':
        case 'RETURN':
          return Math.abs(quantity);
        case 'SALE':
        case 'TRANSFER_OUT':
        case 'SPOILAGE':
          return -Math.abs(quantity);
        case 'ADJUSTMENT':
          return quantity; // Can be positive or negative
        default:
          return 0;
      }
    })();

    // Check for sufficient stock on outgoing movements
    if (stockDelta < 0 && item.currentStock + stockDelta < 0) {
      return NextResponse.json(
        { error: `Insufficient stock. Current: ${item.currentStock} ${item.unit}, requested: ${Math.abs(quantity)} ${item.unit}` },
        { status: 400 }
      );
    }

    // Create movement and update stock in a transaction
    const [movement] = await prisma.$transaction([
      prisma.inventoryMovement.create({
        data: {
          tenantId: auth.tenantId,
          itemId,
          type,
          quantity: stockDelta,
          costPerUnit: costPerUnit ?? item.costPerUnit,
          notes: notes || null,
          createdBy: auth.userName,
        },
        include: {
          item: { select: { id: true, name: true, unit: true } },
        },
      }),
      prisma.inventoryItem.update({
        where: { id: itemId },
        data: { currentStock: { increment: stockDelta } },
      }),
    ]);

    return NextResponse.json({ movement, newStock: item.currentStock + stockDelta }, { status: 201 });
  } catch (error: any) {
    console.error('[Inventory Movements POST]', error);
    return NextResponse.json({ error: error.message || 'Failed to create movement' }, { status: 500 });
  }
}
