import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';

export async function GET() {
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

    const connected = Boolean(integration?.doorDashStoreId);

    return NextResponse.json({
      connected,
      storeId: integration?.doorDashStoreId || null,
      oauthToken: integration?.doorDashOAuthToken || null,
    });
  } catch (error) {
    console.error('[DoorDash Status] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check DoorDash status' },
      { status: 500 }
    );
  }
}

