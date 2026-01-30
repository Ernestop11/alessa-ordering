import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';

/**
 * GET - Retrieve weekly P&L report
 * Query params: weekStart (ISO date), departmentId (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session || (role !== 'admin' && role !== 'super_admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await requireTenant();
    const { searchParams } = request.nextUrl;
    const weekStartParam = searchParams.get('weekStart');
    const departmentId = searchParams.get('departmentId') || null;

    // Default to current week (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);

    const weekStart = weekStartParam ? new Date(weekStartParam) : monday;
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    // Check for cached report
    const cached = await prisma.weeklyCostReport.findUnique({
      where: {
        tenantId_weekStart_menuSectionId: {
          tenantId: tenant.id,
          weekStart,
          menuSectionId: departmentId || '',
        },
      },
    });

    if (cached) {
      return NextResponse.json({ report: cached, source: 'cached' });
    }

    // Generate fresh report
    const report = await generateWeeklyReport(tenant.id, weekStart, weekEnd, departmentId);

    return NextResponse.json({ report, source: 'generated' });
  } catch (error: any) {
    console.error('[Weekly Report GET]', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch report' }, { status: 500 });
  }
}

/**
 * POST - Generate and cache a weekly P&L report
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session || (role !== 'admin' && role !== 'super_admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await requireTenant();
    const body = await request.json();
    const { weekStart: weekStartStr, departmentId } = body;

    if (!weekStartStr) {
      return NextResponse.json({ error: 'weekStart is required' }, { status: 400 });
    }

    const weekStart = new Date(weekStartStr);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const report = await generateWeeklyReport(tenant.id, weekStart, weekEnd, departmentId || null);

    // Cache the report
    const saved = await prisma.weeklyCostReport.upsert({
      where: {
        tenantId_weekStart_menuSectionId: {
          tenantId: tenant.id,
          weekStart,
          menuSectionId: departmentId || '',
        },
      },
      update: {
        totalRevenue: report.totalRevenue,
        totalCOGS: report.totalCOGS,
        grossMargin: report.grossMargin,
        weekEnd,
        details: report.details,
      },
      create: {
        tenantId: tenant.id,
        weekStart,
        weekEnd,
        menuSectionId: departmentId || null,
        totalRevenue: report.totalRevenue,
        totalCOGS: report.totalCOGS,
        grossMargin: report.grossMargin,
        details: report.details,
      },
    });

    return NextResponse.json({ report: saved }, { status: 201 });
  } catch (error: any) {
    console.error('[Weekly Report POST]', error);
    return NextResponse.json({ error: error.message || 'Failed to generate report' }, { status: 500 });
  }
}

async function generateWeeklyReport(
  tenantId: string,
  weekStart: Date,
  weekEnd: Date,
  departmentId: string | null
) {
  // Revenue: Sum of completed orders in the period
  const orderWhere: any = {
    tenantId,
    createdAt: { gte: weekStart, lt: weekEnd },
    status: { in: ['completed', 'confirmed', 'fulfilled'] },
  };

  const orders = await prisma.order.findMany({
    where: orderWhere,
    select: {
      totalAmount: true,
      subtotalAmount: true,
      taxAmount: true,
      tipAmount: true,
      platformFee: true,
    },
  });

  const totalRevenue = orders.reduce((sum, o) => sum + (o.subtotalAmount || 0), 0);
  const totalTax = orders.reduce((sum, o) => sum + (o.taxAmount || 0), 0);
  const totalTips = orders.reduce((sum, o) => sum + (o.tipAmount || 0), 0);

  // COGS: Sum of inventory movements (PURCHASE + SPOILAGE costs in the period)
  const movementWhere: any = {
    tenantId,
    createdAt: { gte: weekStart, lt: weekEnd },
    type: { in: ['PURCHASE', 'SPOILAGE'] },
  };

  if (departmentId) {
    movementWhere.item = { menuSectionId: departmentId };
  }

  const movements = await prisma.inventoryMovement.findMany({
    where: movementWhere,
    select: {
      type: true,
      quantity: true,
      costPerUnit: true,
    },
  });

  const purchaseCost = movements
    .filter((m) => m.type === 'PURCHASE')
    .reduce((sum, m) => sum + Math.abs(m.quantity) * (m.costPerUnit || 0), 0);

  const spoilageCost = movements
    .filter((m) => m.type === 'SPOILAGE')
    .reduce((sum, m) => sum + Math.abs(m.quantity) * (m.costPerUnit || 0), 0);

  // Vendor credits applied in the period
  const creditWhere: any = {
    tenantId,
    status: 'applied',
    appliedAt: { gte: weekStart, lt: weekEnd },
  };

  const credits = await prisma.vendorCredit.findMany({
    where: creditWhere,
    select: { amount: true },
  });

  const totalCredits = credits.reduce((sum, c) => sum + c.amount, 0);

  const totalCOGS = purchaseCost + spoilageCost - totalCredits;
  const grossMargin = totalRevenue - totalCOGS;

  return {
    weekStart,
    weekEnd,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalCOGS: Math.round(totalCOGS * 100) / 100,
    grossMargin: Math.round(grossMargin * 100) / 100,
    details: {
      orderCount: orders.length,
      purchaseCost: Math.round(purchaseCost * 100) / 100,
      spoilageCost: Math.round(spoilageCost * 100) / 100,
      vendorCredits: Math.round(totalCredits * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      totalTips: Math.round(totalTips * 100) / 100,
      marginPercent: totalRevenue > 0
        ? Math.round((grossMargin / totalRevenue) * 10000) / 100
        : 0,
    },
  };
}
