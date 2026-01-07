'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Fleet {
  id: string;
  name: string;
}

interface Truck {
  id: string;
  truckNumber: string;
  description: string | null;
  licensePlate: string | null;
  qrCode: string;
  fleet: Fleet;
  washCount: number;
}

export default function TrucksManagement() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [fleets, setFleets] = useState<Fleet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    fleetId: '',
    truckNumber: '',
    description: '',
    licensePlate: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [qrModal, setQrModal] = useState<Truck | null>(null);

  useEffect(() => {
    Promise.all([fetchTrucks(), fetchFleets()]).finally(() => setLoading(false));
  }, []);

  const fetchTrucks = async () => {
    try {
      const res = await fetch('/api/wash/trucks');
      if (res.ok) {
        setTrucks(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch trucks:', err);
    }
  };

  const fetchFleets = async () => {
    try {
      const res = await fetch('/api/wash/fleets');
      if (res.ok) {
        const data = await res.json();
        setFleets(data);
        if (data.length > 0 && !formData.fleetId) {
          setFormData((prev) => ({ ...prev, fleetId: data[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch fleets:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/wash/trucks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setFormData({ fleetId: fleets[0]?.id || '', truckNumber: '', description: '', licensePlate: '' });
        setShowForm(false);
        fetchTrucks();
      }
    } catch (err) {
      console.error('Failed to create truck:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const downloadQR = async (truck: Truck) => {
    window.open(`/api/wash/trucks/${truck.id}/qr?format=png&size=400`, '_blank');
  };

  const printQR = (truck: Truck) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>QR Code - ${truck.truckNumber}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
            }
            img { max-width: 300px; }
            h1 { margin-top: 20px; font-size: 24px; }
            p { color: #666; margin: 5px 0; }
          </style>
        </head>
        <body>
          <img src="/api/wash/trucks/${truck.id}/qr?format=png&size=300" alt="QR Code" />
          <h1>${truck.truckNumber}</h1>
          <p>${truck.fleet.name}</p>
          ${truck.description ? `<p>${truck.description}</p>` : ''}
          <script>
            window.onload = () => { window.print(); };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

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
              <h1 className="text-xl font-bold">Truck Management</h1>
            </div>
            <button
              onClick={() => setShowForm(true)}
              disabled={fleets.length === 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 rounded-lg font-medium"
            >
              Add Truck
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full" />
          </div>
        ) : fleets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">Add a fleet first before adding trucks.</p>
            <Link
              href="./fleets"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg inline-block"
            >
              Add Fleet
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {trucks.map((truck) => (
              <div key={truck.id} className="bg-gray-900 rounded-xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{truck.truckNumber}</h3>
                    <p className="text-gray-400 text-sm">{truck.fleet.name}</p>
                  </div>
                  <span className="px-2 py-1 bg-gray-800 rounded-full text-xs text-gray-400">
                    {truck.washCount} washes
                  </span>
                </div>

                {truck.description && (
                  <p className="text-gray-400 text-sm mb-2">{truck.description}</p>
                )}
                {truck.licensePlate && (
                  <p className="text-gray-500 text-sm mb-4">Plate: {truck.licensePlate}</p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setQrModal(truck)}
                    className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm"
                  >
                    View QR
                  </button>
                  <button
                    onClick={() => printQR(truck)}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm"
                  >
                    Print QR
                  </button>
                </div>
              </div>
            ))}

            {trucks.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                No trucks yet. Add your first truck to generate QR codes.
              </div>
            )}
          </div>
        )}

        {/* Add Truck Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-6">Add New Truck</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Fleet *</label>
                  <select
                    value={formData.fleetId}
                    onChange={(e) => setFormData({ ...formData, fleetId: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                  >
                    {fleets.map((fleet) => (
                      <option key={fleet.id} value={fleet.id}>
                        {fleet.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Truck Number *</label>
                  <input
                    type="text"
                    value={formData.truckNumber}
                    onChange={(e) => setFormData({ ...formData, truckNumber: e.target.value })}
                    placeholder="e.g., T-001"
                    required
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g., White Freightliner"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">License Plate</label>
                  <input
                    type="text"
                    value={formData.licensePlate}
                    onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                  />
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
                    {submitting ? 'Creating...' : 'Create Truck'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* QR Code Modal */}
        {qrModal && (
          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setQrModal(null)}
          >
            <div
              className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-2">{qrModal.truckNumber}</h2>
              <p className="text-gray-400 mb-4">{qrModal.fleet.name}</p>

              <div className="bg-white rounded-xl p-4 inline-block mb-4">
                <img
                  src={`/api/wash/trucks/${qrModal.id}/qr?format=png&size=250`}
                  alt="QR Code"
                  className="w-64 h-64"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => downloadQR(qrModal)}
                  className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg"
                >
                  Download
                </button>
                <button
                  onClick={() => {
                    printQR(qrModal);
                    setQrModal(null);
                  }}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                >
                  Print
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
