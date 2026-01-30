import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import { getEscrowBalance } from '@/lib/tax/escrow-service';

/**
 * GET /api/tax/escrow/balance
 *
 * Returns the current tax escrow balance for the authenticated tenant.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tenant = await requireTenant();
    const balance = await getEscrowBalance(tenant.id);

    return NextResponse.json({
      tenantId: tenant.id,
      balance: Math.round(balance * 100) / 100,
    });
  } catch (error: any) {
    console.error('[Tax Escrow Balance]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get escrow balance' },
      { status: 500 }
    );
  }
}
