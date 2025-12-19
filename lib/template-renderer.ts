import prisma from './prisma'

export interface TemplateSettings {
  backgroundGradient: string
  backgroundPattern: string | null
  patternOpacity: number
  patternSize: string | null
  primaryColor: string
  secondaryColor: string
  animation: string | null
  glowEffect: boolean
  particleEffect: string | null
  cardStyle: string
  cardImageEffect: string
  cardBackground: string | null
  headingFont: string
  bodyFont: string
}

const DEFAULT_SETTINGS: TemplateSettings = {
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

/**
 * Fetch template settings for a tenant
 */
export async function getTemplateSettings(tenantId: string | null): Promise<TemplateSettings> {
  if (!tenantId) {
    return DEFAULT_SETTINGS
  }

  try {
    // Find template for tenant
    const template = await prisma.tenantTemplate.findUnique({
      where: { tenantId },
      include: {
        settings: true,
      },
    })

    if (!template?.settings) {
      return DEFAULT_SETTINGS
    }

    const settings = template.settings

    return {
      backgroundGradient: settings.backgroundGradient || DEFAULT_SETTINGS.backgroundGradient,
      backgroundPattern: settings.backgroundPattern,
      patternOpacity: settings.patternOpacity ?? DEFAULT_SETTINGS.patternOpacity,
      patternSize: settings.patternSize,
      primaryColor: settings.primaryColor || DEFAULT_SETTINGS.primaryColor,
      secondaryColor: settings.secondaryColor || DEFAULT_SETTINGS.secondaryColor,
      animation: settings.animation,
      glowEffect: settings.glowEffect ?? DEFAULT_SETTINGS.glowEffect,
      particleEffect: settings.particleEffect,
      cardStyle: settings.cardStyle || DEFAULT_SETTINGS.cardStyle,
      cardImageEffect: settings.cardImageEffect || DEFAULT_SETTINGS.cardImageEffect,
      cardBackground: settings.cardBackground,
      headingFont: settings.headingFont || DEFAULT_SETTINGS.headingFont,
      bodyFont: settings.bodyFont || DEFAULT_SETTINGS.bodyFont,
    }
  } catch (error) {
    console.error('[Template Renderer] Error fetching settings:', error)
    return DEFAULT_SETTINGS
  }
}

/**
 * Generate CSS variables from template settings
 */
export function generateCSSVariables(settings: TemplateSettings): string {
  const vars: string[] = []

  vars.push(`--template-bg-gradient: ${settings.backgroundGradient}`)
  vars.push(`--template-primary-color: ${settings.primaryColor}`)
  vars.push(`--template-secondary-color: ${settings.secondaryColor}`)
  vars.push(`--template-heading-font: ${settings.headingFont}`)
  vars.push(`--template-body-font: ${settings.bodyFont}`)
  vars.push(`--template-card-style: ${settings.cardStyle}`)
  vars.push(`--template-card-image-effect: ${settings.cardImageEffect}`)

  if (settings.backgroundPattern) {
    vars.push(`--template-bg-pattern: ${settings.backgroundPattern}`)
    vars.push(`--template-pattern-size: ${settings.patternSize || '40px 40px'}`)
    vars.push(`--template-pattern-opacity: ${settings.patternOpacity}`)
  }

  if (settings.cardBackground) {
    vars.push(`--template-card-background: url(${settings.cardBackground})`)
  }

  return vars.join('; ')
}

/**
 * Generate inline styles for the page body
 */
export function generatePageStyles(settings: TemplateSettings): React.CSSProperties {
  const styles: React.CSSProperties = {
    background: settings.backgroundGradient,
  }

  if (settings.backgroundPattern) {
    return {
      ...styles,
      position: 'relative',
    }
  }

  return styles
}

/**
 * Generate pattern overlay styles
 */
export function generatePatternStyles(settings: TemplateSettings): React.CSSProperties | null {
  if (!settings.backgroundPattern) {
    return null
  }

  return {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: settings.backgroundPattern,
    backgroundSize: settings.patternSize || '40px 40px',
    opacity: settings.patternOpacity,
    pointerEvents: 'none',
    zIndex: 1,
  }
}

/**
 * Generate animation class name
 */
export function getAnimationClass(animation: string | null): string {
  if (!animation) return ''
  
  const animationMap: Record<string, string> = {
    pulse: 'animate-pulse',
    shimmer: 'animate-shimmer',
    'gradient-shift': 'animate-gradient-shift',
    aurora: 'animate-aurora',
  }

  return animationMap[animation] || ''
}

