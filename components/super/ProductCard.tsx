'use client';

import { useState } from 'react';

interface ProductPricingTier {
  id: string;
  name: string;
  slug: string;
  monthlyPrice: number;
  yearlyPrice: number | null;
  setupFee: number;
  features: string[];
  isPopular: boolean;
  sortOrder: number;
}

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
  tiers: ProductPricingTier[];
  subscriptionCount?: number;
}

interface ProductCardProps {
  product: Product;
  tenantId?: string;
  isSubscribed?: boolean;
  currentTier?: ProductPricingTier;
  onSubscribe: (tierId?: string) => void;
  onUpgrade: (tierId: string) => void;
  onCancel: () => void;
}

export default function ProductCard({
  product,
  tenantId,
  isSubscribed = false,
  currentTier,
  onSubscribe,
  onUpgrade,
  onCancel,
}: ProductCardProps) {
  const [selectedTierId, setSelectedTierId] = useState<string | null>(
    currentTier?.id || (product.tiers.length > 0 ? product.tiers[0].id : null)
  );
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const selectedTier = product.tiers.find((t) => t.id === selectedTierId);
  const startingPrice = product.tiers.length > 0
    ? Math.min(...product.tiers.map((t) => t.monthlyPrice))
    : product.monthlyPrice || 0;

  const getCategoryBadge = () => {
    const colors = {
      core: 'bg-blue-100 text-blue-800',
      addon: 'bg-purple-100 text-purple-800',
      premium: 'bg-yellow-100 text-yellow-800',
    };
    const labels = {
      core: 'Core',
      addon: 'Add-on',
      premium: 'Premium',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[product.category as keyof typeof colors] || colors.addon}`}>
        {labels[product.category as keyof typeof labels] || 'Add-on'}
      </span>
    );
  };

  const getIcon = () => {
    // Simple icon mapping - in production, use proper icon library
    const iconMap: Record<string, string> = {
      'shopping-cart': '🛒',
      'menu': '📋',
      'receipt-tax': '🧾',
      'megaphone': '📢',
      'shopping-bag': '🛍️',
    };
    return iconMap[product.icon || ''] || '📦';
  };

  const handleAction = () => {
    if (isSubscribed) {
      if (currentTier && selectedTier && selectedTier.id !== currentTier.id) {
        onUpgrade(selectedTier.id);
      }
    } else {
      onSubscribe(selectedTierId || undefined);
    }
  };

  const getActionButton = () => {
    if (isSubscribed) {
      if (currentTier && selectedTier && selectedTier.id !== currentTier.id) {
        const price = billingCycle === 'yearly' && selectedTier.yearlyPrice
          ? selectedTier.yearlyPrice / 12
          : selectedTier.monthlyPrice;
        const currentPrice = billingCycle === 'yearly' && currentTier.yearlyPrice
          ? currentTier.yearlyPrice / 12
          : currentTier.monthlyPrice;

        return (
          <button
            onClick={handleAction}
            className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            {price > currentPrice ? 'Upgrade' : 'Downgrade'} to {selectedTier.name}
          </button>
        );
      }
      return (
        <div className="space-y-2">
          <div className="w-full px-4 py-2 bg-green-100 text-green-800 font-medium rounded-lg text-center">
            ✓ Subscribed ({currentTier?.name || 'Standard'})
          </div>
          <button
            onClick={onCancel}
            className="w-full px-4 py-2 border border-red-300 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors"
          >
            Cancel Subscription
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={handleAction}
        className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        Add to Plan
      </button>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-4xl">{getIcon()}</div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
              {getCategoryBadge()}
            </div>
            {product.subscriptionCount !== undefined && (
              <p className="text-sm text-gray-500 mt-1">
                {product.subscriptionCount} active subscription{product.subscriptionCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      </div>

      {product.description && (
        <p className="text-sm text-gray-600 mb-4">{product.description}</p>
      )}

      <div className="mb-4">
        <div className="text-2xl font-bold text-gray-900">
          {product.tiers.length > 0 ? (
            <>
              Starting at ${startingPrice.toFixed(0)}
              <span className="text-sm font-normal text-gray-500">/mo</span>
            </>
          ) : (
            <>
              ${product.monthlyPrice?.toFixed(0) || '0'}
              <span className="text-sm font-normal text-gray-500">/mo</span>
            </>
          )}
        </div>
      </div>

      {product.tiers.length > 1 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Tier
          </label>
          <select
            value={selectedTierId || ''}
            onChange={(e) => setSelectedTierId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSubscribed && !currentTier}
          >
            {product.tiers.map((tier) => (
              <option key={tier.id} value={tier.id}>
                {tier.name} - ${tier.monthlyPrice.toFixed(0)}/mo
                {tier.isPopular && ' ⭐ Popular'}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedTier && (
        <>
          {selectedTier.yearlyPrice && (
            <div className="mb-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    billingCycle === 'monthly'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    billingCycle === 'yearly'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Yearly
                  {selectedTier.yearlyPrice && (
                    <span className="ml-1 text-xs">(Save ${((selectedTier.monthlyPrice * 12 - selectedTier.yearlyPrice) / 12).toFixed(0)}/mo)</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {selectedTier.isPopular && (
            <div className="mb-4 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-yellow-600">⭐</span>
                <span className="text-sm font-medium text-yellow-800">Most Popular</span>
              </div>
            </div>
          )}

          <div className="mb-4">
            <div className="text-lg font-semibold text-gray-900 mb-2">
              {billingCycle === 'yearly' && selectedTier.yearlyPrice
                ? `$${(selectedTier.yearlyPrice / 12).toFixed(0)}/mo`
                : `$${selectedTier.monthlyPrice.toFixed(0)}/mo`}
              {billingCycle === 'yearly' && selectedTier.yearlyPrice && (
                <span className="text-sm font-normal text-gray-500">
                  {' '}(${selectedTier.yearlyPrice.toFixed(0)}/yr)
                </span>
              )}
            </div>
            {selectedTier.setupFee > 0 && (
              <p className="text-sm text-gray-600">+ ${selectedTier.setupFee.toFixed(0)} setup fee</p>
            )}
          </div>

          {selectedTier.features.length > 0 && (
            <div className="mb-6">
              <ul className="space-y-2">
                {selectedTier.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {product.tiers.length === 0 && product.features.length > 0 && (
        <div className="mb-6">
          <ul className="space-y-2">
            {product.features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {getActionButton()}
    </div>
  );
}

