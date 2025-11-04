import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireTenant } from '@/lib/tenant'

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
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(orders)
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const tenant = await requireTenant()
    // Expecting body: { items: [{menuItemId, quantity, price}], subtotalAmount, totalAmount, taxAmount, deliveryFee, tipAmount, platformFee, fulfillmentMethod, deliveryPartner?, paymentMethod?, ... }
    const subtotalAmount = parseFloat(String(body.subtotalAmount || 0))
    const totalAmount = parseFloat(String(body.totalAmount || subtotalAmount))
    const taxAmount = parseFloat(String(body.taxAmount || 0))
    const deliveryFee = parseFloat(String(body.deliveryFee || 0))
    const tipAmount = parseFloat(String(body.tipAmount || 0))
    const platformFee = parseFloat(String(body.platformFee || 0))
    const fulfillmentMethod = body.fulfillmentMethod === 'delivery' ? 'delivery' : 'pickup'
    const deliveryPartner = body.deliveryPartner || (fulfillmentMethod === 'delivery' ? 'doordash' : null)
    const paymentMethod = body.paymentMethod || null

    let customerId: string | null = null
    if (body.customerEmail || body.customerPhone) {
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          tenantId: tenant.id,
          OR: [
            body.customerEmail ? { email: body.customerEmail } : undefined,
            body.customerPhone ? { phone: body.customerPhone } : undefined,
          ].filter(Boolean) as any,
        },
      })

      if (existingCustomer) {
        customerId = existingCustomer.id
        await prisma.customer.update({
          where: { id: existingCustomer.id },
          data: {
            name: body.customerName || existingCustomer.name,
            email: body.customerEmail || existingCustomer.email,
            phone: body.customerPhone || existingCustomer.phone,
          },
        })
      } else {
        const createdCustomer = await prisma.customer.create({
          data: {
            tenantId: tenant.id,
            name: body.customerName || null,
            email: body.customerEmail || null,
            phone: body.customerPhone || null,
          },
        })
        customerId = createdCustomer.id
      }
    }

    const order = await prisma.order.create({
      data: {
        subtotalAmount,
        totalAmount,
        taxAmount,
        deliveryFee,
        tipAmount,
        platformFee,
        fulfillmentMethod,
        deliveryPartner,
        paymentMethod,
        customerName: body.customerName || null,
        customerEmail: body.customerEmail || null,
        customerPhone: body.customerPhone || null,
        notes: body.notes || null,
        status: 'pending',
        tenantId: tenant.id,
        customerId,
      },
    })

    // Create order items (link to orderId)
    if (Array.isArray(body.items)) {
      for (const it of body.items) {
        const menuItem = await prisma.menuItem.findUnique({
          where: { id: it.menuItemId },
          select: { tenantId: true },
        })

        if (!menuItem || menuItem.tenantId !== tenant.id) {
          continue
        }

        await prisma.orderItem.create({
          data: {
            menuItemId: it.menuItemId,
            orderId: order.id,
            quantity: Number(it.quantity || 1),
            price: parseFloat(String(it.price || 0)),
            notes: it.notes || null,
            tenantId: tenant.id,
          },
        })
      }
    }

    if (customerId && tenant.settings?.membershipProgram) {
      const program = tenant.settings.membershipProgram as any;
      if (program.enabled !== false) {
        const rate = Number(program.pointsPerDollar ?? 0);
        if (Number.isFinite(rate) && rate > 0) {
          const pointsEarned = Math.round(totalAmount * rate);
          if (pointsEarned > 0) {
            const customer = await prisma.customer.findUnique({
              where: { id: customerId },
              select: { loyaltyPoints: true },
            });

            if (customer) {
              const currentPoints = customer.loyaltyPoints ?? 0;
              const newPoints = currentPoints + pointsEarned;
              let membershipTier: string | null = null;

              if (Array.isArray(program.tiers)) {
                const sortedTiers = [...program.tiers].sort((a: any, b: any) => {
                  const aOrder = Number.isFinite(a?.sortOrder) ? a.sortOrder : a?.threshold ?? 0;
                  const bOrder = Number.isFinite(b?.sortOrder) ? b.sortOrder : b?.threshold ?? 0;
                  return aOrder - bOrder;
                });

                const achievedTier = sortedTiers.filter((tier: any) => (tier?.threshold ?? 0) <= newPoints).pop();
                if (achievedTier) {
                  membershipTier = achievedTier.id || achievedTier.name || null;
                }
              }

              await prisma.customer.update({
                where: { id: customerId },
                data: {
                  loyaltyPoints: newPoints,
                  membershipTier,
                },
              });
            }
          }
        }
      }
    }

    const created = await prisma.order.findFirst({
      where: { id: order.id, tenantId: tenant.id },
      include: {
        items: {
          include: {
            menuItem: true,
          },
        },
        customer: true,
      },
    })
    if (!created) {
      return NextResponse.json({ error: 'Failed to load created order' }, { status: 500 })
    }
    return NextResponse.json(created, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create order', details: String(err) }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const tenant = await requireTenant()
    // Expecting { orderId, status }
    if (!body.orderId || !body.status) {
      return NextResponse.json({ error: 'orderId and status required' }, { status: 400 })
    }

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
      },
    })

    if (!orderWithItems) {
      return NextResponse.json({ error: 'Failed to fetch updated order' }, { status: 500 })
    }

    return NextResponse.json(orderWithItems)
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}
