import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import {
  calculateTaxCollected,
  getRemittancePeriod,
  createTaxRemittance,
  processTaxRemittance,
  generateTaxRemittanceReport,
} from '@/lib/tax/remittance-scheduler';
import prisma from '@/lib/prisma';

/**
 * GET /api/tax/remit
 * Get tax remittance status and history
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    
    if (!session || (role !== 'admin' && role !== 'super_admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await requireTenant();

    // Get remittance settings
    const integration = await prisma.tenantIntegration.findUnique({
      where: { tenantId: tenant.id },
      select: {
        taxRemittanceEnabled: true,
        taxRemittanceSchedule: true,
        taxEscrowAccountId: true,
      },
    });

    // Get remittance history
    const remittances = await prisma.taxRemittance.findMany({
      where: { tenantId: tenant.id },
      orderBy: { periodStart: 'desc' },
      take: 12,
    });

    // Calculate current period summary
    const schedule = (integration?.taxRemittanceSchedule || 'monthly') as 'monthly' | 'quarterly';
    const currentPeriod = getRemittancePeriod(schedule);
    
    let currentPeriodSummary = null;
    try {
      const summary = await calculateTaxCollected(tenant.id, currentPeriod);
      currentPeriodSummary = {
        period: currentPeriod,
        totalTaxCollected: summary.totalTaxCollected,
        orderCount: summary.orderCount,
      };
    } catch (error) {
      console.error('[Tax Remit] Error calculating current period:', error);
    }

    return NextResponse.json({
      enabled: integration?.taxRemittanceEnabled || false,
      schedule: integration?.taxRemittanceSchedule || 'monthly',
      escrowAccountConfigured: !!integration?.taxEscrowAccountId,
      currentPeriod: currentPeriodSummary,
      remittances: remittances.map((r) => ({
        id: r.id,
        periodStart: r.periodStart,
        periodEnd: r.periodEnd,
        totalTaxCollected: r.totalTaxCollected,
        totalTaxRemitted: r.totalTaxRemitted,
        status: r.status,
        remittanceDate: r.remittanceDate,
        remittanceReference: r.remittanceReference,
      })),
    });
  } catch (error: any) {
    console.error('[Tax Remit] GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get tax remittance status' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tax/remit
 * Create and process tax remittance
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    
    if (!session || (role !== 'admin' && role !== 'super_admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await requireTenant();
    const body = await req.json();
    const { action, remittanceId, period } = body;

    if (action === 'create') {
      // Create remittance for specified period
      const remittancePeriod = period
        ? {
            start: new Date(period.start),
            end: new Date(period.end),
            periodType: period.type || 'monthly',
          }
        : getRemittancePeriod(
            (tenant.integrations?.taxRemittanceSchedule || 'monthly') as 'monthly' | 'quarterly'
          );

      const summary = await calculateTaxCollected(tenant.id, remittancePeriod);
      const id = await createTaxRemittance(tenant.id, summary);

      return NextResponse.json({
        success: true,
        remittanceId: id,
        summary,
      });
    }

    if (action === 'process' && remittanceId) {
      // Process existing remittance
      const result = await processTaxRemittance(remittanceId, body.method || 'manual');

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to process remittance' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        reference: result.reference,
      });
    }

    if (action === 'report' && remittanceId) {
      // Generate report
      const report = await generateTaxRemittanceReport(remittanceId);
      return NextResponse.json(report);
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "create", "process", or "report"' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[Tax Remit] POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process tax remittance request' },
      { status: 500 }
    );
  }
}









