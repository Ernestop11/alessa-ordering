#!/usr/bin/env node

import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const prisma = new PrismaClient()

async function main() {
  console.log('🌮 ===================================')
  console.log('🌮 LAS REINAS COLUSA - DATABASE SEEDER')
  console.log('🌮 ===================================\n')

  // Load menu data
  const menuDataPath = path.join(__dirname, 'seed-data/las-reinas-menu.json')
  console.log(`📂 Loading menu data from: ${menuDataPath}`)

  const menuData = JSON.parse(fs.readFileSync(menuDataPath, 'utf-8'))
  console.log(`✅ Menu data loaded successfully\n`)

  // Find or create tenant
  console.log('🔍 Checking for existing tenant...')
  let tenant = await prisma.tenant.findFirst({
    where: { slug: 'lasreinas' }
  })

  if (tenant) {
    console.log(`⚠️  Tenant already exists: ${tenant.name} (ID: ${tenant.id})`)
    const readline = await import('readline')
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    const answer = await new Promise((resolve) => {
      rl.question('Do you want to DELETE and re-seed? (yes/no): ', resolve)
    })
    rl.close()

    if (answer.toLowerCase() === 'yes') {
      console.log('🗑️  Deleting existing menu items and sections...')

      // Delete in correct order due to foreign keys
      await prisma.menuItem.deleteMany({ where: { tenantId: tenant.id } })
      await prisma.menuSection.deleteMany({ where: { tenantId: tenant.id } })

      console.log('✅ Cleanup complete')
    } else {
      console.log('❌ Seeding cancelled')
      return
    }
  } else {
    // Create new tenant
    console.log('📝 Creating new tenant...')
    tenant = await prisma.tenant.create({
      data: {
        name: menuData.tenant.name,
        slug: menuData.tenant.slug,
        domain: menuData.tenant.domain,
        description: menuData.tenant.description,
        address: menuData.tenant.address,
        phone: menuData.tenant.phone,
        email: menuData.tenant.email,
        settings: menuData.tenant.settings,
      }
    })
    console.log(`✅ Created tenant: ${tenant.name} (ID: ${tenant.id})\n`)
  }

  // Create menu sections
  console.log('📁 Creating menu sections...')
  const sectionMap = {}

  for (const sectionData of menuData.sections) {
    const section = await prisma.menuSection.create({
      data: {
        name: sectionData.name,
        description: sectionData.description,
        type: sectionData.type,
        position: sectionData.position,
        tenantId: tenant.id
      }
    })
    sectionMap[section.name] = section.id
    console.log(`  ✓ ${sectionData.icon} ${section.name}`)
  }

  console.log(`✅ Created ${menuData.sections.length} sections\n`)

  // Create menu items
  console.log('🍽️  Creating menu items...')
  let itemCount = 0
  let featuredCount = 0
  const categoryCounts = {}

  for (const itemData of menuData.items) {
    const sectionId = sectionMap[itemData.section]

    if (!sectionId) {
      console.warn(`  ⚠️  Section not found for: ${itemData.name} (${itemData.section})`)
      continue
    }

    await prisma.menuItem.create({
      data: {
        name: itemData.name,
        description: itemData.description,
        price: itemData.price,
        category: itemData.category,
        available: itemData.available,
        isFeatured: itemData.isFeatured,
        tags: itemData.tags || [],
        menuSectionId: sectionId,
        tenantId: tenant.id,
      }
    })

    itemCount++
    if (itemData.isFeatured) featuredCount++

    // Track category counts
    categoryCounts[itemData.category] = (categoryCounts[itemData.category] || 0) + 1

    // Progress indicator
    if (itemCount % 10 === 0) {
      console.log(`  ... ${itemCount} items created`)
    }
  }

  console.log(`✅ Created ${itemCount} menu items\n`)

  // Summary statistics
  console.log('📊 SUMMARY STATISTICS')
  console.log('─────────────────────────────────')
  console.log(`Tenant:          ${tenant.name}`)
  console.log(`Slug:            ${tenant.slug}`)
  console.log(`Domain:          ${tenant.domain}`)
  console.log(`Menu Sections:   ${menuData.sections.length}`)
  console.log(`Menu Items:      ${itemCount}`)
  console.log(`Featured Items:  ${featuredCount}`)
  console.log(`\nBreakdown by Category:`)

  Object.entries(categoryCounts).forEach(([category, count]) => {
    console.log(`  ${category.padEnd(15)} ${count} items`)
  })

  console.log('\n🎉 LAS REINAS SEEDING COMPLETE!')
  console.log('─────────────────────────────────')
  console.log('\n✅ Next Steps:')
  console.log('1. Upload logo to /public/tenant/lasreinas/images/logo.png')
  console.log('2. Upload hero image to /public/tenant/lasreinas/images/hero-quesabirria-action.jpg')
  console.log('3. Set primary color in tenant settings: #DC2626')
  console.log('4. Visit https://lasreinas.order.alessacloud.com to test')
  console.log('\n')
}

main()
  .catch((e) => {
    console.error('\n❌ ERROR during seeding:')
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
