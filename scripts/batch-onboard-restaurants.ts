/**
 * Batch Onboard Remaining Restaurants
 * Applies templates to existing tenants
 */

import { PrismaClient, TenantStatus, TemplateType } from '@prisma/client'

const prisma = new PrismaClient()

// Restaurant data to onboard
const RESTAURANTS = [
  {
    name: 'Las Reinas',
    slug: 'lasreinas',
    templateName: 'Mexican Restaurant',
    primaryColor: '#dc2626',
    secondaryColor: '#f59e0b',
  },
  {
    name: 'El Taquito',
    slug: 'eltaquito',
    templateName: 'Mexican Restaurant',
    primaryColor: '#dc2626',
    secondaryColor: '#f59e0b',
  },
  {
    name: 'Casa de Tacos',
    slug: 'casatacos',
    templateName: 'Mexican Restaurant',
    primaryColor: '#dc2626',
    secondaryColor: '#f59e0b',
  },
  {
    name: 'Taco Express',
    slug: 'tacoexpress',
    templateName: 'Mexican Restaurant',
    primaryColor: '#dc2626',
    secondaryColor: '#f59e0b',
  },
  {
    name: 'La Cocina',
    slug: 'lacocina',
    templateName: 'Mexican Restaurant',
    primaryColor: '#dc2626',
    secondaryColor: '#f59e0b',
  },
]

async function main() {
  console.log('🚀 Batch onboarding restaurants...\n')

  for (const restaurant of RESTAURANTS) {
    console.log(`📋 Processing: ${restaurant.name}...`)

    // Find tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: restaurant.slug },
    })

    if (!tenant) {
      console.log(`  ⚠️  Tenant not found, skipping...`)
      continue
    }

    // Check if tenant already has a template
    const existingTemplate = await prisma.tenantTemplate.findUnique({
      where: { tenantId: tenant.id },
    })

    if (existingTemplate) {
      console.log(`  ⏭️  Template already exists, skipping...`)
      continue
    }

    // Find global template
    const globalTemplate = await prisma.tenantTemplate.findFirst({
      where: {
        name: restaurant.templateName,
        isGlobal: true,
        tenantId: null,
      },
      include: {
        blocks: {
          orderBy: { position: 'asc' },
        },
        settings: true,
      },
    })

    if (!globalTemplate) {
      console.log(`  ⚠️  Global template "${restaurant.templateName}" not found, skipping...`)
      continue
    }

    console.log(`  📦 Creating template from "${restaurant.templateName}"...`)

    // Create tenant template
    const template = await prisma.tenantTemplate.create({
      data: {
        tenantId: tenant.id,
        name: `${restaurant.name} Template`,
        type: globalTemplate.type,
        isGlobal: false,
        settings: globalTemplate.settings ? {
          create: {
            backgroundGradient: globalTemplate.settings.backgroundGradient,
            backgroundPattern: globalTemplate.settings.backgroundPattern,
            patternOpacity: globalTemplate.settings.patternOpacity,
            patternSize: globalTemplate.settings.patternSize,
            primaryColor: restaurant.primaryColor,
            secondaryColor: restaurant.secondaryColor,
            animation: globalTemplate.settings.animation,
            glowEffect: globalTemplate.settings.glowEffect,
            particleEffect: globalTemplate.settings.particleEffect,
            cardStyle: globalTemplate.settings.cardStyle,
            cardImageEffect: globalTemplate.settings.cardImageEffect,
            cardBackground: globalTemplate.settings.cardBackground,
            headingFont: globalTemplate.settings.headingFont,
            bodyFont: globalTemplate.settings.bodyFont,
          },
        } : undefined,
      },
    })

    // Copy blocks
    for (const block of globalTemplate.blocks) {
      await prisma.tenantBlock.create({
        data: {
          templateId: template.id,
          type: block.type,
          title: block.title,
          subtitle: block.subtitle,
          badgeText: block.badgeText,
          ctaText: block.ctaText,
          ctaLink: block.ctaLink,
          config: block.config,
          position: block.position,
          active: block.active,
        },
      })
    }

    // Update tenant colors
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        primaryColor: restaurant.primaryColor,
        secondaryColor: restaurant.secondaryColor,
        status: TenantStatus.APPROVED,
      },
    })

    console.log(`  ✅ Created template with ${globalTemplate.blocks.length} blocks`)
    console.log(`  ✅ Updated tenant colors\n`)
  }

  console.log('🎉 Batch onboarding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

