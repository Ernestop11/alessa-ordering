import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// GET - Fetch all blocks for a template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as { role?: string } | undefined)?.role
    if (!session || role !== 'super_admin') {
      return unauthorized()
    }

    const { id } = await Promise.resolve(params)

    // Verify template exists
    const template = await prisma.tenantTemplate.findUnique({
      where: { id },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const blocks = await prisma.tenantBlock.findMany({
      where: { templateId: id },
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
      orderBy: { position: 'asc' },
    })

    return NextResponse.json({ data: blocks })
  } catch (error: any) {
    console.error('[Template Blocks API] GET Error:', error)
    return NextResponse.json({ error: 'Failed to fetch blocks', details: error.message }, { status: 500 })
  }
}

// POST - Create a new block
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as { role?: string } | undefined)?.role
    if (!session || role !== 'super_admin') {
      return unauthorized()
    }

    const { id } = await Promise.resolve(params)
    const body = await request.json()
    const { type, title, subtitle, badgeText, ctaText, ctaLink, config, position } = body

    if (!type) {
      return NextResponse.json({ error: 'Type is required' }, { status: 400 })
    }

    // Verify template exists
    const template = await prisma.tenantTemplate.findUnique({
      where: { id },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Get the next position if not provided
    let blockPosition = position
    if (blockPosition === undefined) {
      const lastBlock = await prisma.tenantBlock.findFirst({
        where: { templateId: id },
        orderBy: { position: 'desc' },
      })
      blockPosition = (lastBlock?.position || 0) + 1
    }

    const block = await prisma.tenantBlock.create({
      data: {
        templateId: id,
        type,
        title,
        subtitle,
        badgeText,
        ctaText,
        ctaLink,
        config: config || {},
        position: blockPosition,
        active: true,
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
              },
            },
          },
          orderBy: { displayOrder: 'asc' },
        },
      },
    })

    return NextResponse.json({ data: block }, { status: 201 })
  } catch (error: any) {
    console.error('[Template Blocks API] POST Error:', error)
    return NextResponse.json({ error: 'Failed to create block', details: error.message }, { status: 500 })
  }
}

// PUT - Reorder blocks
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as { role?: string } | undefined)?.role
    if (!session || role !== 'super_admin') {
      return unauthorized()
    }

    const { id } = await Promise.resolve(params)
    const body = await request.json()
    const { blocks } = body // Array of { id, position }

    if (!Array.isArray(blocks)) {
      return NextResponse.json({ error: 'Blocks array is required' }, { status: 400 })
    }

    // Verify template exists
    const template = await prisma.tenantTemplate.findUnique({
      where: { id },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Update positions in a transaction
    await prisma.$transaction(
      blocks.map((b: { id: string; position: number }) =>
        prisma.tenantBlock.update({
          where: { id: b.id, templateId: id }, // Ensure block belongs to this template
          data: { position: b.position },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Template Blocks API] PUT Error:', error)
    return NextResponse.json({ error: 'Failed to reorder blocks', details: error.message }, { status: 500 })
  }
}

