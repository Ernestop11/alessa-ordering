import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

// POST /api/wash/complete - Record a completed wash
export async function POST(req: NextRequest) {
  try {
    const tenant = await requireTenant();
    const body = await req.json();

    const { truckId, employeeId, notes } = body;

    if (!truckId || !employeeId) {
      return NextResponse.json(
        { error: 'truckId and employeeId are required' },
        { status: 400 }
      );
    }

    // Get truck and fleet to determine price
    const truck = await prisma.truck.findFirst({
      where: {
        id: truckId,
        tenantId: tenant.id,
      },
      include: {
        fleet: {
          select: { pricePerWash: true },
        },
      },
    });

    if (!truck) {
      return NextResponse.json({ error: 'Truck not found' }, { status: 404 });
    }

    // Verify employee exists and belongs to tenant
    const employee = await prisma.washEmployee.findFirst({
      where: {
        id: employeeId,
        tenantId: tenant.id,
        active: true,
      },
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found or inactive' }, { status: 404 });
    }

    // Create wash record
    const washRecord = await prisma.washRecord.create({
      data: {
        tenantId: tenant.id,
        truckId,
        employeeId,
        price: truck.fleet.pricePerWash,
        notes: notes || null,
        washedAt: new Date(),
      },
      include: {
        truck: {
          include: {
            fleet: { select: { name: true } },
          },
        },
        employee: { select: { name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      wash: {
        id: washRecord.id,
        truckNumber: washRecord.truck.truckNumber,
        fleetName: washRecord.truck.fleet.name,
        employeeName: washRecord.employee.name,
        price: Number(washRecord.price),
        washedAt: washRecord.washedAt,
      },
    });
  } catch (error) {
    console.error('[wash/complete] Error:', error);
    return NextResponse.json({ error: 'Failed to record wash' }, { status: 500 });
  }
}
