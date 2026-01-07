'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface OrderItem {
  id: string;
  menuItemName: string | null;
  quantity: number;
  price: number;
  notes: string | null;
}

interface SerializedOrder {
  id: string;
  status: string;
  fulfillmentMethod: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  subtotalAmount: number;
  taxAmount: number;
  tipAmount: number;
  deliveryFee: number;
  platformFee: number;
  totalAmount: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  acknowledgedAt: string | null;
  items: OrderItem[];
  tenant: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
    contactPhone: string | null;
  } | null;
}

interface Props {
  order: SerializedOrder;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: string; step: number }> = {
  pending: { label: 'Order Received', color: '#6b7280', bgColor: '#f3f4f6', icon: '📋', step: 1 },
  confirmed: { label: 'Confirmed', color: '#2563eb', bgColor: '#dbeafe', icon: '✓', step: 2 },
  preparing: { label: 'Being Prepared', color: '#f59e0b', bgColor: '#fef3c7', icon: '👨‍🍳', step: 3 },
  ready: { label: 'Ready for Pickup', color: '#10b981', bgColor: '#d1fae5', icon: '✅', step: 4 },
  completed: { label: 'Completed', color: '#059669', bgColor: '#d1fae5', icon: '🎉', step: 5 },
  cancelled: { label: 'Cancelled', color: '#ef4444', bgColor: '#fee2e2', icon: '❌', step: 0 },
};

