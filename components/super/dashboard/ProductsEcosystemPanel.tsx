"use client";

import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  monthlyPrice: number;
  icon: string | null;
  color: string | null;
  subscriberCount: number;
}

interface Props {
  products: Product[];
  onProductClick?: (productSlug: string) => void;
}

export default function ProductsEcosystemPanel({ products, onProductClick }: Props) {
  const handleProductClick = (product: Product) => {
    if (product.slug === 'alessa-ordering') {
      // Navigate to separate ordering dashboard
      window.location.href = '/super-admin/ordering';
      return;
    }
    onProductClick?.(product.slug);
  };

  return (
    <div className="space-y-6">
      {/* Products Grid */}
      <div>
        <h3 className="mb-4 text-lg font-bold text-gray-900">Alessa Products</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {products.map((product) => (
            <button
              key={product.id}
              onClick={() => handleProductClick(product)}
              className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-gray-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{product.icon || '📦'}</span>
                    <div>
                      <h4 className="font-semibold text-gray-900">{product.name}</h4>
                      <p className="mt-1 text-xs text-gray-500">
                        {product.subscriberCount} {product.subscriberCount === 1 ? 'subscriber' : 'subscribers'}
                      </p>
                    </div>
                  </div>
                  {product.monthlyPrice > 0 && (
                    <p className="mt-2 text-sm font-semibold text-gray-700">
                      ${product.monthlyPrice}/mo
                    </p>
                  )}
                  {product.status === 'coming_soon' && (
                    <span className="mt-2 inline-block rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-700">
                      Coming Soon
                    </span>
                  )}
                </div>
                <div
                  className="h-12 w-12 rounded-full opacity-10"
                  style={{ backgroundColor: product.color || '#6b7280' }}
                />
              </div>
              {product.slug === 'alessa-ordering' && (
                <div className="mt-3 rounded-lg bg-blue-50 p-2 text-xs text-blue-700">
                  Click to access Ordering System Dashboard →
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Ecosystem Health */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h3 className="mb-4 text-lg font-bold text-gray-900">Ecosystem Health</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">API Health</span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm font-semibold text-green-600">Healthy</span>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Database</span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm font-semibold text-green-600">Connected</span>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Payment Processing</span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm font-semibold text-green-600">Active</span>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Sync Status</span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm font-semibold text-green-600">All Synced</span>
            </span>
          </div>
        </div>
        <div className="mt-4 rounded-lg bg-gray-50 p-3">
          <p className="text-xs text-gray-600">
            <strong>Total Products:</strong> {products.length}
          </p>
          <p className="mt-1 text-xs text-gray-600">
            <strong>Active Integrations:</strong>{' '}
            {products.filter((p) => p.status === 'active').length}
          </p>
        </div>
      </div>
    </div>
  );
}

