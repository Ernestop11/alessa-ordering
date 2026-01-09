import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/wash/clock - Get current clock status for an employee
export async function GET(req: NextRequest) {
  try {
    const employeeId = req.nextUrl.searchParams.get('employeeId');

    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required' },
        { status: 400 }
      );
    }

    // Find active shift (no clockOut)
    const activeShift = await prisma.employeeShift.findFirst({
      where: {
        employeeId,
        clockOut: null,
      },
      orderBy: { clockIn: 'desc' },
    });

    // Get today's shifts
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayShifts = await prisma.employeeShift.findMany({
      where: {
        employeeId,
        clockIn: { gte: today },
      },
      orderBy: { clockIn: 'desc' },
    });

    // Calculate total hours today
    let totalMinutesToday = 0;
    for (const shift of todayShifts) {
      const end = shift.clockOut || new Date();
      const duration = (end.getTime() - shift.clockIn.getTime()) / (1000 * 60);
      totalMinutesToday += duration;
    }

    return NextResponse.json({
      isClockedIn: !!activeShift,
      activeShift: activeShift
        ? {
            id: activeShift.id,
            clockIn: activeShift.clockIn,
          }
        : null,
      todayShifts,
      totalHoursToday: Math.round(totalMinutesToday / 60 * 100) / 100,
    });
  } catch (error) {
    console.error('[wash/clock] GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to get clock status' },
      { status: 500 }
    );
  }
}

// POST /api/wash/clock - Clock in or out
export async function POST(req: NextRequest) {
  try {
    const { employeeId, action } = await req.json();

    if (!employeeId || !action) {
      return NextResponse.json(
        { error: 'Employee ID and action are required' },
        { status: 400 }
      );
    }

    if (!['clock_in', 'clock_out'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be clock_in or clock_out' },
        { status: 400 }
      );
    }

    // Verify employee exists
    const employee = await prisma.washEmployee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    if (action === 'clock_in') {
      // Check if already clocked in
      const activeShift = await prisma.employeeShift.findFirst({
        where: {
          employeeId,
          clockOut: null,
        },
      });

      if (activeShift) {
        return NextResponse.json(
          { error: 'Already clocked in' },
          { status: 400 }
        );
      }

      // Create new shift
      const shift = await prisma.employeeShift.create({
        data: {
          tenantId: employee.tenantId,
          employeeId,
          clockIn: new Date(),
        },
      });

      return NextResponse.json({
        ok: true,
        action: 'clock_in',
        shift: {
          id: shift.id,
          clockIn: shift.clockIn,
        },
      });
    } else {
      // Clock out - find active shift
      const activeShift = await prisma.employeeShift.findFirst({
        where: {
          employeeId,
          clockOut: null,
        },
      });

      if (!activeShift) {
        return NextResponse.json(
          { error: 'Not clocked in' },
          { status: 400 }
        );
      }

      // Update shift with clock out time
      const shift = await prisma.employeeShift.update({
        where: { id: activeShift.id },
        data: { clockOut: new Date() },
      });

      // Calculate duration
      const durationMs = shift.clockOut!.getTime() - shift.clockIn.getTime();
      const durationHours = Math.round(durationMs / (1000 * 60 * 60) * 100) / 100;

      return NextResponse.json({
        ok: true,
        action: 'clock_out',
        shift: {
          id: shift.id,
          clockIn: shift.clockIn,
          clockOut: shift.clockOut,
          hoursWorked: durationHours,
        },
      });
    }
  } catch (error) {
    console.error('[wash/clock] POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to process clock action' },
      { status: 500 }
    );
  }
}
