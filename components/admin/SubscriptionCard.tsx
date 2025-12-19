'use client';

interface Product {
  id: string;
  productId: string;
  productName: string;
  productIcon: string | null;
  tierName: string | null;
  status: string;
  billingCycle: string;
  monthlyAmount: number;
  currentPeriodEnd: Date | null;
}

interface Props {
  product: Product;
  onUpgrade: () => void;
  onCancel: () => void;
}

export default function SubscriptionCard({ product, onUpgrade, onCancel }: Props) {
  const getStatusBadge = () => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      trial: 'bg-blue-100 text-blue-800',
      past_due: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[product.status as keyof typeof colors] || colors.active}`}>
        {product.status}
      </span>
    );
  };

  const getIcon = () => {
    const iconMap: Record<string, string> = {
      'shopping-cart': '🛒',
      'menu': '📋',
      'receipt-tax': '🧾',
      'megaphone': '📢',
      'shopping-bag': '🛍️',
    };
    return iconMap[product.productIcon || ''] || '📦';
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{getIcon()}</div>
          <div>
            <h3 className="font-semibold text-gray-900">{product.productName}</h3>
            {product.tierName && (
              <p className="text-sm text-gray-600">{product.tierName} Tier</p>
            )}
          </div>
        </div>
        {getStatusBadge()}
      </div>

      <div className="mb-4">
        <div className="text-2xl font-bold text-gray-900">${product.monthlyAmount.toFixed(2)}</div>
        <div className="text-sm text-gray-600">per {product.billingCycle === 'yearly' ? 'year' : 'month'}</div>
      </div>

      {product.currentPeriodEnd && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            Next billing date: <span className="font-medium">{new Date(product.currentPeriodEnd).toLocaleDateString()}</span>
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onUpgrade}
          className="flex-1 px-3 py-2 text-sm border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
        >
          Upgrade
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-3 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

