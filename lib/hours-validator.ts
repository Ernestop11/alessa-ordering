/**
 * Operating Hours Validation Utility
 *
 * Validates if a restaurant is currently open based on:
 * - Operating hours (store hours or kitchen hours)
 * - Temporary closure flag
 * - Holiday closures
 * - Winter mode (seasonal hours)
 * - Timezone handling
 *
 * TIMEZONE HANDLING (Critical for VPS deployments):
 * =================================================
 * The VPS server runs in UTC. Without timezone conversion, a restaurant
 * in Los Angeles at 4pm Sunday (PST) would appear as Monday 12am (UTC),
 * causing incorrect "closed on Monday" messages.
 *
 * The toTimezone() function uses Intl.DateTimeFormat to convert server
 * time to the restaurant's local timezone before checking operating hours.
 *
 * USAGE:
 * - Called by /api/restaurant-status/route.ts for real-time status polling
 * - Frontend polls every 10 seconds to sync admin toggle with order page
 * - Both "Add to Cart" buttons check this status before allowing orders
 *
 * OPERATING HOURS FORMATS:
 * - New format: { storeHours: { monday: { open, close, closed } }, timezone }
 * - Old format: { monday: { open, close, enabled } } - auto-converted by API
 *
 * @see /api/restaurant-status/route.ts - Status polling endpoint
 * @see /components/order/OrderPageClient.tsx - Frontend status handling
 */

interface DayHours {
  open: string; // Format: "HH:mm" (e.g., "09:00")
  close: string; // Format: "HH:mm" (e.g., "21:00")
  closed: boolean;
}

interface OperatingHours {
  timezone?: string;
  storeHours?: Record<string, DayHours>;
  kitchenHours?: Record<string, DayHours>;
  useKitchenHours?: boolean;
  winterMode?: boolean;
  winterStartDate?: string; // Format: "YYYY-MM-DD"
  winterEndDate?: string; // Format: "YYYY-MM-DD"
  winterHours?: Record<string, DayHours>;
  temporarilyClosed?: boolean;
  closedMessage?: string;
  holidays?: Array<{
    id: string;
    date: string; // Format: "YYYY-MM-DD"
    name: string;
    closingTime?: string; // Optional early closing time (HH:mm). If set, restaurant closes at this time instead of all day
  }>;
}

export interface HoursValidationResult {
  isOpen: boolean;
  reason?: string;
  message?: string;
  nextOpenTime?: string;
}

/**
 * Get the day name from a Date object (lowercase, e.g., "monday")
 */
function getDayName(date: Date): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
}

/**
 * Parse time string (HH:mm) to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert 24-hour time string (HH:mm) to 12-hour AM/PM format
 */
