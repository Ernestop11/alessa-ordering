import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';

export async function GET() {
  try {
    const tenant = await requireTenant();
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: tenant.id },
      select: { cateringGallery: true },
    });

    return NextResponse.json({ gallery: settings?.cateringGallery || [] });
  } catch (err) {
    console.error('[catering-gallery] GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch gallery' }, { status: 500 });
  }
}

