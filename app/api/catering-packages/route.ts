import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';

export async function GET() {
  try {
    const tenant = await requireTenant();

    // Fetch sections with their packages
    const sections = await prisma.cateringSection.findMany({
      where: { tenantId: tenant.id },
      orderBy: { position: 'asc' },
      include: {
        packages: {
          where: { available: true },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    // Fetch gallery images from settings
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: tenant.id },
      select: { cateringGallery: true },
    });

    return NextResponse.json({
      sections,
      gallery: settings?.cateringGallery || [],
    });
  } catch (err) {
    console.error('Failed to fetch catering packages', err);
    return NextResponse.json({ error: 'Failed to fetch catering packages' }, { status: 500 });
  }
}