function formatTimeAMPM(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12; // Convert 0 to 12 for midnight, 13-23 to 1-11
  return minutes === 0 ? `${hour12} ${period}` : `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Check if a date falls within winter mode date range
 */
function isInWinterMode(date: Date, winterStartDate?: string, winterEndDate?: string): boolean {
  if (!winterStartDate || !winterEndDate) return false;
  
  const start = new Date(winterStartDate);
  const end = new Date(winterEndDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  
  return date >= start && date <= end;
}

/**
 * Check if a date is a holiday and get the holiday details
 * Returns null if not a holiday, or the holiday object if it is
 */
function getHolidayInfo(date: Date, holidays?: Array<{ date: string; name: string; closingTime?: string }>): { name: string; closingTime?: string } | null {
  if (!holidays || holidays.length === 0) return null;

  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const holiday = holidays.find(h => h.date === dateStr);
  return holiday ? { name: holiday.name, closingTime: holiday.closingTime } : null;
}

/**
 * Get the appropriate hours to use (store, kitchen, or winter)
 */
function getActiveHours(
  hours: OperatingHours | null | undefined,
  currentDate: Date
): Record<string, DayHours> | null {
  if (!hours) return null;

  // Check for winter mode
  if (hours.winterMode && isInWinterMode(currentDate, hours.winterStartDate, hours.winterEndDate)) {
    return hours.winterHours || null;
  }

  // Use kitchen hours if enabled, otherwise store hours
  if (hours.useKitchenHours && hours.kitchenHours) {
    return hours.kitchenHours;
  }

  return hours.storeHours || null;
}

/**
 * Check if current time is within operating hours for a given day
 */
function isWithinHours(currentTime: Date, dayHours: DayHours | null | undefined): boolean {
  if (!dayHours || dayHours.closed) return false;

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const openMinutes = timeToMinutes(dayHours.open);
  const closeMinutes = timeToMinutes(dayHours.close);

  // Handle case where closing time is next day (e.g., 22:00 - 02:00)
  if (closeMinutes < openMinutes) {
    // Closing time is next day
    return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
  }

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

/**
 * Convert a date to a specific timezone
 */
function toTimezone(date: Date, timezone: string = 'America/Los_Angeles'): Date {
  try {
    // Get the time in the target timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(date);
    const year = parseInt(parts.find(p => p.type === 'year')?.value || '0');
    const month = parseInt(parts.find(p => p.type === 'month')?.value || '0') - 1;
    const day = parseInt(parts.find(p => p.type === 'day')?.value || '0');
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
    const second = parseInt(parts.find(p => p.type === 'second')?.value || '0');

    return new Date(year, month, day, hour, minute, second);
  } catch (error) {
    console.warn(`[hours-validator] Invalid timezone "${timezone}", using local time`, error);
    return date;
  }
}

/**
 * Get next open time (simplified - returns next day's open time if closed)
 */
function getNextOpenTime(
  currentDate: Date,
  activeHours: Record<string, DayHours> | null
): string | undefined {
  if (!activeHours) return undefined;

  const dayName = getDayName(currentDate);
  const dayHours = activeHours[dayName];

  if (!dayHours || dayHours.closed) {
    // Find next open day
    for (let i = 1; i <= 7; i++) {
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + i);
      const nextDayName = getDayName(nextDate);
      const nextDayHours = activeHours[nextDayName];
      
      if (nextDayHours && !nextDayHours.closed) {
        return `${nextDayName} at ${formatTimeAMPM(nextDayHours.open)}`;
      }
    }
    return undefined;
  }

  // If we're past closing time today, return tomorrow's open time
  const currentMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();
  const closeMinutes = timeToMinutes(dayHours.close);

  if (currentMinutes >= closeMinutes) {
    // Find next open day
    for (let i = 1; i <= 7; i++) {
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + i);
      const nextDayName = getDayName(nextDate);
      const nextDayHours = activeHours[nextDayName];

      if (nextDayHours && !nextDayHours.closed) {
        return `${nextDayName} at ${formatTimeAMPM(nextDayHours.open)}`;
      }
    }
  }

  return undefined;
}

/**
 * Main validation function
 * 
 * @param operatingHours - The operating hours configuration from tenant settings
 * @param isOpenFlag - The isOpen boolean flag from tenant settings (defaults to true)
 * @param currentDate - Optional current date (defaults to now)
 * @returns HoursValidationResult indicating if restaurant is open and why
 */
export function validateOperatingHours(
  operatingHours: OperatingHours | null | undefined,
  isOpenFlag: boolean | null | undefined = true,
  currentDate: Date = new Date()
): HoursValidationResult {
  // Default to closed if no hours configured (unless explicitly open)
  if (!operatingHours) {
    return {
      isOpen: isOpenFlag === true, // Only open if explicitly true
      reason: isOpenFlag !== true ? 'isOpen flag is not set to true' : undefined,
      message: isOpenFlag !== true ? 'Restaurant is currently closed.' : undefined,
    };
  }

  // Check temporary closure first (highest priority)
  if (operatingHours.temporarilyClosed) {
    return {
      isOpen: false,
      reason: 'temporarily_closed',
      message: operatingHours.closedMessage || 'We are temporarily closed. Check back soon!',
    };
  }

  // Check isOpen flag - must be explicitly true to be open
  if (isOpenFlag !== true) {
    // Even though closed by flag, try to provide helpful messaging
    const timezone = operatingHours.timezone || 'America/Los_Angeles';
    const localDate = toTimezone(currentDate, timezone);
    const activeHours = getActiveHours(operatingHours, localDate);
    const dayName = getDayName(localDate);
    const todayHours = activeHours?.[dayName];

    // Check if we're within today's normal operating hours
    if (todayHours && !todayHours.closed) {
      const currentMinutes = localDate.getHours() * 60 + localDate.getMinutes();
      const openMinutes = timeToMinutes(todayHours.open);
      const closeMinutes = timeToMinutes(todayHours.close);

      // If we're before open time today
      if (currentMinutes < openMinutes) {
        return {
          isOpen: false,
          reason: 'isOpen_flag',
          message: `Kitchen opens at ${formatTimeAMPM(todayHours.open)} today.`,
          nextOpenTime: `today at ${formatTimeAMPM(todayHours.open)}`,
        };
      }

      // If we're within normal hours but admin closed
      if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
        return {
          isOpen: false,
          reason: 'isOpen_flag',
          message: `Kitchen is temporarily closed. Normal hours: ${formatTimeAMPM(todayHours.open)} - ${formatTimeAMPM(todayHours.close)}.`,
          nextOpenTime: undefined,
        };
      }
    }

    // Otherwise find next open time
    const nextOpen = activeHours ? getNextOpenTime(localDate, activeHours) : undefined;

    return {
      isOpen: false,
      reason: 'isOpen_flag',
      message: nextOpen
        ? `Kitchen is closed. We'll be open ${nextOpen}.`
        : 'Restaurant is currently closed.',
      nextOpenTime: nextOpen,
    };
  }

  // Convert current date to restaurant's timezone
  const timezone = operatingHours.timezone || 'America/Los_Angeles';
  const localDate = toTimezone(currentDate, timezone);

  // Check if today is a holiday
  const holidayInfo = getHolidayInfo(localDate, operatingHours.holidays);
  if (holidayInfo) {
    // Check if it's an early closing holiday (has closingTime set)
    if (holidayInfo.closingTime) {
      const currentMinutes = localDate.getHours() * 60 + localDate.getMinutes();
      const closingMinutes = timeToMinutes(holidayInfo.closingTime);

      if (currentMinutes >= closingMinutes) {
        // Past the early closing time
        return {
          isOpen: false,
          reason: 'holiday',
          message: `We closed early at ${formatTimeAMPM(holidayInfo.closingTime)} for ${holidayInfo.name}.`,
        };
      }
      // Before early closing time - continue to regular hours check
      // But we'll use the early closing time as the close time for today
    } else {
      // Full day closure (no closingTime set)
      return {
        isOpen: false,
        reason: 'holiday',
        message: `We are closed for ${holidayInfo.name}.`,
      };
    }
  }

  // Get the active hours (store, kitchen, or winter)
  const activeHours = getActiveHours(operatingHours, localDate);
  
  if (!activeHours) {
    // No hours configured, but isOpenFlag check already handled above
    // If we reach here, isOpenFlag must be true, so we're open
    return {
      isOpen: true,
      reason: undefined,
      message: undefined,
    };
  }

  // Get today's hours
  const dayName = getDayName(localDate);
  let dayHours = activeHours[dayName];

  // Check if day is marked as closed
  if (!dayHours || dayHours.closed) {
    const nextOpen = getNextOpenTime(localDate, activeHours);
    return {
      isOpen: false,
      reason: 'day_closed',
      message: `We are closed on ${dayName}.${nextOpen ? ` We'll be open ${nextOpen}.` : ''}`,
      nextOpenTime: nextOpen,
    };
  }

  // If this is a holiday with early closing, adjust the closing time
  let effectiveCloseTime = dayHours.close;
  let holidayEarlyClose = false;
  if (holidayInfo?.closingTime) {
    effectiveCloseTime = holidayInfo.closingTime;
    holidayEarlyClose = true;
  }

  // Create effective hours for comparison
  const effectiveDayHours = {
    ...dayHours,
    close: effectiveCloseTime,
  };

  // Check if current time is within operating hours
  if (!isWithinHours(localDate, effectiveDayHours)) {
    const nextOpen = getNextOpenTime(localDate, activeHours);
    const hoursMessage = holidayEarlyClose
      ? `We are closing early at ${formatTimeAMPM(effectiveCloseTime)} for ${holidayInfo!.name}. Our regular hours are ${formatTimeAMPM(dayHours.open)} - ${formatTimeAMPM(dayHours.close)}.`
      : `We are currently closed. Our hours today are ${formatTimeAMPM(dayHours.open)} - ${formatTimeAMPM(dayHours.close)}.`;
    return {
      isOpen: false,
      reason: holidayEarlyClose ? 'holiday' : 'outside_hours',
      message: `${hoursMessage}${nextOpen ? ` We'll be open ${nextOpen}.` : ''}`,
      nextOpenTime: nextOpen,
    };
  }

  // Restaurant is open!
  // If it's a holiday with early closing, show a message about early closing
  if (holidayEarlyClose) {
    return {
      isOpen: true,
      message: `We are closing early at ${formatTimeAMPM(effectiveCloseTime)} for ${holidayInfo!.name}.`,
    };
  }

  return {
    isOpen: true,
  };
}

