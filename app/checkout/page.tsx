'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/lib/store/cart';
import { useTenantTheme } from '@/components/TenantThemeProvider';
import { StripeCheckoutWrapper } from '@/components/StripeCheckout';
import { X } from 'lucide-react';

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const tenant = useTenantTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantSlug = searchParams.get('tenant');

  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripeAccount, setStripeAccount] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const handleCreatePaymentIntent = async () => {
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      setError('Please fill in all required fields');
      return;
    }

    if (orderType === 'delivery' && !customerInfo.address) {
      setError('Please enter a delivery address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Build order payload for the payment intent API
      const order = {
        items: items.map((item) => ({
          menuItemId: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
        subtotalAmount: total(),
        totalAmount: total(),
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
        fulfillmentMethod: orderType,
        deliveryAddress: orderType === 'delivery' ? customerInfo.address : undefined,
      };

      const response = await fetch('/api/payments/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment intent');
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
      setStripeAccount(data.stripeAccount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#050A1C] to-[#0A1C2F] text-white">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Your cart is empty</h1>
            <p className="mt-4 text-white/60">Add some items to your cart before checking out</p>
            <button
              onClick={() => router.push(`/order?tenant=${tenantSlug}`)}
              className="mt-8 rounded-2xl px-8 py-3 text-base font-bold text-white transition hover:scale-[1.02]"
              style={{
                background: `linear-gradient(135deg, ${tenant.primaryColor} 0%, ${tenant.secondaryColor} 50%, ${tenant.primaryColor} 100%)`,
                boxShadow: `0 10px 20px rgba(220, 38, 38, 0.4)`,
              }}
            >
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050A1C] to-[#0A1C2F] text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold sm:text-3xl">Checkout</h1>
          <button
            onClick={() => router.push(`/order?tenant=${tenantSlug}`)}
            className="rounded-full border border-white/15 p-2 text-white/60 transition hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left Column: Customer Info & Order Type */}
          <div className="space-y-6">
            {/* Order Type Selection */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="mb-4 text-xl font-semibold">Order Type</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setOrderType('delivery')}
                  className={`rounded-2xl border p-4 transition-all ${
                    orderType === 'delivery'
                      ? 'border-[#DC2626] bg-[#DC2626]/10 shadow-[0_0_20px_rgba(220,38,38,0.3)]'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="text-2xl mb-2">🚗</div>
                  <div className="font-semibold">Delivery</div>
                </button>
                <button
                  onClick={() => setOrderType('pickup')}
                  className={`rounded-2xl border p-4 transition-all ${
                    orderType === 'pickup'
                      ? 'border-[#DC2626] bg-[#DC2626]/10 shadow-[0_0_20px_rgba(220,38,38,0.3)]'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="text-2xl mb-2">🏃</div>
                  <div className="font-semibold">Pickup</div>
                </button>
              </div>
            </div>

            {/* Customer Information */}
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="mb-4 text-xl font-semibold">Your Information</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="mb-2 block text-sm text-white/70">
                    Full Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-[#DC2626]/50 focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm text-white/70">
                    Email *
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-[#DC2626]/50 focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="mb-2 block text-sm text-white/70">
                    Phone Number *
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-[#DC2626]/50 focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20"
                    placeholder="(555) 123-4567"
                  />
                </div>
                {orderType === 'delivery' && (
                  <div>
                    <label htmlFor="address" className="mb-2 block text-sm text-white/70">
                      Delivery Address *
                    </label>
                    <textarea
                      id="address"
                      value={customerInfo.address}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-[#DC2626]/50 focus:outline-none focus:ring-2 focus:ring-[#DC2626]/20"
                      placeholder="123 Main St, City, State, ZIP"
                      rows={3}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Payment Section (shown after customer info) */}
            {clientSecret && (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h2 className="mb-4 text-xl font-semibold">Payment</h2>
                <StripeCheckoutWrapper
                  clientSecret={clientSecret}
                  successPath={`/order/success?tenant=${tenantSlug}`}
                  totalAmount={total()}
                  stripeAccount={stripeAccount}
                />
              </div>
            )}

            {!clientSecret && (
              <button
                onClick={handleCreatePaymentIntent}
                disabled={loading}
                className="w-full rounded-2xl px-8 py-4 text-base font-bold text-white transition hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                style={{
                  background: `linear-gradient(135deg, ${tenant.primaryColor} 0%, ${tenant.secondaryColor} 50%, ${tenant.primaryColor} 100%)`,
                  boxShadow: `0 10px 20px rgba(220, 38, 38, 0.4), 0 0 30px rgba(251, 191, 36, 0.2)`,
                }}
              >
                {loading ? 'Loading...' : 'Continue to Payment'}
              </button>
            )}

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:sticky lg:top-8 lg:h-fit">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="mb-4 text-xl font-semibold">Order Summary</h2>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-16 w-16 rounded-xl object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-white/60">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#FBBF24]">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 border-t border-white/10 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-black text-[#FBBF24]">${total().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
