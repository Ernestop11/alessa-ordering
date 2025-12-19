import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// GET - Fetch a single block
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; blockId: string }> | { id: string; blockId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as { role?: string } | undefined)?.role
    if (!session || role !== 'super_admin') {
      return unauthorized()
    }

    const { id, blockId } = await Promise.resolve(params)

    const block = await prisma.tenantBlock.findFirst({
      where: {
        id: blockId,
        templateId: id,
      },
      include: {
        menuItems: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                price: true,
                image: true,
                description: true,
              },
            },
          },
          orderBy: { displayOrder: 'asc' },
        },
      },
    })

    if (!block) {
      return NextResponse.json({ error: 'Block not found' }, { status: 404 })
    }

    return NextResponse.json({ data: block })
  } catch (error: any) {
    console.error('[Template Block API] GET Error:', error)
    return NextResponse.json({ error: 'Failed to fetch block', details: error.message }, { status: 500 })
  }
}

// PUT - Update a block
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; blockId: string }> | { id: string; blockId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as { role?: string } | undefined)?.role
    if (!session || role !== 'super_admin') {
      return unauthorized()
    }

    const { id, blockId } = await Promise.resolve(params)
    const body = await request.json()
    const { type, title, subtitle, badgeText, ctaText, ctaLink, config, position, active } = body

    // Build update data - only include defined fields
    const updateData: Record<string, unknown> = {}
    if (type !== undefined) updateData.type = type
    if (title !== undefined) updateData.title = title
    if (subtitle !== undefined) updateData.subtitle = subtitle
    if (badgeText !== undefined) updateData.badgeText = badgeText
    if (ctaText !== undefined) updateData.ctaText = ctaText
    if (ctaLink !== undefined) updateData.ctaLink = ctaLink
    if (config !== undefined) updateData.config = config
    if (position !== undefined) updateData.position = position
    if (active !== undefined) updateData.active = active

    const block = await prisma.tenantBlock.update({
      where: { id: blockId },
      data: updateData,
      include: {
        menuItems: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                price: true,
                image: true,
              },
            },
          },
          orderBy: { displayOrder: 'asc' },
        },
      },
    })

    // Verify block belongs to this template
    if (block.templateId !== id) {
      return NextResponse.json({ error: 'Block does not belong to this template' }, { status: 400 })
    }

    return NextResponse.json({ data: block })
  } catch (error: any) {
    console.error('[Template Block API] PUT Error:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Block not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to update block', details: error.message }, { status: 500 })
  }
}

// DELETE - Delete a block
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; blockId: string }> | { id: string; blockId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as { role?: string } | undefined)?.role
    if (!session || role !== 'super_admin') {
      return unauthorized()
    }

    const { id, blockId } = await Promise.resolve(params)

    // Verify block belongs to template
    const block = await prisma.tenantBlock.findFirst({
      where: {
        id: blockId,
        templateId: id,
      },
    })

    if (!block) {
      return NextResponse.json({ error: 'Block not found' }, { status: 404 })
    }

    await prisma.tenantBlock.delete({
      where: { id: blockId },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Template Block API] DELETE Error:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Block not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to delete block', details: error.message }, { status: 500 })
  }
}

