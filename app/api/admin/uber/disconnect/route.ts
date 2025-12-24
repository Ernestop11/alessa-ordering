import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';
import { clearUberTokenCache } from '@/lib/uber/auth';

/**
 * Disconnect Uber Direct Account
 *
 * Clears all Uber Direct credentials for the tenant
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;

    if (!session || (role !== 'admin' && role !== 'super_admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await requireTenant();

    // Clear cached token for this tenant
    clearUberTokenCache(tenant.id);

    // Clear Uber Direct credentials
    await prisma.tenantIntegration.update({
      where: { tenantId: tenant.id },
      data: {
        uberClientId: null,
        uberClientSecret: null,
        uberCustomerId: null,
        uberSandbox: null,
      },
    });

    await prisma.integrationLog.create({
      data: {
        tenantId: tenant.id,
        source: 'uber',
        message: 'Uber Direct account disconnected',
      },
    });

    return NextResponse.json({
      success: true,
      connected: false,
    });
  } catch (error: unknown) {
    console.error('[Uber Direct Disconnect] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to disconnect Uber Direct';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

















