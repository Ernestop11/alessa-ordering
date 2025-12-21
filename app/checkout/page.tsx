'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/lib/store/cart';
import { useTenantTheme } from '@/components/TenantThemeProvider';
import { StripeCheckoutWrapper } from '@/components/StripeCheckout';
import { X } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentRequestButtonElement, useStripe } from '@stripe/react-stripe-js';
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

// Apple Pay Button Component - uses Stripe's native PaymentRequestButtonElement
interface ApplePayButtonProps {
  totalAmount: number;
  tenantName: string;
  onPaymentStart: () => Promise<{ clientSecret: string } | null>;
  onSuccess: () => void;
  onError: (message: string) => void;
  disabled?: boolean;
}

function ApplePayButton({ totalAmount, tenantName, onPaymentStart, onSuccess, onError, disabled }: ApplePayButtonProps) {
  const stripe = useStripe();
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [canPay, setCanPay] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!stripe || totalAmount <= 0) return;

    const pr = stripe.paymentRequest({
      country: 'US',
      currency: 'usd',
      total: {
        label: tenantName || 'Order Total',
        amount: Math.round(totalAmount * 100),
      },
      requestPayerName: true,
      requestPayerEmail: true,
      requestPayerPhone: true,
    });

    // Check if Apple Pay / Google Pay is available
    pr.canMakePayment().then((result) => {
      console.log('[ApplePay] canMakePayment:', result);
      if (result) {
        setPaymentRequest(pr);
        setCanPay(true);
      }
    });

    // Handle the payment
    pr.on('paymentmethod', async (event) => {
      console.log('[ApplePay] Payment method received:', event.paymentMethod.id);
      setProcessing(true);

      try {
        // Get payment intent from parent
        const intentData = await onPaymentStart();
        if (!intentData) {
          event.complete('fail');
          setProcessing(false);
          return;
        }

        // Confirm the payment
        const { error, paymentIntent } = await stripe.confirmCardPayment(
          intentData.clientSecret,
          { payment_method: event.paymentMethod.id },
          { handleActions: false }
        );

        if (error) {
          console.error('[ApplePay] Payment error:', error);
          event.complete('fail');
          onError(error.message || 'Payment failed');
          setProcessing(false);
          return;
        }

        event.complete('success');

        // Handle 3D Secure if needed
        if (paymentIntent?.status === 'requires_action') {
          const { error: actionError } = await stripe.confirmCardPayment(intentData.clientSecret);
          if (actionError) {
            onError(actionError.message || 'Payment verification failed');
            setProcessing(false);
            return;
          }
        }

        onSuccess();
      } catch (err) {
        event.complete('fail');
        onError(err instanceof Error ? err.message : 'Payment failed');
        setProcessing(false);
      }
    });

    return () => {
      // Cleanup
    };
  }, [stripe, totalAmount, tenantName]);

  // Update amount when it changes
  useEffect(() => {
    if (paymentRequest && totalAmount > 0) {
      paymentRequest.update({
        total: {
          label: tenantName || 'Order Total',
          amount: Math.round(totalAmount * 100),
        },
      });
    }
  }, [paymentRequest, totalAmount, tenantName]);

  if (!canPay || !paymentRequest) {
    return null;
  }

  if (processing) {
    return (
      <div className="w-full rounded-xl bg-black py-4 flex items-center justify-center gap-2" style={{ minHeight: '56px' }}>
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
        <span className="text-white font-semibold">Processing...</span>
      </div>
    );
  }

  return (
    <div className={disabled ? 'opacity-50 pointer-events-none' : ''}>
      <PaymentRequestButtonElement
        options={{
          paymentRequest,
          style: {
            paymentRequestButton: {
              type: 'buy',
              theme: 'dark',
              height: '56px',
            },
          },
        }}
      />
    </div>
  );
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
  const [stripeReady, setStripeReady] = useState(false);

  // Get Stripe promise for the connected account
  const stripePromise = useMemo(() => {
    if (stripeAccount) {
      return getStripePromise(stripeAccount);
    }
    return null;
  }, [stripeAccount]);

  // Fetch Stripe account on mount
  useEffect(() => {
    async function fetchStripeAccount() {
      try {
        const configRes = await fetch('/api/payments/config');
        const configData = await configRes.json();
        if (configData.stripeAccount) {
          setStripeAccount(configData.stripeAccount);
          setStripeReady(true);
        }
      } catch (err) {
        console.error('[Checkout] Failed to fetch Stripe config:', err);
      }
    }
    fetchStripeAccount();
  }, []);

  // Create payment intent for Apple Pay
  const createPaymentIntent = async (): Promise<{ clientSecret: string } | null> => {
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      setError('Please fill in your contact information first');
      return null;
    }

    if (orderType === 'delivery' && !customerInfo.address) {
      setError('Please enter a delivery address');
      return null;
    }

    try {
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
      return { clientSecret: data.clientSecret };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    }
  };

  const handleApplePaySuccess = () => {
    clearCart();
    router.push(`/order/success?tenant=${tenantSlug}`);
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
            <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#050A1C] via-[#050A1C] to-transparent p-4 lg:static lg:p-0 lg:bg-transparent z-50">
              <div className="space-y-3 max-w-lg mx-auto lg:max-w-none">
                {/* Native Apple Pay Button - Uses Stripe's official button */}
                {stripeReady && stripePromise && (
                  <Elements stripe={stripePromise}>
                    <ApplePayButton
                      totalAmount={total()}
                      tenantName={tenant.name || 'Las Reinas'}
                      onPaymentStart={createPaymentIntent}
                      onSuccess={handleApplePaySuccess}
                      onError={(msg) => setError(msg)}
                      disabled={loading}
                    />
                  </Elements>
                )}

                {/* Loading state while Stripe initializes */}
                {!stripeReady && (
                  <div className="flex items-center justify-center py-4">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
                    <span className="ml-2 text-sm text-white/60">Loading payment options...</span>
                  </div>
                )}

                {/* Divider - only show if not in card payment mode */}
                {!showCardPayment && stripeReady && (
                  <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-[#050A1C] px-3 text-white/50">or pay with card</span>
                    </div>
                  </div>
                )}

                {/* Card Payment Button / Section */}
                {!showCardPayment ? (
                  <button
                    onClick={handleCreatePaymentIntent}
                    disabled={loading || !stripeReady}
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
