'use client';

import { useState, useEffect } from 'react';
import ProductCard from '../ProductCard';
import AddProductModal from '../AddProductModal';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  icon: string | null;
  color: string | null;
  monthlyPrice: number | null;
  features: string[];
  tiers: Array<{
    id: string;
    name: string;
    slug: string;
    monthlyPrice: number;
    yearlyPrice: number | null;
    setupFee: number;
    features: string[];
    isPopular: boolean;
    sortOrder: number;
  }>;
  subscriptionCount?: number;
}

interface Props {
  tenantId?: string;
  tenantProducts?: Array<{
    productId: string;
    tierId: string | null;
    status: string;
  }>;
}

export default function ProductsTab({ tenantId, tenantProducts = [] }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/super/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleSubscribe = async (productId: string, tierId?: string) => {
    if (!tenantId) {
      alert('Please select a tenant first');
      return;
    }

    try {
      const response = await fetch(`/api/super/tenants/${tenantId}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, tierId }),
      });

      if (response.ok) {
        await fetchProducts();
        alert('Product added successfully!');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to add product');
      }
    } catch (error) {
      console.error('Subscribe error:', error);
      alert('Failed to add product');
    }
  };

  const handleCancel = async (productId: string) => {
    if (!tenantId) return;
    if (!confirm('Are you sure you want to cancel this subscription?')) return;

    try {
      const response = await fetch(`/api/super/tenants/${tenantId}/products?productId=${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchProducts();
        alert('Subscription cancelled');
      } else {
        alert('Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Cancel error:', error);
      alert('Failed to cancel subscription');
    }
  };

  const getProductStatus = (productId: string) => {
    const tenantProduct = tenantProducts.find((tp) => tp.productId === productId);
    return tenantProduct ? { isSubscribed: true, tierId: tenantProduct.tierId } : { isSubscribed: false };
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Products</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage products and pricing tiers for the platform
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              // Sync with Stripe
              fetch('/api/super/products/sync-stripe', { method: 'POST' }).then(() => {
                alert('Synced with Stripe');
                fetchProducts();
              });
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Sync Stripe
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Product
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Categories</option>
          <option value="core">Core</option>
          <option value="addon">Add-ons</option>
          <option value="premium">Premium</option>
        </select>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const status = getProductStatus(product.id);
            const currentTier = status.tierId
              ? product.tiers.find((t) => t.id === status.tierId)
              : undefined;

            return (
              <ProductCard
                key={product.id}
                product={product}
                tenantId={tenantId}
                isSubscribed={status.isSubscribed}
                currentTier={currentTier}
                onSubscribe={(tierId) => handleSubscribe(product.id, tierId)}
                onUpgrade={(tierId) => handleSubscribe(product.id, tierId)}
                onCancel={() => handleCancel(product.id)}
              />
            );
          })}
        </div>
      )}

      {showAddModal && (
        <AddProductModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchProducts();
          }}
        />
      )}
    </div>
  );
}

