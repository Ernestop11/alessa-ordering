import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';
import { initiateAutoPayment } from '@/lib/tax/auto-pay-service';

/**
 * POST /api/tax/filing-periods/[id]/pay
 *
 * Initiate ACH payment for a filed tax period.
 */
export async function POST(
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

    const result = await initiateAutoPayment(period.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const updated = await prisma.taxFilingPeriod.findUnique({
      where: { id: period.id },
    });

    return NextResponse.json({
      period: updated,
      paymentId: result.paymentId,
    });
  } catch (error: any) {
    console.error('[Tax Pay]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initiate payment' },
      { status: 500 }
    );
  }
}
