import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    
    if (!session || (role !== 'admin' && role !== 'super_admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await requireTenant();

    // Clear Uber Direct credentials
    await prisma.tenantIntegration.update({
      where: { tenantId: tenant.id },
      data: {
        uberClientId: null,
        uberClientSecret: null,
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
  } catch (error: any) {
    console.error('[Uber Direct Disconnect] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to disconnect Uber Direct' },
      { status: 500 }
    );
  }
}





