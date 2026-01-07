import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

// GET /api/wash/employees/[id] - Get employee details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenant = await requireTenant();
    const { id } = await params;

    const employee = await prisma.washEmployee.findFirst({
      where: { id, tenantId: tenant.id },
      include: {
        washes: {
          orderBy: { washedAt: 'desc' },
          take: 20,
          include: {
            truck: {
              include: { fleet: { select: { name: true } } },
            },
          },
        },
        shifts: {
          orderBy: { clockIn: 'desc' },
          take: 10,
        },
        _count: { select: { washes: true, shifts: true } },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Calculate total earnings from washes
    const totalEarnings = await prisma.washRecord.aggregate({
      where: { employeeId: id, tenantId: tenant.id },
      _sum: { price: true },
    });

    // Check if currently clocked in
    const openShift = employee.shifts.find((s) => !s.clockOut);

    return NextResponse.json({
      id: employee.id,
      name: employee.name,
      phone: employee.phone,
      hourlyRate: employee.hourlyRate ? Number(employee.hourlyRate) : null,
      active: employee.active,
      totalWashes: employee._count.washes,
      totalShifts: employee._count.shifts,
      totalEarnings: Number(totalEarnings._sum.price || 0),
      isClockedIn: !!openShift,
      currentShiftStart: openShift?.clockIn || null,
      recentWashes: employee.washes.map((w) => ({
        id: w.id,
        truckNumber: w.truck.truckNumber,
        fleetName: w.truck.fleet.name,
        price: Number(w.price),
        washedAt: w.washedAt,
      })),
      recentShifts: employee.shifts.map((s) => ({
        id: s.id,
        clockIn: s.clockIn,
        clockOut: s.clockOut,
      })),
      createdAt: employee.createdAt,
    });
  } catch (error) {
    console.error('[wash/employees/[id]] GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch employee' }, { status: 500 });
  }
}

// PUT /api/wash/employees/[id] - Update employee
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenant = await requireTenant();
    const { id } = await params;
    const body = await req.json();

    const { name, phone, pin, hourlyRate, active } = body;

    const existing = await prisma.washEmployee.findFirst({
      where: { id, tenantId: tenant.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const employee = await prisma.washEmployee.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        phone: phone ?? existing.phone,
        pin: pin ?? existing.pin,
        hourlyRate: hourlyRate !== undefined ? hourlyRate : existing.hourlyRate,
        active: active !== undefined ? active : existing.active,
      },
    });

    return NextResponse.json({
      id: employee.id,
      name: employee.name,
      phone: employee.phone,
      hourlyRate: employee.hourlyRate ? Number(employee.hourlyRate) : null,
      active: employee.active,
    });
  } catch (error) {
    console.error('[wash/employees/[id]] PUT Error:', error);
    return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 });
  }
}

// DELETE /api/wash/employees/[id] - Delete (or deactivate) employee
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenant = await requireTenant();
    const { id } = await params;

    const existing = await prisma.washEmployee.findFirst({
      where: { id, tenantId: tenant.id },
      include: { _count: { select: { washes: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // If employee has washes, just deactivate instead of delete
    if (existing._count.washes > 0) {
      await prisma.washEmployee.update({
        where: { id },
        data: { active: false },
      });
      return NextResponse.json({ success: true, deactivated: true });
    }

    await prisma.washEmployee.delete({ where: { id } });
    return NextResponse.json({ success: true, deleted: true });
  } catch (error) {
    console.error('[wash/employees/[id]] DELETE Error:', error);
    return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 });
  }
}
