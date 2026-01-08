'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart, useCartHydrated } from '@/lib/store/cart';
import { useTenantTheme } from '@/components/TenantThemeProvider';
import { ArrowLeft, CreditCard, Trash2, Check, Users, PartyPopper, Clock } from 'lucide-react';
import ScheduledPickupSelector from '@/components/checkout/ScheduledPickupSelector';
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

// SECURITY: Cache Stripe instances per tenant+account to prevent cross-tenant pollution
// Key format: {tenantSlug}-{stripeAccount|platform}
const stripePromiseCache: Record<string, Promise<Stripe | null>> = {};

function getStripePromise(tenantSlug: string, stripeAccount?: string): Promise<Stripe | null> {
  // Include tenant slug in cache key to prevent cross-tenant Stripe instance sharing
  const cacheKey = `${tenantSlug}-${stripeAccount || 'platform'}`;
  if (!stripePromiseCache[cacheKey]) {
    const options = stripeAccount ? { stripeAccount } : undefined;
    stripePromiseCache[cacheKey] = loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
      options
    );
  }
  return stripePromiseCache[cacheKey];
}

// Saved Payment Method interface
interface SavedPaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth?: number;
  expYear?: number;
  isDefault?: boolean;
}

// Brand icons
const brandIcons: Record<string, string> = {
  visa: '💳',
  mastercard: '💳',
  amex: '💳',
  discover: '💳',
  unknown: '💳',
};

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
  savedCards: SavedPaymentMethod[];
  onRefreshCards: () => void;
  isLoggedIn: boolean;
  groupSessionCode?: string | null;
  participantName?: string | null;
  scheduledPickupTime?: Date | null;
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
  savedCards,
  onRefreshCards,
  isLoggedIn,
  groupSessionCode,
  participantName,
  scheduledPickupTime,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [canPayWithApplePay, setCanPayWithApplePay] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [saveCard, setSaveCard] = useState(true); // Default to save card for logged in users
  const [showNewCard, setShowNewCard] = useState(savedCards.length === 0);

  // Check if form is valid
  const isFormValid = customerInfo.name && customerInfo.email && customerInfo.phone &&
    (orderType === 'pickup' || customerInfo.address);

  // Create payment intent
  const createPaymentIntent = async (paymentMethodId?: string) => {
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
      // Scheduled pickup time (ISO string or null for ASAP)
      scheduledPickupTime: scheduledPickupTime?.toISOString() || null,
      // Group order context
      groupSessionCode: groupSessionCode || undefined,
      participantName: participantName || undefined,
    };

    const response = await fetch('/api/payments/intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order,
        saveCard: isLoggedIn && saveCard && !paymentMethodId,
        paymentMethodId, // For one-click pay with saved card
      }),
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

  // Handle saved card payment
  const handleSavedCardPayment = async (cardId: string) => {
    if (!isFormValid) {
      onError('Please fill in all required fields');
      return;
    }

    setProcessing(true);
    setSelectedCard(cardId);

    try {
      const data = await createPaymentIntent(cardId);

      // If payment succeeded immediately (off_session)
      if (data.success && data.status === 'succeeded') {
        onSuccess(data.paymentIntentId);
        return;
      }

      // If requires authentication (3D Secure)
      if (data.requiresAction && stripe && data.clientSecret) {
        const { error, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret);
        if (error) {
          onError(error.message || 'Payment authentication failed');
          setProcessing(false);
          return;
        }
        if (paymentIntent?.status === 'succeeded') {
          onSuccess(data.paymentIntentId);
        } else {
          onError('Payment was not successful');
          setProcessing(false);
        }
        return;
      }

      // Otherwise proceed with client-side confirmation
      if (stripe && data.clientSecret) {
        const { error, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret);
        if (error) {
          onError(error.message || 'Payment failed');
          setProcessing(false);
          return;
        }
        if (paymentIntent?.status === 'succeeded') {
          onSuccess(data.paymentIntentId);
        }
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Payment failed');
      setProcessing(false);
    }
  };

  // Delete saved card
  const handleDeleteCard = async (cardId: string) => {
    try {
      const res = await fetch('/api/customers/payment-methods', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId: cardId }),
      });

      if (res.ok) {
        onRefreshCards();
      }
    } catch (err) {
      console.error('Failed to delete card:', err);
    }
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
      {/* Saved Cards Section */}
      {savedCards.length > 0 && !showNewCard && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-white/80">Saved Cards</h3>
            <button
              onClick={() => setShowNewCard(true)}
              className="text-xs text-[#FBBF24] hover:underline"
            >
              + Use new card
            </button>
          </div>
          <div className="space-y-2">
            {savedCards.map((card) => (
              <div
                key={card.id}
                className={`relative flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
                  selectedCard === card.id
                    ? 'border-[#DC2626] bg-[#DC2626]/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
                onClick={() => !processing && handleSavedCardPayment(card.id)}
              >
                <div className="flex-shrink-0 w-10 h-6 rounded bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-xs font-bold text-white uppercase">
                  {card.brand.slice(0, 4)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">
                    •••• {card.last4}
                  </p>
                  {card.expMonth && card.expYear && (
                    <p className="text-xs text-white/50">
                      Expires {card.expMonth}/{card.expYear.toString().slice(-2)}
                    </p>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCard(card.id);
                  }}
                  className="p-1.5 rounded-full hover:bg-red-500/20 text-white/40 hover:text-red-400 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                {selectedCard === card.id && (
                  <div className="absolute right-12 top-1/2 -translate-y-1/2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pay with saved card button */}
          <button
            onClick={() => selectedCard && handleSavedCardPayment(selectedCard)}
            disabled={!isFormValid || processing || !selectedCard}
            className="w-full rounded-xl py-4 text-base font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50"
            style={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
              boxShadow: `0 4px 12px ${primaryColor}40`,
            }}
          >
            <span className="flex items-center justify-center gap-2">
              <CreditCard className="w-5 h-5" />
              Pay ${totalAmount.toFixed(2)} with Saved Card
            </span>
          </button>
        </div>
      )}

      {/* New Card / Apple Pay Section */}
      {(savedCards.length === 0 || showNewCard) && (
        <>
          {/* Back to saved cards */}
          {savedCards.length > 0 && showNewCard && (
            <button
              onClick={() => setShowNewCard(false)}
              className="text-sm text-[#FBBF24] hover:underline mb-2"
            >
              ← Back to saved cards
            </button>
          )}

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

          {/* Save Card Checkbox - only for logged in users */}
          {isLoggedIn && (
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                  saveCard
                    ? 'bg-[#DC2626] border-[#DC2626]'
                    : 'border-white/30 bg-transparent'
                }`}
                onClick={() => setSaveCard(!saveCard)}
              >
                {saveCard && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className="text-sm text-white/70">Save card for faster checkout next time</span>
            </label>
          )}

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
        </>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  const { items, total, clearCart, groupSessionCode, participantName, clearGroupOrder, isSponsoredOrder, sponsorName } = useCart();
  const isHydrated = useCartHydrated();
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
  const [scheduledPickupTime, setScheduledPickupTime] = useState<Date | null>(null); // null = ASAP
  const [stripeAccount, setStripeAccount] = useState<string | null>(null);
  const [stripeReady, setStripeReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedCards, setSavedCards] = useState<SavedPaymentMethod[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sponsoredOrderLoading, setSponsoredOrderLoading] = useState(false);

  const stripePromise = useMemo(() => {
    // SECURITY: Include tenant slug in Stripe cache key to prevent cross-tenant pollution
    if (stripeAccount) {
      return getStripePromise(tenantSlug, stripeAccount);
    }
    // Use platform account if no connected account
    return getStripePromise(tenantSlug);
  }, [tenantSlug, stripeAccount]);

  // Fetch Stripe config, saved cards, and logged-in customer info
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch Stripe config
        const configRes = await fetch('/api/payments/config');
        const configData = await configRes.json();
        setStripeAccount(configData.stripeAccount);

        // Fetch saved payment methods
        const cardsRes = await fetch('/api/customers/payment-methods');
        const cardsData = await cardsRes.json();
        if (cardsData.paymentMethods && cardsData.paymentMethods.length > 0) {
          setSavedCards(cardsData.paymentMethods);
          setIsLoggedIn(true);
        }

        // Fetch logged-in customer info to auto-fill form
        const customerRes = await fetch('/api/rewards/customer', {
          credentials: 'include',
          cache: 'no-store',
        });
        if (customerRes.ok) {
          const customerData = await customerRes.json();
          if (customerData && customerData.id) {
            setIsLoggedIn(true);
            // Auto-fill customer info
            setCustomerInfo(prev => ({
              ...prev,
              name: customerData.name || prev.name,
              email: customerData.email || prev.email,
              phone: customerData.phone || prev.phone,
            }));
          }
        }

        setStripeReady(true);
      } catch (err) {
        console.error('[Checkout] Failed to fetch data:', err);
        setStripeReady(true); // Still allow checkout with platform account
      }
    }
    fetchData();
  }, []);

  // Refresh saved cards
  const refreshCards = async () => {
    try {
      const res = await fetch('/api/customers/payment-methods');
      const data = await res.json();
      setSavedCards(data.paymentMethods || []);
    } catch (err) {
      console.error('Failed to refresh cards:', err);
    }
  };

  // Handle sponsored order submission (no payment needed)
  const handleSponsoredOrderSubmit = async () => {
    // Validate required fields
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      setError('Please fill in all required fields');
      return;
    }
    if (orderType === 'delivery' && !customerInfo.address) {
      setError('Please enter a delivery address');
      return;
    }

    setSponsoredOrderLoading(true);
    setError(null);

    try {
      // Create order without payment (sponsored order)
      const response = await fetch('/api/group-orders/add-participant-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupSessionCode,
          participantName,
          customerName: customerInfo.name,
          customerEmail: customerInfo.email,
          customerPhone: customerInfo.phone,
          fulfillmentMethod: orderType,
          deliveryAddress: orderType === 'delivery' ? customerInfo.address : undefined,
          scheduledPickupTime: scheduledPickupTime?.toISOString() || null,
          items: items.map((item) => ({
            menuItemId: extractMenuItemId(item.id),
            quantity: item.quantity,
            price: item.price,
            name: item.name,
            modifiers: item.modifiers,
            addons: item.addons,
            note: item.note,
          })),
          subtotalAmount: total(),
          totalAmount: total(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add order to group');
      }

      // Success - clear cart and redirect
      clearCart();
      clearGroupOrder();

      router.push(`/order/success?tenant=${tenantSlug}&group=${groupSessionCode}&sponsored=true`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add order');
      setSponsoredOrderLoading(false);
    }
  };

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
    clearGroupOrder(); // Clear group order context after successful payment

    // Redirect with group context if applicable
    const successUrl = groupSessionCode
      ? `/order/success?tenant=${tenantSlug}&group=${groupSessionCode}`
      : `/order/success${tenantSlug ? `?tenant=${tenantSlug}` : ''}`
    router.push(successUrl);
  };

  // Wait for cart to hydrate from localStorage before checking if empty
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0A1628] to-[#050A1C] text-white flex flex-col items-center justify-center px-4">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-white/20 border-t-white"></div>
        <p className="mt-4 text-white/60">Loading your cart...</p>
      </div>
    );
  }

  // Empty cart state - only show after hydration is complete
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
          {isLoggedIn && savedCards.length > 0 && (
            <span className="ml-auto text-xs bg-[#FBBF24]/20 text-[#FBBF24] px-2 py-0.5 rounded-full">
              {savedCards.length} card{savedCards.length > 1 ? 's' : ''} saved
            </span>
          )}
        </div>
      </header>

      {/* Group Order Banner - Different for sponsored orders */}
      {groupSessionCode && participantName && (
        <div className={isSponsoredOrder ? "bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-3" : "bg-amber-500 px-4 py-2"}>
          <div className="max-w-lg mx-auto flex items-center gap-3">
            {isSponsoredOrder ? (
              <PartyPopper className="w-6 h-6 text-white" />
            ) : (
              <Users className="w-5 h-5 text-black/70" />
            )}
            <div className="flex-1">
              {isSponsoredOrder ? (
                <>
                  <p className="text-sm font-bold text-white">
                    {sponsorName}&apos;s buying!
                  </p>
                  <p className="text-xs text-white/80">
                    Just add your items - no payment needed
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-black/90">
                    Group Order for <span className="font-bold">{participantName}</span>
                  </p>
                  <p className="text-xs text-black/60">Your order will be grouped with others</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

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
              onClick={() => tenant.deliveryEnabled && setOrderType('delivery')}
              disabled={!tenant.deliveryEnabled}
              className={`rounded-xl border p-3 transition-all relative ${
                !tenant.deliveryEnabled
                  ? 'border-white/10 bg-white/5 opacity-50 cursor-not-allowed'
                  : orderType === 'delivery'
                    ? 'border-[#DC2626] bg-[#DC2626]/10'
                    : 'border-white/10 bg-white/5'
              }`}
            >
              <span className="text-lg">🚗</span>
              <span className="ml-2 font-medium">Delivery</span>
              {!tenant.deliveryEnabled && (
                <span className="absolute -top-2 -right-2 text-[10px] bg-white/10 text-white/50 px-1.5 py-0.5 rounded-full">
                  Coming soon
                </span>
              )}
            </button>
          </div>
        </section>

        {/* Scheduled Pickup Time - Only show for pickup orders */}
        {orderType === 'pickup' && (
          <section className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <ScheduledPickupSelector
              value={scheduledPickupTime}
              onChange={setScheduledPickupTime}
              primaryColor={tenant.primaryColor || '#DC2626'}
            />
          </section>
        )}

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

        {/* Payment Section - Skip for sponsored orders */}
        {isSponsoredOrder ? (
          <section className="rounded-2xl border border-green-500/30 bg-green-500/10 p-4">
            <div className="text-center mb-4">
              <PartyPopper className="w-10 h-10 text-green-400 mx-auto mb-2" />
              <h2 className="font-semibold text-white">No Payment Needed!</h2>
              <p className="text-sm text-white/60 mt-1">
                {sponsorName} will pay for your order
              </p>
            </div>
            <button
              onClick={handleSponsoredOrderSubmit}
              disabled={sponsoredOrderLoading}
              className="w-full rounded-xl py-4 text-base font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                boxShadow: '0 4px 12px rgba(34, 197, 94, 0.4)',
              }}
            >
              {sponsoredOrderLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                  Adding to Group...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <PartyPopper className="w-5 h-5" />
                  Add My Order to Group
                </span>
              )}
            </button>
          </section>
        ) : (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h2 className="font-semibold mb-4">Payment</h2>
            {stripeReady ? (
              <Elements stripe={stripePromise}>
                <PaymentForm
                  totalAmount={total()}
                  tenantName={tenant.name || 'Restaurant'}
                  customerInfo={customerInfo}
                  orderType={orderType}
                  items={items.map((i) => ({ id: i.id, quantity: i.quantity, price: i.price }))}
                  onSuccess={handlePaymentSuccess}
                  onError={(msg) => setError(msg)}
                  primaryColor={tenant.primaryColor || '#DC2626'}
                  savedCards={savedCards}
                  onRefreshCards={refreshCards}
                  isLoggedIn={isLoggedIn}
                  groupSessionCode={groupSessionCode}
                  participantName={participantName}
                  scheduledPickupTime={scheduledPickupTime}
                />
              </Elements>
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
                <span className="ml-3 text-white/60">Loading payment...</span>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
