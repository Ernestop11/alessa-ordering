import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tax/reports
 * 
 * Generate tax reports for a period
 * Query params: periodStart, periodEnd, format (json | pdf)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await requireTenant();
    const { searchParams } = new URL(req.url);
    const periodStart = searchParams.get('periodStart');
    const periodEnd = searchParams.get('periodEnd');
    const format = searchParams.get('format') || 'json';

    if (!periodStart || !periodEnd) {
      return NextResponse.json(
        { error: 'periodStart and periodEnd query parameters are required' },
        { status: 400 }
      );
    }

    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);

    // Get orders in the period
    const orders = await prisma.order.findMany({
      where: {
        tenantId: tenant.id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: { not: 'cancelled' },
      },
      select: {
        id: true,
        createdAt: true,
        subtotalAmount: true,
        taxAmount: true,
        totalAmount: true,
        status: true,
      },
    });

    // Calculate totals
    const totalTaxCollected = orders.reduce((sum, order) => sum + (order.taxAmount || 0), 0);
    const totalSales = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const totalSubtotal = orders.reduce((sum, order) => sum + (order.subtotalAmount || 0), 0);

    // Get remittances for this period
    const remittances = await prisma.taxRemittance.findMany({
      where: {
        tenantId: tenant.id,
        periodStart: { lte: endDate },
        periodEnd: { gte: startDate },
      },
    });

    const reportData = {
      tenantId: tenant.id,
      tenantName: tenant.name,
      periodStart: startDate.toISOString(),
      periodEnd: endDate.toISOString(),
      summary: {
        totalSales,
        totalSubtotal,
        totalTaxCollected,
        orderCount: orders.length,
        remittanceCount: remittances.length,
        totalRemitted: remittances.reduce((sum, r) => sum + r.totalTaxRemitted, 0),
      },
      orders: orders.map((order) => ({
        id: order.id,
        date: order.createdAt.toISOString(),
        subtotal: order.subtotalAmount,
        tax: order.taxAmount,
        total: order.totalAmount,
        status: order.status,
      })),
      remittances: remittances.map((r) => ({
        id: r.id,
        periodStart: r.periodStart.toISOString(),
        periodEnd: r.periodEnd.toISOString(),
        totalTaxCollected: r.totalTaxCollected,
        totalTaxRemitted: r.totalTaxRemitted,
        status: r.status,
        remittanceDate: r.remittanceDate?.toISOString(),
        remittanceMethod: r.remittanceMethod,
      })),
      generatedAt: new Date().toISOString(),
    };

    if (format === 'pdf') {
      // Redirect to PDF endpoint
      return NextResponse.redirect(
        `/api/tax/reports/pdf?periodStart=${encodeURIComponent(periodStart)}&periodEnd=${encodeURIComponent(periodEnd)}`
      );
    }

    return NextResponse.json(reportData);
  } catch (error: any) {
    console.error('[tax-reports] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate report' },
      { status: 500 }
    );
  }
}

