/**
 * Time-Specific Menu Item Utilities
 * 
 * Handles time-based availability and pricing for menu items
 * (e.g., Taco Tuesday, Lunch Specials, Weekend Deals)
 */

export interface TimeSpecificConfig {
  timeSpecificEnabled: boolean;
  timeSpecificDays: number[];
  timeSpecificStartTime?: string | null;
  timeSpecificEndTime?: string | null;
  timeSpecificPrice?: number | null;
  timeSpecificLabel?: string | null;
  regularPrice: number;
}

/**
 * Check if a time-specific item should be active/visible right now
 */
export function isTimeSpecificActive(config: TimeSpecificConfig): boolean {
  if (!config.timeSpecificEnabled) return false;
  
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Check if today is in the allowed days
  if (!config.timeSpecificDays.includes(currentDay)) return false;
  
  // Check time window if specified
  if (config.timeSpecificStartTime && config.timeSpecificEndTime) {
    const [startHour, startMin] = config.timeSpecificStartTime.split(':').map(Number);
    const [endHour, endMin] = config.timeSpecificEndTime.split(':').map(Number);
    
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTime = currentHour * 60 + currentMin;
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    // Handle overnight time windows (e.g., 22:00 - 02:00)
    if (endTime < startTime) {
      // Overnight window
      if (currentTime < startTime && currentTime > endTime) return false;
    } else {
      // Normal window
      if (currentTime < startTime || currentTime > endTime) return false;
    }
  }
  
  return true;
}

/**
 * Get the price for an item based on time-specific rules
 * Returns the special price if active, otherwise regular price
 */
export function getTimeSpecificPrice(config: TimeSpecificConfig): number {
  if (isTimeSpecificActive(config)) {
    return config.timeSpecificPrice ?? config.regularPrice;
  }
  return config.regularPrice;
}

/**
 * Get the display label for a time-specific item
 * Returns the special label if active, otherwise null
 */
export function getTimeSpecificLabel(config: TimeSpecificConfig): string | null {
  if (isTimeSpecificActive(config)) {
    return config.timeSpecificLabel || null;
  }
  return null;
}

/**
 * Check if an item should be shown in the menu
 * Time-specific items are hidden when not active
 */
export function shouldShowItem(config: TimeSpecificConfig): boolean {
  if (!config.timeSpecificEnabled) return true; // Always show non-time-specific items
  return isTimeSpecificActive(config); // Only show time-specific items when active
}

/**
 * Format day numbers to day names
 */
export function formatDays(days: number[]): string {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days.map(d => dayNames[d]).join(', ');
}

/**
 * Get a human-readable description of the time-specific schedule
 */
export function getTimeSpecificDescription(config: TimeSpecificConfig): string | null {
  if (!config.timeSpecificEnabled) return null;
  
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const days = config.timeSpecificDays.map(d => dayNames[d]).join(', ');
  
  let description = `Available on ${days}`;
  
  if (config.timeSpecificStartTime && config.timeSpecificEndTime) {
    description += ` from ${config.timeSpecificStartTime} to ${config.timeSpecificEndTime}`;
  }
  
  if (config.timeSpecificPrice && config.timeSpecificPrice !== config.regularPrice) {
    description += ` (Special price: $${config.timeSpecificPrice.toFixed(2)})`;
  }
  
  return description;
}

