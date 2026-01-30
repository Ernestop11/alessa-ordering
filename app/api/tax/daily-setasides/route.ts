import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import { getDailySetAsides } from '@/lib/tax/escrow-service';

/**
 * GET /api/tax/daily-setasides
 *
 * Returns daily tax set-aside records for the authenticated tenant.
 * Query params: startDate, endDate, page, limit
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

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '31', 10);
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : undefined;
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : undefined;

    const result = await getDailySetAsides(tenant.id, {
      startDate,
      endDate,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Tax Daily Set-Asides]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get daily set-asides' },
      { status: 500 }
    );
  }
}
