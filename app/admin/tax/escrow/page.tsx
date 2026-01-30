'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface EscrowEntry {
  id: string;
  entryType: string;
  amount: number;
  runningBalance: number;
  description: string;
  createdAt: string;
  dailySetAsideId: string | null;
  filingPeriodId: string | null;
}

const fmt = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const typeLabels: Record<string, string> = {
  daily_deposit: 'Daily Deposit',
  tax_payment: 'Tax Payment',
  adjustment: 'Adjustment',
  refund: 'Refund',
};

const typeColors: Record<string, string> = {
  daily_deposit: 'text-emerald-600',
  tax_payment: 'text-red-600',
  adjustment: 'text-blue-600',
  refund: 'text-orange-600',
};

export default function EscrowLedgerPage() {
  const [entries, setEntries] = useState<EscrowEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [balance, setBalance] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchBalance();
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [page, filter]);

  const fetchBalance = async () => {
    try {
      const res = await fetch('/api/tax/escrow/balance');
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (filter) params.set('entryType', filter);

      const res = await fetch(`/api/tax/escrow/history?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries);
        setTotal(data.total);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Escrow Ledger</h1>
            <p className="text-sm text-gray-500">
              Audit trail of all tax escrow movements
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase">Current Balance</p>
              <p className="text-xl font-bold text-emerald-700">{fmt(balance)}</p>
            </div>
            <Link
              href="/admin/tax"
              className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              Back
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All Types</option>
            <option value="daily_deposit">Daily Deposits</option>
            <option value="tax_payment">Tax Payments</option>
            <option value="adjustment">Adjustments</option>
            <option value="refund">Refunds</option>
          </select>
          <span className="text-sm text-gray-500">{total} entries</span>
        </div>

        {/* Ledger Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Description
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {new Date(entry.createdAt).toLocaleDateString()}
                    <p className="text-xs text-gray-400">
                      {new Date(entry.createdAt).toLocaleTimeString()}
                    </p>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-sm font-medium ${typeColors[entry.entryType] || 'text-gray-600'}`}
                    >
                      {typeLabels[entry.entryType] || entry.entryType}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-700 max-w-xs truncate">
                    {entry.description}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span
                      className={`text-sm font-mono font-medium ${entry.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
                    >
                      {entry.amount >= 0 ? '+' : ''}
                      {fmt(entry.amount)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-sm font-mono text-gray-600">
                    {fmt(entry.runningBalance)}
                  </td>
                </tr>
              ))}
              {entries.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-gray-400">
                    No escrow entries yet
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-gray-400">
                    Loading...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
