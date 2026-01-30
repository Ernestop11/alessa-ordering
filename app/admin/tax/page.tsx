'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DashboardData {
  isEnabled: boolean;
  escrowBalance: number;
  currentQuarter: {
    quarter: number;
    year: number;
    taxCollected: number;
    posTransactions: number;
    onlineOrders: number;
    daysTracked: number;
  };
  nextDeadline: {
    id: string;
    quarter: number;
    year: number;
    filingDeadline: string;
    filingStatus: string;
    paymentStatus: string;
    daysUntil: number;
  } | null;
  currentPeriod: {
    id: string;
    filingStatus: string;
    totalTaxCollected: number;
    totalEscrowBalance: number;
  } | null;
  recentActivity: Array<{
    id: string;
    entryType: string;
    amount: number;
    runningBalance: number;
    description: string;
    createdAt: string;
  }>;
  filingPeriods: Array<{
    id: string;
    state: string;
    year: number;
    quarter: number;
    filingDeadline: string;
    filingStatus: string;
    paymentStatus: string;
    totalTaxCollected: number;
  }>;
  config: {
    taxRate: number;
    filingState: string;
    filingFrequency: string;
    autoPayEnabled: boolean;
  };
}

const fmt = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const statusColors: Record<string, string> = {
  accumulating: 'bg-blue-100 text-blue-800',
  ready_to_file: 'bg-yellow-100 text-yellow-800',
  filing_prepared: 'bg-orange-100 text-orange-800',
  filed: 'bg-green-100 text-green-800',
  confirmed: 'bg-emerald-100 text-emerald-800',
  pending: 'bg-gray-100 text-gray-800',
  payment_initiated: 'bg-blue-100 text-blue-800',
  payment_confirmed: 'bg-green-100 text-green-800',
  completed: 'bg-emerald-100 text-emerald-800',
};

const statusLabels: Record<string, string> = {
  accumulating: 'Accumulating',
  ready_to_file: 'Ready to File',
  filing_prepared: 'Return Prepared',
  filed: 'Filed',
  confirmed: 'Confirmed',
  pending: 'Pending',
  payment_initiated: 'Payment Sent',
  payment_confirmed: 'Payment Confirmed',
  completed: 'Completed',
};

export default function TaxDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/tax/dashboard')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading tax dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Auto Sales Tax</h1>
            <p className="text-sm text-gray-500">
              Automated tax tracking, filing preparation, and ACH payment
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/tax/config"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Settings
            </Link>
            <Link
              href="/admin"
              className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              Back to Admin
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {!data.isEnabled && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 font-medium">
              Tax automation is not enabled.{' '}
              <Link href="/admin/tax/config" className="underline">
                Enable it in settings
              </Link>{' '}
              to start tracking daily tax set-asides.
            </p>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Escrow Balance
            </p>
            <p className="mt-2 text-3xl font-bold text-emerald-700">
              {fmt(data.escrowBalance)}
            </p>
            <Link
              href="/admin/tax/escrow"
              className="text-sm text-emerald-600 hover:underline mt-1 inline-block"
            >
              View ledger
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Q{data.currentQuarter.quarter} {data.currentQuarter.year} Tax
            </p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {fmt(data.currentQuarter.taxCollected)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {data.currentQuarter.daysTracked} days tracked
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Transactions
            </p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {(
                data.currentQuarter.posTransactions +
                data.currentQuarter.onlineOrders
              ).toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              POS: {data.currentQuarter.posTransactions.toLocaleString()} | Online:{' '}
              {data.currentQuarter.onlineOrders.toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              Next Deadline
            </p>
            {data.nextDeadline ? (
              <>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {data.nextDeadline.daysUntil}d
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Q{data.nextDeadline.quarter} {data.nextDeadline.year} —{' '}
                  {new Date(data.nextDeadline.filingDeadline).toLocaleDateString()}
                </p>
              </>
            ) : (
              <p className="mt-2 text-lg text-gray-400">No upcoming deadlines</p>
            )}
          </div>
        </div>

        {/* Filing Periods + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Filing Periods Table */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Filing Periods</h2>
              <Link
                href="/admin/tax/filings"
                className="text-sm text-emerald-600 hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Period
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tax Collected
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Filing
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Payment
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.filingPeriods.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/tax/filings?id=${p.id}`}
                          className="font-medium text-gray-900 hover:text-emerald-600"
                        >
                          Q{p.quarter} {p.year}
                        </Link>
                        <p className="text-xs text-gray-500">{p.state}</p>
                      </td>
                      <td className="px-5 py-3 font-mono text-sm">
                        {fmt(p.totalTaxCollected)}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[p.filingStatus] || 'bg-gray-100 text-gray-800'}`}
                        >
                          {statusLabels[p.filingStatus] || p.filingStatus}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[p.paymentStatus] || 'bg-gray-100 text-gray-800'}`}
                        >
                          {statusLabels[p.paymentStatus] || p.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {data.filingPeriods.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-gray-400">
                        No filing periods yet. Enable tax automation in settings.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions + Activity */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link
                  href="/admin/tax/filings"
                  className="block w-full px-4 py-3 text-sm font-medium text-center text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
                >
                  View Filings
                </Link>
                <Link
                  href="/admin/tax/escrow"
                  className="block w-full px-4 py-3 text-sm font-medium text-center text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 border border-emerald-200"
                >
                  Escrow Ledger
                </Link>
                <Link
                  href="/admin/tax/config"
                  className="block w-full px-4 py-3 text-sm font-medium text-center text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 border border-gray-200"
                >
                  Tax Settings
                </Link>
              </div>
            </div>

            {/* Tax Rate Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                Configuration
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax Rate</span>
                  <span className="font-medium">
                    {(data.config.taxRate * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">State</span>
                  <span className="font-medium">{data.config.filingState}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Frequency</span>
                  <span className="font-medium capitalize">
                    {data.config.filingFrequency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Auto-Pay</span>
                  <span
                    className={`font-medium ${data.config.autoPayEnabled ? 'text-emerald-600' : 'text-gray-400'}`}
                  >
                    {data.config.autoPayEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {data.recentActivity.map((entry) => (
              <div key={entry.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-900">{entry.description}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(entry.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-sm font-mono font-medium ${entry.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}
                  >
                    {entry.amount >= 0 ? '+' : ''}
                    {fmt(entry.amount)}
                  </p>
                  <p className="text-xs text-gray-400">
                    Balance: {fmt(entry.runningBalance)}
                  </p>
                </div>
              </div>
            ))}
            {data.recentActivity.length === 0 && (
              <div className="px-5 py-8 text-center text-gray-400">
                No activity yet
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
