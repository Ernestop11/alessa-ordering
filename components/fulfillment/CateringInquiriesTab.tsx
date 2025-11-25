"use client";

import { useEffect, useState } from 'react';

interface CateringInquiry {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  eventDate: string | null;
  guestCount: number | null;
  message: string | null;
  status: string;
  responseNotes: string | null;
  createdAt: string;
}

export default function CateringInquiriesTab() {
  const [inquiries, setInquiries] = useState<CateringInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('new');
  const [responseNotes, setResponseNotes] = useState<string>('');

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      const res = await fetch('/api/admin/catering/inquiries');
      if (res.ok) {
        const data = await res.json();
        setInquiries(data.inquiries || []);
      }
    } catch (err) {
      console.error('Failed to fetch inquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string) => {
    try {
      const res = await fetch('/api/admin/catering/inquiries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, responseNotes }),
      });
      if (res.ok) {
        await fetchInquiries();
        setEditingId(null);
        setStatus('new');
        setResponseNotes('');
      }
    } catch (err) {
      console.error('Failed to update inquiry:', err);
      alert('Failed to update inquiry');
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="mt-4 text-gray-600">Loading inquiries...</p>
        </div>
      </div>
    );
  }

  const newInquiries = inquiries.filter((i) => i.status === 'new');
  const contacted = inquiries.filter((i) => i.status === 'contacted');
  const quoted = inquiries.filter((i) => i.status === 'quoted');
  const booked = inquiries.filter((i) => i.status === 'booked');

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-2xl font-bold text-blue-600">{newInquiries.length}</div>
          <div className="text-sm text-gray-600">New</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-2xl font-bold text-yellow-600">{contacted.length}</div>
          <div className="text-sm text-gray-600">Contacted</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-2xl font-bold text-purple-600">{quoted.length}</div>
          <div className="text-sm text-gray-600">Quoted</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="text-2xl font-bold text-green-600">{booked.length}</div>
          <div className="text-sm text-gray-600">Booked</div>
        </div>
      </div>

      <div className="space-y-4">
        {inquiries.map((inquiry) => (
          <div key={inquiry.id} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-900">{inquiry.customerName}</h3>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      inquiry.status === 'new'
                        ? 'bg-blue-100 text-blue-800'
                        : inquiry.status === 'contacted'
                        ? 'bg-yellow-100 text-yellow-800'
                        : inquiry.status === 'quoted'
                        ? 'bg-purple-100 text-purple-800'
                        : inquiry.status === 'booked'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {inquiry.status}
                  </span>
                </div>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <div>
                    <strong>Email:</strong> {inquiry.customerEmail}
                  </div>
                  <div>
                    <strong>Phone:</strong> {inquiry.customerPhone}
                  </div>
                  {inquiry.eventDate && (
                    <div>
                      <strong>Event Date:</strong> {new Date(inquiry.eventDate).toLocaleDateString()}
                    </div>
                  )}
                  {inquiry.guestCount && (
                    <div>
                      <strong>Guests:</strong> {inquiry.guestCount}
                    </div>
                  )}
                  {inquiry.message && (
                    <div className="mt-2 rounded bg-gray-50 p-2">
                      <strong>Message:</strong>
                      <p className="mt-1 text-gray-700">{inquiry.message}</p>
                    </div>
                  )}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Submitted: {new Date(inquiry.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="ml-4">
                {editingId === inquiry.id ? (
                  <div className="space-y-2">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="quoted">Quoted</option>
                      <option value="booked">Booked</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <textarea
                      value={responseNotes}
                      onChange={(e) => setResponseNotes(e.target.value)}
                      placeholder="Response notes..."
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateStatus(inquiry.id)}
                        className="rounded-lg bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setStatus('new');
                          setResponseNotes('');
                        }}
                        className="rounded-lg border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingId(inquiry.id);
                      setStatus(inquiry.status);
                      setResponseNotes(inquiry.responseNotes || '');
                    }}
                    className="rounded-lg bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                  >
                    Update Status
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

