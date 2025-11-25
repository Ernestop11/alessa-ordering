import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import prisma from '@/lib/prisma'
import { requireTenant } from '@/lib/tenant'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id
    const tenant = await requireTenant()
    const item = await prisma.menuItem.findUnique({
      where: { id },
      include: { section: true },
    })
    if (!item || item.tenantId !== tenant.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(item)
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch menu item' }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    // Check authentication and role
    const session = await getServerSession(authOptions)
    const role = (session?.user as { role?: string } | undefined)?.role
    if (!session || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id
    const body = await req.json()
    const tenant = await requireTenant()

    const existing = await prisma.menuItem.findUnique({ where: { id } })
    if (!existing || existing.tenantId !== tenant.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const existingGallery = Array.isArray((existing as any).gallery)
      ? ((existing as any).gallery as unknown[]).filter((url): url is string => typeof url === 'string' && url.length > 0)
      : [];
    const nextGallery =
      body.gallery !== undefined
        ? Array.isArray(body.gallery)
          ? body.gallery.filter((url: unknown): url is string => typeof url === 'string' && url.length > 0)
          : existingGallery
        : existingGallery;

    const updatableFields = {
      name: body.name ?? existing.name,
      description: body.description ?? existing.description,
      price: body.price !== undefined ? parseFloat(String(body.price)) : existing.price,
      category: body.category ?? existing.category,
      image: body.image !== undefined ? body.image : existing.image,
      gallery: nextGallery,
      available: body.available !== undefined ? Boolean(body.available) : existing.available,
      isFeatured: body.isFeatured !== undefined ? Boolean(body.isFeatured) : (existing as any).isFeatured ?? false,
      tags: Array.isArray(body.tags) ? body.tags : existing.tags,
      menuSectionId: body.menuSectionId !== undefined ? body.menuSectionId : existing.menuSectionId,
    }

    const updated = await prisma.menuItem.update({
      where: { id },
      data: updatableFields,
    })

    // Revalidate customer-facing pages so menu changes reflect immediately
    revalidatePath('/')
    revalidatePath('/order')
    revalidatePath(`/${tenant.slug}`)
    revalidatePath(`/${tenant.slug}/order`)

    return NextResponse.json(updated)
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update menu item', details: String(err) }, { status: 500 })
  }
}

// Also support PUT for backwards compatibility
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  return PATCH(req, { params })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    // Check authentication and role
    const session = await getServerSession(authOptions)
    const role = (session?.user as { role?: string } | undefined)?.role
    if (!session || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id
    const tenant = await requireTenant()

    const existing = await prisma.menuItem.findUnique({ where: { id } })
    if (!existing || existing.tenantId !== tenant.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.menuItem.delete({ where: { id } })

    // Revalidate customer-facing pages so menu changes reflect immediately
    revalidatePath('/')
    revalidatePath('/order')
    revalidatePath(`/${tenant.slug}`)
    revalidatePath(`/${tenant.slug}/order`)

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete menu item' }, { status: 500 })
  }
}
