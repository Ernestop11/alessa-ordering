import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

/**
 * Export template as JSON
 * GET /api/super/templates/export/[id]
 */
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

    // Fetch template with all related data
    const template = await prisma.tenantTemplate.findUnique({
      where: { id },
      include: {
        blocks: {
          include: {
            menuItems: {
              include: {
                menuItem: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { position: 'asc' },
        },
        settings: true,
      },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Format for export (exclude tenantId, IDs will be regenerated on import)
    const exportData = {
      name: template.name,
      type: template.type,
      isGlobal: template.isGlobal,
      settings: template.settings ? {
        backgroundGradient: template.settings.backgroundGradient,
        backgroundPattern: template.settings.backgroundPattern,
        patternOpacity: template.settings.patternOpacity,
        patternSize: template.settings.patternSize,
        primaryColor: template.settings.primaryColor,
        secondaryColor: template.settings.secondaryColor,
        animation: template.settings.animation,
        glowEffect: template.settings.glowEffect,
        particleEffect: template.settings.particleEffect,
        cardStyle: template.settings.cardStyle,
        cardImageEffect: template.settings.cardImageEffect,
        cardBackground: template.settings.cardBackground,
        headingFont: template.settings.headingFont,
        bodyFont: template.settings.bodyFont,
      } : null,
      blocks: template.blocks.map(block => ({
        type: block.type,
        title: block.title,
        subtitle: block.subtitle,
        badgeText: block.badgeText,
        ctaText: block.ctaText,
        ctaLink: block.ctaLink,
        config: block.config,
        position: block.position,
        active: block.active,
        // Note: menuItems are not exported as they're tenant-specific
        // They'll need to be reassigned after import
      })),
      exportedAt: new Date().toISOString(),
      version: '1.0',
    }

    return NextResponse.json({
      data: exportData,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="template-${template.name.toLowerCase().replace(/\s+/g, '-')}.json"`,
      },
    })
  } catch (error: any) {
    console.error('[Template Export API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to export template', details: error.message },
      { status: 500 }
    )
  }
}

