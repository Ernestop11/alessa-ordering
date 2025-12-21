'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/lib/store/cart';
import { useTenantTheme } from '@/components/TenantThemeProvider';
import { StripeCheckoutWrapper } from '@/components/StripeCheckout';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentRequestButtonElement } from '@stripe/react-stripe-js';
import type { PaymentRequest, Stripe } from '@stripe/stripe-js';

// Cache for stripe instances by account ID
const stripePromiseCache: Record<string, Promise<Stripe | null>> = {};

function getStripePromise(stripeAccount?: string): Promise<Stripe | null> {
  const cacheKey = stripeAccount || 'platform';
  if (!stripePromiseCache[cacheKey]) {
    const options = stripeAccount ? { stripeAccount } : undefined;
    stripePromiseCache[cacheKey] = loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
      options
    );
  }
  return stripePromiseCache[cacheKey];
}

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
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('pickup');
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripeAccount, setStripeAccount] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [showCardPayment, setShowCardPayment] = useState(false);

  // Apple Pay state
  const [applePayReady, setApplePayReady] = useState(false);
  const [applePayLoading, setApplePayLoading] = useState(true);
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [stripeInstance, setStripeInstance] = useState<Stripe | null>(null);

  // Fetch Stripe account and initialize Apple Pay on mount
  useEffect(() => {
    async function initializeApplePay() {
      try {
        // First fetch the Stripe account ID for this tenant
        const configRes = await fetch('/api/payments/config');
        const configData = await configRes.json();
        const accountId = configData.stripeAccount;
        setStripeAccount(accountId);

        // Load Stripe with the connected account
        const stripe = await getStripePromise(accountId);
        if (!stripe) {
          setApplePayLoading(false);
          return;
        }
        setStripeInstance(stripe);

        // Create payment request for Apple Pay
        const pr = stripe.paymentRequest({
          country: 'US',
          currency: 'usd',
          total: {
            label: tenant.name || 'Order Total',
            amount: Math.max(50, Math.round(total() * 100)),
          },
          requestPayerName: true,
          requestPayerEmail: true,
          requestPayerPhone: true,
        });

        // Check if Apple Pay is available
        const result = await pr.canMakePayment();
        console.log('[Checkout] canMakePayment result:', result);

        if (result) {
          setPaymentRequest(pr);
          setApplePayReady(true);
        }
        setApplePayLoading(false);
      } catch (err) {
        console.error('[Checkout] Apple Pay init error:', err);
        setApplePayLoading(false);
      }
    }

    if (items.length > 0) {
      initializeApplePay();
    }
  }, [items.length, tenant.name]);

  // Update payment request amount when total changes
  useEffect(() => {
    if (paymentRequest) {
      paymentRequest.update({
        total: {
          label: tenant.name || 'Order Total',
          amount: Math.max(50, Math.round(total() * 100)),
        },
      });
    }
  }, [total, paymentRequest, tenant.name]);

  // Handle Apple Pay payment
  const handleApplePay = async () => {
    if (!paymentRequest || !stripeInstance) return;

    // Validate customer info
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      setError('Please fill in your contact information first');
      return;
    }

    if (orderType === 'delivery' && !customerInfo.address) {
      setError('Please enter a delivery address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create payment intent first
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
      const secret = data.clientSecret;

      // Set up the payment method handler
      paymentRequest.on('paymentmethod', async (event) => {
        console.log('[Apple Pay] Payment method received:', event.paymentMethod.type);

        const { error: confirmError, paymentIntent } = await stripeInstance.confirmCardPayment(
          secret,
          { payment_method: event.paymentMethod.id },
          { handleActions: false }
        );

        if (confirmError) {
          console.error('[Apple Pay] Confirmation error:', confirmError);
          event.complete('fail');
          setError(confirmError.message || 'Payment failed');
          setLoading(false);
        } else {
          event.complete('success');

          if (paymentIntent?.status === 'requires_action') {
            const { error } = await stripeInstance.confirmCardPayment(secret);
            if (error) {
              setError(error.message || 'Payment failed');
              setLoading(false);
              return;
            }
          }

          // Success - redirect to success page
          clearCart();
          router.push(`/order/success?tenant=${tenantSlug}`);
        }
      });

      // This triggers the Apple Pay sheet
      paymentRequest.show();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

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
      setShowCardPayment(true);
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
    <div className="min-h-screen bg-gradient-to-br from-[#050A1C] to-[#0A1C2F] text-white pb-32 lg:pb-8">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:py-12">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-bold sm:text-3xl">Checkout</h1>
          <button
            onClick={() => router.push(`/order?tenant=${tenantSlug}`)}
            className="rounded-full border border-white/15 p-2 text-white/60 transition hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          {/* Left Column: Order Summary (shown first on mobile) */}
          <div className="order-1 lg:order-2 lg:sticky lg:top-8 lg:h-fit">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
              <h2 className="mb-3 text-lg font-semibold sm:text-xl">Order Summary</h2>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-12 w-12 sm:h-16 sm:w-16 rounded-xl object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm sm:text-base truncate">{item.name}</p>
                      <p className="text-xs sm:text-sm text-white/60">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#FBBF24] text-sm sm:text-base">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 border-t border-white/10 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-base sm:text-lg font-semibold">Total</span>
                  <span className="text-xl sm:text-2xl font-black text-[#FBBF24]">${total().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Customer Info & Payment */}
          <div className="order-2 lg:order-1 space-y-4 sm:space-y-6">
            {/* Order Type Selection */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
              <h2 className="mb-3 text-lg font-semibold sm:text-xl">Order Type</h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setOrderType('pickup')}
                  className={`rounded-xl border p-3 sm:p-4 transition-all ${
                    orderType === 'pickup'
                      ? 'border-[#DC2626] bg-[#DC2626]/10 shadow-[0_0_20px_rgba(220,38,38,0.3)]'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="text-xl sm:text-2xl mb-1">🏃</div>
                  <div className="font-semibold text-sm sm:text-base">Pickup</div>
                </button>
                <button
                  onClick={() => setOrderType('delivery')}
                  className={`rounded-xl border p-3 sm:p-4 transition-all ${
                    orderType === 'delivery'
                      ? 'border-[#DC2626] bg-[#DC2626]/10 shadow-[0_0_20px_rgba(220,38,38,0.3)]'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="text-xl sm:text-2xl mb-1">🚗</div>
                  <div className="font-semibold text-sm sm:text-base">Delivery</div>
                </button>
              </div>
            </div>

            {/* Customer Information */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
              <h2 className="mb-3 text-lg font-semibold sm:text-xl">Your Information</h2>
              <div className="space-y-3">
                <input
                  type="text"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white text-sm sm:text-base placeholder:text-white/40 focus:border-[#DC2626]/50 focus:outline-none"
                  placeholder="Full Name *"
                />
                <input
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white text-sm sm:text-base placeholder:text-white/40 focus:border-[#DC2626]/50 focus:outline-none"
                  placeholder="Email *"
                />
                <input
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white text-sm sm:text-base placeholder:text-white/40 focus:border-[#DC2626]/50 focus:outline-none"
                  placeholder="Phone Number *"
                />
                {orderType === 'delivery' && (
                  <textarea
                    value={customerInfo.address}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white text-sm sm:text-base placeholder:text-white/40 focus:border-[#DC2626]/50 focus:outline-none"
                    placeholder="Delivery Address *"
                    rows={2}
                  />
                )}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Payment Buttons - Fixed at bottom on mobile */}
            <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#050A1C] via-[#050A1C] to-transparent p-4 lg:static lg:p-0 lg:bg-transparent">
              <div className="space-y-3">
                {/* Apple Pay Button - Primary */}
                {applePayLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
                    <span className="ml-2 text-sm text-white/60">Loading payment options...</span>
                  </div>
                ) : applePayReady && paymentRequest ? (
                  <button
                    onClick={handleApplePay}
                    disabled={loading}
                    className="w-full rounded-xl bg-black py-4 text-white font-semibold flex items-center justify-center gap-2 transition hover:bg-gray-900 disabled:opacity-50 border border-white/20"
                    style={{ minHeight: '56px' }}
                  >
                    {loading ? (
                      <>
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.0425 9.63579C16.9906 9.62088 15.9199 9.18952 15.9199 7.89941C15.9199 6.79492 16.7544 6.27002 16.8135 6.22949C16.2671 5.4668 15.4185 5.37061 15.1279 5.35571C14.3574 5.27441 13.6533 5.77197 13.2588 5.77197C12.8643 5.77197 12.2754 5.37061 11.6377 5.38306C10.7888 5.39795 10.0014 5.83906 9.55713 6.56494C8.62891 8.04688 9.31396 10.2563 10.2051 11.4404C10.6484 12.0254 11.1694 12.6758 11.8428 12.6484C12.481 12.6211 12.7319 12.2422 13.4883 12.2422C14.2446 12.2422 14.4707 12.6484 15.1484 12.6362C15.8486 12.6235 16.2993 12.0505 16.7319 11.4604C17.2383 10.7891 17.4561 10.1367 17.4702 10.1025C17.4565 10.0889 17.0938 9.65063 17.0425 9.63579ZM15.2754 4.49341C15.6431 4.05225 15.8906 3.45361 15.8271 2.84912C15.2949 2.87158 14.6426 3.20654 14.249 3.64795C13.8975 4.04102 13.5967 4.66455 13.6733 5.24854C14.2705 5.29883 14.8906 4.93457 15.2754 4.49341Z"/>
                          <path d="M19.0537 20.8994H4.94629V3.10059H19.0537V20.8994Z" fill="none" stroke="currentColor" strokeWidth="0"/>
                          <text x="4" y="19" fill="currentColor" fontSize="6" fontWeight="bold" fontFamily="system-ui">Pay</text>
                        </svg>
                        <span>Pay with Apple Pay</span>
                      </>
                    )}
                  </button>
                ) : null}

                {/* Divider */}
                {applePayReady && !showCardPayment && (
                  <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-[#050A1C] px-3 text-white/50">or</span>
                    </div>
                  </div>
                )}

                {/* Card Payment Button / Section */}
                {!showCardPayment ? (
                  <button
                    onClick={handleCreatePaymentIntent}
                    disabled={loading}
                    className="w-full rounded-xl px-6 py-4 text-base font-bold text-white transition hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                    style={{
                      background: `linear-gradient(135deg, ${tenant.primaryColor} 0%, ${tenant.secondaryColor} 50%, ${tenant.primaryColor} 100%)`,
                      boxShadow: `0 8px 16px rgba(220, 38, 38, 0.3)`,
                    }}
                  >
                    {loading ? 'Loading...' : 'Pay with Card'}
                  </button>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white p-4">
                    <StripeCheckoutWrapper
                      clientSecret={clientSecret!}
                      successPath={`/order/success?tenant=${tenantSlug}`}
                      totalAmount={total()}
                      stripeAccount={stripeAccount}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
