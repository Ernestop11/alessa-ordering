import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth/options';
import { serializeOrder } from '@/lib/order-serializer';
import { subscribeToOrders, type OrderEvent } from '@/lib/order-events';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'super_admin') return unauthorized();

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
          take: 200,
        });

        send({ type: 'init', orders: orders.map(serializeOrder) });
      };

      void setup();

      const unsubscribe = subscribeToOrders((event: OrderEvent) => {
        send(event);
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
      // cleanup handled via abort
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
