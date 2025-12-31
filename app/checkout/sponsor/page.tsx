'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTenantTheme } from '@/components/TenantThemeProvider';
import { ArrowLeft, CreditCard, Users, PartyPopper, Check } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentRequestButtonElement,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import type { PaymentRequest, Stripe } from '@stripe/stripe-js';

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

interface GroupOrderData {
  id: string;
  sessionCode: string;
  name: string | null;
  organizerName: string;
  sponsorName: string | null;
  totalAmount: number;
  orderCount: number;
  orders: Array<{
    id: string;
    participantName: string | null;
    total: number;
    itemCount: number;
  }>;
}

// Payment Form for sponsor
interface SponsorPaymentFormProps {
  totalAmount: number;
  tenantName: string;
  sessionCode: string;
  primaryColor: string;
  onSuccess: () => void;
  onError: (message: string) => void;
}

function SponsorPaymentForm({
  totalAmount,
  tenantName,
  sessionCode,
  primaryColor,
  onSuccess,
  onError,
}: SponsorPaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [canPayWithApplePay, setCanPayWithApplePay] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Create payment intent
  const createPaymentIntent = async () => {
    const response = await fetch('/api/group-orders/sponsor-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionCode }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create payment');
    }

    const data = await response.json();
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
        label: `${tenantName} - Group Order`,
        amount: Math.round(totalAmount * 100),
      },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    pr.canMakePayment().then((result) => {
      if (result) {
        setPaymentRequest(pr);
        setCanPayWithApplePay(true);
      }
    });

    pr.on('paymentmethod', async (event) => {
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

        // Mark payment as complete
        await fetch('/api/group-orders/sponsor-checkout/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionCode,
            paymentIntentId: intentData.paymentIntentId,
          }),
        });

        onSuccess();
      } catch (err) {
        event.complete('fail');
        onError(err instanceof Error ? err.message : 'Payment failed');
        setProcessing(false);
      }
    });

    return () => {};
  }, [stripe, totalAmount, tenantName]);

  // Handle card payment
  const handleCardPayment = async () => {
    if (!stripe || !elements) {
      onError('Payment not ready');
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
      if (!secret) {
        const intentData = await createPaymentIntent();
        secret = intentData.clientSecret;
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(secret!, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        onError(error.message || 'Payment failed');
        setProcessing(false);
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        // Mark payment as complete
        await fetch('/api/group-orders/sponsor-checkout/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionCode,
            paymentIntentId: paymentIntent.id,
          }),
        });

        onSuccess();
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
      {/* Apple Pay Button */}
      {canPayWithApplePay && paymentRequest && (
        <div>
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
        disabled={processing}
        className="w-full rounded-xl py-4 text-base font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
          boxShadow: `0 4px 12px ${primaryColor}40`,
        }}
      >
        <span className="flex items-center justify-center gap-2">
          <CreditCard className="w-5 h-5" />
          Pay ${totalAmount.toFixed(2)} for Everyone
        </span>
      </button>
    </div>
  );
}

