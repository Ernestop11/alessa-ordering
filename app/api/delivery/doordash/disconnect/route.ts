import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/delivery/doordash/disconnect
 * 
 * Disconnects DoorDash Drive by clearing credentials
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await requireTenant();

    const integration = await prisma.tenantIntegration.findUnique({
      where: { tenantId: tenant.id },
    });

    const paymentConfig = (integration?.paymentConfig as any) || {};
    delete paymentConfig.doordash;

    await prisma.tenantIntegration.update({
      where: { tenantId: tenant.id },
      data: {
        doordashBusinessId: null,
        doordashOnboardingStatus: 'not_connected',
        paymentConfig: paymentConfig,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[doordash-disconnect] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to disconnect' },
      { status: 500 }
    );
  }
}

