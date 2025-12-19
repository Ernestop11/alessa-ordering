import { NextResponse } from 'next/server';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';
import { isUberDirectConfiguredForTenant } from '@/lib/uber/auth';

/**
 * Get Uber Direct connection status for the current tenant
 */
export async function GET() {
  try {
    const tenant = await requireTenant();

    const integration = await prisma.tenantIntegration.findUnique({
      where: { tenantId: tenant.id },
      select: {
        uberClientId: true,
        uberClientSecret: true,
        uberCustomerId: true,
        uberSandbox: true,
      },
    });

    // Fully connected means all three credentials are present
    const connected = !!(
      integration?.uberClientId &&
      integration?.uberClientSecret &&
      integration?.uberCustomerId
    );

    // Check if using global fallback credentials
    const usingGlobalFallback = !connected && isUberDirectConfiguredForTenant(integration);

    return NextResponse.json({
      connected,
      usingGlobalFallback,
      clientId: connected
        ? integration?.uberClientId?.substring(0, 10) + '...'
        : null,
      customerId: connected
        ? integration?.uberCustomerId?.substring(0, 10) + '...'
        : null,
      sandbox: integration?.uberSandbox ?? true,
    });
  } catch (error: unknown) {
    console.error('[Uber Direct Status] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to check Uber Direct status';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}















