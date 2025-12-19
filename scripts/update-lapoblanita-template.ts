/**
 * Update La Poblanita Template Settings
 * Updates the template with proper Design Studio configuration
 */

import { PrismaClient } from '@prisma/client'
import { PAGE_GRADIENT_PRESETS, PATTERN_PRESETS } from '../lib/template-builder/presets'

const prisma = new PrismaClient()

async function main() {
  console.log('🎨 Updating La Poblanita template settings...\n')

  const tenant = await prisma.tenant.findUnique({
    where: { slug: 'lapoblanita' },
  })

  if (!tenant) {
    console.error('❌ Tenant not found')
    process.exit(1)
  }

  const template = await prisma.tenantTemplate.findUnique({
    where: { tenantId: tenant.id },
    include: { settings: true },
  })

  if (!template) {
    console.error('❌ Template not found')
    process.exit(1)
  }

  const pueblaBlueGradient = PAGE_GRADIENT_PRESETS.find(p => p.id === 'puebla-blue')
  const goldFiligreePattern = PATTERN_PRESETS.find(p => p.id === 'gold-filigree')

  if (template.settings) {
    // Update existing settings
    await prisma.tenantTemplateSettings.update({
      where: { templateId: template.id },
      data: {
        backgroundGradient: pueblaBlueGradient?.value || 
          'linear-gradient(180deg, #1e3a5f 0%, #2d4a6f 50%, #1e3a5f 100%)',
        backgroundPattern: goldFiligreePattern?.value || null,
        patternSize: goldFiligreePattern?.size || null,
        patternOpacity: 0.15,
        primaryColor: '#1e3a5f',
        secondaryColor: '#c9a227',
        animation: 'pulse',
        glowEffect: true,
        cardStyle: 'puebla-blue',
        cardImageEffect: 'soft-shadow',
      },
    })
    console.log('✅ Updated template settings')
  } else {
    // Create settings if they don't exist
    await prisma.tenantTemplateSettings.create({
      data: {
        templateId: template.id,
        backgroundGradient: pueblaBlueGradient?.value || 
          'linear-gradient(180deg, #1e3a5f 0%, #2d4a6f 50%, #1e3a5f 100%)',
        backgroundPattern: goldFiligreePattern?.value || null,
        patternSize: goldFiligreePattern?.size || null,
        patternOpacity: 0.15,
        primaryColor: '#1e3a5f',
        secondaryColor: '#c9a227',
        animation: 'pulse',
        glowEffect: true,
        cardStyle: 'puebla-blue',
        cardImageEffect: 'soft-shadow',
        headingFont: 'Bebas Neue',
        bodyFont: 'Inter',
      },
    })
    console.log('✅ Created template settings')
  }

  console.log('\n🎉 Template settings updated!')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

