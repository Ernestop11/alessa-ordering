'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';

interface SyncStatus {
  enabled: boolean;
  lastSyncAt: string | null;
  syncStatus: 'success' | 'pending' | 'failed' | null;
  productCount: number;
  hasProducts: boolean;
  needsAutoSeed: boolean;
  message: string;
}

export default function SwitchMenuProSync() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSyncStatus();
  }, []);

  const fetchSyncStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/sync/smp/status');
      if (!res.ok) throw new Error('Failed to fetch sync status');
      const data = await res.json();
      setStatus(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load sync status');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerSync = async () => {
    setSyncing(true);
    setError(null);

    try {
      const res = await fetch('/api/sync/smp/trigger', {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sync failed');

      // Refresh status after sync
      setTimeout(() => {
        fetchSyncStatus();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to trigger sync');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
          <p className="text-sm text-gray-600">Loading Switch Menu Pro sync status...</p>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="text-sm text-red-700">Failed to load sync status</p>
      </div>
    );
  }

  const getStatusIcon = () => {
    if (!status.syncStatus) return <Clock className="h-5 w-5 text-gray-400" />;
    switch (status.syncStatus) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-blue-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    if (!status.syncStatus) return 'bg-gray-100 text-gray-700';
    switch (status.syncStatus) {
      case 'success':
        return 'bg-green-100 text-green-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      case 'pending':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <span className="text-xl">📱</span>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Switch Menu Pro Sync</h4>
              <p className="text-xs text-gray-500 mt-1">
                Sync your menu products to Switch Menu Pro
              </p>
            </div>
          </div>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
            status.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
          }`}>
            {status.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-4">
          <div>
            <p className="text-xs text-gray-500">Last Sync</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {status.lastSyncAt
                ? new Date(status.lastSyncAt).toLocaleString()
                : 'Never'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Sync Status</p>
            <div className="mt-1 flex items-center gap-2">
              {getStatusIcon()}
              <span className={`text-xs font-medium ${getStatusColor().split(' ')[1]}`}>
                {status.syncStatus || 'Unknown'}
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500">Products</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {status.productCount} items
            </p>
          </div>
        </div>

        {status.message && (
          <div className={`rounded-md p-3 mb-4 ${
            status.syncStatus === 'failed'
              ? 'bg-red-50 border border-red-200'
              : status.syncStatus === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-blue-50 border border-blue-200'
          }`}>
            <p className={`text-xs ${
              status.syncStatus === 'failed'
                ? 'text-red-700'
                : status.syncStatus === 'success'
                ? 'text-green-700'
                : 'text-blue-700'
            }`}>
              {status.message}
            </p>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={handleTriggerSync}
            disabled={syncing || !status.enabled}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Sync Now
              </>
            )}
          </button>
          <button
            onClick={fetchSyncStatus}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Refresh Status
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {!status.enabled && (
          <div className="mt-4 rounded-md bg-amber-50 border border-amber-200 p-3">
            <p className="text-xs text-amber-800">
              ⚠️ Switch Menu Pro sync is disabled. Enable it in your tenant sync configuration.
            </p>
          </div>
        )}

        {status.needsAutoSeed && (
          <div className="mt-4 rounded-md bg-blue-50 border border-blue-200 p-3">
            <p className="text-xs text-blue-800">
              ℹ️ Auto-seed is recommended. Products are ready to be synced to Switch Menu Pro.
            </p>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h5 className="text-xs font-semibold text-gray-900 mb-2">How it works</h5>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Syncs all menu products from Alessa Ordering to Switch Menu Pro</li>
          <li>• Updates product information, pricing, and availability</li>
          <li>• Maintains product relationships and categories</li>
          <li>• Sync runs automatically on product changes, or manually via &quot;Sync Now&quot;</li>
        </ul>
      </div>
    </div>
  );
}






