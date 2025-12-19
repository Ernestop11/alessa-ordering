'use client';

import { useState, useEffect } from 'react';

interface TenantProduct {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    category: string;
  };
  tier: {
    id: string;
    name: string;
    monthlyPrice: number;
  } | null;
  status: string;
  billingCycle: string;
  monthlyAmount: number;
  currentPeriodEnd: string | null;
  stripeSubscriptionId: string | null;
}

interface Props {
  tenantId: string;
}

export default function TenantProductsPanel({ tenantId }: Props) {
  const [products, setProducts] = useState<TenantProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalMonthly, setTotalMonthly] = useState(0);

  useEffect(() => {
    fetchProducts();
  }, [tenantId]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/super/tenants/${tenantId}/products`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
        const total = (data.products || []).reduce((sum: number, p: TenantProduct) => sum + p.monthlyAmount, 0);
        setTotalMonthly(total);
      }
    } catch (error) {
      console.error('Failed to fetch tenant products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId: string) => {
    if (!confirm('Are you sure you want to remove this product from the tenant?')) {
      return;
    }

    try {
      const response = await fetch(`/api/super/tenants/${tenantId}/products?productId=${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchProducts();
      } else {
        alert('Failed to remove product');
      }
    } catch (error) {
      console.error('Remove error:', error);
      alert('Failed to remove product');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800',
      past_due: 'bg-red-100 text-red-800',
      trial: 'bg-blue-100 text-blue-800',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status as keyof typeof colors] || colors.active}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="w-8 h-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Subscribed Products</h3>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">${totalMonthly.toFixed(2)}</div>
          <div className="text-sm text-gray-600">Monthly Total</div>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No products subscribed</p>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((tp) => (
            <div
              key={tp.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">{tp.product.icon || '📦'}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{tp.product.name}</span>
                    {getStatusBadge(tp.status)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {tp.tier ? `${tp.tier.name} Tier` : 'Standard'} • {tp.billingCycle}
                  </div>
                  {tp.currentPeriodEnd && (
                    <div className="text-xs text-gray-500 mt-1">
                      Next billing: {new Date(tp.currentPeriodEnd).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-semibold text-gray-900">${tp.monthlyAmount.toFixed(2)}/mo</div>
                  {tp.stripeSubscriptionId && (
                    <div className="text-xs text-gray-500">Stripe: {tp.stripeSubscriptionId.substring(0, 12)}...</div>
                  )}
                </div>
                <button
                  onClick={() => handleRemove(tp.productId)}
                  className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

