import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/delivery/uber/disconnect
 * 
 * Disconnects Uber Direct by clearing OAuth tokens
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await requireTenant();

    await prisma.tenantIntegration.update({
      where: { tenantId: tenant.id },
      data: {
        uberOAuthAccessToken: null,
        uberOAuthRefreshToken: null,
        uberOAuthExpiresAt: null,
        uberMerchantId: null,
        uberOnboardingStatus: 'not_connected',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[uber-disconnect] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to disconnect' },
      { status: 500 }
    );
  }
}