function SponsorCheckoutContent() {
  const tenant = useTenantTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionCode = searchParams.get('session');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupOrder, setGroupOrder] = useState<GroupOrderData | null>(null);
  const [stripeAccount, setStripeAccount] = useState<string | null>(null);
  const [stripeReady, setStripeReady] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const stripePromise = useMemo(() => {
    if (stripeAccount) {
      return getStripePromise(stripeAccount);
    }
    return getStripePromise();
  }, [stripeAccount]);

  // Fetch group order data
  useEffect(() => {
    if (!sessionCode) {
      setError('No session code provided');
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        // Fetch group order
        const orderRes = await fetch(`/api/group-orders/${sessionCode}`);
        if (!orderRes.ok) {
          throw new Error('Group order not found');
        }
        const orderData = await orderRes.json();

        if (!orderData.isSponsoredOrder) {
          throw new Error('This group order is not sponsored');
        }

        if (orderData.sponsorPaidAt) {
          throw new Error('This group order has already been paid');
        }

        setGroupOrder(orderData);

        // Fetch Stripe config
        const configRes = await fetch('/api/payments/config');
        const configData = await configRes.json();
        setStripeAccount(configData.stripeAccount);

        setStripeReady(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load group order');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [sessionCode]);

  const handlePaymentSuccess = () => {
    setPaymentSuccess(true);
  };

  // Success state
  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0A1628] to-[#050A1C] text-white flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <Check className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Payment Successful!</h1>
          <p className="text-white/60 mb-6">
            You&apos;ve paid for {groupOrder?.orderCount} orders totaling ${groupOrder?.totalAmount.toFixed(2)}.
            All participants have been notified.
          </p>
          <button
            onClick={() => router.push('/order')}
            className="px-6 py-3 rounded-xl font-medium text-white bg-white/10 hover:bg-white/20 border border-white/10 transition-all"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0A1628] to-[#050A1C] text-white flex flex-col items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-white/20 border-t-white"></div>
        <p className="mt-4 text-white/60">Loading group order...</p>
      </div>
    );
  }

  // Error state
  if (error || !groupOrder) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0A1628] to-[#050A1C] text-white flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
            <PartyPopper className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Unable to Load</h1>
          <p className="text-white/60 mb-6">{error || 'Group order not found'}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 rounded-xl font-medium text-white bg-white/10 hover:bg-white/20 border border-white/10 transition-all"
          >
            Go Back
          </button>
        </div>
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
          <h1 className="text-lg font-semibold">Pay for Group</h1>
        </div>
      </header>

      {/* Sponsor Banner */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <PartyPopper className="w-6 h-6 text-white" />
          <div className="flex-1">
            <p className="text-sm font-bold text-white">
              {groupOrder.sponsorName}&apos;s Buying!
            </p>
            <p className="text-xs text-white/80">
              Pay for {groupOrder.orderCount} people in this group
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-lg mx-auto px-4 py-4 pb-8">
        {/* Group Summary */}
        <section className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              {groupOrder.name || 'Group Order'}
            </h2>
            <span className="text-green-400 font-bold text-lg">
              ${groupOrder.totalAmount.toFixed(2)}
            </span>
          </div>

          {/* Participant breakdown */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {groupOrder.orders.map((order, index) => (
              <div key={order.id} className="flex justify-between text-sm py-2 border-b border-white/5 last:border-0">
                <span className="text-white/80 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/30 text-amber-400 text-xs flex items-center justify-center font-bold">
                    {index + 1}
                  </span>
                  {order.participantName || 'Guest'}
                  <span className="text-white/40">({order.itemCount} items)</span>
                </span>
                <span className="text-white/60">${order.total.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-3 mt-2 border-t border-white/10">
            <span className="font-medium text-white/70">Total for {groupOrder.orderCount} orders</span>
            <span className="text-xl font-bold text-green-400">
              ${groupOrder.totalAmount.toFixed(2)}
            </span>
          </div>
        </section>

        {/* Payment Section */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <h2 className="font-semibold mb-4">Payment</h2>
          {stripeReady ? (
            <Elements stripe={stripePromise}>
              <SponsorPaymentForm
                totalAmount={groupOrder.totalAmount}
                tenantName={tenant.name || 'Las Reinas'}
                sessionCode={sessionCode!}
                primaryColor={tenant.primaryColor || '#22c55e'}
                onSuccess={handlePaymentSuccess}
                onError={(msg) => setError(msg)}
              />
            </Elements>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
              <span className="ml-3 text-white/60">Loading payment...</span>
            </div>
          )}
        </section>

        {/* Info Note */}
        <p className="text-center text-xs text-white/40 mt-6 px-4">
          All participants will receive confirmation that their orders have been paid for.
        </p>
      </main>
    </div>
  );
}

export default function SponsorCheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-[#0A1628] to-[#050A1C] text-white flex flex-col items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-white/20 border-t-white"></div>
        <p className="mt-4 text-white/60">Loading...</p>
      </div>
    }>
      <SponsorCheckoutContent />
    </Suspense>
  );
}
