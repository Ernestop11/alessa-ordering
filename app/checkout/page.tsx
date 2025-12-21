'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/lib/store/cart';
import { useTenantTheme } from '@/components/TenantThemeProvider';
import { ArrowLeft } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentRequestButtonElement,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import type { PaymentRequest, Stripe } from '@stripe/stripe-js';

// Extract real menuItemId from cart item ID (strips timestamp suffix)
function extractMenuItemId(cartId: string): string {
  const uuidPattern = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
  const match = cartId.match(uuidPattern);
  return match ? match[1] : cartId;
}

// Cache for stripe instances
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

// Combined Payment Form Component
interface PaymentFormProps {
  totalAmount: number;
  tenantName: string;
  customerInfo: { name: string; email: string; phone: string; address: string };
  orderType: 'pickup' | 'delivery';
  items: Array<{ id: string; quantity: number; price: number }>;
  onSuccess: (paymentIntentId: string) => void;
  onError: (message: string) => void;
  primaryColor: string;
}

function PaymentForm({
  totalAmount,
  tenantName,
  customerInfo,
  orderType,
  items,
  onSuccess,
  onError,
  primaryColor,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [canPayWithApplePay, setCanPayWithApplePay] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  // Check if form is valid
  const isFormValid = customerInfo.name && customerInfo.email && customerInfo.phone &&
    (orderType === 'pickup' || customerInfo.address);

  // Create payment intent
  const createPaymentIntent = async () => {
    const order = {
      items: items.map((item) => ({
        menuItemId: extractMenuItemId(item.id),
        quantity: item.quantity,
        price: item.price,
      })),
      subtotalAmount: totalAmount,
      totalAmount: totalAmount,
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
      throw new Error(errorData.error || 'Failed to create payment');
    }

    const data = await response.json();
    setPaymentIntentId(data.paymentIntentId);
    setClientSecret(data.clientSecret);
    return data;
  };

  // Setup Apple Pay
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

    pr.canMakePayment().then((result) => {
      if (result) {
        setPaymentRequest(pr);
        setCanPayWithApplePay(true);
      }
    });

    pr.on('paymentmethod', async (event) => {
      if (!isFormValid) {
        event.complete('fail');
        onError('Please fill in all required fields');
        return;
      }

      setProcessing(true);

      try {
        const intentData = await createPaymentIntent();

        const { error, paymentIntent } = await stripe.confirmCardPayment(
          intentData.clientSecret,
          { payment_method: event.paymentMethod.id },
          { handleActions: false }
        );

        if (error) {
          event.complete('fail');
          onError(error.message || 'Payment failed');
          setProcessing(false);
          return;
        }

        event.complete('success');

        if (paymentIntent?.status === 'requires_action') {
          const { error: actionError } = await stripe.confirmCardPayment(intentData.clientSecret);
          if (actionError) {
            onError(actionError.message || 'Payment verification failed');
            setProcessing(false);
            return;
          }
        }

        onSuccess(intentData.paymentIntentId);
      } catch (err) {
        event.complete('fail');
        onError(err instanceof Error ? err.message : 'Payment failed');
        setProcessing(false);
      }
    });

    return () => {};
  }, [stripe, totalAmount, tenantName, isFormValid]);

  // Update payment request amount
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

  // Handle card payment
  const handleCardPayment = async () => {
    if (!stripe || !elements || !isFormValid) {
      onError('Please fill in all required fields');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      onError('Card element not found');
      return;
    }

    setProcessing(true);

    try {
      // Create payment intent if not already created
      let secret = clientSecret;
      let piId = paymentIntentId;
      if (!secret) {
        const intentData = await createPaymentIntent();
        secret = intentData.clientSecret;
        piId = intentData.paymentIntentId;
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(secret!, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: customerInfo.name,
            email: customerInfo.email,
            phone: customerInfo.phone,
          },
        },
      });

      if (error) {
        onError(error.message || 'Payment failed');
        setProcessing(false);
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        onSuccess(piId!);
      } else {
        onError('Payment was not successful');
        setProcessing(false);
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Payment failed');
      setProcessing(false);
    }
  };

  if (processing) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-white/20 border-t-white"></div>
        <p className="mt-3 text-white/80 font-medium">Processing payment...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Apple Pay Button - shown first and prominently */}
      {canPayWithApplePay && paymentRequest && (
        <div className={!isFormValid ? 'opacity-50 pointer-events-none' : ''}>
          <PaymentRequestButtonElement
            options={{
              paymentRequest,
              style: {
                paymentRequestButton: {
                  type: 'buy',
                  theme: 'dark',
                  height: '52px',
                },
              },
            }}
          />
          {!isFormValid && (
            <p className="text-xs text-center text-white/50 mt-2">
              Fill in your info above to enable Apple Pay
            </p>
          )}
        </div>
      )}

      {/* Divider */}
      {canPayWithApplePay && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[#0A1628] px-3 text-white/40">or pay with card</span>
          </div>
        </div>
      )}

      {/* Card Input */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#ffffff',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                '::placeholder': {
                  color: 'rgba(255, 255, 255, 0.4)',
                },
              },
              invalid: {
                color: '#ef4444',
              },
            },
          }}
        />
      </div>

      {/* Pay Button */}
      <button
        onClick={handleCardPayment}
        disabled={!isFormValid || processing}
        className="w-full rounded-xl py-4 text-base font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
          boxShadow: `0 4px 12px ${primaryColor}40`,
        }}
      >
        Pay ${totalAmount.toFixed(2)}
      </button>
    </div>
  );
}

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const tenant = useTenantTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantSlug = searchParams.get('tenant') || tenant.slug;

  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('pickup');
  const [stripeAccount, setStripeAccount] = useState<string | null>(null);
  const [stripeReady, setStripeReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stripePromise = useMemo(() => {
    if (stripeAccount) {
      return getStripePromise(stripeAccount);
    }
    // Use platform account if no connected account
    return getStripePromise();
  }, [stripeAccount]);

  // Fetch Stripe config
  useEffect(() => {
    async function fetchStripeConfig() {
      try {
        const res = await fetch('/api/payments/config');
        const data = await res.json();
        setStripeAccount(data.stripeAccount);
        setStripeReady(true);
      } catch (err) {
        console.error('[Checkout] Failed to fetch Stripe config:', err);
        setStripeReady(true); // Still allow checkout with platform account
      }
    }
    fetchStripeConfig();
  }, []);

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    // Confirm order creation
    try {
      await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId }),
      });
    } catch (err) {
      console.error('[Checkout] Order confirmation error:', err);
    }

    clearCart();
    router.push(`/order/success${tenantSlug ? `?tenant=${tenantSlug}` : ''}`);
  };

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0A1628] to-[#050A1C] text-white flex flex-col items-center justify-center px-4">
        <div className="text-6xl mb-4">🛒</div>
        <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
        <p className="text-white/60 mb-6 text-center">Add some delicious items before checkout</p>
        <button
          onClick={() => router.push(`/order${tenantSlug ? `?tenant=${tenantSlug}` : ''}`)}
          className="rounded-xl px-6 py-3 font-semibold text-white"
          style={{ backgroundColor: tenant.primaryColor }}
        >
          Browse Menu
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A1628] to-[#050A1C] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0A1628]/95 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full hover:bg-white/10 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">Checkout</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 pb-8">
        {/* Order Summary - Compact */}
        <section className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Order Summary</h2>
            <span className="text-[#FBBF24] font-bold text-lg">${total().toFixed(2)}</span>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-white/80 truncate flex-1 mr-2">
                  {item.quantity}x {item.name}
                </span>
                <span className="text-white/60">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Order Type */}
        <section className="mb-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setOrderType('pickup')}
              className={`rounded-xl border p-3 transition-all ${
                orderType === 'pickup'
                  ? 'border-[#DC2626] bg-[#DC2626]/10'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              <span className="text-lg">🏃</span>
              <span className="ml-2 font-medium">Pickup</span>
            </button>
            <button
              onClick={() => setOrderType('delivery')}
              className={`rounded-xl border p-3 transition-all ${
                orderType === 'delivery'
                  ? 'border-[#DC2626] bg-[#DC2626]/10'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              <span className="text-lg">🚗</span>
              <span className="ml-2 font-medium">Delivery</span>
            </button>
          </div>
        </section>

        {/* Customer Info */}
        <section className="mb-4 space-y-3">
          <h2 className="font-semibold">Your Info</h2>
          <input
            type="text"
            value={customerInfo.name}
            onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none"
            placeholder="Full Name *"
            autoComplete="name"
          />
          <input
            type="email"
            value={customerInfo.email}
            onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none"
            placeholder="Email *"
            autoComplete="email"
          />
          <input
            type="tel"
            value={customerInfo.phone}
            onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none"
            placeholder="Phone *"
            autoComplete="tel"
          />
          {orderType === 'delivery' && (
            <input
              type="text"
              value={customerInfo.address}
              onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none"
              placeholder="Delivery Address *"
              autoComplete="street-address"
            />
          )}
        </section>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Payment Section */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 className="font-semibold mb-4">Payment</h2>
          {stripeReady ? (
            <Elements stripe={stripePromise}>
              <PaymentForm
                totalAmount={total()}
                tenantName={tenant.name || 'Las Reinas'}
                customerInfo={customerInfo}
                orderType={orderType}
                items={items.map((i) => ({ id: i.id, quantity: i.quantity, price: i.price }))}
                onSuccess={handlePaymentSuccess}
                onError={(msg) => setError(msg)}
                primaryColor={tenant.primaryColor || '#DC2626'}
              />
            </Elements>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
              <span className="ml-3 text-white/60">Loading payment...</span>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
