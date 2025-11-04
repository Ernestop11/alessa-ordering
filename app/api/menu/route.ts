import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireTenant } from '@/lib/tenant'

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
    const body = await req.json()
    // Expecting: { name, description, price, category, image?, available? }
    const price = parseFloat(String(body.price || 0))
    const tenant = await requireTenant()

    const data = {
      name: body.name,
      description: body.description || '',
      price,
      category: body.category || 'uncategorized',
      image: body.image || null,
      available: body.available === undefined ? true : Boolean(body.available),
      tags: Array.isArray(body.tags) ? body.tags : [],
      tenantId: tenant.id,
      menuSectionId: body.menuSectionId || null,
    }

    const created = await prisma.menuItem.create({
      data,
    })
    return NextResponse.json(created, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create menu item' }, { status: 500 })
  }
}
