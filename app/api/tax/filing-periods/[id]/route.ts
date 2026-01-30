import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';

/**
 * GET /api/tax/filing-periods/[id]
 *
 * Get detail of a specific filing period.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tenant = await requireTenant();

    const period = await prisma.taxFilingPeriod.findFirst({
      where: { id: params.id, tenantId: tenant.id },
    });

    if (!period) {
      return NextResponse.json({ error: 'Filing period not found' }, { status: 404 });
    }

    // Get daily set-asides for this period
    const dailySetAsides = await prisma.taxDailySetAside.findMany({
      where: {
        tenantId: tenant.id,
        date: { gte: period.periodStart, lte: period.periodEnd },
      },
      orderBy: { date: 'asc' },
    });

    // Get escrow entries for this period
    const escrowEntries = await prisma.taxEscrowLedger.findMany({
      where: {
        tenantId: tenant.id,
        filingPeriodId: period.id,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      period,
      dailySetAsides,
      escrowEntries,
    });
  } catch (error: any) {
    console.error('[Tax Filing Period Detail]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get filing period' },
      { status: 500 }
    );
  }
}
