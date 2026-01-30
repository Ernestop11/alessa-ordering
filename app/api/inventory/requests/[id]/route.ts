import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session || (role !== 'admin' && role !== 'super_admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await requireTenant();

    const inventoryRequest = await prisma.inventoryRequest.findFirst({
      where: { id: params.id, tenantId: tenant.id },
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
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session || (role !== 'admin' && role !== 'super_admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await requireTenant();
    const body = await request.json();
    const { action, rejectionReason } = body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'action must be "approve" or "reject"' }, { status: 400 });
    }

    const existing = await prisma.inventoryRequest.findFirst({
      where: { id: params.id, tenantId: tenant.id },
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

    const approver = session.user?.name || session.user?.email || 'admin';

    if (action === 'approve') {
      const updated = await prisma.inventoryRequest.update({
        where: { id: params.id },
        data: { status: 'APPROVED', approvedBy: approver },
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
