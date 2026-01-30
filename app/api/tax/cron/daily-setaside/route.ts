import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { recordDailySetAside } from '@/lib/tax/escrow-service';

/**
 * POST /api/tax/cron/daily-setaside
 *
 * Called by VPS crontab daily at 2AM.
 * Calculates yesterday's tax from POS + online orders for all tenants
 * with taxAutoSetAsideEnabled, and records it in the escrow ledger.
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

    // Allow overriding the date (for backfills), default to yesterday
    const dateParam = request.nextUrl.searchParams.get('date');
    let targetDate: Date;
    if (dateParam) {
      targetDate = new Date(dateParam);
    } else {
      targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - 1);
    }
    targetDate.setHours(0, 0, 0, 0);

    // Find all tenants with tax auto set-aside enabled
    const integrations = await prisma.tenantIntegration.findMany({
      where: { taxAutoSetAsideEnabled: true },
      select: { tenantId: true },
    });

    if (integrations.length === 0) {
      return NextResponse.json({
        message: 'No tenants with tax auto set-aside enabled',
        date: targetDate.toISOString().split('T')[0],
        processed: 0,
      });
    }

    const results: Array<{
      tenantId: string;
      status: 'success' | 'error';
      totalTaxCollected?: number;
      error?: string;
    }> = [];

    for (const integration of integrations) {
      try {
        const { setAside } = await recordDailySetAside(
          integration.tenantId,
          targetDate
        );

        results.push({
          tenantId: integration.tenantId,
          status: 'success',
          totalTaxCollected: setAside.totalTaxCollected,
        });
      } catch (error: any) {
        console.error(
          `[Tax Cron] Failed for tenant ${integration.tenantId}:`,
          error
        );
        results.push({
          tenantId: integration.tenantId,
          status: 'error',
          error: error.message || 'Unknown error',
        });
      }
    }

    const successCount = results.filter((r) => r.status === 'success').length;
    const errorCount = results.filter((r) => r.status === 'error').length;
    const totalTax = results
      .filter((r) => r.status === 'success')
      .reduce((sum, r) => sum + (r.totalTaxCollected ?? 0), 0);

    console.log(
      `[Tax Cron] Daily set-aside for ${targetDate.toISOString().split('T')[0]}: ${successCount} success, ${errorCount} errors, $${totalTax.toFixed(2)} total tax`
    );

    return NextResponse.json({
      date: targetDate.toISOString().split('T')[0],
      processed: integrations.length,
      successCount,
      errorCount,
      totalTaxCollected: Math.round(totalTax * 100) / 100,
      results,
    });
  } catch (error: any) {
    console.error('[Tax Cron] daily-setaside error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to run daily set-aside' },
      { status: 500 }
    );
  }
}
