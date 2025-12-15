/**
 * Restaurant Status API
 *
 * Returns real-time open/closed status for frontend polling.
 *
 * HOW IT WORKS:
 * 1. Frontend polls this endpoint every 10 seconds (see OrderPageClient.tsx)
 * 2. Uses lib/hours-validator.ts which handles:
 *    - Timezone conversion (VPS is UTC, restaurant uses America/Los_Angeles)
 *    - Operating hours validation (storeHours per day)
 *    - Holidays and temporary closures
 * 3. Checks both `isOpen` flag (manual toggle) AND operating hours schedule
 *
 * OPERATING HOURS FORMATS SUPPORTED:
 * - New format: { storeHours: { monday: { open, close, closed } }, timezone: '...' }
 * - Old format: { monday: { open, close, enabled }, ... } (auto-converted)
 *
 * TIMEZONE FIX (2025-12-14):
 * The VPS runs in UTC. Without timezone handling, 4pm PST Sunday would appear
 * as 12am UTC Monday, causing "closed on Monday" errors. The hours-validator
 * uses Intl.DateTimeFormat to convert server time to restaurant's local timezone.
 */
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawOperatingHours = settings?.operatingHours as any;
    const timeZone = settings?.timeZone || 'America/Los_Angeles';

    // Detect format and convert to hours-validator format
    // New format: { storeHours: {...}, timezone: '...', holidays: [...] }
    // Old format: { monday: { open, close, enabled }, ... }
    let formattedOperatingHours = null;

    if (rawOperatingHours && typeof rawOperatingHours === 'object') {
      // Check if it's already in the new format (has storeHours property)
      if (rawOperatingHours.storeHours) {
        // Already in correct format, just ensure timezone is set
        formattedOperatingHours = {
          ...rawOperatingHours,
          timezone: rawOperatingHours.timezone || timeZone,
        };
      } else if (Object.keys(rawOperatingHours).length > 0) {
        // Old flat format - convert to new format
        const storeHours: Record<string, { open: string; close: string; closed: boolean }> = {};
        for (const [day, hours] of Object.entries(rawOperatingHours)) {
          if (hours && typeof hours === 'object' && 'open' in (hours as object)) {
            const h = hours as { open?: string; close?: string; enabled?: boolean; closed?: boolean };
            storeHours[day] = {
              open: h.open || '09:00',
              close: h.close || '21:00',
              closed: h.closed === true || h.enabled === false,
            };
          }
        }
        if (Object.keys(storeHours).length > 0) {
          formattedOperatingHours = {
            timezone: timeZone,
            storeHours,
          };
        }
      }
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
