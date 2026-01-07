import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

// GET /api/wash/today - Get today's wash summary
export async function GET(req: NextRequest) {
  try {
    const tenant = await requireTenant();

    // Get date param or default to today
    const dateParam = req.nextUrl.searchParams.get('date');
    const targetDate = dateParam ? new Date(dateParam) : new Date();

    // Set to start and end of day
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all washes for the day
    const washes = await prisma.washRecord.findMany({
      where: {
        tenantId: tenant.id,
        washedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        truck: {
          include: {
            fleet: { select: { id: true, name: true } },
          },
        },
        employee: { select: { id: true, name: true } },
      },
      orderBy: { washedAt: 'desc' },
    });

    // Calculate totals
    const totalWashes = washes.length;
    const totalRevenue = washes.reduce((sum, w) => sum + Number(w.price), 0);

    // Group by employee
    const byEmployee: Record<string, { name: string; count: number; revenue: number }> = {};
    washes.forEach((wash) => {
      const empId = wash.employee.id;
      if (!byEmployee[empId]) {
        byEmployee[empId] = { name: wash.employee.name, count: 0, revenue: 0 };
      }
      byEmployee[empId].count++;
      byEmployee[empId].revenue += Number(wash.price);
    });

    // Group by fleet
    const byFleet: Record<string, { name: string; count: number; revenue: number }> = {};
    washes.forEach((wash) => {
      const fleetId = wash.truck.fleet.id;
      if (!byFleet[fleetId]) {
        byFleet[fleetId] = { name: wash.truck.fleet.name, count: 0, revenue: 0 };
      }
      byFleet[fleetId].count++;
      byFleet[fleetId].revenue += Number(wash.price);
    });

    return NextResponse.json({
      date: targetDate.toISOString().split('T')[0],
      summary: {
        totalWashes,
        totalRevenue,
      },
      byEmployee: Object.entries(byEmployee).map(([id, data]) => ({
        id,
        ...data,
      })),
      byFleet: Object.entries(byFleet).map(([id, data]) => ({
        id,
        ...data,
      })),
      washes: washes.map((w) => ({
        id: w.id,
        truckNumber: w.truck.truckNumber,
        fleetName: w.truck.fleet.name,
        employeeName: w.employee.name,
        price: Number(w.price),
        washedAt: w.washedAt,
        notes: w.notes,
      })),
    });
  } catch (error) {
    console.error('[wash/today] Error:', error);
    return NextResponse.json({ error: 'Failed to get daily summary' }, { status: 500 });
  }
}
