import { NextRequest, NextResponse } from 'next/server';
import { resolveInventoryAuth } from '@/lib/inventory-auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const auth = await resolveInventoryAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all menu sections as departments with inventory summaries
    const sections = await prisma.menuSection.findMany({
      where: { tenantId: auth.tenantId },
      select: {
        id: true,
        name: true,
        type: true,
        position: true,
        _count: {
          select: { inventoryItems: true },
        },
      },
      orderBy: { position: 'asc' },
    });

    // Get stock value and low-stock counts per department
    const departments = await Promise.all(
      sections.map(async (section) => {
        const items = await prisma.inventoryItem.findMany({
          where: { tenantId: auth.tenantId, menuSectionId: section.id, active: true },
          select: {
            currentStock: true,
            costPerUnit: true,
            reorderPoint: true,
            expirationDate: true,
          },
        });

        const totalStockValue = items.reduce(
          (sum, item) => sum + item.currentStock * item.costPerUnit,
          0
        );

        const lowStockCount = items.filter(
          (item) => item.reorderPoint !== null && item.currentStock <= item.reorderPoint
        ).length;

        const expiringCount = items.filter((item) => {
          if (!item.expirationDate) return false;
          const daysUntilExpiry = Math.ceil(
            (item.expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
        }).length;

        return {
          id: section.id,
          name: section.name,
          type: section.type,
          position: section.position,
          itemCount: section._count.inventoryItems,
          totalStockValue: Math.round(totalStockValue * 100) / 100,
          lowStockCount,
          expiringCount,
        };
      })
    );

    // Also get unassigned items (no department)
    const unassignedCount = await prisma.inventoryItem.count({
      where: { tenantId: auth.tenantId, menuSectionId: null, active: true },
    });

    return NextResponse.json({
      departments,
      unassignedCount,
    });
  } catch (error: any) {
    console.error('[Inventory Departments GET]', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch departments' }, { status: 500 });
  }
}
