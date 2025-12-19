/**
 * Create Global Templates
 * Creates reusable templates for batch onboarding
 */

import { PrismaClient, TemplateType } from '@prisma/client'
import { PAGE_GRADIENT_PRESETS, PATTERN_PRESETS, CARD_STYLE_PRESETS, ANIMATION_PRESETS } from '../lib/template-builder/presets'

const prisma = new PrismaClient()

const GLOBAL_TEMPLATES = [
  {
    name: 'Mexican Restaurant',
    type: TemplateType.RESTAURANT,
    description: 'Classic Mexican restaurant template based on Las Reinas',
    settings: {
      backgroundGradient: PAGE_GRADIENT_PRESETS.find(p => p.id === 'warmBlack')?.value || 
        'linear-gradient(180deg, #1c1917 0%, #292524 50%, #1c1917 100%)',
      backgroundPattern: PATTERN_PRESETS.find(p => p.id === 'aztec-zigzag')?.value || null,
      patternSize: PATTERN_PRESETS.find(p => p.id === 'aztec-zigzag')?.size || null,
      patternOpacity: 0.1,
      primaryColor: '#dc2626',
      secondaryColor: '#f59e0b',
      animation: 'pulse',
      glowEffect: true,
      cardStyle: 'dark-red',
      cardImageEffect: 'soft-shadow',
      headingFont: 'Bebas Neue',
      bodyFont: 'Inter',
    },
    blocks: [
      { type: 'HERO', title: 'Welcome', subtitle: 'Authentic Mexican Cuisine', position: 0 },
      { type: 'FEATURED_ITEMS', title: 'Featured Specials', subtitle: 'Chef\'s favorites', position: 1 },
      { type: 'MENU_SECTION', title: 'Menu', subtitle: 'Explore our menu', position: 2 },
      { type: 'HOURS_LOCATION', title: 'Hours & Location', subtitle: 'Visit us', position: 3 },
      { type: 'DELIVERY_PARTNERS', title: 'Delivery Options', subtitle: 'Order online', position: 4 },
    ],
  },
  {
    name: 'Puebla Style',
    type: TemplateType.RESTAURANT,
    description: 'Puebla-inspired template with blue and gold theme',
    settings: {
      backgroundGradient: PAGE_GRADIENT_PRESETS.find(p => p.id === 'puebla-blue')?.value || 
        'linear-gradient(180deg, #1e3a5f 0%, #2d4a6f 50%, #1e3a5f 100%)',
      backgroundPattern: PATTERN_PRESETS.find(p => p.id === 'gold-filigree')?.value || null,
      patternSize: PATTERN_PRESETS.find(p => p.id === 'gold-filigree')?.size || null,
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
    blocks: [
      { type: 'HERO', title: 'La Poblanita', subtitle: 'Authentic Mexican Cuisine', position: 0 },
      { type: 'FEATURED_ITEMS', title: 'Featured Specials', subtitle: 'Chef\'s favorites', position: 1 },
      { type: 'MENU_SECTION', title: 'Menu', subtitle: 'Explore our menu', position: 2 },
      { type: 'HOURS_LOCATION', title: 'Hours & Location', subtitle: 'Visit us', position: 3 },
      { type: 'DELIVERY_PARTNERS', title: 'Delivery Options', subtitle: 'Order online', position: 4 },
    ],
  },
  {
    name: 'Coffee Shop',
    type: TemplateType.COFFEE_SHOP,
    description: 'Modern coffee shop template with warm brown tones',
    settings: {
      backgroundGradient: PAGE_GRADIENT_PRESETS.find(p => p.id === 'coffee-brown')?.value || 
        'linear-gradient(180deg, #3d2314 0%, #5d3a1a 50%, #3d2314 100%)',
      backgroundPattern: PATTERN_PRESETS.find(p => p.id === 'coffee-beans')?.value || null,
      patternSize: PATTERN_PRESETS.find(p => p.id === 'coffee-beans')?.size || null,
      patternOpacity: 0.12,
      primaryColor: '#92400e',
      secondaryColor: '#d97706',
      animation: 'shimmer',
      glowEffect: false,
      cardStyle: 'dark-gold',
      cardImageEffect: 'soft-shadow',
      headingFont: 'Bebas Neue',
      bodyFont: 'Inter',
    },
    blocks: [
      { type: 'HERO', title: 'Coffee Shop', subtitle: 'Fresh roasted daily', position: 0 },
      { type: 'DAILY_SPECIALS', title: 'Daily Specials', subtitle: 'Today\'s featured drinks', position: 1 },
      { type: 'MENU_SECTION', title: 'Menu', subtitle: 'Our offerings', position: 2 },
      { type: 'LOYALTY_CARD', title: 'Loyalty Program', subtitle: 'Earn rewards', position: 3 },
      { type: 'HOURS_LOCATION', title: 'Hours & Location', subtitle: 'Visit us', position: 4 },
    ],
  },
  {
    name: 'Bakery',
    type: TemplateType.BAKERY,
    description: 'Sweet bakery template with warm colors',
    settings: {
      backgroundGradient: PAGE_GRADIENT_PRESETS.find(p => p.id === 'sunset')?.value || 
        'linear-gradient(135deg, #ea580c 0%, #f97316 50%, #fb923c 100%)',
      backgroundPattern: PATTERN_PRESETS.find(p => p.id === 'stars-scattered')?.value || null,
      patternSize: PATTERN_PRESETS.find(p => p.id === 'stars-scattered')?.size || null,
      patternOpacity: 0.1,
      primaryColor: '#ea580c',
      secondaryColor: '#fbbf24',
      animation: 'pulse',
      glowEffect: true,
      cardStyle: 'dark-gold',
      cardImageEffect: 'soft-shadow',
      headingFont: 'Bebas Neue',
      bodyFont: 'Inter',
    },
    blocks: [
      { type: 'HERO', title: 'Bakery', subtitle: 'Fresh baked daily', position: 0 },
      { type: 'FEATURED_ITEMS', title: 'Featured Items', subtitle: 'Customer favorites', position: 1 },
      { type: 'MENU_SECTION', title: 'Menu', subtitle: 'Our pastries', position: 2 },
      { type: 'HOURS_LOCATION', title: 'Hours & Location', subtitle: 'Visit us', position: 3 },
    ],
  },
  {
    name: 'Gym/Fitness',
    type: TemplateType.GYM,
    description: 'Modern gym template with steel tones',
    settings: {
      backgroundGradient: PAGE_GRADIENT_PRESETS.find(p => p.id === 'gym-steel')?.value || 
        'linear-gradient(180deg, #1f2937 0%, #374151 50%, #1f2937 100%)',
      backgroundPattern: PATTERN_PRESETS.find(p => p.id === 'gym-hexagons')?.value || null,
      patternSize: PATTERN_PRESETS.find(p => p.id === 'gym-hexagons')?.size || null,
      patternOpacity: 0.08,
      primaryColor: '#1f2937',
      secondaryColor: '#f59e0b',
      animation: 'none',
      glowEffect: false,
      cardStyle: 'dark-red',
      cardImageEffect: 'strong-shadow',
      headingFont: 'Bebas Neue',
      bodyFont: 'Inter',
    },
    blocks: [
      { type: 'HERO', title: 'Fitness Center', subtitle: 'Transform your body', position: 0 },
      { type: 'FEATURED_ITEMS', title: 'Membership Plans', subtitle: 'Choose your plan', position: 1 },
      { type: 'MENU_SECTION', title: 'Services', subtitle: 'What we offer', position: 2 },
      { type: 'HOURS_LOCATION', title: 'Hours & Location', subtitle: 'Visit us', position: 3 },
    ],
  },
  {
    name: 'Auto Shop',
    type: TemplateType.CAR_SHOP,
    description: 'Auto shop template with chrome accents',
    settings: {
      backgroundGradient: PAGE_GRADIENT_PRESETS.find(p => p.id === 'car-shop-chrome')?.value || 
        'linear-gradient(135deg, #374151 0%, #6b7280 50%, #374151 100%)',
      backgroundPattern: PATTERN_PRESETS.find(p => p.id === 'auto-checkered')?.value || null,
      patternSize: PATTERN_PRESETS.find(p => p.id === 'auto-checkered')?.size || null,
      patternOpacity: 0.1,
      primaryColor: '#374151',
      secondaryColor: '#f59e0b',
      animation: 'none',
      glowEffect: false,
      cardStyle: 'dark-red',
      cardImageEffect: 'strong-shadow',
      headingFont: 'Bebas Neue',
      bodyFont: 'Inter',
    },
    blocks: [
      { type: 'HERO', title: 'Auto Shop', subtitle: 'Quality service', position: 0 },
      { type: 'FEATURED_ITEMS', title: 'Services', subtitle: 'What we offer', position: 1 },
      { type: 'MENU_SECTION', title: 'Service Menu', subtitle: 'Our services', position: 2 },
      { type: 'HOURS_LOCATION', title: 'Hours & Location', subtitle: 'Visit us', position: 3 },
    ],
  },
]

async function main() {
  console.log('🚀 Creating global templates...\n')

  for (const templateData of GLOBAL_TEMPLATES) {
    // Check if template already exists
    const existing = await prisma.tenantTemplate.findFirst({
      where: {
        name: templateData.name,
        isGlobal: true,
        tenantId: null,
      },
    })

    if (existing) {
      console.log(`⏭️  Template "${templateData.name}" already exists, skipping...`)
      continue
    }

    console.log(`📋 Creating template: ${templateData.name}...`)

    // Create template
    const template = await prisma.tenantTemplate.create({
      data: {
        name: templateData.name,
        type: templateData.type,
        isGlobal: true,
        tenantId: null,
        settings: {
          create: templateData.settings,
        },
      },
    })

    // Create blocks
    for (const blockData of templateData.blocks) {
      await prisma.tenantBlock.create({
        data: {
          templateId: template.id,
          type: blockData.type,
          title: blockData.title,
          subtitle: blockData.subtitle,
          position: blockData.position,
          active: true,
          config: {},
        },
      })
    }

    console.log(`  ✅ Created ${templateData.blocks.length} blocks`)
    console.log(`✅ Template "${templateData.name}" created (ID: ${template.id})\n`)
  }

  console.log('🎉 All global templates created!')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

