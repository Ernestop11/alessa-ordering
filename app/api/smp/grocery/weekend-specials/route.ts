import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';

/**
 * SMP (Switch Menu Pro) Integration Endpoint
 * Returns weekend special grocery items with images for digital menu displays
 */
export async function GET(req: Request) {
  try {
    const tenant = await requireTenant();

    // Fetch all weekend special items
    const weekendSpecials = await prisma.groceryItem.findMany({
      where: {
        tenantId: tenant.id,
        isWeekendSpecial: true,
        available: true,
      },
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' },
      ],
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        weekendPrice: true,
        unit: true,
        image: true,
        category: true,
        weekendStartDate: true,
        weekendEndDate: true,
      },
    });

    // Filter by date range if dates are set
    const now = new Date();
    const activeSpecials = weekendSpecials.filter(item => {
      // If no dates set, always active
      if (!item.weekendStartDate && !item.weekendEndDate) return true;

      // Check if current date is within range
      const afterStart = !item.weekendStartDate || now >= item.weekendStartDate;
      const beforeEnd = !item.weekendEndDate || now <= item.weekendEndDate;

      return afterStart && beforeEnd;
    });

    // Format for SMP display
    const formattedSpecials = activeSpecials.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description,
      regularPrice: item.price,
      specialPrice: item.weekendPrice || item.price,
      savings: item.price - (item.weekendPrice || item.price),
      savingsPercent: item.weekendPrice
        ? Math.round(((item.price - item.weekendPrice) / item.price) * 100)
        : 0,
      unit: item.unit,
      image: item.image,
      category: item.category,
      startDate: item.weekendStartDate,
      endDate: item.weekendEndDate,
    }));

    // Return formatted data
    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
      },
      weekendSpecials: formattedSpecials,
      count: formattedSpecials.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[SMP Weekend Specials API Error]', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch weekend specials',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
