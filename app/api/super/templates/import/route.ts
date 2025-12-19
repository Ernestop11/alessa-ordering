import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

/**
 * Import template from JSON
 * POST /api/super/templates/import
 * Body: { templateData: {...}, tenantId?: string, name?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const role = (session?.user as { role?: string } | undefined)?.role
    if (!session || role !== 'super_admin') {
      return unauthorized()
    }

    const body = await request.json()
    const { templateData, tenantId, name } = body

    if (!templateData) {
      return NextResponse.json({ error: 'Template data is required' }, { status: 400 })
    }

    // Validate template data structure
    if (!templateData.name || !templateData.type) {
      return NextResponse.json({ error: 'Invalid template data structure' }, { status: 400 })
    }

    // If tenantId is provided, check if tenant exists
    if (tenantId) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
      })
      if (!tenant) {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
      }

      // Check if tenant already has a template
      const existingTemplate = await prisma.tenantTemplate.findUnique({
        where: { tenantId },
      })
      if (existingTemplate) {
        return NextResponse.json(
          { error: 'Tenant already has a template. Delete it first or update it.' },
          { status: 400 }
        )
      }
    }

    // Create template
    const template = await prisma.tenantTemplate.create({
      data: {
        name: name || templateData.name,
        type: templateData.type,
        isGlobal: tenantId ? false : (templateData.isGlobal ?? false),
        tenantId: tenantId || null,
        settings: templateData.settings ? {
          create: {
            backgroundGradient: templateData.settings.backgroundGradient,
            backgroundPattern: templateData.settings.backgroundPattern,
            patternOpacity: templateData.settings.patternOpacity ?? 0.1,
            patternSize: templateData.settings.patternSize,
            primaryColor: templateData.settings.primaryColor,
            secondaryColor: templateData.settings.secondaryColor,
            animation: templateData.settings.animation,
            glowEffect: templateData.settings.glowEffect ?? false,
            particleEffect: templateData.settings.particleEffect,
            cardStyle: templateData.settings.cardStyle,
            cardImageEffect: templateData.settings.cardImageEffect,
            cardBackground: templateData.settings.cardBackground,
            headingFont: templateData.settings.headingFont,
            bodyFont: templateData.settings.bodyFont,
          },
        } : undefined,
      },
    })

    // Create blocks
    if (templateData.blocks && Array.isArray(templateData.blocks)) {
      for (const blockData of templateData.blocks) {
        await prisma.tenantBlock.create({
          data: {
            templateId: template.id,
            type: blockData.type,
            title: blockData.title,
            subtitle: blockData.subtitle,
            badgeText: blockData.badgeText,
            ctaText: blockData.ctaText,
            ctaLink: blockData.ctaLink,
            config: blockData.config || {},
            position: blockData.position ?? 0,
            active: blockData.active !== undefined ? blockData.active : true,
          },
        })
      }
    }

    // Fetch created template with relations
    const createdTemplate = await prisma.tenantTemplate.findUnique({
      where: { id: template.id },
      include: {
        blocks: {
          orderBy: { position: 'asc' },
        },
        settings: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    return NextResponse.json({
      data: createdTemplate,
      message: 'Template imported successfully',
    })
  } catch (error: any) {
    console.error('[Template Import API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to import template', details: error.message },
      { status: 500 }
    )
  }
}

