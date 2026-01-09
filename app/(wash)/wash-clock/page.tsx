"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Employee {
  id: string;
  name: string;
  role: string;
  tenantId: string;
}

interface ClockStatus {
  isClockedIn: boolean;
  activeShift: { id: string; clockIn: string } | null;
  totalHoursToday: number;
}

export default function ClockPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantSlug = searchParams?.get("tenant") || "rhinopowerwashing";

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [status, setStatus] = useState<ClockStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Check if logged in
    const stored = localStorage.getItem("washEmployee");
    if (!stored) {
      router.push(`/wash-login?tenant=${tenantSlug}`);
      return;
    }

    const emp = JSON.parse(stored);
    setEmployee(emp);

    // Fetch clock status
    fetchStatus(emp.id);

    // Update time every second
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [router, tenantSlug]);

  const fetchStatus = async (employeeId: string) => {
    try {
      const res = await fetch(`/api/wash/clock?employeeId=${employeeId}`);
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error("Failed to fetch status:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClockAction = async () => {
    if (!employee) return;

    setActionLoading(true);
    setMessage("");

    const action = status?.isClockedIn ? "clock_out" : "clock_in";

    try {
      const res = await fetch("/api/wash/clock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: employee.id, action }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "Action failed");
        return;
      }

      if (action === "clock_in") {
        setMessage("Clocked in successfully!");
      } else {
        setMessage(`Clocked out! Worked ${data.shift.hoursWorked} hours.`);
      }

      // Refresh status
      await fetchStatus(employee.id);
    } catch (err) {
      setMessage("Connection error. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("washEmployee");
    router.push(`/wash-login?tenant=${tenantSlug}`);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  const getElapsedTime = () => {
    if (!status?.activeShift) return "0:00:00";
    const start = new Date(status.activeShift.clockIn);
    const elapsed = Math.floor((currentTime.getTime() - start.getTime()) / 1000);
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center p-4">
      {/* Header */}
      <div className="w-full max-w-md flex justify-between items-center mb-8 pt-4">
        <div>
          <h2 className="text-xl font-bold text-white">{employee?.name}</h2>
          <p className="text-slate-400 text-sm capitalize">{employee?.role}</p>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 text-sm transition-all"
        >
          Logout
        </button>
      </div>

      {/* Time Display */}
      <div className="text-center mb-8">
        <div className="text-5xl font-mono font-bold text-white mb-2">
          {formatTime(currentTime)}
        </div>
        <div className="text-slate-400">{formatDate(currentTime)}</div>
      </div>

      {/* Status Card */}
      <div className="w-full max-w-md bg-slate-800/50 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-slate-400">Status</span>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              status?.isClockedIn
                ? "bg-green-500/20 text-green-400"
                : "bg-slate-600/50 text-slate-400"
            }`}
          >
            {status?.isClockedIn ? "Clocked In" : "Clocked Out"}
          </span>
        </div>

        {status?.isClockedIn && (
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-400">Current Shift</span>
            <span className="text-2xl font-mono font-bold text-blue-400">
              {getElapsedTime()}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-slate-400">Today&apos;s Hours</span>
          <span className="text-lg font-semibold text-white">
            {status?.totalHoursToday.toFixed(2)} hrs
          </span>
        </div>
      </div>

      {/* Clock Button */}
      <button
        onClick={handleClockAction}
        disabled={actionLoading}
        className={`w-full max-w-md py-6 rounded-2xl text-xl font-bold transition-all disabled:opacity-50 ${
          status?.isClockedIn
            ? "bg-red-600 hover:bg-red-500 text-white"
            : "bg-green-600 hover:bg-green-500 text-white"
        }`}
      >
        {actionLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Processing...
          </span>
        ) : status?.isClockedIn ? (
          "Clock Out"
        ) : (
          "Clock In"
        )}
      </button>

      {/* Message */}
      {message && (
        <div className="mt-4 px-4 py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-400 text-sm">
          {message}
        </div>
      )}

      {/* Dashboard Link (for owners/staff) */}
      {(employee?.role === "owner" || employee?.role === "staff") && (
        <button
          onClick={() => router.push(`/wash-dashboard?tenant=${tenantSlug}`)}
          className="mt-6 text-slate-400 hover:text-white text-sm underline transition-colors"
        >
          Go to Dashboard
        </button>
      )}

      {/* Footer */}
      <p className="mt-auto pt-8 text-slate-600 text-xs">
        Rhino Power Washing - Time Clock
      </p>
    </div>
  );
}
