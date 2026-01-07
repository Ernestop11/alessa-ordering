'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Fleet {
  id: string;
  name: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  fleet: Fleet;
  washCount: number;
  pricePerWash: number;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
}

export default function InvoicesManagement() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [fleets, setFleets] = useState<Fleet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    fleetId: '',
    periodStart: '',
    periodEnd: new Date().toISOString().split('T')[0],
    taxRate: '0',
  });
  const [submitting, setSubmitting] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    Promise.all([fetchInvoices(), fetchFleets()]).finally(() => setLoading(false));
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/wash/invoices');
      if (res.ok) {
        setInvoices(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
    }
  };

  const fetchFleets = async () => {
    try {
      const res = await fetch('/api/wash/fleets');
      if (res.ok) {
        const data = await res.json();
        setFleets(data);
        if (data.length > 0 && !formData.fleetId) {
          // Default to first of month
          const today = new Date();
          const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
            .toISOString()
            .split('T')[0];
          setFormData((prev) => ({
            ...prev,
            fleetId: data[0].id,
            periodStart: firstOfMonth,
          }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch fleets:', err);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/wash/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          taxRate: parseFloat(formData.taxRate),
        }),
      });

      if (res.ok) {
        setShowForm(false);
        fetchInvoices();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to generate invoice');
      }
    } catch (err) {
      console.error('Failed to generate invoice:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (invoice: Invoice, newStatus: string) => {
    try {
      const res = await fetch(`/api/wash/invoices/${invoice.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchInvoices();
      }
    } catch (err) {
      console.error('Failed to update invoice:', err);
    }
  };

  const handleSendEmail = async (invoice: Invoice) => {
    try {
      const res = await fetch(`/api/wash/invoices/${invoice.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        alert('Invoice sent!');
        fetchInvoices();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to send invoice');
      }
    } catch (err) {
      console.error('Failed to send invoice:', err);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-600';
      case 'sent':
        return 'bg-blue-600';
      case 'paid':
        return 'bg-emerald-600';
      default:
        return 'bg-gray-600';
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
              <h1 className="text-xl font-bold">Invoice Management</h1>
            </div>
            <button
              onClick={() => setShowForm(true)}
              disabled={fleets.length === 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 rounded-lg font-medium"
            >
              Generate Invoice
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
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="bg-gray-900 rounded-xl p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold">{invoice.invoiceNumber}</h3>
                      <span
                        className={`px-2 py-1 ${getStatusColor(invoice.status)} rounded-full text-xs uppercase`}
                      >
                        {invoice.status}
                      </span>
                    </div>
                    <p className="text-gray-400">{invoice.fleet.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-400">
                      {formatCurrency(invoice.total)}
                    </div>
                    <div className="text-sm text-gray-400">{invoice.washCount} washes</div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-800">
                  <a
                    href={`/api/wash/invoices/${invoice.id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm"
                  >
                    View PDF
                  </a>
                  {invoice.status === 'draft' && (
                    <>
                      <button
                        onClick={() => handleSendEmail(invoice)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
                      >
                        Send Email
                      </button>
                      <button
                        onClick={() => handleStatusChange(invoice, 'sent')}
                        className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm"
                      >
                        Mark Sent
                      </button>
                    </>
                  )}
                  {invoice.status === 'sent' && (
                    <button
                      onClick={() => handleStatusChange(invoice, 'paid')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm"
                    >
                      Mark Paid
                    </button>
                  )}
                </div>
              </div>
            ))}

            {invoices.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No invoices yet. Generate your first invoice.
              </div>
            )}
          </div>
        )}

        {/* Generate Invoice Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-6">Generate Invoice</h2>
              <form onSubmit={handleGenerate} className="space-y-4">
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
                  <label className="block text-sm text-gray-400 mb-1">Period Start *</label>
                  <input
                    type="date"
                    value={formData.periodStart}
                    onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Period End *</label>
                  <input
                    type="date"
                    value={formData.periodEnd}
                    onChange={(e) => setFormData({ ...formData, periodEnd: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                  />
                </div>
                <p className="text-sm text-gray-500">
                  This will generate an invoice for all uninvoiced washes for the selected fleet
                  within the date range.
                </p>
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
                    {submitting ? 'Generating...' : 'Generate Invoice'}
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