function getEstimatedTime(status: string, acknowledgedAt: string | null, createdAt: string): string | null {
  const now = new Date();
  const created = new Date(createdAt);
  const acknowledged = acknowledgedAt ? new Date(acknowledgedAt) : null;

  // If order is preparing, estimate 10-15 mins from when it was acknowledged
  if (status === 'preparing' && acknowledged) {
    const estimatedReady = new Date(acknowledged.getTime() + 15 * 60 * 1000); // 15 mins
    const minsLeft = Math.max(0, Math.round((estimatedReady.getTime() - now.getTime()) / 60000));
    if (minsLeft <= 0) return 'Should be ready soon!';
    return `~${minsLeft} min${minsLeft !== 1 ? 's' : ''} remaining`;
  }

  // If pending/confirmed, estimate 15-25 mins from creation
  if (status === 'pending' || status === 'confirmed') {
    const estimatedReady = new Date(created.getTime() + 20 * 60 * 1000); // 20 mins
    const minsLeft = Math.max(0, Math.round((estimatedReady.getTime() - now.getTime()) / 60000));
    if (minsLeft <= 0) return 'Should be ready soon!';
    return `~${minsLeft} min${minsLeft !== 1 ? 's' : ''} remaining`;
  }

  // Ready or completed
  if (status === 'ready') {
    return 'Ready now!';
  }

  return null;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function OrderTrackingClient({ order: initialOrder }: Props) {
  const [order, setOrder] = useState(initialOrder);
  const [eta, setEta] = useState<string | null>(null);

  const status = order.status.toLowerCase();
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const primaryColor = order.tenant?.primaryColor || '#dc2626';
  const shortId = order.id.slice(-6).toUpperCase();

  // Refresh order status periodically
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        // Use tenant-scoped API to prevent cross-tenant data access
        const tenantSlug = order.tenant?.slug || 'unknown';
        const res = await fetch(`/api/track/${tenantSlug}/${order.id}`);
        if (res.ok) {
          const data = await res.json();
          setOrder((prev) => ({
            ...prev,
            status: data.status,
            acknowledgedAt: data.acknowledgedAt,
            updatedAt: data.updatedAt,
          }));
        }
      } catch {
        // Silently fail
      }
    };

    // Refresh every 30 seconds if not completed
    if (status !== 'completed' && status !== 'cancelled') {
      const interval = setInterval(fetchStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [order.id, status]);

  // Update ETA based on status
  useEffect(() => {
    const updateEta = () => {
      setEta(getEstimatedTime(order.status.toLowerCase(), order.acknowledgedAt, order.createdAt));
    };
    updateEta();
    const interval = setInterval(updateEta, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [order.status, order.acknowledgedAt, order.createdAt]);

  const steps = ['pending', 'confirmed', 'preparing', 'ready', 'completed'];
  const currentStep = statusConfig.step;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <div className="flex items-center justify-between">
            {order.tenant?.logo ? (
              <Image
                src={order.tenant.logo}
                alt={order.tenant.name}
                width={120}
                height={40}
                className="h-10 w-auto object-contain"
              />
            ) : (
              <h1 className="text-xl font-bold" style={{ color: primaryColor }}>
                {order.tenant?.name || 'Order Tracking'}
              </h1>
            )}
            <div className="text-right">
              <p className="text-xs text-gray-500">Order #</p>
              <p className="font-mono text-lg font-bold" style={{ color: primaryColor }}>
                {shortId}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        {/* Status Card */}
        <div
          className="rounded-2xl p-6 text-center"
          style={{ backgroundColor: statusConfig.bgColor }}
        >
          <div className="text-5xl mb-3">{statusConfig.icon}</div>
          <h2
            className="text-2xl font-bold mb-1"
            style={{ color: statusConfig.color }}
          >
            {statusConfig.label}
          </h2>
          {eta && status !== 'completed' && status !== 'cancelled' && (
            <p className="text-lg font-medium text-gray-700">{eta}</p>
          )}
          {status === 'ready' && (
            <p className="mt-2 text-sm text-gray-600">
              Please pick up your order at the counter
            </p>
          )}
        </div>

        {/* Progress Steps */}
        {status !== 'cancelled' && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-center">
              {steps.slice(0, 4).map((step, index) => {
                const stepNum = index + 1;
                const isActive = stepNum <= currentStep;
                const isCurrent = stepNum === currentStep;
                const stepConfig = STATUS_CONFIG[step];

                return (
                  <div key={step} className="flex flex-col items-center flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                        isCurrent ? 'ring-4 ring-opacity-30' : ''
                      }`}
                      style={{
                        backgroundColor: isActive ? primaryColor : '#e5e7eb',
                        color: isActive ? 'white' : '#9ca3af',
                        ringColor: isCurrent ? primaryColor : 'transparent',
                      }}
                    >
                      {isActive ? '✓' : stepNum}
                    </div>
                    <p
                      className="text-[10px] mt-1 text-center"
                      style={{ color: isActive ? primaryColor : '#9ca3af' }}
                    >
                      {stepConfig.label.split(' ')[0]}
                    </p>
                    {index < 3 && (
                      <div
                        className="absolute h-0.5 w-full max-w-[60px]"
                        style={{
                          backgroundColor: stepNum < currentStep ? primaryColor : '#e5e7eb',
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Order Details */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Order Details</h3>
            <p className="text-xs text-gray-500">
              {order.fulfillmentMethod?.toUpperCase()} • Placed at{' '}
              {formatTime(order.createdAt)}
            </p>
          </div>

          <div className="p-4 space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {item.quantity}× {item.menuItemName || 'Item'}
                  </p>
                  {item.notes && (
                    <p className="text-xs text-gray-500">→ {item.notes}</p>
                  )}
                </div>
                <p className="font-medium text-gray-700">
                  {formatCurrency(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          <div className="p-4 bg-gray-50 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotalAmount)}</span>
            </div>
            {order.deliveryFee > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Delivery</span>
                <span>{formatCurrency(order.deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Tax & Fees</span>
              <span>{formatCurrency(order.taxAmount + order.platformFee)}</span>
            </div>
            {order.tipAmount > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Tip</span>
                <span>{formatCurrency(order.tipAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200">
              <span>Total</span>
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        {order.customerName && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-bold text-gray-900 mb-2">Customer</h3>
            <p className="text-gray-700">{order.customerName}</p>
            {order.customerPhone && (
              <p className="text-sm text-gray-500">{order.customerPhone}</p>
            )}
          </div>
        )}

        {/* Contact Info */}
        {order.tenant?.contactPhone && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500 mb-2">Questions about your order?</p>
            <a
              href={`tel:${order.tenant.contactPhone}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white"
              style={{ backgroundColor: primaryColor }}
            >
              📞 Call {order.tenant.name}
            </a>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 pt-4">
          Powered by AlessaCloud
        </p>
      </main>
    </div>
  );
}
