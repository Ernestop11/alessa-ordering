import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';
import { validateOperatingHours } from '@/lib/hours-validator';

// Force dynamic rendering - never cache this route
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tenant = await requireTenant();

    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: tenant.id },
      select: {
        isOpen: true,
        operatingHours: true,
        timeZone: true,
      },
    });

    const isOpenFlag = settings?.isOpen === true;
    const rawOperatingHours = settings?.operatingHours as Record<string, { open: string; close: string; enabled?: boolean; closed?: boolean }> | null;
    const timeZone = settings?.timeZone || 'America/Los_Angeles';

    // Convert operatingHours to the format expected by hours-validator
    // The validator expects: { timezone, storeHours: { day: { open, close, closed } } }
    let formattedOperatingHours = null;
    if (rawOperatingHours && Object.keys(rawOperatingHours).length > 0) {
      const storeHours: Record<string, { open: string; close: string; closed: boolean }> = {};
      for (const [day, hours] of Object.entries(rawOperatingHours)) {
        if (hours && typeof hours === 'object') {
          storeHours[day] = {
            open: hours.open || '09:00',
            close: hours.close || '21:00',
            // Handle both 'enabled' (old format) and 'closed' (new format)
            closed: hours.closed === true || hours.enabled === false,
          };
        }
      }
      formattedOperatingHours = {
        timezone: timeZone,
        storeHours,
      };
    }

    const validation = validateOperatingHours(formattedOperatingHours, isOpenFlag);

    const response = NextResponse.json({
      isOpen: validation.isOpen,
      message: validation.message || '',
      timestamp: Date.now(),
    });

    // Prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (err) {
    console.error('[restaurant-status] GET error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch restaurant status' },
      { status: 500 }
    );
  }
}
