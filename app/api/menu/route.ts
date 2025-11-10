import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
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
    // Check authentication and role
    const session = await getServerSession(authOptions)
    const role = (session?.user as { role?: string } | undefined)?.role
    if (!session || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    // Expecting: { name, description, price, category, image?, available? }
    const price = parseFloat(String(body.price || 0))
    const tenant = await requireTenant()
    const gallery = Array.isArray(body.gallery)
      ? body.gallery.filter((url: unknown): url is string => typeof url === 'string' && url.trim().length > 0)
      : []

    const data = {
      name: body.name,
      description: body.description || '',
      price,
      category: body.category || 'uncategorized',
      image: body.image || null,
      gallery,
      available: body.available === undefined ? true : Boolean(body.available),
      isFeatured: body.isFeatured === undefined ? false : Boolean(body.isFeatured),
      tags: Array.isArray(body.tags) ? body.tags : [],
      tenantId: tenant.id,
      menuSectionId: body.menuSectionId || null,
    }

    const created = await prisma.menuItem.create({
      data,
    })

    // Revalidate customer-facing pages so menu changes reflect immediately
    revalidatePath('/')
    revalidatePath('/order')
    revalidatePath(`/${tenant.slug}`)
    revalidatePath(`/${tenant.slug}/order`)

    return NextResponse.json(created, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create menu item' }, { status: 500 })
  }
}
