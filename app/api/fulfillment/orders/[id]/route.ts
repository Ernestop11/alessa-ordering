import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth/options';
import { requireTenant } from '@/lib/tenant';
import { emitOrderEvent } from '@/lib/order-events';
import { serializeOrder } from '@/lib/order-serializer';

interface Body {
  status?: string;
}

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || (role !== 'admin' && role !== 'super_admin')) return unauthorized();

  const { status }: Body = await request.json();
  if (!status) {
    return NextResponse.json({ error: 'status is required' }, { status: 400 });
  }

  const existing = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
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

  if (!existing) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (role === 'admin') {
    const tenant = await requireTenant();
    if (existing.tenantId !== tenant.id) {
      return unauthorized();
    }
  }

  const updated = await prisma.order.update({
    where: { id: existing.id },
    data: { status },
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

  emitOrderEvent({
    type: 'order.updated',
    order: serializeOrder(updated),
  });

  return NextResponse.json(serializeOrder(updated));
}
