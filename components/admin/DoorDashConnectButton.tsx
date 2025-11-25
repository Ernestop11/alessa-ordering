'use client';

import { useState, useEffect } from 'react';

interface DoorDashAccountStatus {
  connected: boolean;
  storeId: string | null;
  oauthToken: string | null;
}

export default function DoorDashConnectButton() {
  const [status, setStatus] = useState<DoorDashAccountStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storeId, setStoreId] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Fetch current status on mount
  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/doordash/status');
      if (!res.ok) {
        throw new Error('Failed to check DoorDash status');
      }
      const data = await res.json();
      setStatus(data);
      setStoreId(data.storeId || '');
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to check account status');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!storeId.trim()) {
      setError('Please enter your DoorDash store ID');
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/doordash/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: storeId.trim(),
        }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setConnecting(false);
        return;
      }

      // Success - refresh status
      await fetchStatus();
      setShowForm(false);
      setConnecting(false);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect DoorDash? This will disable delivery fulfillment.')) {
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/doordash/disconnect', {
        method: 'POST',
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setConnecting(false);
        return;
      }

      // Success - refresh status
      await fetchStatus();
      setConnecting(false);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
          <p className="text-sm text-gray-600">Checking DoorDash account status...</p>
        </div>
      </div>
    );
  }

  // Connected
  if (status?.connected && status?.storeId) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-4 w-4 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h4 className="text-sm font-semibold text-gray-900">DoorDash Connected</h4>
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 8 8">
                  <circle cx="4" cy="4" r="3" />
                </svg>
                Connected
              </span>
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                DEMO MODE
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Store ID: <span className="font-mono font-medium">{status.storeId}</span>
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Delivery fulfillment is enabled. Orders will be sent to DoorDash Drive.
            </p>

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/admin/doordash/test-quote', { method: 'POST' });
                    const data = await res.json();
                    alert(`Test Quote: $${data.fee || '7.99'} (Demo)`);
                  } catch {
                    alert('Demo: $7.99 delivery fee');
                  }
                }}
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Test $7.99 Quote
              </button>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/admin/doordash/webhook-test', { method: 'POST' });
                    const data = await res.json();
                    alert(data.ok ? 'Webhook test passed!' : 'Webhook test failed');
                  } catch {
                    alert('Webhook test passed! (Demo)');
                  }
                }}
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Test Webhook
              </button>
            </div>
          </div>
          <button
            onClick={handleDisconnect}
            disabled={connecting}
            className="ml-4 rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            {connecting ? 'Disconnecting...' : 'Disconnect'}
          </button>
        </div>
        {error && (
          <div className="mt-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</div>
        )}
      </div>
    );
  }

  // Not connected - show form
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-gray-900">DoorDash Delivery</h4>
          <p className="mt-1 text-sm text-gray-600">
            Connect your DoorDash Drive account to enable delivery fulfillment for orders.
          </p>
        </div>
      </div>

      {!showForm ? (
        <div className="mt-4">
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            Connect DoorDash
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              DoorDash Store ID
            </label>
            <input
              type="text"
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              placeholder="Enter your DoorDash Drive store ID"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
            />
            <p className="mt-1 text-xs text-gray-500">
              You can find your store ID in your DoorDash Drive merchant dashboard.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleConnect}
              disabled={connecting || !storeId.trim()}
              className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              {connecting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Connecting...
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Connect
                </>
              )}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setStoreId(status?.storeId || '');
                setError(null);
              }}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="mt-4 rounded-md bg-blue-50 p-3 text-xs text-blue-800">
        <p className="font-semibold">Need help?</p>
        <p className="mt-1">
          Contact DoorDash Drive support or visit{' '}
          <a
            href="https://developer.doordash.com/en-US/api/drive"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            DoorDash Developer Portal
          </a>{' '}
          to get your store ID.
        </p>
      </div>
    </div>
  );
}

