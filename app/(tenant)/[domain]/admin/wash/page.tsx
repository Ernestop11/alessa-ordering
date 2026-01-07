'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DailySummary {
  date: string;
  summary: {
    totalWashes: number;
    totalRevenue: number;
  };
  byEmployee: Array<{
    id: string;
    name: string;
    count: number;
    revenue: number;
  }>;
  byFleet: Array<{
    id: string;
    name: string;
    count: number;
    revenue: number;
  }>;
  washes: Array<{
    id: string;
    truckNumber: string;
    fleetName: string;
    employeeName: string;
    price: number;
    washedAt: string;
  }>;
}

export default function WashAdminDashboard() {
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/wash/today?date=${selectedDate}`);
        if (res.ok) {
          setSummary(await res.json());
        }
      } catch (err) {
        console.error('Failed to fetch summary:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [selectedDate]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-emerald-400">Wash Dashboard</h1>
              <p className="text-gray-400 text-sm">Rhino Power Washing</p>
            </div>
            <nav className="flex items-center gap-4">
              <Link
                href="./wash/fleets"
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm"
              >
                Fleets
              </Link>
              <Link
                href="./wash/trucks"
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm"
              >
                Trucks
              </Link>
              <Link
                href="./wash/employees"
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm"
              >
                Employees
              </Link>
              <Link
                href="./wash/invoices"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium"
              >
                Invoices
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Date Picker */}
        <div className="mb-6">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full" />
          </div>
        ) : summary ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-900 rounded-xl p-6">
                <div className="text-gray-400 text-sm mb-1">Total Washes</div>
                <div className="text-3xl font-bold text-emerald-400">
                  {summary.summary.totalWashes}
                </div>
              </div>
              <div className="bg-gray-900 rounded-xl p-6">
                <div className="text-gray-400 text-sm mb-1">Total Revenue</div>
                <div className="text-3xl font-bold text-emerald-400">
                  {formatCurrency(summary.summary.totalRevenue)}
                </div>
              </div>
              <div className="bg-gray-900 rounded-xl p-6">
                <div className="text-gray-400 text-sm mb-1">Employees Active</div>
                <div className="text-3xl font-bold">{summary.byEmployee.length}</div>
              </div>
              <div className="bg-gray-900 rounded-xl p-6">
                <div className="text-gray-400 text-sm mb-1">Fleets Serviced</div>
                <div className="text-3xl font-bold">{summary.byFleet.length}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* By Employee */}
              <div className="bg-gray-900 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">By Employee</h2>
                {summary.byEmployee.length === 0 ? (
                  <p className="text-gray-500">No washes today</p>
                ) : (
                  <div className="space-y-3">
                    {summary.byEmployee.map((emp) => (
                      <div
                        key={emp.id}
                        className="flex items-center justify-between py-2 border-b border-gray-800"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center font-bold">
                            {emp.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium">{emp.name}</div>
                            <div className="text-sm text-gray-400">{emp.count} washes</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-emerald-400">
                            {formatCurrency(emp.revenue)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* By Fleet */}
              <div className="bg-gray-900 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">By Fleet</h2>
                {summary.byFleet.length === 0 ? (
                  <p className="text-gray-500">No washes today</p>
                ) : (
                  <div className="space-y-3">
                    {summary.byFleet.map((fleet) => (
                      <div
                        key={fleet.id}
                        className="flex items-center justify-between py-2 border-b border-gray-800"
                      >
                        <div>
                          <div className="font-medium">{fleet.name}</div>
                          <div className="text-sm text-gray-400">{fleet.count} washes</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-emerald-400">
                            {formatCurrency(fleet.revenue)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Washes */}
            <div className="bg-gray-900 rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Washes</h2>
              {summary.washes.length === 0 ? (
                <p className="text-gray-500">No washes on this date</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-gray-400 text-sm border-b border-gray-800">
                        <th className="pb-3">Time</th>
                        <th className="pb-3">Truck</th>
                        <th className="pb-3">Fleet</th>
                        <th className="pb-3">Employee</th>
                        <th className="pb-3 text-right">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.washes.map((wash) => (
                        <tr key={wash.id} className="border-b border-gray-800/50">
                          <td className="py-3 text-gray-300">{formatTime(wash.washedAt)}</td>
                          <td className="py-3 font-medium">{wash.truckNumber}</td>
                          <td className="py-3 text-gray-400">{wash.fleetName}</td>
                          <td className="py-3 text-gray-400">{wash.employeeName}</td>
                          <td className="py-3 text-right font-medium text-emerald-400">
                            {formatCurrency(wash.price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">Failed to load data</div>
        )}
      </main>
    </div>
  );
}
