"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Employee {
  id: string;
  name: string;
  role: string;
  tenantId: string;
}

interface EmployeeRecord {
  id: string;
  name: string;
  phone: string;
  pin: string;
  role: string;
  hourlyRate: string | null;
  active: boolean;
  _count: { washes: number; shifts: number };
}

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantSlug = searchParams?.get("tenant") || "rhinopowerwashing";

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    role: "employee",
    hourlyRate: "",
  });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    // Check if logged in
    const stored = localStorage.getItem("washEmployee");
    if (!stored) {
      router.push(`/wash-login?tenant=${tenantSlug}`);
      return;
    }

    const emp = JSON.parse(stored);

    // Only owners and staff can access dashboard
    if (!["owner", "staff"].includes(emp.role)) {
      router.push(`/wash-clock?tenant=${tenantSlug}`);
      return;
    }

    setEmployee(emp);
    fetchEmployees();
  }, [router, tenantSlug]);

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`/api/wash/employees?tenantSlug=${tenantSlug}`);
      const data = await res.json();
      if (data.employees) {
        setEmployees(data.employees);
      }
    } catch (err) {
      console.error("Failed to fetch employees:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);

    try {
      const res = await fetch("/api/wash/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug,
          name: formData.name,
          phone: formData.phone,
          role: formData.role,
          hourlyRate: formData.hourlyRate || null,
          requesterId: employee?.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || "Failed to add employee");
        return;
      }

      // Refresh list and close modal
      await fetchEmployees();
      setShowAddModal(false);
      setFormData({ name: "", phone: "", role: "employee", hourlyRate: "" });
    } catch (err) {
      setFormError("Connection error. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteEmployee = async (empId: string, empName: string) => {
    if (!confirm(`Delete ${empName}? This cannot be undone.`)) return;

    try {
      const res = await fetch("/api/wash/employees", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: empId,
          requesterId: employee?.id,
        }),
      });

      if (res.ok) {
        await fetchEmployees();
      }
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("washEmployee");
    router.push(`/wash-login?tenant=${tenantSlug}`);
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8 pt-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Employee Dashboard</h1>
            <p className="text-slate-400">Welcome, {employee?.name}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/wash-clock?tenant=${tenantSlug}`)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm transition-all"
            >
              Time Clock
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 text-sm transition-all"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800/50 rounded-xl p-4">
            <div className="text-slate-400 text-sm">Total Employees</div>
            <div className="text-3xl font-bold text-white">{employees.length}</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4">
            <div className="text-slate-400 text-sm">Active</div>
            <div className="text-3xl font-bold text-green-400">
              {employees.filter((e) => e.active).length}
            </div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4">
            <div className="text-slate-400 text-sm">Total Shifts</div>
            <div className="text-3xl font-bold text-blue-400">
              {employees.reduce((sum, e) => sum + e._count.shifts, 0)}
            </div>
          </div>
        </div>

        {/* Employees List */}
        <div className="bg-slate-800/50 rounded-xl overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-slate-700">
            <h2 className="text-lg font-semibold text-white">Employees</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white text-sm font-medium transition-all"
            >
              + Add Employee
            </button>
          </div>

          <div className="divide-y divide-slate-700">
            {employees.map((emp) => (
              <div
                key={emp.id}
                className="flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                      emp.role === "owner"
                        ? "bg-yellow-600"
                        : emp.role === "staff"
                        ? "bg-blue-600"
                        : "bg-slate-600"
                    }`}
                  >
                    {emp.name[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{emp.name}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs capitalize ${
                          emp.role === "owner"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : emp.role === "staff"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-slate-600/50 text-slate-400"
                        }`}
                      >
                        {emp.role}
                      </span>
                    </div>
                    <div className="text-slate-400 text-sm">
                      {formatPhone(emp.phone)} • PIN: {emp.pin}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <div className="text-slate-400">{emp._count.shifts} shifts</div>
                  </div>
                  {employee?.role === "owner" && emp.id !== employee?.id && (
                    <button
                      onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                      className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}

            {employees.length === 0 && (
              <div className="p-8 text-center text-slate-400">
                No employees yet. Add your first employee to get started.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Add Employee</h3>

            <form onSubmit={handleAddEmployee}>
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-400 text-sm mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-sm mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                  <p className="text-slate-500 text-xs mt-1">
                    Last 4 digits will be their login PIN
                  </p>
                </div>

                <div>
                  <label className="block text-slate-400 text-sm mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="employee">Employee</option>
                    <option value="staff">Staff</option>
                    {employee?.role === "owner" && <option value="owner">Owner</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-sm mb-1">Hourly Rate (optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                    placeholder="15.00"
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {formError && (
                  <div className="px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                    {formError}
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white font-medium transition-all disabled:opacity-50"
                >
                  {formLoading ? "Adding..." : "Add Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
