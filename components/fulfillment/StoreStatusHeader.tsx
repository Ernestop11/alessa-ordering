"use client";

import { useState, useEffect } from 'react';

interface StoreHours {
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
}

interface Props {
  onEditHours?: () => void;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_ABBREV = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function StoreStatusHeader({ onEditHours }: Props) {
  const [isOpen, setIsOpen] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storeHours, setStoreHours] = useState<StoreHours[]>([]);
  const [todayHours, setTodayHours] = useState<string | null>(null);

  useEffect(() => {
    loadStoreStatus();
  }, []);

  const loadStoreStatus = async () => {
    try {
      const [statusRes, hoursRes] = await Promise.all([
        fetch('/api/restaurant-status'),
        fetch('/api/admin/tenant-settings'),
      ]);

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setIsOpen(statusData.isOpen ?? true);
      }

      if (hoursRes.ok) {
        const hoursData = await hoursRes.json();
        const hours = hoursData.storeHours || [];
        setStoreHours(hours);

        // Get today's hours
        const today = new Date().getDay();
        const todaySchedule = hours.find((h: StoreHours) => h.dayOfWeek === today);
        if (todaySchedule) {
          if (todaySchedule.isClosed) {
            setTodayHours('Closed');
          } else if (todaySchedule.openTime && todaySchedule.closeTime) {
            setTodayHours(`${formatTime(todaySchedule.openTime)} - ${formatTime(todaySchedule.closeTime)}`);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load store status:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: string): string => {
    try {
      const [hours, minutes] = time.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    } catch {
      return time;
    }
  };

  const toggleStoreStatus = async () => {
    setSaving(true);
    try {
      const newStatus = !isOpen;
      const response = await fetch('/api/admin/tenant-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOpen: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update store status');
      }

      setIsOpen(newStatus);
    } catch (err) {
      console.error('Failed to toggle store status:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-100 rounded-xl px-4 py-3 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-32"></div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl px-4 py-3 flex items-center justify-between gap-4 flex-wrap ${
      isOpen ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
    }`}>
      {/* Status indicator and toggle */}
      <div className="flex items-center gap-3">
        {/* Status badge */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-bold text-sm ${
          isOpen ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-200 animate-pulse' : 'bg-red-200'}`}></span>
          {isOpen ? 'OPEN' : 'CLOSED'}
        </div>

        {/* Toggle switch */}
        <button
          onClick={toggleStoreStatus}
          disabled={saving}
          className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isOpen
              ? 'bg-green-600 focus:ring-green-500'
              : 'bg-red-600 focus:ring-red-500'
          } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
              isOpen ? 'translate-x-8' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Today's hours */}
      {todayHours && (
        <div className="flex items-center gap-2 text-sm">
          <span className={`font-medium ${isOpen ? 'text-green-700' : 'text-red-700'}`}>
            Today:
          </span>
          <span className={isOpen ? 'text-green-600' : 'text-red-600'}>
            {todayHours}
          </span>
        </div>
      )}

      {/* Edit hours link */}
      <button
        onClick={onEditHours}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          isOpen
            ? 'text-green-700 hover:bg-green-100'
            : 'text-red-700 hover:bg-red-100'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Edit Hours
      </button>
    </div>
  );
}
