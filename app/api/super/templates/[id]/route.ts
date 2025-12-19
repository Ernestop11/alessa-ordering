import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// GET - Fetch a single template by ID
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

    const template = await prisma.tenantTemplate.findUnique({
      where: { id },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        blocks: {
          orderBy: { position: 'asc' },
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
        },
        settings: true,
      },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    return NextResponse.json({ data: template })
  } catch (error: any) {
    console.error('[Template API] GET Error:', error)
    return NextResponse.json({ error: 'Failed to fetch template', details: error.message }, { status: 500 })
  }
}

// PUT - Update a template
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
    const { name, type, tenantId, isGlobal } = body

    // Build update data - only include defined fields
    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (type !== undefined) updateData.type = type
    if (tenantId !== undefined) updateData.tenantId = tenantId || null
    if (isGlobal !== undefined) updateData.isGlobal = isGlobal

    // If tenantId is being set, check if another template already uses it
    if (tenantId !== undefined && tenantId !== null) {
      const existingTemplate = await prisma.tenantTemplate.findUnique({
        where: { tenantId },
      })
      if (existingTemplate && existingTemplate.id !== id) {
        return NextResponse.json({ error: 'Tenant already has a template' }, { status: 400 })
      }
    }

    const template = await prisma.tenantTemplate.update({
      where: { id },
      data: updateData,
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        blocks: {
          orderBy: { position: 'asc' },
        },
        settings: true,
      },
    })

    return NextResponse.json({ data: template })
  } catch (error: any) {
    console.error('[Template API] PUT Error:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to update template', details: error.message }, { status: 500 })
  }
}

// DELETE - Delete a template
export async function DELETE(
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

    await prisma.tenantTemplate.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[Template API] DELETE Error:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to delete template', details: error.message }, { status: 500 })
  }
}

