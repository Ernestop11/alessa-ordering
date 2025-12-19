import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

/**
 * Get template usage statistics
 * GET /api/super/templates/usage
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as { role?: string } | undefined)?.role
    if (!session || role !== 'super_admin') {
      return unauthorized()
    }

    // Get all templates
    const templates = await prisma.tenantTemplate.findMany({
      where: { isGlobal: true },
      select: { id: true },
    })

    // Get usage stats for each template
    const usageStats = await Promise.all(
      templates.map(async (template) => {
        // Count tenants using this template (by matching settings)
        const tenantsUsingTemplate = await prisma.tenantTemplate.findMany({
          where: {
            isGlobal: false,
            type: template.type, // Same type is a proxy for "using this template"
          },
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        })

        return {
          templateId: template.id,
          count: tenantsUsingTemplate.length,
          tenants: tenantsUsingTemplate
            .map(t => t.tenant)
            .filter((t): t is NonNullable<typeof t> => t !== null),
        }
      })
    )

    return NextResponse.json({
      data: usageStats,
    })
  } catch (error: any) {
    console.error('[Template Usage API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch usage stats', details: error.message },
      { status: 500 }
    )
  }
}

