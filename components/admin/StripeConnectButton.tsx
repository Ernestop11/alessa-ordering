'use client';

import { useState, useEffect } from 'react';

interface StripeAccountStatus {
  connected: boolean;
  accountId: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  onboardingComplete: boolean;
  email?: string | null;
  businessName?: string | null;
}

export default function StripeConnectButton() {
  const [status, setStatus] = useState<StripeAccountStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch current status on mount
  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/stripe/connect/status');
      const data = await res.json();
      setStatus(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to check account status');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/stripe/connect/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          redirectUrl: window.location.origin,
        }),
      });

      const data = await res.json();

      if (data.url) {
        // Redirect to Stripe onboarding
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to start onboarding');
        setConnecting(false);
      }
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
          <p className="text-sm text-gray-600">Checking Stripe account status...</p>
        </div>
      </div>
    );
  }

  // Connected and fully onboarded
  if (status?.connected && status?.onboardingComplete) {
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
              <h3 className="font-semibold text-green-900">Stripe Connected</h3>
            </div>

            <div className="mt-3 space-y-2 text-sm">
              <p className="text-green-700">
                <span className="font-medium">Account ID:</span>{' '}
                <code className="rounded bg-green-100 px-2 py-0.5 text-xs">
                  {status.accountId}
                </code>
              </p>

              {status.businessName && (
                <p className="text-green-700">
                  <span className="font-medium">Business:</span> {status.businessName}
                </p>
              )}

              {status.email && (
                <p className="text-green-700">
                  <span className="font-medium">Email:</span> {status.email}
                </p>
              )}

              <div className="flex gap-4 pt-2">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-xs text-green-700">Payments enabled</span>
                </div>
                {status.payoutsEnabled && (
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="text-xs text-green-700">Payouts enabled</span>
                  </div>
                )}
              </div>
            </div>

            <p className="mt-3 text-xs text-green-600">
              ✓ You&apos;re ready to accept payments from customers!
            </p>
          </div>

          <button
            onClick={fetchStatus}
            className="text-sm text-green-700 hover:text-green-800 underline"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  // Connected but onboarding incomplete
  if (status?.connected && !status?.onboardingComplete) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100">
            <svg
              className="h-4 w-4 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-900">Onboarding Incomplete</h3>
            <p className="mt-1 text-sm text-yellow-700">
              {status.detailsSubmitted
                ? 'Stripe is reviewing your information. This usually takes 1-2 business days.'
                : "You started the onboarding process but haven't finished yet."}
            </p>

            {!status.detailsSubmitted && (
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="mt-4 rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700 disabled:opacity-50"
              >
                {connecting ? 'Loading...' : 'Continue Onboarding'}
              </button>
            )}

            <button
              onClick={fetchStatus}
              className="ml-3 mt-4 text-sm text-yellow-700 hover:text-yellow-800 underline"
            >
              Refresh Status
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Not connected yet
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
          <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 1.352 0 2.446.49 2.446.49.15.06.294-.114.234-.274L14.947 4.8a.379.379 0 00-.23-.188c-.59-.235-1.438-.495-2.446-.495-1.764 0-3.157 1.034-3.157 2.868 0 1.764 1.352 2.629 3.356 3.384 1.815.673 2.446 1.503 2.446 2.499 0 .997-.783 1.514-2.172 1.514-1.678 0-3.04-.777-3.04-.777a.273.273 0 00-.294.095l-1.368 1.764c-.098.123-.065.294.065.392.865.65 2.446 1.352 4.637 1.352 2.172 0 3.969-1.034 3.969-3.157-.001-2.013-1.434-2.809-3.761-3.686z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-blue-900">Connect Your Stripe Account</h3>
          <p className="mt-1 text-sm text-blue-700">
            Connect your Stripe account to receive payments directly from customers. Your funds
            will be automatically deposited to your bank account.
          </p>

          <div className="mt-4 space-y-2 text-xs text-blue-600">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Automatic daily payouts to your bank</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Secure PCI-compliant payment processing</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Platform fee: 2.9% + $0.30 per transaction</span>
            </div>
          </div>

          <button
            onClick={handleConnect}
            disabled={connecting}
            className="mt-4 flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {connecting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 1.352 0 2.446.49 2.446.49.15.06.294-.114.234-.274L14.947 4.8a.379.379 0 00-.23-.188c-.59-.235-1.438-.495-2.446-.495-1.764 0-3.157 1.034-3.157 2.868 0 1.764 1.352 2.629 3.356 3.384 1.815.673 2.446 1.503 2.446 2.499 0 .997-.783 1.514-2.172 1.514-1.678 0-3.04-.777-3.04-.777a.273.273 0 00-.294.095l-1.368 1.764c-.098.123-.065.294.065.392.865.65 2.446 1.352 4.637 1.352 2.172 0 3.969-1.034 3.969-3.157-.001-2.013-1.434-2.809-3.761-3.686z" />
                </svg>
                <span>Connect with Stripe</span>
              </>
            )}
          </button>

          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
