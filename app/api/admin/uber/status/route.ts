import { NextResponse } from 'next/server';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const tenant = await requireTenant();
    
    const integration = await prisma.tenantIntegration.findUnique({
      where: { tenantId: tenant.id },
      select: {
        uberClientId: true,
        uberClientSecret: true,
        uberSandbox: true,
      },
    });

    const connected = !!(integration?.uberClientId && integration?.uberClientSecret);

    return NextResponse.json({
      connected,
      clientId: connected ? integration?.uberClientId : null,
      sandbox: integration?.uberSandbox ?? false,
    });
  } catch (error: any) {
    console.error('[Uber Direct Status] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check Uber Direct status' },
      { status: 500 }
    );
  }
}







