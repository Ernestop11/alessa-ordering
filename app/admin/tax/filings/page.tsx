'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface FilingPeriod {
  id: string;
  state: string;
  year: number;
  quarter: number | null;
  month: number | null;
  periodStart: string;
  periodEnd: string;
  filingDeadline: string;
  totalGrossSales: number;
  totalTaxableSales: number;
  totalTaxCollected: number;
  totalEscrowBalance: number;
  filingStatus: string;
  filingData: any;
  filedAt: string | null;
  filingReference: string | null;
  paymentStatus: string;
  paymentAmount: number | null;
  paymentReference: string | null;
  paidAt: string | null;
}

const fmt = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const statusColors: Record<string, string> = {
  accumulating: 'bg-blue-100 text-blue-800',
  ready_to_file: 'bg-yellow-100 text-yellow-800',
  filing_prepared: 'bg-orange-100 text-orange-800',
  filed: 'bg-green-100 text-green-800',
  confirmed: 'bg-emerald-100 text-emerald-800',
};

const paymentColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-800',
  payment_initiated: 'bg-blue-100 text-blue-800',
  payment_confirmed: 'bg-green-100 text-green-800',
  completed: 'bg-emerald-100 text-emerald-800',
};

export default function FilingsPage() {
  const [periods, setPeriods] = useState<FilingPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<FilingPeriod | null>(null);
  const [returnHTML, setReturnHTML] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');

  useEffect(() => {
    fetchPeriods();
  }, []);

  const fetchPeriods = async () => {
    try {
      const res = await fetch('/api/tax/filing-periods');
      if (res.ok) {
        const data = await res.json();
        setPeriods(data.periods);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrepare = async (periodId: string) => {
    setActionLoading(`prepare-${periodId}`);
    try {
      const res = await fetch(`/api/tax/filing-periods/${periodId}/prepare`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setReturnHTML(data.returnHTML);
        setSelectedPeriod(data.period);
        fetchPeriods();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading('');
    }
  };

  const handleMarkFiled = async (periodId: string) => {
    const reference = prompt('Enter CDTFA confirmation number (optional):');
    setActionLoading(`filed-${periodId}`);
    try {
      const res = await fetch(`/api/tax/filing-periods/${periodId}/mark-filed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filingReference: reference || undefined }),
      });
      if (res.ok) {
        fetchPeriods();
        setSelectedPeriod(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading('');
    }
  };

  const handlePay = async (periodId: string) => {
    if (!confirm('Initiate ACH payment to CDTFA for this period?')) return;
    setActionLoading(`pay-${periodId}`);
    try {
      const res = await fetch(`/api/tax/filing-periods/${periodId}/pay`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchPeriods();
      } else {
        const data = await res.json();
        alert(`Payment failed: ${data.error}`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading filings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Filing History</h1>
            <p className="text-sm text-gray-500">
              View, prepare, and manage quarterly tax filings
            </p>
          </div>
          <Link
            href="/admin/tax"
            className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {/* Filing Periods List */}
        <div className="bg-white rounded-xl border border-gray-200">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Period
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Deadline
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Tax Collected
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Filing
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Payment
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {periods.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <span className="font-medium text-gray-900">
                      Q{p.quarter} {p.year}
                    </span>
                    <p className="text-xs text-gray-500">{p.state}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">
                    {new Date(p.filingDeadline).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4 text-sm font-mono text-right">
                    {fmt(p.totalTaxCollected)}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[p.filingStatus] || 'bg-gray-100 text-gray-800'}`}
                    >
                      {p.filingStatus.replace(/_/g, ' ')}
                    </span>
                    {p.filedAt && (
                      <p className="text-xs text-gray-400 mt-1">
                        Filed {new Date(p.filedAt).toLocaleDateString()}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${paymentColors[p.paymentStatus] || 'bg-gray-100 text-gray-800'}`}
                    >
                      {p.paymentStatus.replace(/_/g, ' ')}
                    </span>
                    {p.paidAt && (
                      <p className="text-xs text-gray-400 mt-1">
                        Paid {new Date(p.paidAt).toLocaleDateString()}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right space-x-2">
                    {(p.filingStatus === 'accumulating' ||
                      p.filingStatus === 'ready_to_file') && (
                      <button
                        onClick={() => handlePrepare(p.id)}
                        disabled={actionLoading === `prepare-${p.id}`}
                        className="text-xs px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 border border-orange-200 disabled:opacity-50"
                      >
                        {actionLoading === `prepare-${p.id}`
                          ? 'Preparing...'
                          : 'Prepare Return'}
                      </button>
                    )}
                    {p.filingStatus === 'filing_prepared' && (
                      <>
                        <button
                          onClick={() => handlePrepare(p.id)}
                          className="text-xs px-3 py-1.5 text-gray-600 rounded-lg hover:bg-gray-100 border border-gray-200"
                        >
                          View Return
                        </button>
                        <button
                          onClick={() => handleMarkFiled(p.id)}
                          disabled={actionLoading === `filed-${p.id}`}
                          className="text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 border border-green-200 disabled:opacity-50"
                        >
                          {actionLoading === `filed-${p.id}`
                            ? 'Marking...'
                            : 'Mark Filed'}
                        </button>
                      </>
                    )}
                    {p.filingStatus === 'filed' &&
                      p.paymentStatus === 'pending' && (
                        <button
                          onClick={() => handlePay(p.id)}
                          disabled={actionLoading === `pay-${p.id}`}
                          className="text-xs px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 border border-emerald-200 disabled:opacity-50"
                        >
                          {actionLoading === `pay-${p.id}`
                            ? 'Sending...'
                            : 'Pay via ACH'}
                        </button>
                      )}
                  </td>
                </tr>
              ))}
              {periods.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                    No filing periods yet. Filing periods are created automatically
                    when tax automation is enabled.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Return Preview Modal */}
        {returnHTML && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Pre-Filled Return Preview
              </h2>
              <button
                onClick={() => {
                  setReturnHTML('');
                  setSelectedPeriod(null);
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
            <div
              className="border border-gray-200 rounded-lg overflow-auto max-h-[600px]"
              dangerouslySetInnerHTML={{ __html: returnHTML }}
            />
            {selectedPeriod &&
              selectedPeriod.filingStatus === 'filing_prepared' && (
                <div className="mt-4 flex items-center gap-3">
                  <a
                    href="https://onlineservices.cdtfa.ca.gov/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
                  >
                    File at CDTFA Portal
                  </a>
                  <button
                    onClick={() => handleMarkFiled(selectedPeriod.id)}
                    className="px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 border border-emerald-200"
                  >
                    I&apos;ve Filed — Mark as Filed
                  </button>
                </div>
              )}
          </div>
        )}
      </main>
    </div>
  );
}
