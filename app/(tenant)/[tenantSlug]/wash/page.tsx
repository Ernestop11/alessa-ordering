'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamic import QRScanner to avoid SSR issues with html5-qrcode
const QRScanner = dynamic(() => import('@/components/wash/QRScanner'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64 bg-gray-900 rounded-2xl">
      <div className="animate-spin w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full" />
    </div>
  ),
});

interface Employee {
  id: string;
  name: string;
  isClockedIn: boolean;
}

interface TruckInfo {
  id: string;
  truckNumber: string;
  description: string | null;
  licensePlate: string | null;
  fleet: {
    id: string;
    name: string;
    pricePerWash: number;
  };
}

type AppState = 'select-employee' | 'scanning' | 'confirm-wash' | 'success';

export default function WashScannerPage() {
  const params = useParams();
  const tenantSlug = params?.tenantSlug as string;
  const [state, setState] = useState<AppState>('select-employee');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [scannedTruck, setScannedTruck] = useState<TruckInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [todayWashes, setTodayWashes] = useState(0);
  const [todayRevenue, setTodayRevenue] = useState(0);

  // Fetch employees
  useEffect(() => {
    if (!tenantSlug) return;

    const fetchEmployees = async () => {
      try {
        const res = await fetch(`/api/wash/employees?tenantSlug=${tenantSlug}`);
        if (res.ok) {
          const data = await res.json();
          setEmployees(data.employees || []);
        }
      } catch (err) {
        console.error('Failed to fetch employees:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [tenantSlug]);

  // Fetch today's stats
  useEffect(() => {
    const fetchTodayStats = async () => {
      try {
        const res = await fetch('/api/wash/today');
        if (res.ok) {
          const data = await res.json();
          setTodayWashes(data.summary.totalWashes);
          setTodayRevenue(data.summary.totalRevenue);
        }
      } catch (err) {
        console.error('Failed to fetch today stats:', err);
      }
    };

    fetchTodayStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchTodayStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setState('scanning');
  };

  const handleQRScan = useCallback(async (qrCode: string) => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/wash/scan?qr=${encodeURIComponent(qrCode)}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to lookup truck');
      }

      const truck = await res.json();
      setScannedTruck(truck);
      setState('confirm-wash');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan truck');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCompleteWash = async () => {
    if (!selectedEmployee || !scannedTruck) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/wash/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          truckId: scannedTruck.id,
          employeeId: selectedEmployee.id,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to record wash');
      }

      // Update today's stats
      setTodayWashes((prev) => prev + 1);
      setTodayRevenue((prev) => prev + scannedTruck.fleet.pricePerWash);

      setState('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete wash');
    } finally {
      setSubmitting(false);
    }
  };

  const handleScanAnother = () => {
    setScannedTruck(null);
    setState('scanning');
  };

  const handleChangeEmployee = () => {
    setSelectedEmployee(null);
    setScannedTruck(null);
    setState('select-employee');
  };

  const handleClockInOut = async () => {
    if (!selectedEmployee) return;

    try {
      const action = selectedEmployee.isClockedIn ? 'out' : 'in';
      const res = await fetch(`/api/wash/employees/${selectedEmployee.id}/clock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        setSelectedEmployee({
          ...selectedEmployee,
          isClockedIn: !selectedEmployee.isClockedIn,
        });
        // Refresh employee list
        const empRes = await fetch(`/api/wash/employees?tenantSlug=${tenantSlug}`);
        if (empRes.ok) {
          const data = await empRes.json();
          setEmployees(data.employees || []);
        }
      }
    } catch (err) {
      console.error('Clock in/out failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur border-b border-gray-800">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-emerald-400">Rhino Wash</h1>
              <p className="text-sm text-gray-400">
                {selectedEmployee ? selectedEmployee.name : 'Select Employee'}
              </p>
            </div>

            {selectedEmployee && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClockInOut}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                    selectedEmployee.isClockedIn
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {selectedEmployee.isClockedIn ? 'Clock Out' : 'Clock In'}
                </button>
                <button
                  onClick={handleChangeEmployee}
                  className="p-2 text-gray-400 hover:text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Today's stats */}
        <div className="flex border-t border-gray-800">
          <div className="flex-1 px-4 py-2 text-center border-r border-gray-800">
            <div className="text-2xl font-bold text-emerald-400">{todayWashes}</div>
            <div className="text-xs text-gray-500">Washes Today</div>
          </div>
          <div className="flex-1 px-4 py-2 text-center">
            <div className="text-2xl font-bold text-emerald-400">
              ${todayRevenue.toFixed(0)}
            </div>
            <div className="text-xs text-gray-500">Revenue</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4">
        {error && (
          <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded-xl text-red-300">
            {error}
          </div>
        )}

        {/* Select Employee */}
        {state === 'select-employee' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Select Your Name</h2>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="space-y-2">
                {employees.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => handleSelectEmployee(emp)}
                    className="w-full p-4 bg-gray-900 hover:bg-gray-800 rounded-xl flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-lg font-bold">
                        {emp.name.charAt(0)}
                      </div>
                      <span className="font-medium">{emp.name}</span>
                    </div>
                    {emp.isClockedIn && (
                      <span className="px-2 py-1 bg-emerald-600/20 text-emerald-400 text-xs rounded-full">
                        On Clock
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Scanning */}
        {state === 'scanning' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-center">Scan Truck QR Code</h2>
            <div className="flex justify-center">
              <QRScanner onScan={handleQRScan} isActive={state === 'scanning'} />
            </div>
            <p className="text-center text-gray-400 text-sm">
              Position the QR code within the frame to scan
            </p>
          </div>
        )}

        {/* Confirm Wash */}
        {state === 'confirm-wash' && scannedTruck && (
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-2xl p-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-600 rounded-full mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-bold">Truck Found!</h2>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Fleet</span>
                  <span className="font-medium">{scannedTruck.fleet.name}</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Truck #</span>
                  <span className="font-medium text-2xl">{scannedTruck.truckNumber}</span>
                </div>
                {scannedTruck.description && (
                  <div className="flex justify-between py-3 border-b border-gray-800">
                    <span className="text-gray-400">Description</span>
                    <span className="font-medium">{scannedTruck.description}</span>
                  </div>
                )}
                {scannedTruck.licensePlate && (
                  <div className="flex justify-between py-3 border-b border-gray-800">
                    <span className="text-gray-400">License Plate</span>
                    <span className="font-medium">{scannedTruck.licensePlate}</span>
                  </div>
                )}
                <div className="flex justify-between py-3">
                  <span className="text-gray-400">Price</span>
                  <span className="font-bold text-2xl text-emerald-400">
                    ${scannedTruck.fleet.pricePerWash.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleCompleteWash}
              disabled={submitting}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 rounded-2xl font-bold text-lg transition flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  Recording...
                </>
              ) : (
                'Complete Wash'
              )}
            </button>

            <button
              onClick={() => setState('scanning')}
              className="w-full py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-300"
            >
              Scan Different Truck
            </button>
          </div>
        )}

        {/* Success */}
        {state === 'success' && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-emerald-600 rounded-full mb-6 animate-bounce">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Wash Complete!</h2>
            <p className="text-gray-400 mb-8">
              {scannedTruck?.truckNumber} - ${scannedTruck?.fleet.pricePerWash.toFixed(2)}
            </p>

            <button
              onClick={handleScanAnother}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 rounded-2xl font-bold text-lg"
            >
              Scan Next Truck
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
