'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import DashboardLayout from './DashboardLayout';
import StripeConnectButton from './StripeConnectButton';

interface PaymentsPageProps {
  tenant: {
    id: string;
    slug: string;
    integrations?: {
      stripeAccountId: string | null;
    } | null;
  };
}

interface StripeStatus {
  connected: boolean;
  accountId: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  onboardingComplete: boolean;
}

export default function PaymentsPage({ tenant }: PaymentsPageProps) {
  const [stripeStatus, setStripeStatus] = useState<StripeStatus>({
    connected: false,
    accountId: null,
    chargesEnabled: false,
    payoutsEnabled: false,
    detailsSubmitted: false,
    onboardingComplete: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStripeStatus();
  }, []);

  const fetchStripeStatus = async () => {
    try {
      const res = await fetch('/api/admin/stripe/connect/status');
      const data = await res.json();
      setStripeStatus({
        connected: data.connected || false,
        accountId: data.accountId || null,
        chargesEnabled: data.chargesEnabled || false,
        payoutsEnabled: data.payoutsEnabled || false,
        detailsSubmitted: data.detailsSubmitted || false,
        onboardingComplete: data.onboardingComplete || false,
      });
    } catch (err) {
      console.error('Failed to fetch Stripe status', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOnboard = async () => {
    window.location.href = `/api/stripe/onboard?tenant=${tenant.slug}`;
  };

  const handleViewDashboard = async () => {
    window.location.href = `/api/stripe/dashboard?tenant=${tenant.slug}`;
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/admin" className="text-gray-500 hover:text-gray-700">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Stripe Connect Card */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Stripe Connect</h2>
            <StripeConnectButton />
          </div>

          {/* Payout Health (Mock) */}
          {!loading && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payout Health</h2>
              {stripeStatus.connected && stripeStatus.payoutsEnabled ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Next Payout:</span>
                    <span className="font-medium text-gray-900">In 2 days</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Payout Schedule:</span>
                    <span className="font-medium text-gray-900">Daily</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Healthy
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Connect Stripe to view payout information.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

