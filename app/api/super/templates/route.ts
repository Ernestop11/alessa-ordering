import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// GET - Fetch all templates
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as { role?: string } | undefined)?.role
    if (!session || role !== 'super_admin') {
      return unauthorized()
    }

    const templates = await prisma.tenantTemplate.findMany({
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
        _count: {
          select: {
            blocks: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: templates })
  } catch (error: any) {
    console.error('[Templates API] GET Error:', error)
    return NextResponse.json({ error: 'Failed to fetch templates', details: error.message }, { status: 500 })
  }
}

// POST - Create a new template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as { role?: string } | undefined)?.role
    if (!session || role !== 'super_admin') {
      return unauthorized()
    }

    const body = await request.json()
    const { name, type, tenantId, isGlobal } = body

    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 })
    }

    // If tenantId is provided, check if tenant already has a template
    if (tenantId) {
      const existingTemplate = await prisma.tenantTemplate.findUnique({
        where: { tenantId },
      })
      if (existingTemplate) {
        return NextResponse.json({ error: 'Tenant already has a template' }, { status: 400 })
      }
    }

    const template = await prisma.tenantTemplate.create({
      data: {
        name,
        type,
        tenantId: tenantId || null,
        isGlobal: isGlobal || false,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        blocks: true,
        settings: true,
      },
    })

    return NextResponse.json({ data: template }, { status: 201 })
  } catch (error: any) {
    console.error('[Templates API] POST Error:', error)
    return NextResponse.json({ error: 'Failed to create template', details: error.message }, { status: 500 })
  }
}

