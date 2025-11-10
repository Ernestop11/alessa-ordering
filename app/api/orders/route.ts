import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireTenant } from '@/lib/tenant'
import { emitOrderEvent } from '@/lib/order-events'
import { serializeOrder } from '@/lib/order-serializer'
import { autoPrintOrder } from '@/lib/printer-dispatcher'
import { orderStatusUpdateSchema } from '@/lib/validation/orders'
import { validateRequestBody } from '@/lib/validation/validateRequest'

export async function GET() {
  try {
    const tenant = await requireTenant()
    const orders = await prisma.order.findMany({
      where: { tenantId: tenant.id },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(orders)
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  return NextResponse.json({ error: 'Orders are finalized after Stripe payment confirmation.' }, { status: 405 })
}

export async function PATCH(req: Request) {
  try {
    const validation = await validateRequestBody(req, orderStatusUpdateSchema)
    if (!validation.success) {
      return validation.response
    }
    const body = validation.data

    const tenant = await requireTenant()

    const existing = await prisma.order.findUnique({
      where: { id: body.orderId },
      select: { id: true, tenantId: true },
    })

    if (!existing || existing.tenantId !== tenant.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const updated = await prisma.order.update({
      where: { id: body.orderId },
      data: { status: body.status },
    })

    const orderWithItems = await prisma.order.findFirst({
      where: { id: updated.id, tenantId: tenant.id },
      include: {
        items: {
          include: {
            menuItem: true,
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
    })

    if (!orderWithItems) {
      return NextResponse.json({ error: 'Failed to fetch updated order' }, { status: 500 })
    }

    const serialized = serializeOrder(orderWithItems)

    if (orderWithItems.status?.toLowerCase() === 'confirmed') {
      try {
        await autoPrintOrder(serialized, { reason: 'order.confirmed' })
      } catch (error) {
        console.error('[printer] Auto-print on confirm failed', error)
      }
    }

    emitOrderEvent({
      type: 'order.updated',
      order: serialized,
    })

    return NextResponse.json(orderWithItems)
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}
