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

  if (!session || role !== 'admin') {
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

    // Get printer config from tenant integrations
    const printerConfig = tenant.integrations?.printerConfig as {
      type?: 'bluetooth' | 'network' | 'cloud';
      enabled?: boolean;
      config?: Record<string, unknown>;
    } || {
      type: 'bluetooth',
      enabled: false,
      config: {},
    };

    if (!printerConfig.enabled) {
      return NextResponse.json({
        success: false,
        error: 'Printer not configured. Please enable printer in settings.',
      });
    }

    const serializedOrder = serializeOrder(order, null);
    const result = await autoDispatchOrder(serializedOrder, {
      type: printerConfig.type || 'bluetooth',
      enabled: printerConfig.enabled || false,
      config: printerConfig.config || {},
    });

    if (result.success) {
      // Log print job
      await prisma.integrationLog.create({
        data: {
          tenantId: tenant.id,
          source: 'printer',
          level: 'info',
          message: 'Order printed',
          payload: {
            orderId: order.id,
            jobId: result.jobId,
            printerId: result.printerId,
          },
        },
      });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[Print] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to print order' },
      { status: 500 }
    );
  }
}
