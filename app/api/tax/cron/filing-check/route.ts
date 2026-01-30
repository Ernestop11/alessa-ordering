import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkUpcomingDeadlines, ensureFilingPeriods } from '@/lib/tax/filing-notifications';

/**
 * POST /api/tax/cron/filing-check
 *
 * Called by VPS crontab weekly (Monday 8AM).
 * - Ensures filing periods exist for all enrolled tenants
 * - Rolls up daily set-aside totals into filing periods
 * - Checks for approaching deadlines and sends reminders
 *
 * Protected by CRON_SECRET header.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find all tenants with tax auto set-aside enabled
    const integrations = await prisma.tenantIntegration.findMany({
      where: { taxAutoSetAsideEnabled: true },
      select: { tenantId: true },
    });

    // Step 1: Ensure filing periods exist for current + next quarter
    let periodsCreated = 0;
    for (const integration of integrations) {
      try {
        await ensureFilingPeriods(integration.tenantId);
        periodsCreated++;
      } catch (error: any) {
        console.error(
          `[Tax Filing Check] Failed to ensure periods for ${integration.tenantId}:`,
          error
        );
      }
    }

    // Step 2: Roll up daily set-aside totals into active filing periods
    const activePeriods = await prisma.taxFilingPeriod.findMany({
      where: {
        filingStatus: 'accumulating',
        tenantId: { in: integrations.map((i) => i.tenantId) },
      },
    });

    for (const period of activePeriods) {
      try {
        const setAsides = await prisma.taxDailySetAside.findMany({
          where: {
            tenantId: period.tenantId,
            date: { gte: period.periodStart, lte: period.periodEnd },
          },
        });

        const totalTaxCollected = setAsides.reduce(
          (sum, s) => sum + s.totalTaxCollected,
          0
        );
        const totalEscrowBalance = setAsides
          .filter((s) => s.escrowTransferStatus === 'transferred')
          .reduce((sum, s) => sum + s.totalTaxCollected, 0);

        // Check if period has ended — if so, mark as ready_to_file
        const now = new Date();
        const periodEnded = now > period.periodEnd;

        await prisma.taxFilingPeriod.update({
          where: { id: period.id },
          data: {
            totalTaxCollected: Math.round(totalTaxCollected * 100) / 100,
            totalEscrowBalance: Math.round(totalEscrowBalance * 100) / 100,
            filingStatus: periodEnded ? 'ready_to_file' : 'accumulating',
          },
        });
      } catch (error: any) {
        console.error(
          `[Tax Filing Check] Failed to update period ${period.id}:`,
          error
        );
      }
    }

    // Step 3: Check upcoming deadlines and send reminders
    const reminderResults = await checkUpcomingDeadlines();

    console.log(
      `[Tax Filing Check] Tenants: ${integrations.length}, Periods updated: ${activePeriods.length}, Reminders sent: ${reminderResults.reminders}`
    );

    return NextResponse.json({
      tenantsChecked: integrations.length,
      periodsCreated,
      periodsUpdated: activePeriods.length,
      reminders: reminderResults,
    });
  } catch (error: any) {
    console.error('[Tax Filing Check] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to run filing check' },
      { status: 500 }
    );
  }
}
