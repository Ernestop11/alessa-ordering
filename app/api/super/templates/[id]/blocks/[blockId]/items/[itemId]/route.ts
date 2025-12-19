import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// DELETE - Remove a menu item from a block
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; blockId: string; itemId: string }> | { id: string; blockId: string; itemId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as { role?: string } | undefined)?.role
    if (!session || role !== 'super_admin') {
      return unauthorized()
    }

    const { id, blockId, itemId } = await Promise.resolve(params)

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

    // Verify block menu item exists and belongs to this block
    const blockMenuItem = await prisma.tenantBlockMenuItem.findFirst({
      where: {
        id: itemId,
        blockId,
      },
    })

    if (!blockMenuItem) {
      return NextResponse.json({ error: 'Menu item not found in this block' }, { status: 404 })
    }

    await prisma.tenantBlockMenuItem.delete({
      where: { id: itemId },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Template Block Item API] DELETE Error:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to remove menu item', details: error.message }, { status: 500 })
  }
}

