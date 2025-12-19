import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// POST - Add a menu item to a block
export async function POST(
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
    const { menuItemId, displayOrder } = body

    if (!menuItemId) {
      return NextResponse.json({ error: 'menuItemId is required' }, { status: 400 })
    }

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

    // Verify menu item exists
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
    })

    if (!menuItem) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 })
    }

    // Get the next display order if not provided
    let itemDisplayOrder = displayOrder
    if (itemDisplayOrder === undefined) {
      const lastItem = await prisma.tenantBlockMenuItem.findFirst({
        where: { blockId },
        orderBy: { displayOrder: 'desc' },
      })
      itemDisplayOrder = (lastItem?.displayOrder || 0) + 1
    }

    // Check if item already exists in block
    const existingItem = await prisma.tenantBlockMenuItem.findUnique({
      where: {
        blockId_menuItemId: {
          blockId,
          menuItemId,
        },
      },
    })

    if (existingItem) {
      return NextResponse.json({ error: 'Menu item already exists in this block' }, { status: 400 })
    }

    const blockMenuItem = await prisma.tenantBlockMenuItem.create({
      data: {
        blockId,
        menuItemId,
        displayOrder: itemDisplayOrder,
      },
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
    })

    return NextResponse.json({ data: blockMenuItem }, { status: 201 })
  } catch (error: any) {
    console.error('[Template Block Items API] POST Error:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Menu item already exists in this block' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to add menu item', details: error.message }, { status: 500 })
  }
}

