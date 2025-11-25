import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';

export async function POST() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tenant = await requireTenant();
    const integration = await prisma.tenantIntegration.findUnique({
      where: { tenantId: tenant.id },
    });

    if (!integration || !integration.doorDashStoreId) {
      return NextResponse.json({ error: 'DoorDash is not connected' }, { status: 400 });
    }

    // Remove DoorDash connection
    await prisma.tenantIntegration.update({
      where: { tenantId: tenant.id },
      data: {
        doorDashStoreId: null,
        doorDashOAuthToken: null,
      },
    });

    // Log the disconnection
    await prisma.integrationLog.create({
      data: {
        tenantId: tenant.id,
        source: 'doordash',
        level: 'info',
        message: 'DoorDash store disconnected',
        payload: {
          previousStoreId: integration.doorDashStoreId,
        },
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('[DoorDash Disconnect] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to disconnect DoorDash' },
      { status: 500 }
    );
  }
}

