'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Stripe Connect Onboarding Refresh Page
 *
 * Users land here if their onboarding link expired or they need to
 * continue onboarding. We generate a new link and redirect them.
 */
export default function StripeConnectRefreshPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const refreshOnboarding = async () => {
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
          // Redirect to the new onboarding link
          window.location.href = data.url;
        } else {
          setError(data.error || 'Failed to generate onboarding link');
        }
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred');
      }
    };

    refreshOnboarding();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg text-center">
        {!error ? (
          <>
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
            <h1 className="text-xl font-semibold text-gray-900">Refreshing...</h1>
            <p className="mt-2 text-sm text-gray-600">
              Generating a new onboarding link for you...
            </p>
          </>
        ) : (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Error</h1>
            <p className="mt-2 text-sm text-gray-600">{error}</p>
            <button
              onClick={() => router.push('/admin?tab=settings')}
              className="mt-6 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Back to Settings
            </button>
          </>
        )}
      </div>
    </div>
  );
}
