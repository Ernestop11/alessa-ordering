import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

// GET /api/wash/employees - List all employees
export async function GET(req: NextRequest) {
  try {
    const tenant = await requireTenant();
    const activeOnly = req.nextUrl.searchParams.get('active') !== 'false';

    const employees = await prisma.washEmployee.findMany({
      where: {
        tenantId: tenant.id,
        ...(activeOnly ? { active: true } : {}),
      },
      include: {
        _count: { select: { washes: true, shifts: true } },
        shifts: {
          where: { clockOut: null },
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(
      employees.map((e) => ({
        id: e.id,
        name: e.name,
        phone: e.phone,
        hourlyRate: e.hourlyRate ? Number(e.hourlyRate) : null,
        active: e.active,
        totalWashes: e._count.washes,
        totalShifts: e._count.shifts,
        isClockedIn: e.shifts.length > 0,
        currentShiftStart: e.shifts[0]?.clockIn || null,
        createdAt: e.createdAt,
      }))
    );
  } catch (error) {
    console.error('[wash/employees] GET Error:', error);
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
  }
}

// POST /api/wash/employees - Create a new employee
export async function POST(req: NextRequest) {
  try {
    const tenant = await requireTenant();
    const body = await req.json();

    const { name, phone, pin, hourlyRate } = body;

    if (!name) {
      return NextResponse.json({ error: 'Employee name is required' }, { status: 400 });
    }

    const employee = await prisma.washEmployee.create({
      data: {
        tenantId: tenant.id,
        name,
        phone: phone || null,
        pin: pin || null,
        hourlyRate: hourlyRate || null,
        active: true,
      },
    });

    return NextResponse.json({
      id: employee.id,
      name: employee.name,
      phone: employee.phone,
      hourlyRate: employee.hourlyRate ? Number(employee.hourlyRate) : null,
      active: employee.active,
      createdAt: employee.createdAt,
    });
  } catch (error) {
    console.error('[wash/employees] POST Error:', error);
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 });
  }
}
