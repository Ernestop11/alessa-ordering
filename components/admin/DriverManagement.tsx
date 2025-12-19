'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Truck,
  Phone,
  Mail,
  Car,
  Loader2,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  Key,
} from 'lucide-react';

interface Driver {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  vehicleType: string | null;
  licensePlate: string | null;
  isActive: boolean;
  pin?: string;
  _count?: {
    deliveries: number;
  };
}

export default function DriverManagement() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [saving, setSaving] = useState(false);
  const [newDriverPin, setNewDriverPin] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    vehicleType: 'car',
    licensePlate: '',
  });

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      const response = await fetch('/api/admin/drivers');
      if (response.ok) {
        const data = await response.json();
        setDrivers(data.drivers);
      }
    } catch (error) {
      console.error('Failed to load drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingDriver
        ? `/api/admin/drivers/${editingDriver.id}`
        : '/api/admin/drivers';
      const method = editingDriver ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save driver');
      }

      const data = await response.json();

      // Show PIN for new drivers
      if (!editingDriver && data.driver?.pin) {
        setNewDriverPin(data.driver.pin);
      } else {
        closeModal();
      }

      loadDrivers();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to save driver');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (driverId: string) => {
    if (!confirm('Are you sure you want to delete this driver?')) return;

    try {
      const response = await fetch(`/api/admin/drivers/${driverId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete driver');
      }

      loadDrivers();
    } catch (error) {
      alert('Failed to delete driver');
    }
  };

  const toggleDriverStatus = async (driver: Driver) => {
    try {
      const response = await fetch(`/api/admin/drivers/${driver.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !driver.isActive }),
      });

      if (!response.ok) {
        throw new Error('Failed to update driver status');
      }

      loadDrivers();
    } catch (error) {
      alert('Failed to update driver status');
    }
  };

  const openEditModal = (driver: Driver) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name,
      phone: driver.phone,
      email: driver.email || '',
      vehicleType: driver.vehicleType || 'car',
      licensePlate: driver.licensePlate || '',
    });
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingDriver(null);
    setNewDriverPin(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      vehicleType: 'car',
      licensePlate: '',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-500/20 p-3">
            <Users className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Drivers</h1>
            <p className="text-white/60">Manage your delivery drivers</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 font-semibold text-white transition hover:bg-emerald-600"
        >
          <Plus className="h-5 w-5" />
          Add Driver
        </button>
      </div>

      {/* Driver List */}
      {drivers.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
          <Truck className="mx-auto h-12 w-12 text-white/30" />
          <h3 className="mt-4 text-lg font-semibold text-white">No drivers yet</h3>
          <p className="mt-2 text-white/60">Add your first driver to start managing deliveries</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {drivers.map((driver) => (
            <div
              key={driver.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-white/20"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-full p-2 ${
                      driver.isActive ? 'bg-emerald-500/20' : 'bg-red-500/20'
                    }`}
                  >
                    <Truck
                      className={`h-5 w-5 ${
                        driver.isActive ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{driver.name}</h3>
                    <span
                      className={`text-xs ${
                        driver.isActive ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {driver.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditModal(driver)}
                    className="rounded-lg p-2 text-white/40 transition hover:bg-white/10 hover:text-white"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(driver.id)}
                    className="rounded-lg p-2 text-white/40 transition hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-white/60">
                  <Phone className="h-4 w-4" />
                  <span>{driver.phone}</span>
                </div>
                {driver.email && (
                  <div className="flex items-center gap-2 text-white/60">
                    <Mail className="h-4 w-4" />
                    <span>{driver.email}</span>
                  </div>
                )}
                {driver.vehicleType && (
                  <div className="flex items-center gap-2 text-white/60">
                    <Car className="h-4 w-4" />
                    <span className="capitalize">
                      {driver.vehicleType}
                      {driver.licensePlate && ` - ${driver.licensePlate}`}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                <span className="text-sm text-white/40">
                  {driver._count?.deliveries || 0} deliveries
                </span>
                <button
                  onClick={() => toggleDriverStatus(driver)}
                  className={`flex items-center gap-1 rounded-lg px-3 py-1 text-sm transition ${
                    driver.isActive
                      ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                  }`}
                >
                  {driver.isActive ? (
                    <>
                      <XCircle className="h-4 w-4" /> Deactivate
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" /> Activate
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0A1C2F] p-6">
            {newDriverPin ? (
              // Show PIN after creating driver
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
                  <Key className="h-8 w-8 text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Driver Created!</h2>
                <p className="mt-2 text-white/60">
                  Share this PIN with the driver. They will need it to login to the driver app.
                </p>
                <div className="my-6 rounded-xl bg-white/10 py-4 text-4xl font-mono font-bold tracking-widest text-emerald-400">
                  {newDriverPin}
                </div>
                <p className="text-sm text-amber-400">
                  Make sure to save this PIN - it won't be shown again!
                </p>
                <button
                  onClick={closeModal}
                  className="mt-6 w-full rounded-xl bg-emerald-500 py-3 font-semibold text-white transition hover:bg-emerald-600"
                >
                  Done
                </button>
              </div>
            ) : (
              // Add/Edit form
              <>
                <h2 className="text-xl font-bold text-white">
                  {editingDriver ? 'Edit Driver' : 'Add New Driver'}
                </h2>
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div>
                    <label className="mb-2 block text-sm text-white/70">Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-white/70">Phone *</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
                      placeholder="(555) 123-4567"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-white/70">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-white/70">Vehicle Type</label>
                    <select
                      value={formData.vehicleType}
                      onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
                    >
                      <option value="car">Car</option>
                      <option value="motorcycle">Motorcycle</option>
                      <option value="bike">Bicycle</option>
                      <option value="scooter">Scooter</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm text-white/70">License Plate</label>
                    <input
                      type="text"
                      value={formData.licensePlate}
                      onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 rounded-xl border border-white/10 py-3 font-semibold text-white transition hover:bg-white/5"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 rounded-xl bg-emerald-500 py-3 font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : editingDriver ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
