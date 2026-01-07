'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Fleet {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  pricePerWash: number;
  truckCount: number;
}

export default function FleetsManagement() {
  const [fleets, setFleets] = useState<Fleet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contactName: '',
    email: '',
    phone: '',
    pricePerWash: '25.00',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchFleets();
  }, []);

  const fetchFleets = async () => {
    try {
      const res = await fetch('/api/wash/fleets');
      if (res.ok) {
        setFleets(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch fleets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/wash/fleets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          pricePerWash: parseFloat(formData.pricePerWash),
        }),
      });

      if (res.ok) {
        setFormData({ name: '', contactName: '', email: '', phone: '', pricePerWash: '25.00' });
        setShowForm(false);
        fetchFleets();
      }
    } catch (err) {
      console.error('Failed to create fleet:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="../wash" className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-xl font-bold">Fleet Management</h1>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium"
            >
              Add Fleet
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
          <div className="grid gap-4">
            {fleets.map((fleet) => (
              <div key={fleet.id} className="bg-gray-900 rounded-xl p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{fleet.name}</h3>
                    {fleet.contactName && (
                      <p className="text-gray-400 text-sm">{fleet.contactName}</p>
                    )}
                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                      {fleet.email && <span>{fleet.email}</span>}
                      {fleet.phone && <span>{fleet.phone}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-400">
                      {formatCurrency(fleet.pricePerWash)}
                    </div>
                    <div className="text-sm text-gray-400">per wash</div>
                    <div className="mt-2 px-3 py-1 bg-gray-800 rounded-full text-sm">
                      {fleet.truckCount} trucks
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {fleets.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No fleets yet. Add your first fleet to get started.
              </div>
            )}
          </div>
        )}

        {/* Add Fleet Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-6">Add New Fleet</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Company Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Contact Name</label>
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                  <label className="block text-sm text-gray-400 mb-1">Price Per Wash *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-400">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.pricePerWash}
                      onChange={(e) => setFormData({ ...formData, pricePerWash: e.target.value })}
                      required
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
                    {submitting ? 'Creating...' : 'Create Fleet'}
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
