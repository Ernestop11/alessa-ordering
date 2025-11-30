import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';

export async function GET() {
  try {
    const tenant = await requireTenant();
    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: tenant.id },
      select: { rewardsGallery: true },
    });

    const response = NextResponse.json({ gallery: (settings?.rewardsGallery as string[]) || [] });
    // Prevent caching to ensure fresh data
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  } catch (err) {
    console.error('[rewards-gallery] GET error:', err);
    const errorResponse = NextResponse.json({ error: 'Failed to fetch gallery' }, { status: 500 });
    errorResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return errorResponse;
  }
}

