/**
 * La Poblanita Setup Script
 * Creates tenant, template, and initial configuration
 */

import { PrismaClient, TenantStatus, TemplateType } from '@prisma/client'
import { PAGE_GRADIENT_PRESETS, PATTERN_PRESETS, CARD_STYLE_PRESETS, ANIMATION_PRESETS } from '../lib/template-builder/presets'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Setting up La Poblanita...\n')

  // Step 1: Create or get tenant
  let tenant = await prisma.tenant.findUnique({
    where: { slug: 'lapoblanita' },
  })

  if (!tenant) {
    console.log('📝 Creating La Poblanita tenant...')
    tenant = await prisma.tenant.create({
      data: {
        name: 'La Poblanita',
        slug: 'lapoblanita',
        primaryColor: '#1e3a5f',
        secondaryColor: '#c9a227',
        status: TenantStatus.APPROVED,
        heroTitle: 'La Poblanita',
        heroSubtitle: 'Authentic Mexican Cuisine',
        contactEmail: 'info@lapoblanita.com',
        contactPhone: '+1-555-0123',
        addressLine1: '123 Main Street',
        city: 'Los Angeles',
        state: 'CA',
        postalCode: '90001',
        country: 'USA',
        settings: {
          create: {
            tagline: 'Authentic Mexican flavors, made fresh daily',
            timeZone: 'America/Los_Angeles',
            deliveryRadiusMi: 5,
            minimumOrderValue: 15.0,
            currency: 'USD',
            isOpen: true,
            operatingHours: {
              monday: { open: '11:00', close: '21:00' },
              tuesday: { open: '11:00', close: '21:00' },
              wednesday: { open: '11:00', close: '21:00' },
              thursday: { open: '11:00', close: '21:00' },
              friday: { open: '11:00', close: '22:00' },
              saturday: { open: '11:00', close: '22:00' },
              sunday: { open: '12:00', close: '20:00' },
            },
            frontendConfig: {
              featuredCarousel: {
                title: 'Featured Specials',
                subtitle: 'Try our chef\'s favorites',
              },
            },
          },
        },
        integrations: {
          create: {
            paymentProcessor: 'stripe',
            printerType: 'bluetooth',
          },
        },
      },
    })
    console.log('✅ Tenant created:', tenant.id)
  } else {
    console.log('✅ Tenant already exists:', tenant.id)
  }

  // Step 2: Create template
  let template = await prisma.tenantTemplate.findUnique({
    where: { tenantId: tenant.id },
  })

  if (!template) {
    console.log('\n📋 Creating La Poblanita template...')
    template = await prisma.tenantTemplate.create({
      data: {
        tenantId: tenant.id,
        name: 'La Poblanita Template',
        type: TemplateType.RESTAURANT,
        isGlobal: false,
        settings: {
          create: {
            // Puebla Blue gradient
            backgroundGradient: PAGE_GRADIENT_PRESETS.find(p => p.id === 'puebla-blue')?.value || 
              'linear-gradient(180deg, #1e3a5f 0%, #2d4a6f 50%, #1e3a5f 100%)',
            // Gold Filigree pattern
            backgroundPattern: PATTERN_PRESETS.find(p => p.id === 'gold-filigree')?.value || null,
            patternSize: PATTERN_PRESETS.find(p => p.id === 'gold-filigree')?.size || null,
            patternOpacity: 0.15,
            // Colors
            primaryColor: '#1e3a5f',
            secondaryColor: '#c9a227',
            // Effects
            animation: 'pulse',
            glowEffect: true,
            // Card styling - Puebla Blue with gold accents
            cardStyle: 'puebla-blue',
            cardImageEffect: 'soft-shadow',
            // Typography
            headingFont: 'Bebas Neue',
            bodyFont: 'Inter',
          },
        },
      },
    })
    console.log('✅ Template created:', template.id)
  } else {
    console.log('✅ Template already exists:', template.id)
  }

  // Step 3: Create initial blocks
  console.log('\n🧱 Creating template blocks...')

  const existingBlocks = await prisma.tenantBlock.findMany({
    where: { templateId: template.id },
  })

  if (existingBlocks.length === 0) {
    // HERO Block
    await prisma.tenantBlock.create({
      data: {
        templateId: template.id,
        type: 'HERO',
        title: 'La Poblanita',
        subtitle: 'Authentic Mexican Cuisine',
        badgeText: 'FRESH DAILY',
        ctaText: 'Order Now',
        ctaLink: '/order',
        position: 0,
        active: true,
        config: {
          gradient: 'linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 50%, #1e3a5f 100%)',
        },
      },
    })
    console.log('  ✅ Created HERO block')

    // FEATURED_ITEMS Block
    await prisma.tenantBlock.create({
      data: {
        templateId: template.id,
        type: 'FEATURED_ITEMS',
        title: 'Featured Specials',
        subtitle: 'Chef\'s favorites',
        position: 1,
        active: true,
        config: {},
      },
    })
    console.log('  ✅ Created FEATURED_ITEMS block')

    // MENU_SECTION blocks will be created dynamically based on menu sections
    // For now, create a placeholder
    await prisma.tenantBlock.create({
      data: {
        templateId: template.id,
        type: 'MENU_SECTION',
        title: 'Menu',
        subtitle: 'Explore our menu',
        position: 2,
        active: true,
        config: {},
      },
    })
    console.log('  ✅ Created MENU_SECTION block')

    // HOURS_LOCATION Block
    await prisma.tenantBlock.create({
      data: {
        templateId: template.id,
        type: 'HOURS_LOCATION',
        title: 'Hours & Location',
        subtitle: 'Visit us or order online',
        position: 3,
        active: true,
        config: {},
      },
    })
    console.log('  ✅ Created HOURS_LOCATION block')

    // DELIVERY_PARTNERS Block (if enabled)
    await prisma.tenantBlock.create({
      data: {
        templateId: template.id,
        type: 'DELIVERY_PARTNERS',
        title: 'Delivery Options',
        subtitle: 'Order from your favorite platform',
        position: 4,
        active: true,
        config: {},
      },
    })
    console.log('  ✅ Created DELIVERY_PARTNERS block')
  } else {
    console.log(`  ✅ ${existingBlocks.length} blocks already exist`)
  }

  // Step 4: Create asset directories
  console.log('\n📁 Creating asset directories...')
  const fs = await import('fs')
  const path = await import('path')

  const assetDirs = [
    'public/tenant/lapoblanita',
    'public/tenant/lapoblanita/images',
    'public/tenant/lapoblanita/images/menu-items',
  ]

  for (const dir of assetDirs) {
    const fullPath = path.join(process.cwd(), dir)
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true })
      console.log(`  ✅ Created ${dir}`)
    } else {
      console.log(`  ✅ ${dir} already exists`)
    }
  }

  // Create placeholder README
  const readmePath = path.join(process.cwd(), 'public/tenant/lapoblanita/README.md')
  if (!fs.existsSync(readmePath)) {
    fs.writeFileSync(
      readmePath,
      `# La Poblanita Assets

## Required Images

Place the following images in this directory:

- \`images/logo.png\` - Logo (recommended: 200x200px, transparent PNG)
- \`images/hero.jpg\` - Hero banner (recommended: 1920x600px, JPG)
- \`images/menu-items/*.jpg\` - Menu item photos (recommended: 800x600px, JPG)

## Usage

These assets are served at:
- Logo: \`/tenant/lapoblanita/images/logo.png\`
- Hero: \`/tenant/lapoblanita/images/hero.jpg\`
- Menu items: \`/tenant/lapoblanita/images/menu-items/{filename}.jpg\`
`
    )
    console.log('  ✅ Created README.md')
  }

  console.log('\n🎉 La Poblanita setup complete!')
  console.log('\n📋 Next steps:')
  console.log('  1. Add logo to: public/tenant/lapoblanita/images/logo.png')
  console.log('  2. Add hero image to: public/tenant/lapoblanita/images/hero.jpg')
  console.log('  3. Configure template blocks in: /super-admin/template-builder')
  console.log('  4. Add menu items via admin dashboard')
  console.log('  5. Configure Stripe Connect account')
  console.log('  6. Set up Apple Pay domain verification')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

