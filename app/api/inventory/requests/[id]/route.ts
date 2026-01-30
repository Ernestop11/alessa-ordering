import { NextRequest, NextResponse } from 'next/server';
import { resolveInventoryAuth } from '@/lib/inventory-auth';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await resolveInventoryAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const inventoryRequest = await prisma.inventoryRequest.findFirst({
      where: { id: params.id, tenantId: auth.tenantId },
      include: {
        items: {
          include: {
            item: { select: { id: true, name: true, unit: true, currentStock: true, costPerUnit: true } },
          },
        },
      },
    });

    if (!inventoryRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Get section names
    const sections = await prisma.menuSection.findMany({
      where: { id: { in: [inventoryRequest.fromSectionId, inventoryRequest.toSectionId] } },
      select: { id: true, name: true, type: true },
    });
    const sectionMap = Object.fromEntries(sections.map((s) => [s.id, s]));

    return NextResponse.json({
      request: {
        ...inventoryRequest,
        fromSection: sectionMap[inventoryRequest.fromSectionId],
        toSection: sectionMap[inventoryRequest.toSectionId],
      },
    });
  } catch (error: any) {
    console.error('[Inventory Request GET]', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch request' }, { status: 500 });
  }
}

/**
 * PUT - Approve or reject a request
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await resolveInventoryAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, rejectionReason } = body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'action must be "approve" or "reject"' }, { status: 400 });
    }

    const existing = await prisma.inventoryRequest.findFirst({
      where: { id: params.id, tenantId: auth.tenantId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (existing.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Cannot ${action} a request that is ${existing.status}` },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      const updated = await prisma.inventoryRequest.update({
        where: { id: params.id },
        data: { status: 'APPROVED', approvedBy: auth.userName },
        include: { items: { include: { item: { select: { id: true, name: true, unit: true } } } } },
      });
      return NextResponse.json({ request: updated });
    } else {
      const updated = await prisma.inventoryRequest.update({
        where: { id: params.id },
        data: {
          status: 'REJECTED',
          rejectedAt: new Date(),
          rejectionReason: rejectionReason || null,
        },
        include: { items: { include: { item: { select: { id: true, name: true, unit: true } } } } },
      });
      return NextResponse.json({ request: updated });
    }
  } catch (error: any) {
    console.error('[Inventory Request PUT]', error);
    return NextResponse.json({ error: error.message || 'Failed to update request' }, { status: 500 });
  }
}
