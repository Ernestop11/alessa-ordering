import { NextRequest, NextResponse } from 'next/server';
import { pollPaymentStatuses } from '@/lib/tax/auto-pay-service';

/**
 * POST /api/tax/cron/payment-status
 *
 * Called by VPS crontab daily at 10AM.
 * Polls Remitian for ACH payment status updates on pending payments.
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

    const result = await pollPaymentStatuses();

    console.log(
      `[Tax Cron] Payment status check: ${result.checked} checked, ${result.updated} updated, ${result.errors.length} errors`
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Tax Cron] payment-status error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check payment statuses' },
      { status: 500 }
    );
  }
}
