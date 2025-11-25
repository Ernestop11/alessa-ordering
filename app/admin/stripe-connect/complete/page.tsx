'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

/**
 * Stripe Connect Onboarding Complete Page
 *
 * Users land here after successfully completing Stripe onboarding.
 * We check the account status and redirect them to settings.
 */
export default function StripeConnectCompletePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your Stripe account...');

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/admin/stripe/connect/status');
        const data = await res.json();

        if (data.connected && data.onboardingComplete) {
          setStatus('success');
          setMessage('Your Stripe account is connected and ready to accept payments!');

          // Redirect to payments page after 2 seconds
          setTimeout(() => {
            router.push('/admin/payments');
          }, 2000);
        } else if (data.connected && data.detailsSubmitted) {
          setStatus('success');
          setMessage('Account connected! Stripe is reviewing your information.');
          setTimeout(() => {
            router.push('/admin/payments');
          }, 2000);
        } else {
          setStatus('error');
          setMessage('Onboarding incomplete. Please try again.');
        }
      } catch (error) {
        console.error('Status check failed:', error);
        setStatus('error');
        setMessage('Failed to verify account status. Please check your settings.');
      }
    };

    checkStatus();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        {status === 'loading' && (
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
            <h1 className="text-xl font-semibold text-gray-900">Processing...</h1>
            <p className="mt-2 text-sm text-gray-600">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
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
            <h1 className="text-xl font-semibold text-gray-900">Success!</h1>
            <p className="mt-2 text-sm text-gray-600">{message}</p>
            <p className="mt-4 text-xs text-gray-500">Redirecting to settings...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
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
            <h1 className="text-xl font-semibold text-gray-900">Something went wrong</h1>
            <p className="mt-2 text-sm text-gray-600">{message}</p>
            <Link
              href="/admin/payments"
              className="mt-6 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Go to Payments
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
