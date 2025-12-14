"use client";

import { useState, useEffect } from 'react';
import DashboardLayout from './DashboardLayout';

interface CateringPackage {
  id: string;
  name: string;
  description: string;
  pricePerGuest: number;
  badge: string | null;
  available: boolean;
  displayOrder: number;
}

export default function CateringEditorPage() {
  const [packages, setPackages] = useState<CateringPackage[]>([]);
  const [editingPackage, setEditingPackage] = useState<CateringPackage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const res = await fetch('/api/admin/catering-packages');
      if (res.ok) {
        const data = await res.json();
        setPackages(data);
      }
    } catch (err) {
      console.error('Failed to fetch catering packages', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPackage = () => {
    const newPackage: CateringPackage = {
      id: '',
      name: '',
      description: '',
      pricePerGuest: 0,
      badge: null,
      available: true,
      displayOrder: packages.length,
    };
    setEditingPackage(newPackage);
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPackage) return;

    const method = editingPackage.id ? 'PATCH' : 'POST';
    const url = editingPackage.id
      ? `/api/admin/catering-packages/${editingPackage.id}`
      : '/api/admin/catering-packages';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPackage),
      });

      if (res.ok) {
        await fetchPackages();
        setEditingPackage(null);
      } else {
        alert('Failed to save catering package');
      }
    } catch (err) {
      console.error('Error saving catering package', err);
      alert('Failed to save catering package');
    }
  };

  const handleDeletePackage = async (id: string) => {
    if (!confirm('Delete this catering package?')) return;

    try {
      const res = await fetch(`/api/admin/catering-packages/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchPackages();
      } else {
        alert('Failed to delete catering package');
      }
    } catch (err) {
      console.error('Error deleting catering package', err);
      alert('Failed to delete catering package');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Catering Packages</h1>
          <button
            onClick={handleAddPackage}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Add Package
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <div key={pkg.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-start justify-between">
                <div>
                  {pkg.badge && (
                    <span className="mb-1 inline-block rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                      {pkg.badge}
                    </span>
                  )}
                  <h3 className="text-lg font-semibold text-gray-900">{pkg.name}</h3>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingPackage(pkg)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeletePackage(pkg.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <p className="mb-2 text-sm text-gray-600">{pkg.description}</p>
              <p className="text-xl font-bold text-gray-900">${pkg.pricePerGuest.toFixed(2)} / guest</p>
              <p className="mt-2 text-xs text-gray-500">
                {pkg.available ? '✓ Available' : '✗ Unavailable'}
              </p>
            </div>
          ))}
        </div>

        {packages.length === 0 && (
          <div className="mt-8 text-center text-gray-500">
            No catering packages yet. Click &quot;Add Package&quot; to create one.
          </div>
        )}

        {editingPackage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
              <h2 className="mb-4 text-xl font-bold text-gray-900">
                {editingPackage.id ? 'Edit Package' : 'Add Package'}
              </h2>
              <form onSubmit={handleSavePackage} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Package Name</label>
                  <input
                    required
                    type="text"
                    value={editingPackage.name}
                    onChange={(e) => setEditingPackage({ ...editingPackage, name: e.target.value })}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Taquiza Experience"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    required
                    value={editingPackage.description}
                    onChange={(e) => setEditingPackage({ ...editingPackage, description: e.target.value })}
                    rows={3}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe what's included..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price Per Guest ($)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingPackage.pricePerGuest}
                    onChange={(e) => setEditingPackage({ ...editingPackage, pricePerGuest: parseFloat(e.target.value) || 0 })}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Badge (optional)</label>
                  <input
                    type="text"
                    value={editingPackage.badge || ''}
                    onChange={(e) => setEditingPackage({ ...editingPackage, badge: e.target.value || null })}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Most Popular, Signature"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingPackage.available}
                    onChange={(e) => setEditingPackage({ ...editingPackage, available: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">Available</label>
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setEditingPackage(null)}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Save Package
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
