'use client';

import { useState, useEffect } from 'react';
import { Download, Calendar, DollarSign, CheckCircle2, Clock, XCircle } from 'lucide-react';

interface TaxRemittanceData {
  enabled: boolean;
  schedule: 'monthly' | 'quarterly';
  escrowAccountConfigured: boolean;
  currentPeriod: {
    period: {
      start: string;
      end: string;
    };
    totalTaxCollected: number;
    orderCount: number;
  } | null;
  remittances: Array<{
    id: string;
    periodStart: string;
    periodEnd: string;
    totalTaxCollected: number;
    totalTaxRemitted: number;
    status: string;
    remittanceDate: string | null;
    remittanceReference: string | null;
  }>;
}

export default function TaxRemittance() {
  const [data, setData] = useState<TaxRemittanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRemittanceData();
  }, []);

  const fetchRemittanceData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/tax/remit');
      if (!res.ok) throw new Error('Failed to fetch remittance data');
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load tax remittance data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRemittance = async () => {
    if (!data?.currentPeriod) return;

    setProcessing(true);
    setError(null);

    try {
      const res = await fetch('/api/tax/remit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          period: data.currentPeriod.period,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to create remittance');

      // Refresh data
      await fetchRemittanceData();
    } catch (err: any) {
      setError(err.message || 'Failed to create remittance');
    } finally {
      setProcessing(false);
    }
  };

  const handleProcessRemittance = async (remittanceId: string) => {
    if (!confirm('Process this tax remittance? Funds will be transferred to tax authority.')) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const res = await fetch('/api/tax/remit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'process',
          remittanceId,
          method: 'manual',
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to process remittance');

      // Refresh data
      await fetchRemittanceData();
    } catch (err: any) {
      setError(err.message || 'Failed to process remittance');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadReport = async (remittanceId: string) => {
    try {
      const res = await fetch('/api/tax/remit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'report',
          remittanceId,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to generate report');

      // Download as CSV
      const blob = new Blob([result.report], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tax-remittance-${remittanceId}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Failed to download report');
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
          <p className="text-sm text-gray-600">Loading tax remittance data...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="text-sm text-red-700">Failed to load tax remittance data</p>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'processing':
        return 'bg-blue-100 text-blue-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Tax Remittance</h3>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
            data.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
          }`}>
            {data.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-gray-500">Schedule</p>
            <p className="mt-1 text-lg font-semibold text-gray-900 capitalize">{data.schedule}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Escrow Account</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {data.escrowAccountConfigured ? 'Configured' : 'Not Configured'}
            </p>
          </div>
          {data.currentPeriod && (
            <div>
              <p className="text-sm text-gray-500">Current Period Tax</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                ${data.currentPeriod.totalTaxCollected.toFixed(2)}
              </p>
            </div>
          )}
        </div>

        {!data.enabled && (
          <div className="mt-4 rounded-md bg-amber-50 border border-amber-200 p-3">
            <p className="text-sm text-amber-800">
              Tax remittance is disabled. Enable it in Settings → Taxes to automatically collect and remit taxes.
            </p>
          </div>
        )}

        {data.enabled && !data.escrowAccountConfigured && (
          <div className="mt-4 rounded-md bg-amber-50 border border-amber-200 p-3">
            <p className="text-sm text-amber-800">
              ⚠️ Tax escrow account not configured. Configure in Settings → Taxes to enable automatic remittance.
            </p>
          </div>
        )}
      </div>

      {/* Current Period */}
      {data.currentPeriod && data.currentPeriod.totalTaxCollected > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Current Period</h4>
              <p className="mt-1 text-xs text-gray-600">
                {new Date(data.currentPeriod.period.start).toLocaleDateString()} -{' '}
                {new Date(data.currentPeriod.period.end).toLocaleDateString()}
              </p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                ${data.currentPeriod.totalTaxCollected.toFixed(2)}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                {data.currentPeriod.orderCount} orders
              </p>
            </div>
            <button
              onClick={handleCreateRemittance}
              disabled={processing}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              <Calendar className="h-4 w-4" />
              {processing ? 'Creating...' : 'Create Remittance'}
            </button>
          </div>
        </div>
      )}

      {/* Remittance History */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">Remittance History</h4>

        {data.remittances.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No remittances yet</p>
        ) : (
          <div className="space-y-3">
            {data.remittances.map((remittance) => (
              <div
                key={remittance.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
              >
                <div className="flex items-center gap-4 flex-1">
                  {getStatusIcon(remittance.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(remittance.periodStart).toLocaleDateString()} -{' '}
                        {new Date(remittance.periodEnd).toLocaleDateString()}
                      </p>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(remittance.status)}`}>
                        {remittance.status}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-xs text-gray-600">
                      <span>Collected: ${remittance.totalTaxCollected.toFixed(2)}</span>
                      {remittance.totalTaxRemitted > 0 && (
                        <span>Remitted: ${remittance.totalTaxRemitted.toFixed(2)}</span>
                      )}
                      {remittance.remittanceDate && (
                        <span>Date: {new Date(remittance.remittanceDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {remittance.status === 'pending' && (
                    <button
                      onClick={() => handleProcessRemittance(remittance.id)}
                      disabled={processing}
                      className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <DollarSign className="h-4 w-4" />
                      Process
                    </button>
                  )}
                  <button
                    onClick={() => handleDownloadReport(remittance.id)}
                    className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Download className="h-4 w-4" />
                    Report
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}












