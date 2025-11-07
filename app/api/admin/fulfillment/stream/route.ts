import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth/options';
import { requireTenant, getTenantBySlug } from '@/lib/tenant';
import { serializeOrder } from '@/lib/order-serializer';
import { subscribeToOrders, type OrderEvent } from '@/lib/order-events';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'admin') return unauthorized();

  const tenantSlug = request.nextUrl.searchParams.get('tenant');
  const tenant = tenantSlug ? await getTenantBySlug(tenantSlug) : await requireTenant();

  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;

      const send = (payload: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      const setup = async () => {
        const orders = await prisma.order.findMany({
          where: { tenantId: tenant.id },
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
          orderBy: { createdAt: 'desc' },
          take: 100,
        });

        send({ type: 'init', orders: orders.map(serializeOrder) });
      };

      void setup();

      const unsubscribe = subscribeToOrders((event: OrderEvent) => {
        if (event.order && (event as OrderEvent<{ tenantId: string }>).order.tenantId === tenant.id) {
          send(event);
        }
      });

      const close = () => {
        if (closed) return;
        closed = true;
        unsubscribe();
        controller.close();
      };

      request.signal.addEventListener('abort', close);
    },
    cancel() {
      // noop, cleanup handled via abort
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
