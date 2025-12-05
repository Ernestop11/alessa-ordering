import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import prisma from '@/lib/prisma'
import { requireTenant } from '@/lib/tenant'
import { emitMenuUpdate } from '@/lib/ecosystem/communication'

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
      customizationRemovals: Array.isArray(body.customizationRemovals) ? body.customizationRemovals : existing.customizationRemovals,
      customizationAddons: body.customizationAddons !== undefined ? body.customizationAddons : (existing as any).customizationAddons,
      // Time-specific fields
      timeSpecificEnabled: body.timeSpecificEnabled !== undefined ? Boolean(body.timeSpecificEnabled) : (existing as any).timeSpecificEnabled ?? false,
      timeSpecificDays: Array.isArray(body.timeSpecificDays) ? body.timeSpecificDays : (existing as any).timeSpecificDays ?? [],
      timeSpecificStartTime: body.timeSpecificStartTime !== undefined ? body.timeSpecificStartTime : (existing as any).timeSpecificStartTime ?? null,
      timeSpecificEndTime: body.timeSpecificEndTime !== undefined ? body.timeSpecificEndTime : (existing as any).timeSpecificEndTime ?? null,
      timeSpecificPrice: body.timeSpecificPrice !== undefined ? (body.timeSpecificPrice ? parseFloat(String(body.timeSpecificPrice)) : null) : (existing as any).timeSpecificPrice ?? null,
      timeSpecificLabel: body.timeSpecificLabel !== undefined ? body.timeSpecificLabel : (existing as any).timeSpecificLabel ?? null,
    }

    const updated = await prisma.menuItem.update({
      where: { id },
      data: updatableFields,
    })

    // Emit ecosystem event for SMP sync
    try {
      await emitMenuUpdate(tenant.id, 'updated', updated.id, updated.name)
    } catch (err) {
      console.error('[Menu API] Error emitting ecosystem event:', err)
    }

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

    // Emit ecosystem event for SMP sync
    try {
      await emitMenuUpdate(tenant.id, 'deleted', existing.id, existing.name)
    } catch (err) {
      console.error('[Menu API] Error emitting ecosystem event:', err)
    }

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
