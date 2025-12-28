import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';
import { autoDispatchOrder } from '@/lib/printer/auto-dispatch';
import { serializeOrder } from '@/lib/order-serializer';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  // Allow both admin and super_admin
  if (!session || (role !== 'admin' && role !== 'super_admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tenant = await requireTenant();
    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            menuItem: {
              select: {
                name: true,
              },
            },
          },
        },
        customer: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            primaryColor: true,
            secondaryColor: true,
          },
        },
      },
    });

    if (!order || order.tenantId !== tenant.id) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Get printer config from TenantIntegration table (correct location)
    const tenantIntegration = await prisma.tenantIntegration.findUnique({
      where: { tenantId: tenant.id },
      select: { printerConfig: true },
    });

    const printerConfig = (tenantIntegration?.printerConfig as {
      type?: 'bluetooth' | 'network' | 'cloud' | 'none';
      name?: string;
      ipAddress?: string;
      port?: number;
      deviceId?: string;
    }) || null;

    // If no printer configured, fall back to browser print (don't error)
    if (!printerConfig || printerConfig.type === 'none') {
      console.log('[Print] No printer configured, returning success for browser print fallback');
      return NextResponse.json({
        success: false,
        fallbackToBrowser: true,
        error: 'No printer configured. Using browser print.',
      });
    }

    const serializedOrder = serializeOrder(order, null);

    // Handle network printer - send directly to printer IP
    if (printerConfig.type === 'network' && printerConfig.ipAddress) {
      const result = await autoDispatchOrder(serializedOrder, {
        type: 'network',
        enabled: true,
        config: {
          ipAddress: printerConfig.ipAddress,
          port: printerConfig.port || 9100,
        },
      });

      if (result.success) {
        await prisma.integrationLog.create({
          data: {
            tenantId: tenant.id,
            source: 'printer',
            level: 'info',
            message: 'Order printed via network',
            payload: {
              orderId: order.id,
              jobId: result.jobId,
              printerId: printerConfig.ipAddress,
            },
          },
        });
      }

      return NextResponse.json(result);
    }

    // For other printer types, let client-side handle it
    return NextResponse.json({
      success: false,
      fallbackToBrowser: true,
      printerType: printerConfig.type,
      error: `${printerConfig.type} printer requires client-side printing`,
    });
  } catch (error: any) {
    console.error('[Print] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to print order' },
      { status: 500 }
    );
  }
}
