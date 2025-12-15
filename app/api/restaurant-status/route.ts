import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';

// Force dynamic rendering - never cache this route
export const dynamic = 'force-dynamic';

// Operating hours validation (same logic as order page)
function validateOperatingHours(
  operatingHours: Record<string, { open: string; close: string; enabled: boolean }> | null | undefined,
  isOpenFlag: boolean
): { isOpen: boolean; message: string } {
  // If manually closed, always show closed
  if (!isOpenFlag) {
    return { isOpen: false, message: 'We are currently closed.' };
  }

  // If no operating hours configured, use isOpen flag only
  if (!operatingHours || Object.keys(operatingHours).length === 0) {
    return { isOpen: isOpenFlag, message: isOpenFlag ? '' : 'We are currently closed.' };
  }

  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = days[now.getDay()];
  const todayHours = operatingHours[currentDay];

  if (!todayHours || !todayHours.enabled) {
    return { isOpen: false, message: `We are closed on ${currentDay.charAt(0).toUpperCase() + currentDay.slice(1)}s.` };
  }

  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [openHour, openMin] = todayHours.open.split(':').map(Number);
  const [closeHour, closeMin] = todayHours.close.split(':').map(Number);
  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;

  if (currentTime < openTime) {
    return { isOpen: false, message: `We open at ${todayHours.open}. Please check back soon!` };
  }

  if (currentTime >= closeTime) {
    return { isOpen: false, message: `We are closed for the day. We open again tomorrow.` };
  }

  return { isOpen: true, message: '' };
}

export async function GET() {
  try {
    const tenant = await requireTenant();

    const settings = await prisma.tenantSettings.findUnique({
      where: { tenantId: tenant.id },
      select: {
        isOpen: true,
        operatingHours: true,
      },
    });

    const isOpenFlag = settings?.isOpen === true;
    const operatingHours = settings?.operatingHours as Record<string, { open: string; close: string; enabled: boolean }> | null;

    const validation = validateOperatingHours(operatingHours, isOpenFlag);

    const response = NextResponse.json({
      isOpen: validation.isOpen,
      message: validation.message,
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
