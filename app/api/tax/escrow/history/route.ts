import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import { getEscrowHistory } from '@/lib/tax/escrow-service';

/**
 * GET /api/tax/escrow/history
 *
 * Returns paginated escrow ledger entries for the authenticated tenant.
 * Query params: page, limit, startDate, endDate, entryType
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
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : undefined;
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : undefined;
    const entryType = searchParams.get('entryType') || undefined;

    const result = await getEscrowHistory(tenant.id, {
      page,
      limit,
      startDate,
      endDate,
      entryType,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Tax Escrow History]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get escrow history' },
      { status: 500 }
    );
  }
}
