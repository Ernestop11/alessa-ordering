import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

// GET /api/wash/trucks/[id] - Get truck details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenant = await requireTenant();
    const { id } = await params;

    const truck = await prisma.truck.findFirst({
      where: { id, tenantId: tenant.id },
      include: {
        fleet: { select: { id: true, name: true, pricePerWash: true } },
        washes: {
          orderBy: { washedAt: 'desc' },
          take: 20,
          include: {
            employee: { select: { id: true, name: true } },
          },
        },
        _count: { select: { washes: true } },
      },
    });

    if (!truck) {
      return NextResponse.json({ error: 'Truck not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: truck.id,
      truckNumber: truck.truckNumber,
      description: truck.description,
      licensePlate: truck.licensePlate,
      qrCode: truck.qrCode,
      fleet: {
        id: truck.fleet.id,
        name: truck.fleet.name,
        pricePerWash: Number(truck.fleet.pricePerWash),
      },
      totalWashes: truck._count.washes,
      recentWashes: truck.washes.map((w) => ({
        id: w.id,
        washedAt: w.washedAt,
        price: Number(w.price),
        employee: { id: w.employee.id, name: w.employee.name },
        notes: w.notes,
      })),
      createdAt: truck.createdAt,
    });
  } catch (error) {
    console.error('[wash/trucks/[id]] GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch truck' }, { status: 500 });
  }
}

// PUT /api/wash/trucks/[id] - Update truck
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenant = await requireTenant();
    const { id } = await params;
    const body = await req.json();

    const { truckNumber, description, licensePlate, fleetId } = body;

    // Verify truck belongs to tenant
    const existing = await prisma.truck.findFirst({
      where: { id, tenantId: tenant.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Truck not found' }, { status: 404 });
    }

    // If changing fleet, verify new fleet belongs to tenant
    if (fleetId && fleetId !== existing.fleetId) {
      const fleet = await prisma.fleet.findFirst({
        where: { id: fleetId, tenantId: tenant.id },
      });
      if (!fleet) {
        return NextResponse.json({ error: 'Fleet not found' }, { status: 404 });
      }
    }

    const truck = await prisma.truck.update({
      where: { id },
      data: {
        truckNumber: truckNumber ?? existing.truckNumber,
        description: description ?? existing.description,
        licensePlate: licensePlate ?? existing.licensePlate,
        fleetId: fleetId ?? existing.fleetId,
      },
      include: {
        fleet: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      id: truck.id,
      truckNumber: truck.truckNumber,
      description: truck.description,
      licensePlate: truck.licensePlate,
      qrCode: truck.qrCode,
      fleet: { id: truck.fleet.id, name: truck.fleet.name },
    });
  } catch (error) {
    console.error('[wash/trucks/[id]] PUT Error:', error);
    return NextResponse.json({ error: 'Failed to update truck' }, { status: 500 });
  }
}

// DELETE /api/wash/trucks/[id] - Delete truck
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenant = await requireTenant();
    const { id } = await params;

    const existing = await prisma.truck.findFirst({
      where: { id, tenantId: tenant.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Truck not found' }, { status: 404 });
    }

    await prisma.truck.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[wash/trucks/[id]] DELETE Error:', error);
    return NextResponse.json({ error: 'Failed to delete truck' }, { status: 500 });
  }
}
