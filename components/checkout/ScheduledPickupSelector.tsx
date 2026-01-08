'use client';

import { useState, useEffect } from 'react';
import { Clock, Zap, ChevronDown } from 'lucide-react';

interface ScheduledPickupSelectorProps {
  value: Date | null; // null = ASAP
  onChange: (date: Date | null) => void;
  primaryColor?: string;
  operatingHours?: {
    open: string; // "HH:mm"
    close: string; // "HH:mm"
  } | null;
  timezone?: string;
}

// Generate time slots in 15-minute increments
function generateTimeSlots(
  startTime: Date,
  endTime: Date,
  intervalMinutes: number = 15
): Date[] {
  const slots: Date[] = [];
  const current = new Date(startTime);

  // Round up to next interval
  const minutes = current.getMinutes();
  const remainder = minutes % intervalMinutes;
  if (remainder !== 0) {
    current.setMinutes(minutes + (intervalMinutes - remainder));
  }
  current.setSeconds(0);
  current.setMilliseconds(0);

  while (current <= endTime) {
    slots.push(new Date(current));
    current.setMinutes(current.getMinutes() + intervalMinutes);
  }

  return slots;
}

// Format time for display (e.g., "2:30 PM")
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Get relative label (e.g., "In 30 min")
function getRelativeLabel(date: Date, now: Date): string {
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);

  if (diffMins <= 20) return 'ASAP';
  if (diffMins <= 35) return 'In 30 min';
  if (diffMins <= 50) return 'In 45 min';
  if (diffMins <= 70) return 'In 1 hour';
  if (diffMins <= 100) return 'In 1.5 hours';
  if (diffMins <= 130) return 'In 2 hours';
  return formatTime(date);
}

export default function ScheduledPickupSelector({
  value,
  onChange,
  primaryColor = '#DC2626',
  operatingHours,
  timezone = 'America/Los_Angeles',
}: ScheduledPickupSelectorProps) {
  const [showAllTimes, setShowAllTimes] = useState(false);
  const [now, setNow] = useState(new Date());

  // Update "now" every minute
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Calculate available time slots
  const getAvailableSlots = () => {
    const currentTime = new Date(now);

    // Default: allow orders up to 4 hours ahead, or until closing
    let endTime = new Date(currentTime);
    endTime.setHours(endTime.getHours() + 4);

    // If we have operating hours, respect closing time
    if (operatingHours?.close) {
      const [closeHour, closeMin] = operatingHours.close.split(':').map(Number);
      const closingTime = new Date(currentTime);
      closingTime.setHours(closeHour, closeMin, 0, 0);

      // If closing time is before our end time, use closing time
      if (closingTime < endTime) {
        endTime = closingTime;
      }
    }

    // Start from at least 15 minutes from now
    const startTime = new Date(currentTime);
    startTime.setMinutes(startTime.getMinutes() + 15);

    return generateTimeSlots(startTime, endTime, 15);
  };

  const allSlots = getAvailableSlots();

  // Quick pick options: ASAP + next few convenient times
  const quickPicks: Array<{ label: string; value: Date | null; icon?: React.ReactNode }> = [
    { label: 'ASAP', value: null, icon: <Zap className="w-4 h-4" /> },
  ];

  // Add "In 30 min", "In 1 hour" if available
  const thirtyMin = allSlots.find(slot => {
    const diff = (slot.getTime() - now.getTime()) / 60000;
    return diff >= 25 && diff <= 35;
  });
  if (thirtyMin) {
    quickPicks.push({ label: 'In 30 min', value: thirtyMin });
  }

  const oneHour = allSlots.find(slot => {
    const diff = (slot.getTime() - now.getTime()) / 60000;
    return diff >= 55 && diff <= 65;
  });
  if (oneHour) {
    quickPicks.push({ label: 'In 1 hour', value: oneHour });
  }

  // Check if selected value matches a quick pick
  const isSelected = (pickValue: Date | null) => {
    if (pickValue === null && value === null) return true;
    if (pickValue === null || value === null) return false;
    return pickValue.getTime() === value.getTime();
  };

  // Check if value is a custom time (not in quick picks)
  const isCustomTime = value !== null && !quickPicks.some(p => p.value && p.value.getTime() === value.getTime());

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-white/70">
        <Clock className="w-4 h-4" />
        <span>When do you want it?</span>
      </div>

      {/* Quick Pick Buttons */}
      <div className="flex gap-2 flex-wrap">
        {quickPicks.map((pick, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              onChange(pick.value);
              setShowAllTimes(false);
            }}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
              isSelected(pick.value)
                ? 'text-white shadow-lg scale-[1.02]'
                : 'bg-white/5 text-white/80 border border-white/10 hover:border-white/20'
            }`}
            style={isSelected(pick.value) ? {
              backgroundColor: primaryColor,
              boxShadow: `0 4px 12px ${primaryColor}40`
            } : {}}
          >
            {pick.icon}
            {pick.label}
          </button>
        ))}

        {/* Custom Time Button */}
        <button
          type="button"
          onClick={() => setShowAllTimes(!showAllTimes)}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
            isCustomTime
              ? 'text-white shadow-lg'
              : 'bg-white/5 text-white/80 border border-white/10 hover:border-white/20'
          }`}
          style={isCustomTime ? {
            backgroundColor: primaryColor,
            boxShadow: `0 4px 12px ${primaryColor}40`
          } : {}}
        >
          {isCustomTime ? formatTime(value!) : 'Pick a time'}
          <ChevronDown className={`w-4 h-4 transition-transform ${showAllTimes ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* All Time Slots (expandable) */}
      {showAllTimes && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-3 max-h-48 overflow-y-auto">
          <div className="grid grid-cols-4 gap-2">
            {allSlots.map((slot, idx) => {
              const isSlotSelected = value && slot.getTime() === value.getTime();
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    onChange(slot);
                    setShowAllTimes(false);
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isSlotSelected
                      ? 'text-white'
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                  style={isSlotSelected ? { backgroundColor: primaryColor } : {}}
                >
                  {formatTime(slot)}
                </button>
              );
            })}
          </div>
          {allSlots.length === 0 && (
            <p className="text-center text-white/50 text-sm py-4">
              No more time slots available today
            </p>
          )}
        </div>
      )}

      {/* Selected Time Display */}
      {value && (
        <div className="flex items-center gap-2 text-sm">
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: primaryColor }}
          />
          <span className="text-white/70">
            Pickup at <span className="text-white font-medium">{formatTime(value)}</span>
            <span className="text-white/50 ml-1">
              ({getRelativeLabel(value, now)})
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
