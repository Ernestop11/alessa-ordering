'use client';

import { useState, useEffect } from 'react';
import SubscriptionCard from './SubscriptionCard';
import InvoiceHistory from './InvoiceHistory';

interface TenantProduct {
  id: string;
  productId: string;
  productName: string;
  productIcon: string | null;
  tierName: string | null;
  status: string;
  billingCycle: string;
  monthlyAmount: number;
  currentPeriodEnd: Date | null;
  stripeSubscriptionId: string | null;
}

interface Props {
  tenantId: string;
  tenantSlug: string;
  tenantProducts: TenantProduct[];
  totalMonthly: number;
}

export default function BillingOverviewClient({
  tenantId,
  tenantSlug,
  tenantProducts,
  totalMonthly,
}: Props) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBillingInfo();
  }, []);

  const fetchBillingInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/billing');
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices || []);
      }
    } catch (error) {
      console.error('Failed to fetch billing info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      const response = await fetch('/api/admin/billing/portal', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        }
      } else {
        alert('Failed to open billing portal');
      }
    } catch (error) {
      console.error('Billing portal error:', error);
      alert('Failed to open billing portal');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing & Subscription</h1>
          <p className="text-gray-600">Manage your subscription and view billing history</p>
        </div>

        {/* Current Plan Overview */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Current Plan</h2>
              <p className="text-sm text-gray-600 mt-1">Active subscriptions and billing</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">${totalMonthly.toFixed(2)}</div>
              <div className="text-sm text-gray-600">per month</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {tenantProducts.map((tp) => (
              <SubscriptionCard
                key={tp.id}
                product={tp}
                onUpgrade={() => {
                  // Navigate to upgrade flow
                  alert('Upgrade functionality coming soon');
                }}
                onCancel={async () => {
                  if (!confirm(`Are you sure you want to cancel ${tp.productName}?`)) return;
                  // Handle cancellation
                  alert('Cancellation functionality coming soon');
                }}
              />
            ))}
          </div>

          <div className="pt-4 border-t">
            <button
              onClick={handleManageBilling}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Manage Billing & Payment Method
            </button>
          </div>
        </div>

        {/* Invoice History */}
        <InvoiceHistory invoices={invoices} loading={loading} />
      </div>
    </div>
  );
}

