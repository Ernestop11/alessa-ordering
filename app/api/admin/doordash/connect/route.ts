import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tenant = await requireTenant();
    const body = await req.json();
    const { developerId, clientId, clientSecret } = body;

    // Get current paymentConfig or create empty object
    const currentPaymentConfig = (tenant.integrations?.paymentConfig as Record<string, any>) || {};

    // Update paymentConfig with DoorDash credentials
    const updatedPaymentConfig = {
      ...currentPaymentConfig,
      doordash: {
        developerId: developerId || '',
        clientId: clientId || '',
        clientSecret: clientSecret || '',
      },
    };

    // Upsert the integration with DoorDash credentials in paymentConfig
    await prisma.tenantIntegration.upsert({
      where: { tenantId: tenant.id },
      create: {
        tenantId: tenant.id,
        paymentConfig: updatedPaymentConfig,
        doorDashStoreId: clientId || null, // Use clientId as storeId for demo
      },
      update: {
        paymentConfig: updatedPaymentConfig,
        doorDashStoreId: clientId || null,
      },
    });

    // Log the connection
    await prisma.integrationLog.create({
      data: {
        tenantId: tenant.id,
        source: 'doordash',
        level: 'info',
        message: 'DoorDash credentials saved (demo mode)',
        payload: {
          developerId: developerId || '',
          clientId: clientId || '',
        },
      },
    });

    return NextResponse.json({
      success: true,
      connected: true,
    });
  } catch (error) {
    console.error('[DoorDash Connect] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to connect DoorDash' },
      { status: 500 }
    );
  }
}

