import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireTenant } from '@/lib/tenant'
import { menuItemCreateSchema } from '@/lib/validation/menu'
import { validateRequestBody } from '@/lib/validation/validateRequest'

export async function GET() {
  try {
    const tenant = await requireTenant()
    const items = await prisma.menuItem.findMany({
      where: { tenantId: tenant.id },
      include: { section: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(items)
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const validation = await validateRequestBody(req, menuItemCreateSchema)
    if (!validation.success) {
      return validation.response
    }

    const tenant = await requireTenant()
    const body = validation.data

    const gallery = Array.isArray(body.gallery)
      ? body.gallery.filter((url: unknown): url is string => typeof url === 'string' && url.trim().length > 0)
      : []

    const created = await prisma.menuItem.create({
      data: {
        name: body.name,
        description: body.description ?? '',
        price: body.price,
        category: body.category || 'uncategorized',
        image: body.image ?? null,
        gallery,
        available: body.available ?? true,
        isFeatured: body.isFeatured ?? false,
        tags: Array.isArray(body.tags) ? body.tags : [],
        tenantId: tenant.id,
        menuSectionId: body.menuSectionId ?? null,
      },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create menu item' }, { status: 500 })
  }
}
