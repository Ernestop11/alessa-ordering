import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// Default settings
const DEFAULT_SETTINGS = {
  backgroundGradient: 'linear-gradient(180deg, #1c1917 0%, #292524 50%, #1c1917 100%)',
  backgroundPattern: null,
  patternOpacity: 0.1,
  patternSize: null,
  primaryColor: '#dc2626',
  secondaryColor: '#f59e0b',
  animation: null,
  glowEffect: false,
  particleEffect: null,
  cardStyle: 'dark-red',
  cardImageEffect: 'soft-shadow',
  cardBackground: null,
  headingFont: 'Bebas Neue',
  bodyFont: 'Inter',
}

// GET - Fetch template settings
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

    // Try to get settings from database, or return defaults
    const settings = await prisma.tenantTemplateSettings.findUnique({
      where: { templateId: id },
    })

    if (!settings) {
      return NextResponse.json({ data: DEFAULT_SETTINGS })
    }

    return NextResponse.json({
      data: {
        backgroundGradient: settings.backgroundGradient,
        backgroundPattern: settings.backgroundPattern,
        patternOpacity: settings.patternOpacity,
        patternSize: settings.patternSize,
        primaryColor: settings.primaryColor,
        secondaryColor: settings.secondaryColor,
        animation: settings.animation,
        glowEffect: settings.glowEffect,
        particleEffect: settings.particleEffect,
        cardStyle: settings.cardStyle,
        cardImageEffect: settings.cardImageEffect,
        cardBackground: settings.cardBackground,
        headingFont: settings.headingFont,
        bodyFont: settings.bodyFont,
      },
    })
  } catch (error: any) {
    console.error('[Template Settings API] GET Error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings', details: error.message }, { status: 500 })
  }
}

// PUT - Update template settings
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
    const {
      backgroundGradient,
      backgroundPattern,
      patternOpacity,
      patternSize,
      primaryColor,
      secondaryColor,
      animation,
      glowEffect,
      particleEffect,
      cardStyle,
      cardImageEffect,
      cardBackground,
      headingFont,
      bodyFont,
    } = body

    // Verify template exists
    const template = await prisma.tenantTemplate.findUnique({
      where: { id },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Build update data - only include defined fields
    const updateData: Record<string, unknown> = {}

    if (backgroundGradient !== undefined) updateData.backgroundGradient = backgroundGradient
    if (backgroundPattern !== undefined) updateData.backgroundPattern = backgroundPattern
    if (patternOpacity !== undefined) updateData.patternOpacity = patternOpacity
    if (patternSize !== undefined) updateData.patternSize = patternSize
    if (primaryColor !== undefined) updateData.primaryColor = primaryColor
    if (secondaryColor !== undefined) updateData.secondaryColor = secondaryColor
    if (animation !== undefined) updateData.animation = animation
    if (glowEffect !== undefined) updateData.glowEffect = glowEffect
    if (particleEffect !== undefined) updateData.particleEffect = particleEffect
    if (cardStyle !== undefined) updateData.cardStyle = cardStyle
    if (cardImageEffect !== undefined) updateData.cardImageEffect = cardImageEffect
    if (cardBackground !== undefined) updateData.cardBackground = cardBackground
    if (headingFont !== undefined) updateData.headingFont = headingFont
    if (bodyFont !== undefined) updateData.bodyFont = bodyFont

    // Upsert settings
    const settings = await prisma.tenantTemplateSettings.upsert({
      where: { templateId: id },
      update: updateData,
      create: {
        templateId: id,
        backgroundGradient: backgroundGradient || DEFAULT_SETTINGS.backgroundGradient,
        backgroundPattern: backgroundPattern || null,
        patternOpacity: patternOpacity !== undefined ? patternOpacity : DEFAULT_SETTINGS.patternOpacity,
        patternSize: patternSize || null,
        primaryColor: primaryColor || DEFAULT_SETTINGS.primaryColor,
        secondaryColor: secondaryColor || DEFAULT_SETTINGS.secondaryColor,
        animation: animation || null,
        glowEffect: glowEffect !== undefined ? glowEffect : DEFAULT_SETTINGS.glowEffect,
        particleEffect: particleEffect || null,
        cardStyle: cardStyle || DEFAULT_SETTINGS.cardStyle,
        cardImageEffect: cardImageEffect || DEFAULT_SETTINGS.cardImageEffect,
        cardBackground: cardBackground || null,
        headingFont: headingFont || DEFAULT_SETTINGS.headingFont,
        bodyFont: bodyFont || DEFAULT_SETTINGS.bodyFont,
      },
    })

    return NextResponse.json({
      data: {
        backgroundGradient: settings.backgroundGradient,
        backgroundPattern: settings.backgroundPattern,
        patternOpacity: settings.patternOpacity,
        patternSize: settings.patternSize,
        primaryColor: settings.primaryColor,
        secondaryColor: settings.secondaryColor,
        animation: settings.animation,
        glowEffect: settings.glowEffect,
        particleEffect: settings.particleEffect,
        cardStyle: settings.cardStyle,
        cardImageEffect: settings.cardImageEffect,
        cardBackground: settings.cardBackground,
        headingFont: settings.headingFont,
        bodyFont: settings.bodyFont,
      },
    })
  } catch (error: any) {
    console.error('[Template Settings API] PUT Error:', error)
    return NextResponse.json({ error: 'Failed to update settings', details: error.message }, { status: 500 })
  }
}

