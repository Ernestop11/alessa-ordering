import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';
import { getEscrowBalance } from '@/lib/tax/escrow-service';

/**
 * GET /api/tax/dashboard
 *
 * Returns aggregated dashboard data for the tax automation system.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tenant = await requireTenant();
    const integration = await prisma.tenantIntegration.findUnique({
      where: { tenantId: tenant.id },
    });

    // Escrow balance
    const escrowBalance = await getEscrowBalance(tenant.id);

    // Current quarter info
    const now = new Date();
    const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);
    const currentYear = now.getFullYear();

    // Current filing period
    const currentPeriod = await prisma.taxFilingPeriod.findFirst({
      where: {
        tenantId: tenant.id,
        year: currentYear,
        quarter: currentQuarter,
      },
    });

    // Next filing deadline
    const nextDeadline = await prisma.taxFilingPeriod.findFirst({
      where: {
        tenantId: tenant.id,
        filingDeadline: { gte: now },
        filingStatus: { in: ['accumulating', 'ready_to_file', 'filing_prepared'] },
      },
      orderBy: { filingDeadline: 'asc' },
    });

    // Tax collected this quarter
    const quarterStart = new Date(currentYear, (currentQuarter - 1) * 3, 1);
    const quarterEnd = new Date(currentYear, currentQuarter * 3, 0);

    const quarterSetAsides = await prisma.taxDailySetAside.findMany({
      where: {
        tenantId: tenant.id,
        date: { gte: quarterStart, lte: quarterEnd },
      },
    });

    const quarterTaxCollected = quarterSetAsides.reduce(
      (sum, s) => sum + s.totalTaxCollected,
      0
    );
    const quarterPosCount = quarterSetAsides.reduce(
      (sum, s) => sum + s.posTransactionCount,
      0
    );
    const quarterOnlineCount = quarterSetAsides.reduce(
      (sum, s) => sum + s.onlineOrderCount,
      0
    );

    // Recent escrow activity
    const recentActivity = await prisma.taxEscrowLedger.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // All filing periods
    const filingPeriods = await prisma.taxFilingPeriod.findMany({
      where: { tenantId: tenant.id },
      orderBy: [{ year: 'desc' }, { quarter: 'desc' }],
      take: 8,
    });

    // Days until next deadline
    let daysUntilDeadline: number | null = null;
    if (nextDeadline) {
      daysUntilDeadline = Math.ceil(
        (nextDeadline.filingDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    return NextResponse.json({
      isEnabled: integration?.taxAutoSetAsideEnabled ?? false,
      escrowBalance: Math.round(escrowBalance * 100) / 100,
      currentQuarter: {
        quarter: currentQuarter,
        year: currentYear,
        taxCollected: Math.round(quarterTaxCollected * 100) / 100,
        posTransactions: quarterPosCount,
        onlineOrders: quarterOnlineCount,
        daysTracked: quarterSetAsides.length,
      },
      nextDeadline: nextDeadline
        ? {
            id: nextDeadline.id,
            quarter: nextDeadline.quarter,
            year: nextDeadline.year,
            filingDeadline: nextDeadline.filingDeadline,
            filingStatus: nextDeadline.filingStatus,
            paymentStatus: nextDeadline.paymentStatus,
            daysUntil: daysUntilDeadline,
          }
        : null,
      currentPeriod: currentPeriod
        ? {
            id: currentPeriod.id,
            filingStatus: currentPeriod.filingStatus,
            totalTaxCollected: currentPeriod.totalTaxCollected,
            totalEscrowBalance: currentPeriod.totalEscrowBalance,
          }
        : null,
      recentActivity,
      filingPeriods,
      config: {
        taxRate: integration?.defaultTaxRate ?? 0.0825,
        filingState: integration?.taxFilingState ?? 'CA',
        filingFrequency: integration?.taxFilingFrequency ?? 'quarterly',
        autoPayEnabled: integration?.taxAutoPayEnabled ?? false,
      },
    });
  } catch (error: any) {
    console.error('[Tax Dashboard]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get dashboard data' },
      { status: 500 }
    );
  }
}
