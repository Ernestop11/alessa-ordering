import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';

/**
 * POST /api/tax/filing-periods/[id]/mark-filed
 *
 * Mark a filing period as filed (manual confirmation after submitting to CDTFA).
 * Optionally provide a filing reference/confirmation number.
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

    if (period.filingStatus === 'filed' || period.filingStatus === 'confirmed') {
      return NextResponse.json({ error: 'Period already filed' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { filingReference, notes } = body;

    const updated = await prisma.taxFilingPeriod.update({
      where: { id: period.id },
      data: {
        filingStatus: 'filed',
        filedAt: new Date(),
        filingReference: filingReference || null,
        notes: notes || period.notes,
      },
    });

    return NextResponse.json({ period: updated });
  } catch (error: any) {
    console.error('[Tax Filing Mark Filed]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to mark as filed' },
      { status: 500 }
    );
  }
}
