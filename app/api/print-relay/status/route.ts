import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Print Relay Status API
 *
 * Returns current restaurant status (open/closed) and schedule info
 * for the local print relay to manage Mac sleep/wake cycles.
 *
 * No authentication required - just public status info.
 */

interface StoreHours {
  open: string;
  close: string;
  closed: boolean;
}

interface OperatingHours {
  storeHours: {
    monday: StoreHours;
    tuesday: StoreHours;
    wednesday: StoreHours;
    thursday: StoreHours;
    friday: StoreHours;
    saturday: StoreHours;
    sunday: StoreHours;
  };
  holidays?: Array<{
    id: string;
    date: string;
    name: string;
    closed?: boolean;
    open?: string;
    close?: string;
  }>;
  temporarilyClosed?: boolean;
  closedMessage?: string;
  timezone?: string;
}

export async function GET(request: NextRequest) {
  const tenantSlug = request.nextUrl.searchParams.get('tenant');

  if (!tenantSlug) {
    return NextResponse.json({ error: 'Missing tenant parameter' }, { status: 400 });
  }

  // Get tenant settings
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    include: {
      settings: {
        select: {
          operatingHours: true,
          timeZone: true,
          isOpen: true,
        },
      },
    },
  });

  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }

  const settings = tenant.settings;
  const operatingHours = settings?.operatingHours as OperatingHours | null;
  const timezone = operatingHours?.timezone || settings?.timeZone || 'America/Los_Angeles';

  // Get current time in restaurant's timezone
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const weekday = parts.find(p => p.type === 'weekday')?.value?.toLowerCase() || 'monday';
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
  const currentTime = hour * 60 + minute; // minutes since midnight

  // Check if temporarily closed
  if (operatingHours?.temporarilyClosed || settings?.isOpen === false) {
    return NextResponse.json({
      isOpen: false,
      reason: 'temporarily_closed',
      message: operatingHours?.closedMessage || 'Restaurant is temporarily closed',
      timezone,
    });
  }

  // Check for holiday
  const todayStr = now.toISOString().split('T')[0];
  const holiday = operatingHours?.holidays?.find(h => h.date === todayStr);
  if (holiday) {
    if (holiday.closed !== false && !holiday.open) {
      return NextResponse.json({
        isOpen: false,
        reason: 'holiday',
        holidayName: holiday.name,
        timezone,
      });
    }
    // Holiday with special hours - use those instead
    if (holiday.open && holiday.close) {
      const [openH, openM] = holiday.open.split(':').map(Number);
      const [closeH, closeM] = holiday.close.split(':').map(Number);
      const openTime = openH * 60 + openM;
      const closeTime = closeH * 60 + closeM;
      const isOpen = currentTime >= openTime && currentTime < closeTime;

      return NextResponse.json({
        isOpen,
        reason: isOpen ? 'holiday_hours' : 'outside_holiday_hours',
        holidayName: holiday.name,
        todayHours: { open: holiday.open, close: holiday.close },
        nextOpen: isOpen ? null : getNextDateTime(timezone, openH, openM),
        nextClose: isOpen ? getNextDateTime(timezone, closeH, closeM) : null,
        timezone,
      });
    }
  }

  // Get today's regular hours
  const dayKey = weekday as keyof OperatingHours['storeHours'];
  const todayHours = operatingHours?.storeHours?.[dayKey];

  if (!todayHours || todayHours.closed) {
    // Find next open day
    const nextOpenInfo = findNextOpenDay(operatingHours, weekday, timezone);
    return NextResponse.json({
      isOpen: false,
      reason: 'closed_today',
      nextOpen: nextOpenInfo?.nextOpen,
      timezone,
    });
  }

  // Parse open/close times
  const [openH, openM] = todayHours.open.split(':').map(Number);
  const [closeH, closeM] = todayHours.close.split(':').map(Number);
  const openTime = openH * 60 + openM;
  const closeTime = closeH * 60 + closeM;

  const isOpen = currentTime >= openTime && currentTime < closeTime;

  // Calculate next open/close times
  let nextOpen = null;
  let nextClose = null;

  if (isOpen) {
    nextClose = getNextDateTime(timezone, closeH, closeM);
  } else if (currentTime < openTime) {
    // Before opening today
    nextOpen = getNextDateTime(timezone, openH, openM);
  } else {
    // After closing - find next open
    const nextOpenInfo = findNextOpenDay(operatingHours, weekday, timezone);
    nextOpen = nextOpenInfo?.nextOpen;
  }

  return NextResponse.json({
    isOpen,
    reason: isOpen ? 'within_hours' : 'outside_hours',
    currentTime: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
    todayHours: { open: todayHours.open, close: todayHours.close },
    nextOpen,
    nextClose,
    timezone,
    operatingHours: operatingHours?.storeHours,
  });
}

function getNextDateTime(timezone: string, hour: number, minute: number): string {
  const now = new Date();
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }
  return target.toISOString();
}

function findNextOpenDay(
  operatingHours: OperatingHours | null,
  currentDay: string,
  timezone: string
): { nextOpen: string } | null {
  if (!operatingHours?.storeHours) return null;

  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentIndex = days.indexOf(currentDay);

  for (let i = 1; i <= 7; i++) {
    const nextIndex = (currentIndex + i) % 7;
    const nextDay = days[nextIndex] as keyof OperatingHours['storeHours'];
    const hours = operatingHours.storeHours[nextDay];

    if (hours && !hours.closed) {
      const [openH, openM] = hours.open.split(':').map(Number);
      const now = new Date();
      const target = new Date(now);
      target.setDate(target.getDate() + i);
      target.setHours(openH, openM, 0, 0);
      return { nextOpen: target.toISOString() };
    }
  }

  return null;
}
