import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

// POST /api/wash/employees/[id]/clock - Clock in or out
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenant = await requireTenant();
    const { id } = await params;
    const body = await req.json();

    const { action } = body; // 'in' or 'out'

    if (!action || !['in', 'out'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be "in" or "out"' },
        { status: 400 }
      );
    }

    // Verify employee exists and is active
    const employee = await prisma.washEmployee.findFirst({
      where: { id, tenantId: tenant.id, active: true },
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found or inactive' }, { status: 404 });
    }

    // Check for open shift
    const openShift = await prisma.employeeShift.findFirst({
      where: {
        employeeId: id,
        tenantId: tenant.id,
        clockOut: null,
      },
    });

    if (action === 'in') {
      if (openShift) {
        return NextResponse.json(
          { error: 'Employee is already clocked in', shiftId: openShift.id },
          { status: 400 }
        );
      }

      // Create new shift
      const shift = await prisma.employeeShift.create({
        data: {
          tenantId: tenant.id,
          employeeId: id,
          clockIn: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        action: 'clocked_in',
        shift: {
          id: shift.id,
          clockIn: shift.clockIn,
        },
      });
    }

    // action === 'out'
    if (!openShift) {
      return NextResponse.json(
        { error: 'Employee is not clocked in' },
        { status: 400 }
      );
    }

    // Clock out
    const updatedShift = await prisma.employeeShift.update({
      where: { id: openShift.id },
      data: { clockOut: new Date() },
    });

    // Calculate hours worked
    const hoursWorked =
      (updatedShift.clockOut!.getTime() - updatedShift.clockIn.getTime()) / (1000 * 60 * 60);

    return NextResponse.json({
      success: true,
      action: 'clocked_out',
      shift: {
        id: updatedShift.id,
        clockIn: updatedShift.clockIn,
        clockOut: updatedShift.clockOut,
        hoursWorked: Math.round(hoursWorked * 100) / 100,
      },
    });
  } catch (error) {
    console.error('[wash/employees/[id]/clock] Error:', error);
    return NextResponse.json({ error: 'Failed to clock in/out' }, { status: 500 });
  }
}

// GET /api/wash/employees/[id]/clock - Get current clock status
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenant = await requireTenant();
    const { id } = await params;

    const openShift = await prisma.employeeShift.findFirst({
      where: {
        employeeId: id,
        tenantId: tenant.id,
        clockOut: null,
      },
    });

    if (!openShift) {
      return NextResponse.json({
        isClockedIn: false,
        currentShift: null,
      });
    }

    const elapsedMs = Date.now() - openShift.clockIn.getTime();
    const elapsedHours = elapsedMs / (1000 * 60 * 60);

    return NextResponse.json({
      isClockedIn: true,
      currentShift: {
        id: openShift.id,
        clockIn: openShift.clockIn,
        elapsedHours: Math.round(elapsedHours * 100) / 100,
      },
    });
  } catch (error) {
    console.error('[wash/employees/[id]/clock] GET Error:', error);
    return NextResponse.json({ error: 'Failed to get clock status' }, { status: 500 });
  }
}
