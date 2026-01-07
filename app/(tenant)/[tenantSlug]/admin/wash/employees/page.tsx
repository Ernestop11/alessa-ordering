'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Employee {
  id: string;
  name: string;
  phone: string | null;
  hourlyRate: number | null;
  active: boolean;
  totalWashes: number;
  isClockedIn: boolean;
}

export default function EmployeesManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    pin: '',
    hourlyRate: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/wash/employees?active=false');
      if (res.ok) {
        setEmployees(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/wash/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : null,
        }),
      });

      if (res.ok) {
        setFormData({ name: '', phone: '', pin: '', hourlyRate: '' });
        setShowForm(false);
        fetchEmployees();
      }
    } catch (err) {
      console.error('Failed to create employee:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (employee: Employee) => {
    try {
      const res = await fetch(`/api/wash/employees/${employee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !employee.active }),
      });

      if (res.ok) {
        fetchEmployees();
      }
    } catch (err) {
      console.error('Failed to update employee:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="./" className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-xl font-bold">Employee Management</h1>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium"
            >
              Add Employee
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {employees.map((emp) => (
              <div
                key={emp.id}
                className={`bg-gray-900 rounded-xl p-6 ${!emp.active ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-xl font-bold">
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold">{emp.name}</h3>
                      {emp.phone && <p className="text-gray-400 text-sm">{emp.phone}</p>}
                    </div>
                  </div>
                  {emp.isClockedIn && (
                    <span className="px-2 py-1 bg-emerald-600/20 text-emerald-400 text-xs rounded-full">
                      On Clock
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-2xl font-bold">{emp.totalWashes}</div>
                    <div className="text-xs text-gray-500">Total Washes</div>
                  </div>
                  {emp.hourlyRate && (
                    <div>
                      <div className="text-2xl font-bold">${emp.hourlyRate.toFixed(0)}</div>
                      <div className="text-xs text-gray-500">Hourly Rate</div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => toggleActive(emp)}
                  className={`w-full py-2 rounded-lg text-sm ${
                    emp.active
                      ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                      : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30'
                  }`}
                >
                  {emp.active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            ))}

            {employees.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                No employees yet. Add your first employee.
              </div>
            )}
          </div>
        )}

        {/* Add Employee Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-6">Add New Employee</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">PIN (4 digits)</label>
                  <input
                    type="text"
                    maxLength={4}
                    pattern="[0-9]{4}"
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })}
                    placeholder="Optional"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Hourly Rate</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-400">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.hourlyRate}
                      onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                      placeholder="Optional"
                      className="w-full px-4 py-2 pl-7 bg-gray-800 border border-gray-700 rounded-lg"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium disabled:opacity-50"
                  >
                    {submitting ? 'Creating...' : 'Create Employee'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
