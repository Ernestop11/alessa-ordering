import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';

/**
 * GET /api/tax/filing-periods
 *
 * List all filing periods for the authenticated tenant.
 * Query params: year, state, status
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tenant = await requireTenant();
    const searchParams = request.nextUrl.searchParams;

    const where: any = { tenantId: tenant.id };
    if (searchParams.get('year')) where.year = parseInt(searchParams.get('year')!, 10);
    if (searchParams.get('state')) where.state = searchParams.get('state');
    if (searchParams.get('status')) where.filingStatus = searchParams.get('status');

    const periods = await prisma.taxFilingPeriod.findMany({
      where,
      orderBy: [{ year: 'desc' }, { quarter: 'desc' }],
    });

    return NextResponse.json({ periods });
  } catch (error: any) {
    console.error('[Tax Filing Periods GET]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get filing periods' },
      { status: 500 }
    );
  }
}
