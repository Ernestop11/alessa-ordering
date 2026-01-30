import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session || (role !== 'admin' && role !== 'super_admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await requireTenant();
    const { searchParams } = request.nextUrl;
    const status = searchParams.get('status');
    const departmentId = searchParams.get('departmentId');

    const where: any = { tenantId: tenant.id };
    if (status) where.status = status;
    if (departmentId) {
      where.OR = [
        { fromSectionId: departmentId },
        { toSectionId: departmentId },
      ];
    }

    const requests = await prisma.inventoryRequest.findMany({
      where,
      include: {
        items: {
          include: {
            item: { select: { id: true, name: true, unit: true, currentStock: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Enrich with section names
    const sectionIds = new Set<string>();
    requests.forEach((r) => {
      sectionIds.add(r.fromSectionId);
      sectionIds.add(r.toSectionId);
    });

    const sections = await prisma.menuSection.findMany({
      where: { id: { in: Array.from(sectionIds) } },
      select: { id: true, name: true, type: true },
    });

    const sectionMap = Object.fromEntries(sections.map((s) => [s.id, s]));

    const enriched = requests.map((r) => ({
      ...r,
      fromSection: sectionMap[r.fromSectionId] || { name: 'Unknown' },
      toSection: sectionMap[r.toSectionId] || { name: 'Unknown' },
    }));

    return NextResponse.json({ requests: enriched });
  } catch (error: any) {
    console.error('[Inventory Requests GET]', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch requests' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session || (role !== 'admin' && role !== 'super_admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await requireTenant();
    const body = await request.json();

    const { fromSectionId, toSectionId, items, notes, requestedBy } = body;

    if (!fromSectionId || !toSectionId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'fromSectionId, toSectionId, and items[] are required' },
        { status: 400 }
      );
    }

    if (fromSectionId === toSectionId) {
      return NextResponse.json(
        { error: 'Cannot request from the same department' },
        { status: 400 }
      );
    }

    // Verify sections belong to tenant
    const sectionCount = await prisma.menuSection.count({
      where: {
        id: { in: [fromSectionId, toSectionId] },
        tenantId: tenant.id,
      },
    });

    if (sectionCount !== 2) {
      return NextResponse.json({ error: 'Invalid department IDs' }, { status: 400 });
    }

    // Verify all items belong to tenant
    const itemIds = items.map((i: any) => i.itemId);
    const validItems = await prisma.inventoryItem.count({
      where: { id: { in: itemIds }, tenantId: tenant.id },
    });

    if (validItems !== itemIds.length) {
      return NextResponse.json({ error: 'One or more items not found' }, { status: 400 });
    }

    const inventoryRequest = await prisma.inventoryRequest.create({
      data: {
        tenantId: tenant.id,
        fromSectionId,
        toSectionId,
        requestedBy: requestedBy || session.user?.name || session.user?.email || 'admin',
        notes: notes || null,
        items: {
          create: items.map((item: any) => ({
            itemId: item.itemId,
            quantityRequested: item.quantity,
          })),
        },
      },
      include: {
        items: {
          include: {
            item: { select: { id: true, name: true, unit: true } },
          },
        },
      },
    });

    return NextResponse.json({ request: inventoryRequest }, { status: 201 });
  } catch (error: any) {
    console.error('[Inventory Requests POST]', error);
    return NextResponse.json({ error: error.message || 'Failed to create request' }, { status: 500 });
  }
}
