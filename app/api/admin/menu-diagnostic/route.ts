import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import prisma from '@/lib/prisma'
import { requireTenant } from '@/lib/tenant'

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    const role = (session?.user as { role?: string } | undefined)?.role
    if (!session || role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenant = await requireTenant()

    // Get ALL menu items from database
    const allItems = await prisma.menuItem.findMany({
      where: { tenantId: tenant.id },
      include: { section: true },
      orderBy: { name: 'asc' },
    })

    // Get items that WILL appear on frontend (available items)
    const frontendVisibleItems = await prisma.menuItem.findMany({
      where: {
        tenantId: tenant.id,
        available: true,
      },
      include: { section: true },
      orderBy: { name: 'asc' },
    })

    // Get items WITH sections
    const itemsInSections = allItems.filter(item => item.menuSectionId !== null)

    // Get ORPHANED items (no section assigned)
    const orphanedItems = allItems.filter(item => item.menuSectionId === null)

    // Get HIDDEN items (available: false)
    const hiddenItems = allItems.filter(item => !item.available)

    // Get all sections
    const sections = await prisma.menuSection.findMany({
      where: { tenantId: tenant.id },
      orderBy: { position: 'asc' },
      include: {
        _count: {
          select: { menuItems: true }
        }
      }
    })

    return NextResponse.json({
      summary: {
        totalItems: allItems.length,
        frontendVisible: frontendVisibleItems.length,
        inSections: itemsInSections.length,
        orphaned: orphanedItems.length,
        hidden: hiddenItems.length,
        totalSections: sections.length,
      },
      items: {
        all: allItems.map(item => ({
          id: item.id,
          name: item.name,
          available: item.available,
          hasSection: !!item.menuSectionId,
          sectionName: item.section?.name || 'No Section',
          image: item.image,
          willShowOnFrontend: item.available,
          status: !item.available ? 'HIDDEN' : item.menuSectionId ? 'IN_SECTION' : 'ORPHANED',
        })),
        orphaned: orphanedItems.map(item => ({
          id: item.id,
          name: item.name,
          available: item.available,
          image: item.image,
        })),
        hidden: hiddenItems.map(item => ({
          id: item.id,
          name: item.name,
          sectionName: item.section?.name || 'No Section',
          image: item.image,
        })),
      },
      sections: sections.map(section => ({
        id: section.id,
        name: section.name,
        type: section.type,
        itemCount: section._count.menuItems,
        position: section.position,
      })),
    })
  } catch (err) {
    console.error('Menu diagnostic error:', err)
    return NextResponse.json({ error: 'Failed to generate diagnostic' }, { status: 500 })
  }
}
