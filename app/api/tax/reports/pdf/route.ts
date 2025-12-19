import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';
import { generateTaxReportPDF } from '@/lib/tax/pdf-generator';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tax/reports/pdf
 * 
 * Generate PDF tax report
 * Query params: periodStart, periodEnd
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

    if (!periodStart || !periodEnd) {
      return NextResponse.json(
        { error: 'periodStart and periodEnd query parameters are required' },
        { status: 400 }
      );
    }

    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);

    // Get report data (reuse logic from reports route)
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

    const totalTaxCollected = orders.reduce((sum, order) => sum + (order.taxAmount || 0), 0);
    const totalSales = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    const remittances = await prisma.taxRemittance.findMany({
      where: {
        tenantId: tenant.id,
        periodStart: { lte: endDate },
        periodEnd: { gte: startDate },
      },
    });

    const reportData = {
      tenantName: tenant.name,
      periodStart: startDate,
      periodEnd: endDate,
      totalSales,
      totalTaxCollected,
      orderCount: orders.length,
      orders: orders.map((o) => ({
        id: o.id,
        date: o.createdAt,
        subtotal: o.subtotalAmount || 0,
        tax: o.taxAmount || 0,
        total: o.totalAmount,
      })),
      remittances: remittances.map((r) => ({
        periodStart: r.periodStart,
        periodEnd: r.periodEnd,
        totalTaxRemitted: r.totalTaxRemitted,
        status: r.status,
      })),
    };

    // Get tax breakdown by jurisdiction from remittances
    const taxData = remittances.flatMap((r) => {
      const breakdown = (r.reportData as any)?.breakdown || [];
      return breakdown.map((b: any) => ({
        jurisdiction: b.state || 'Unknown',
        jurisdictionType: 'state' as const,
        taxAmount: b.taxAmount || 0,
        orderCount: b.orderCount || 0,
      }));
    });

    // Generate PDF using new signature
    const pdfBuffer = await generateTaxReportPDF(
      tenant,
      { start: startDate, end: endDate },
      taxData.length > 0 ? taxData : [
        {
          jurisdiction: tenant.state || 'Unknown',
          jurisdictionType: 'state',
          taxAmount: totalTaxCollected,
          orderCount: orders.length,
        },
      ]
    );

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="tax-report-${tenant.slug}-${periodStart}-${periodEnd}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('[tax-reports-pdf] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate PDF report' },
      { status: 500 }
    );
  }
}

