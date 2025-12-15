import { NextResponse } from 'next/server';
import { requireTenant } from '@/lib/tenant';
import prisma from '@/lib/prisma';

/**
 * GET - Fetch hero images for polling (public endpoint for frontend updates)
 */
export async function GET() {
  try {
    const tenant = await requireTenant();

    const tenantSettings = await prisma.tenantSettings.findUnique({
      where: { tenantId: tenant.id },
      select: { branding: true },
    });

    const branding = (tenantSettings?.branding || {}) as any;
    const heroImages = branding.heroImages || [];

    return NextResponse.json(
      { heroImages },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    console.error('[Hero Images GET Error]', error);
    return NextResponse.json({ heroImages: [] }, { status: 200 });
  }
}
