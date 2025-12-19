'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Package, DollarSign, Calendar } from 'lucide-react';
import Link from 'next/link';

interface TenantProduct {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  productIcon: string;
  productColor: string;
  tierId: string | null;
  tierName: string | null;
  status: 'active' | 'paused' | 'cancelled';
  monthlyPrice: number;
  subscribedAt: string;
  features: string[];
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  monthlyFee: number;
  contactEmail: string | null;
  contactPhone: string | null;
  createdAt: string;
}

interface Props {
  tenantId: string;
  tenant: Tenant;
  rootDomain: string;
}

export default function TenantProductsView({ tenantId, tenant, rootDomain }: Props) {
  const [products, setProducts] = useState<TenantProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTenantProducts();
  }, [tenantId]);

  const fetchTenantProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/super/tenants/${tenantId}/products`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Failed to fetch tenant products:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalMonthlySpend = products
    .filter((p) => p.status === 'active')
    .reduce((sum, p) => sum + p.monthlyPrice, 0);

  const activeProducts = products.filter((p) => p.status === 'active').length;
  const totalProducts = products.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tenant Header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{tenant.name}</h2>
            <p className="text-sm text-gray-600 mt-1">
              {tenant.slug}.{rootDomain}
            </p>
            <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
              {tenant.contactEmail && (
                <span>📧 {tenant.contactEmail}</span>
              )}
              {tenant.contactPhone && (
                <span>📞 {tenant.contactPhone}</span>
              )}
            </div>
          </div>
          <div className="text-right">
            <span
              className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${
                tenant.status === 'LIVE'
                  ? 'bg-green-100 text-green-700'
                  : tenant.status === 'PENDING_REVIEW'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-700'
              }`}
            >
              {tenant.status}
            </span>
            <p className="mt-2 text-xs text-gray-500">
              Created {new Date(tenant.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Active</p>
              <p className="text-2xl font-bold text-gray-900">{activeProducts}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Monthly Spend</p>
              <p className="text-2xl font-bold text-gray-900">${totalMonthlySpend}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-100 p-2">
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Base Plan</p>
              <p className="text-2xl font-bold text-gray-900">${tenant.monthlyFee}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Subscribed Products</h3>
          <Link
            href={`https://${tenant.slug}.${rootDomain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View Storefront →
          </Link>
        </div>
        {products.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No products subscribed</p>
            <p className="text-sm text-gray-500 mt-1">This tenant hasn't subscribed to any products yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="group relative overflow-hidden rounded-xl border-2 bg-white shadow-sm transition-all hover:shadow-md"
                style={{
                  borderColor: product.status === 'active' ? product.productColor : '#e5e7eb',
                }}
              >
                {/* Product Header */}
                <div
                  className="p-4 text-white"
                  style={{ backgroundColor: product.productColor }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{product.productIcon}</span>
                      <div>
                        <h4 className="font-bold text-lg">{product.productName}</h4>
                        {product.tierName && (
                          <p className="text-sm opacity-90">{product.tierName}</p>
                        )}
                      </div>
                    </div>
                    {product.status === 'active' ? (
                      <CheckCircle2 className="h-6 w-6 text-white" />
                    ) : (
                      <XCircle className="h-6 w-6 text-white opacity-50" />
                    )}
                  </div>
                </div>

                {/* Product Details */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Status</span>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        product.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : product.status === 'paused'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {product.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Monthly Price</span>
                    <span className="text-sm font-bold text-gray-900">${product.monthlyPrice}/mo</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Subscribed</span>
                    <span className="text-xs text-gray-600">
                      {new Date(product.subscribedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {product.features.length > 0 && (
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Features</span>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {product.features.slice(0, 3).map((feature, idx) => (
                          <span
                            key={idx}
                            className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                          >
                            {feature}
                          </span>
                        ))}
                        {product.features.length > 3 && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                            +{product.features.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <div className="flex gap-2">
                    <button
                      className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => {
                        // View product details
                        console.log('View product:', product.productId);
                      }}
                    >
                      View Details
                    </button>
                    {product.status === 'active' && (
                      <button
                        className="rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                        onClick={() => {
                          if (confirm('Are you sure you want to cancel this subscription?')) {
                            // Cancel subscription
                            console.log('Cancel:', product.id);
                          }
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Total Summary */}
      <div className="rounded-xl border border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Monthly Recurring Revenue</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              ${totalMonthlySpend + tenant.monthlyFee}
              <span className="text-lg text-gray-600">/mo</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Base plan: ${tenant.monthlyFee} + Products: ${totalMonthlySpend}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Annual Value</p>
            <p className="text-2xl font-bold text-gray-900">
              ${((totalMonthlySpend + tenant.monthlyFee) * 12).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

