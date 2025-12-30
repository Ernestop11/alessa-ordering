"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { OrderPayload } from "../lib/order-service";
import { useCart } from "../lib/store/cart";
import { StripeCheckoutWrapper } from "./StripeCheckout";
import { useTenantTheme } from "./TenantThemeProvider";

const DEFAULT_PLATFORM_PERCENT_FEE = 0.03;
const DEFAULT_PLATFORM_FLAT_FEE = 0.3;
const DEFAULT_TAX_RATE = 0.085;
const DEFAULT_DELIVERY_BASE_FEE = 4.99;
const ZIP_REGEX = /\b\d{5}(?:-\d{4})?\b/;

function extractPostalCode(value: string) {
  if (!value) return undefined;
  const match = value.match(ZIP_REGEX);
  return match ? match[0] : undefined;
}

const TIP_OPTIONS = ["0", "10", "15", "20", "custom"] as const;
type TipOption = typeof TIP_OPTIONS[number];

const roundCurrency = (value: number) => Number(value.toFixed(2));
const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

interface CartProps {
  darkMode?: boolean;
}

export default function Cart({ darkMode = false }: CartProps) {
  const tenant = useTenantTheme();
  const membershipProgram: any = tenant.membershipProgram;
  const {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  } = useCart();
  const searchParams = useSearchParams();

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [fulfillmentMethod, setFulfillmentMethod] = useState<"pickup" | "delivery">("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryQuote, setDeliveryQuote] = useState<number | null>(null);
  const [deliveryQuoteId, setDeliveryQuoteId] = useState<string | null>(null);
  const [deliveryPartner, setDeliveryPartner] = useState<'doordash' | 'uber' | null>(null);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const [tipSelection, setTipSelection] = useState<TipOption>("15");
  const [customTip, setCustomTip] = useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [paymentSessionId, setPaymentSessionId] = useState<string | null>(null);
  const [stripeAccount, setStripeAccount] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentReady, setPaymentReady] = useState(false);
  const [taxQuote, setTaxQuote] = useState<{ amount: number; rate: number; provider: string } | null>(null);
  const [taxQuoteLoading, setTaxQuoteLoading] = useState(false);
  const [taxQuoteError, setTaxQuoteError] = useState<string | null>(null);
  const [becomeMember, setBecomeMember] = useState(false);
  const [rewardDiscount, setRewardDiscount] = useState<{ type: 'percent' | 'amount'; value: number; name: string } | null>(null);
  const [rewardFreeShipping, setRewardFreeShipping] = useState(false);
  const [restaurantIsOpen, setRestaurantIsOpen] = useState(true);
  const [restaurantClosedMessage, setRestaurantClosedMessage] = useState("");

  // Poll restaurant status every 10 seconds
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/restaurant-status?t=${Date.now()}`);
        if (response.ok) {
          const data = await response.json();
          setRestaurantIsOpen(data.isOpen);
          setRestaurantClosedMessage(data.message || "We're currently closed");
        }
      } catch (err) {
        console.error('[Cart] Failed to check restaurant status:', err);
      }
    };

    // Check immediately
    checkStatus();

    // Then poll every 10 seconds
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  // Check if user came from "Join Rewards" button
  useEffect(() => {
    if (searchParams?.get('joinRewards') === 'true') {
      setBecomeMember(true);
    }
  }, [searchParams]);

  // Load reward discounts from localStorage
  useEffect(() => {
    const discountStr = localStorage.getItem('activeRewardDiscount');
    if (discountStr) {
      try {
        const discount = JSON.parse(discountStr);
        setRewardDiscount(discount);
      } catch (err) {
        console.error('Failed to parse reward discount', err);
      }
    }

    const freeShipping = localStorage.getItem('activeRewardFreeShipping');
    if (freeShipping === 'true') {
      setRewardFreeShipping(true);
    }
  }, []);
  
  // Get tenant theme colors
  const primaryColor = tenant.primaryColor || "#dc2626";
  const secondaryColor = tenant.secondaryColor || "#f59e0b";

  const subtotal = useMemo(
    () => roundCurrency(items.reduce((sum, item) => sum + item.price * item.quantity, 0)),
    [items],
  );

  // Calculate discount amount
  const discountAmount = useMemo(() => {
    if (!rewardDiscount || subtotal === 0) return 0;
    if (rewardDiscount.type === 'percent') {
      return roundCurrency(subtotal * (rewardDiscount.value / 100));
    } else {
      return roundCurrency(Math.min(rewardDiscount.value, subtotal));
    }
  }, [rewardDiscount, subtotal]);

  const subtotalAfterDiscount = useMemo(
    () => roundCurrency(Math.max(0, subtotal - discountAmount)),
    [subtotal, discountAmount],
  );

  const platformPercentFee = tenant.platformPercentFee ?? DEFAULT_PLATFORM_PERCENT_FEE;
  const platformFlatFee = tenant.platformFlatFee ?? DEFAULT_PLATFORM_FLAT_FEE;
  const defaultTaxRate = tenant.defaultTaxRate ?? DEFAULT_TAX_RATE;
  const defaultDeliveryFee = tenant.deliveryBaseFee ?? DEFAULT_DELIVERY_BASE_FEE;

  useEffect(() => {
    if (tipSelection !== "custom") {
      setCustomTip("");
    }
  }, [tipSelection]);

  useEffect(() => {
    if (fulfillmentMethod === "pickup") {
      setDeliveryQuote(null);
      setDeliveryAddress("");
      setDeliveryError(null);
    }
  }, [fulfillmentMethod]);

  const tipAmount = useMemo(() => {
    if (items.length === 0) return 0;
    if (tipSelection === "custom") {
      const parsed = Number(customTip);
      return Number.isFinite(parsed) ? roundCurrency(Math.max(parsed, 0)) : 0;
    }
    const percent = Number.parseInt(tipSelection, 10);
    // Calculate tip on subtotal after discount
    return roundCurrency(subtotalAfterDiscount * ((Number.isFinite(percent) ? percent : 15) / 100));
  }, [customTip, items.length, subtotalAfterDiscount, tipSelection]);

  const resolvedDeliveryFee = useMemo(() => {
    if (items.length === 0 || fulfillmentMethod !== "delivery") return 0;
    // Apply free shipping reward if active
    if (rewardFreeShipping) return 0;
    const fee = deliveryQuote ?? defaultDeliveryFee;
    return roundCurrency(fee);
  }, [defaultDeliveryFee, deliveryQuote, fulfillmentMethod, items.length, rewardFreeShipping]);

  const platformFee = useMemo(() => {
    if (items.length === 0) return 0;
    // Calculate platform fee on subtotal after discount
    const fee = subtotalAfterDiscount * platformPercentFee + platformFlatFee;
    return roundCurrency(Math.max(fee, 0));
  }, [items.length, platformFlatFee, platformPercentFee, subtotalAfterDiscount]);

  const taxBase = useMemo(() => {
    if (items.length === 0) return 0;
    // Calculate tax on subtotal after discount
    const base = subtotalAfterDiscount + resolvedDeliveryFee + platformFee;
    return roundCurrency(base);
  }, [items.length, platformFee, resolvedDeliveryFee, subtotalAfterDiscount]);

  const fallbackTaxAmount = useMemo(
    () => roundCurrency(taxBase * defaultTaxRate),
    [defaultTaxRate, taxBase],
  );

  useEffect(() => {
    if (items.length === 0) {
      setTaxQuote(null);
      setTaxQuoteError(null);
      setTaxQuoteLoading(false);
      return;
    }

    if (tenant.taxProvider === "builtin") {
      setTaxQuote(null);
      setTaxQuoteError(null);
      setTaxQuoteLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchTaxQuote = async () => {
      setTaxQuoteLoading(true);
      setTaxQuoteError(null);
      try {
        const normalizedItems = items.map((item) => ({
          menuItemId: item.id,
          quantity: item.quantity,
          price: roundCurrency(item.price),
          notes: item.note ?? undefined,
        }));

        const deliveryPostalCode =
          fulfillmentMethod === "delivery"
            ? extractPostalCode(deliveryAddress)
            : tenant.postalCode ?? undefined;

        const destination = {
          postalCode: deliveryPostalCode ?? tenant.postalCode ?? undefined,
          country: tenant.country ?? "US",
          state: tenant.state ?? undefined,
          city: tenant.city ?? undefined,
          line1: fulfillmentMethod === "delivery" ? deliveryAddress || undefined : tenant.addressLine1 ?? undefined,
        };

        const response = await fetch("/api/tax/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            order: {
              items: normalizedItems,
              subtotalAmount: subtotal,
              totalAmount: subtotal + resolvedDeliveryFee + platformFee + fallbackTaxAmount + tipAmount,
              taxAmount: fallbackTaxAmount,
              deliveryFee: resolvedDeliveryFee,
              tipAmount,
              platformFee,
              fulfillmentMethod,
              destination,
            },
            destination,
          }),
        });

        if (!response.ok) {
          const err = await response.text();
          throw new Error(err || "Failed to retrieve live tax rate.");
        }

        const data = await response.json();
        setTaxQuote({
          amount: Number(data.amount ?? 0),
          rate: Number(data.rate ?? 0),
          provider: typeof data.provider === "string" ? data.provider : "builtin",
        });
        setTaxQuoteError(
          Array.isArray(data.warnings) && data.warnings.length > 0 ? String(data.warnings[0]) : null,
        );
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error(err);
        setTaxQuote(null);
        setTaxQuoteError(err instanceof Error ? err.message : "Unable to fetch live tax. Using default rate.");
      } finally {
        if (!controller.signal.aborted) {
          setTaxQuoteLoading(false);
        }
      }
    };

    void fetchTaxQuote();

    return () => controller.abort();
  }, [
    fallbackTaxAmount,
    fulfillmentMethod,
    deliveryAddress,
    items,
    tenant.addressLine1,
    tenant.city,
    tenant.country,
    tenant.postalCode,
    tenant.state,
    tenant.taxProvider,
    platformFee,
    resolvedDeliveryFee,
    subtotal,
    tipAmount,
  ]);

  const taxAmount = useMemo(() => {
    if (taxQuote) {
      return roundCurrency(taxQuote.amount);
    }
    return fallbackTaxAmount;
  }, [fallbackTaxAmount, taxQuote]);

  const taxLabel = useMemo(() => {
    if (taxQuoteLoading) return 'calculating...';
    if (taxQuote) {
      const cleaned = typeof taxQuote.provider === 'string' ? taxQuote.provider.replace(/[-_]/g, ' ') : '';
      return cleaned ? cleaned : taxQuote.provider;
    }
    if (tenant.taxProvider !== 'builtin') return 'fallback';
    return null;
  }, [taxQuote, taxQuoteLoading, tenant.taxProvider]);

  const totalAmount = useMemo(
    () => roundCurrency(subtotalAfterDiscount + resolvedDeliveryFee + platformFee + taxAmount + tipAmount),
    [platformFee, resolvedDeliveryFee, subtotalAfterDiscount, taxAmount, tipAmount],
  );

  const estimatedPoints = useMemo(() => {
    const rate = Number(membershipProgram?.pointsPerDollar ?? 0);
    if (!Number.isFinite(rate) || rate <= 0) return null;
    return Math.max(0, Math.round(totalAmount * rate));
  }, [membershipProgram?.pointsPerDollar, totalAmount]);

  const isContactValid =
    customerEmail.trim().length > 0 || customerPhone.trim().length > 0;

  const orderPayload = useMemo<OrderPayload | null>(() => {
    if (items.length === 0) return null;

    const normalizedItems = items.map((item) => ({
      menuItemId: item.id,
      quantity: item.quantity,
      price: roundCurrency(item.price),
      notes: item.note ?? undefined,
    }));

    const deliveryPostalCode =
      fulfillmentMethod === "delivery" ? extractPostalCode(deliveryAddress) : tenant.postalCode ?? undefined;

    const destination =
      deliveryPostalCode ||
      tenant.country ||
      tenant.state ||
      tenant.city ||
      tenant.addressLine1
        ? {
            postalCode: deliveryPostalCode ?? tenant.postalCode ?? undefined,
            country: tenant.country ?? undefined,
            state: tenant.state ?? undefined,
            city: tenant.city ?? undefined,
            line1: fulfillmentMethod === "delivery" ? deliveryAddress || undefined : tenant.addressLine1 ?? undefined,
          }
        : undefined;

    return {
      items: normalizedItems,
      subtotalAmount: subtotal,
      totalAmount,
      taxAmount,
      deliveryFee: resolvedDeliveryFee,
      tipAmount,
      platformFee,
      fulfillmentMethod,
      deliveryQuoteId: fulfillmentMethod === "delivery" && deliveryQuoteId ? deliveryQuoteId : undefined,
      deliveryPartner: fulfillmentMethod === "delivery" ? deliveryPartner || 'doordash' : undefined,
      customerName: customerName.trim() || undefined,
      customerEmail: customerEmail.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      notes: orderNotes.trim() || undefined,
      paymentMethod: "card",
      destination,
    };
  }, [
    deliveryAddress,
    deliveryQuoteId,
    deliveryPartner,
    customerEmail,
    customerName,
    customerPhone,
    fulfillmentMethod,
    items,
    orderNotes,
    platformFee,
    resolvedDeliveryFee,
    subtotal,
    taxAmount,
    tipAmount,
    totalAmount,
    tenant.addressLine1,
    tenant.city,
    tenant.country,
    tenant.postalCode,
    tenant.state,
    becomeMember,
  ]);

  const fetchDeliveryQuote = async () => {
    if (items.length === 0) {
      setDeliveryError("Add items to your cart before requesting delivery.");
      return;
    }

    if (!deliveryAddress.trim()) {
      setDeliveryError("Please enter a delivery address.");
      return;
    }

    setDeliveryLoading(true);
    setDeliveryError(null);
    try {
      // Extract address components from delivery address
      const postalCode = extractPostalCode(deliveryAddress);
      const addressParts = deliveryAddress.split(',').map(s => s.trim());
      
      const addressPayload = {
        pickupAddress: {
          street: tenant.addressLine1 || "",
          city: tenant.city || "",
          state: tenant.state || "",
          zipCode: tenant.postalCode || "",
        },
        dropoffAddress: {
          street: addressParts[0] || deliveryAddress,
          city: addressParts[1] || tenant.city || "",
          state: addressParts[2]?.split(' ')[0] || tenant.state || "",
          zipCode: postalCode || tenant.postalCode || "",
        },
        orderValue: subtotal,
      };

      // Try Uber Direct first (if configured), then fallback to DoorDash
      let response;
      let partner: 'uber' | 'doordash' = 'doordash';
      
      try {
        // Try Uber Direct
        response = await fetch("/api/delivery/uber/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(addressPayload),
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.mode !== 'mock' && data.mode !== 'placeholder') {
            partner = 'uber';
            setDeliveryPartner('uber');
            setDeliveryQuote(Number(data.deliveryFee ?? defaultDeliveryFee));
            setDeliveryQuoteId(data.quoteId || null);
            return;
          }
        }
      } catch (uberErr) {
        console.log('[Cart] Uber Direct not available, trying DoorDash');
      }

      // Fallback to DoorDash
      response = await fetch("/api/delivery/doordash/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addressPayload),
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to fetch delivery quote.");
      }
      setDeliveryPartner('doordash');
      setDeliveryQuote(Number(data.deliveryFee ?? defaultDeliveryFee));
      setDeliveryQuoteId(data.quoteId || null);
    } catch (err) {
      setDeliveryError(err instanceof Error ? err.message : "Failed to fetch delivery quote.");
      // Fallback to default fee
      setDeliveryQuote(defaultDeliveryFee);
      setDeliveryPartner(null);
    } finally {
      setDeliveryLoading(false);
    }
  };

  const resetPaymentState = () => {
    setClientSecret(null);
    setPaymentIntentId(null);
    setPaymentSessionId(null);
    setStripeAccount(undefined);
    setPaymentReady(false);
  };

  useEffect(() => {
    if (items.length === 0) {
      resetPaymentState();
    }
  }, [items.length]);

  // Auto-create payment intent when contact info is valid AND restaurant is open
  useEffect(() => {
    // Skip if restaurant is closed, already have client secret, loading, or no valid contact
    if (!restaurantIsOpen || clientSecret || loading || !isContactValid || items.length === 0) {
      return;
    }

    // Debounce to avoid creating multiple intents while typing
    const timeoutId = setTimeout(async () => {
      if (!orderPayload) return;

      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/payments/intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order: orderPayload,
            currency: "usd",
          }),
        });

        const data = await response.json();
        if (!response.ok || !data.clientSecret) {
          console.error('[Cart] Payment intent creation failed:', data);
          throw new Error(data.error || "Failed to create Stripe payment intent.");
        }

        console.log('[Cart] Payment intent created successfully:', {
          hasClientSecret: !!data.clientSecret,
          paymentIntentId: data.paymentIntentId,
        });

        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId ?? null);
        setPaymentSessionId(data.paymentSessionId ?? null);
        setStripeAccount(data.stripeAccount || undefined);
        setPaymentReady(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to initiate checkout.");
      } finally {
        setLoading(false);
      }
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [items.length, isContactValid, customerEmail, customerPhone, clientSecret, loading, orderPayload, restaurantIsOpen]);

  return (
    <div className="flex w-full max-w-lg flex-col gap-3 sm:gap-6 rounded-2xl sm:rounded-3xl border border-gray-100 bg-white p-3 sm:p-6 shadow-xl md:p-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Checkout</h2>
          <p className="mt-1 text-sm text-gray-600">You have {items.length} item{items.length === 1 ? "" : "s"} in your cart.</p>
        </div>
        <button
          onClick={() => {
            clearCart();
            resetPaymentState();
          }}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50"
        >
          Clear
        </button>
      </header>


      {items.length === 0 ? (
        <div className={`rounded-2xl border-2 border-dashed p-12 text-center ${darkMode ? 'border-white/20 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
          <div className="text-5xl mb-4">🛒</div>
          <p className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-700'}`}>Your cart is empty</p>
          <p className={`mt-2 text-sm ${darkMode ? 'text-white/50' : 'text-gray-500'}`}>Browse the menu to add something delicious!</p>
        </div>
      ) : (
        <>
          <section className="space-y-3">
            {items.map((item) => (
              <article
                key={item.id}
                className={`group flex gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border p-3 sm:p-4 shadow-sm transition-all ${
                  darkMode
                    ? 'border-white/10 bg-white/5 hover:border-[#DC2626]/30 hover:bg-white/10'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <div className={`relative h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 overflow-hidden rounded-lg sm:rounded-xl shadow-sm ${
                  darkMode ? 'bg-white/10 ring-1 ring-white/10' : 'bg-gray-100'
                }`}>
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      onError={(e) => {
                        // Hide the entire image container on error
                        const target = e.target as HTMLImageElement;
                        target.parentElement!.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className={`flex h-full w-full items-center justify-center text-lg font-bold ${darkMode ? 'text-white/40' : 'text-gray-400'}`}>
                      {item.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm sm:text-base font-bold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.name}</p>
                      {item.description && (
                        <p className={`mt-0.5 text-xs line-clamp-1 sm:line-clamp-2 ${darkMode ? 'text-white/50' : 'text-gray-600'}`}>{item.description}</p>
                      )}
                      {item.addons?.length ? (
                        <p className={`mt-0.5 text-xs font-medium truncate ${darkMode ? 'text-white/70' : 'text-gray-700'}`}>
                          + {item.addons.map((addon) => addon.name).join(", ")}
                        </p>
                      ) : null}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className={`flex-shrink-0 rounded-lg border px-2 py-1 text-xs font-medium transition ${
                        darkMode
                          ? 'border-white/20 text-rose-400 hover:border-rose-400/40 hover:bg-rose-500/10'
                          : 'border-gray-200 text-rose-600 hover:border-rose-300 hover:bg-rose-50'
                      }`}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border text-sm sm:text-base font-bold transition active:scale-95 ${
                          darkMode
                            ? 'border-white/20 bg-white/5 text-white hover:border-[#DC2626]/40 hover:bg-white/10'
                            : 'border-2 border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        aria-label={`Decrease quantity of ${item.name}`}
                      >
                        −
                      </button>
                      <span className={`w-6 sm:w-8 text-center text-sm sm:text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border text-sm sm:text-base font-bold transition active:scale-95 ${
                          darkMode
                            ? 'border-white/20 bg-white/5 text-white hover:border-[#DC2626]/40 hover:bg-white/10'
                            : 'border-2 border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        aria-label={`Increase quantity of ${item.name}`}
                      >
                        +
                      </button>
                    </div>
                    <span className={`text-sm sm:text-lg font-bold flex-shrink-0 ${darkMode ? 'text-[#FBBF24]' : 'text-gray-900'}`}>
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </section>

          <section className={`space-y-4 sm:space-y-6 rounded-xl sm:rounded-2xl border p-4 sm:p-6 ${
            darkMode ? 'border-white/10 bg-white/5' : 'border-gray-100 bg-gray-50'
          }`}>
            <h3 className={`text-base sm:text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Order Details</h3>
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                <label className={`text-xs sm:text-sm font-semibold ${darkMode ? 'text-white/70' : 'text-gray-700'}`}>
                  Name
                  <input
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    className={`mt-1.5 sm:mt-2 w-full rounded-lg sm:rounded-xl border px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-medium transition focus:outline-none ${
                      darkMode
                        ? 'border-white/20 bg-white/5 text-white placeholder:text-white/30 focus:border-[#DC2626]/60 focus:ring-2 focus:ring-[#DC2626]/20'
                        : 'border-2 border-gray-200 bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                    }`}
                    placeholder="Maria Perez"
                  />
                </label>
                <label className={`text-xs sm:text-sm font-semibold ${darkMode ? 'text-white/70' : 'text-gray-700'}`}>
                  Email<span className="ml-1 text-rose-500">*</span>
                  <input
                    value={customerEmail}
                    onChange={(event) => setCustomerEmail(event.target.value)}
                    type="email"
                    className={`mt-1.5 sm:mt-2 w-full rounded-lg sm:rounded-xl border px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-medium transition focus:outline-none ${
                      darkMode
                        ? 'border-white/20 bg-white/5 text-white placeholder:text-white/30 focus:border-[#DC2626]/60 focus:ring-2 focus:ring-[#DC2626]/20'
                        : 'border-2 border-gray-200 bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                    }`}
                    placeholder="maria@example.com"
                  />
                </label>
                <label className={`text-xs sm:text-sm font-semibold ${darkMode ? 'text-white/70' : 'text-gray-700'}`}>
                  Phone
                  <input
                    value={customerPhone}
                    onChange={(event) => setCustomerPhone(event.target.value)}
                    type="tel"
                    className={`mt-1.5 sm:mt-2 w-full rounded-lg sm:rounded-xl border px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-medium transition focus:outline-none ${
                      darkMode
                        ? 'border-white/20 bg-white/5 text-white placeholder:text-white/30 focus:border-[#DC2626]/60 focus:ring-2 focus:ring-[#DC2626]/20'
                        : 'border-2 border-gray-200 bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                    }`}
                    placeholder="(123) 456-7890"
                  />
                </label>
                <label className={`text-xs sm:text-sm font-semibold ${darkMode ? 'text-white/70' : 'text-gray-700'}`}>
                  Order notes
                  <input
                    value={orderNotes}
                    onChange={(event) => setOrderNotes(event.target.value)}
                    className={`mt-1.5 sm:mt-2 w-full rounded-lg sm:rounded-xl border px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-medium transition focus:outline-none ${
                      darkMode
                        ? 'border-white/20 bg-white/5 text-white placeholder:text-white/30 focus:border-[#DC2626]/60 focus:ring-2 focus:ring-[#DC2626]/20'
                        : 'border-2 border-gray-200 bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                    }`}
                    placeholder="Add utensils, etc."
                  />
                </label>
              </div>

              <div>
                <p className={`text-xs sm:text-sm font-semibold ${darkMode ? 'text-white/80' : 'text-gray-800'}`}>Fulfillment Method</p>
                <div className="mt-2 sm:mt-3 flex gap-2 sm:gap-3">
                  <button
                    onClick={() => setFulfillmentMethod("pickup")}
                    className={`flex-1 rounded-lg sm:rounded-xl border-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold transition ${
                      fulfillmentMethod === "pickup"
                        ? "shadow-md"
                        : darkMode
                          ? "border-white/20 bg-white/5 text-white/70 hover:border-white/30"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    }`}
                    style={fulfillmentMethod === "pickup" ? {
                      borderColor: primaryColor,
                      backgroundColor: darkMode ? `${primaryColor}30` : `${primaryColor}15`,
                      color: darkMode ? '#fff' : primaryColor,
                    } : {}}
                    type="button"
                  >
                    🏃 Pickup
                  </button>
                  <button
                    onClick={() => setFulfillmentMethod("delivery")}
                    className={`flex-1 rounded-lg sm:rounded-xl border-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold transition ${
                      fulfillmentMethod === "delivery"
                        ? "shadow-md"
                        : darkMode
                          ? "border-white/20 bg-white/5 text-white/70 hover:border-white/30"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    }`}
                    style={fulfillmentMethod === "delivery" ? {
                      borderColor: primaryColor,
                      backgroundColor: darkMode ? `${primaryColor}30` : `${primaryColor}15`,
                      color: darkMode ? '#fff' : primaryColor,
                    } : {}}
                    type="button"
                  >
                    🚗 Delivery
                  </button>
                </div>
              {fulfillmentMethod === "delivery" && (
                <div className="mt-3 space-y-3 rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🚗</span>
                    <span className="text-sm font-bold text-gray-800">
                      {deliveryPartner === 'uber' ? 'Uber Direct' : 'DoorDash'} Delivery
                    </span>
                    {!deliveryPartner && (
                      <span className="text-xs text-gray-500">(Auto-select partner)</span>
                    )}
                  </div>
                  <label className="text-sm font-medium text-gray-700">
                    Delivery address
                    <textarea
                      value={deliveryAddress}
                      onChange={(event) => setDeliveryAddress(event.target.value)}
                      rows={2}
                      className="mt-1 w-full rounded-lg border-2 border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                      placeholder="Street address, city, state, zip code"
                    />
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={fetchDeliveryQuote}
                      type="button"
                      className="rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 px-4 py-2 text-sm font-bold text-white shadow-md transition hover:from-amber-600 hover:to-yellow-600 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={deliveryLoading || !deliveryAddress.trim()}
                    >
                      {deliveryLoading ? "Getting quote..." : "Get Delivery Quote"}
                    </button>
                    {deliveryQuote !== null && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-700">Delivery Fee:</span>
                        <span className="text-lg font-bold text-amber-700">
                          {formatCurrency(deliveryQuote)}
                        </span>
                      </div>
                    )}
                  </div>
                  {deliveryError && (
                    <div className="rounded-lg bg-rose-50 border border-rose-200 p-2">
                      <p className="text-sm text-rose-600">{deliveryError}</p>
                    </div>
                  )}
                  {deliveryQuote !== null && !deliveryError && (
                    <div className="rounded-lg bg-green-50 border border-green-200 p-2">
                      <p className="text-xs text-green-700">
                        ✓ {deliveryPartner === 'uber' ? 'Uber Direct' : 'DoorDash'} delivery quote ready. Estimated 30-45 minutes.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

              <div>
                <p className="text-xs sm:text-sm font-semibold text-gray-800">Tip the team</p>
                <div className="mt-2 sm:mt-3 grid grid-cols-3 sm:grid-cols-5 gap-1.5 sm:gap-2">
                  {TIP_OPTIONS.map((option) => (
                    <button
                      key={option}
                      onClick={() => setTipSelection(option)}
                      type="button"
                      className={`rounded-lg sm:rounded-xl border-2 px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-bold transition ${
                        tipSelection === option
                          ? "shadow-md"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                      }`}
                      style={tipSelection === option ? {
                        borderColor: primaryColor,
                        backgroundColor: `${primaryColor}15`,
                        color: primaryColor,
                      } : {}}
                    >
                      {option === "custom" ? "Custom" : `${option}%`}
                    </button>
                  ))}
                </div>
                {tipSelection === "custom" && (
                  <div className="mt-3">
                    <input
                      value={customTip}
                      onChange={(event) => setCustomTip(event.target.value)}
                      type="number"
                      min="0"
                      step="0.25"
                      className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Enter custom tip amount"
                    />
                  </div>
                )}
              </div>

              {/* Membership Toggle */}
              {membershipProgram && (
                <div
                  className="rounded-xl border-2 border-dashed p-4"
                  style={{
                    borderColor: `${primaryColor}40`,
                    backgroundColor: `${primaryColor}08`,
                  }}
                >
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={becomeMember}
                      onChange={(e) => setBecomeMember(e.target.checked)}
                      className="mt-1 h-5 w-5 rounded cursor-pointer"
                      style={{
                        accentColor: primaryColor,
                      }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🎁</span>
                        <span className="font-semibold text-gray-900">Become a Member</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Save your info for faster checkout next time. Earn {membershipProgram.pointsPerDollar ? `${membershipProgram.pointsPerDollar} points per $1` : 'points'} on every order! {estimatedPoints && estimatedPoints > 0 && `This order: ${estimatedPoints} points.`}
                      </p>
                    </div>
                  </label>
                </div>
              )}

              {/* Upsell Bundles Section - styled like cart items */}
              {tenant.upsellBundles && tenant.upsellBundles.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔥</span>
                    <h4 className="text-sm font-bold text-gray-900">Complete Your Order</h4>
                  </div>
                  {tenant.upsellBundles
                    .filter(bundle => !bundle.surfaces || bundle.surfaces.includes('cart') || bundle.surfaces.includes('checkout'))
                    .slice(0, 3)
                    .map((bundle) => {
                      const isInCart = items.some(item => item.name === bundle.name && item.isUpsell);
                      return (
                        <article
                          key={bundle.id}
                          className={`group flex gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border p-3 sm:p-4 shadow-sm transition-all ${
                            isInCart
                              ? 'border-green-300 bg-green-50'
                              : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                          }`}
                        >
                          <div className="relative h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 overflow-hidden rounded-lg sm:rounded-xl bg-gray-100 shadow-sm">
                            {bundle.image ? (
                              <img
                                src={bundle.image}
                                alt={bundle.name}
                                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.parentElement!.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-lg font-bold text-gray-400">
                                {bundle.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-1 flex-col gap-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm sm:text-base font-bold text-gray-900 truncate">{bundle.name}</p>
                                  {bundle.tag && (
                                    <span
                                      className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-bold rounded-full text-white"
                                      style={{ backgroundColor: primaryColor }}
                                    >
                                      {bundle.tag}
                                    </span>
                                  )}
                                </div>
                                {bundle.description && (
                                  <p className="mt-0.5 text-xs text-gray-600 line-clamp-2">{bundle.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="mt-auto flex items-center justify-between gap-2">
                              <span className="text-sm sm:text-lg font-bold text-gray-900">
                                ${bundle.price.toFixed(2)}
                              </span>
                              {isInCart ? (
                                <span className="px-3 py-1.5 text-xs font-bold text-green-700 bg-green-100 rounded-lg">
                                  ✓ Added
                                </span>
                              ) : (
                                <button
                                  onClick={() => {
                                    addToCart({
                                      id: `upsell-${bundle.id}-${Date.now()}`,
                                      name: bundle.name,
                                      price: bundle.price,
                                      quantity: 1,
                                      image: bundle.image,
                                      description: bundle.description,
                                      isUpsell: true,
                                    });
                                  }}
                                  className="px-4 py-2 text-xs sm:text-sm font-bold text-white rounded-lg transition-all hover:scale-105 active:scale-95"
                                  style={{ backgroundColor: primaryColor }}
                                >
                                  {bundle.cta || '+ Add to Order'}
                                </button>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                </div>
              )}
            </section>

          <section className="space-y-3 rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal</span>
                <span className="font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Platform fee</span>
                <span className="font-semibold">{formatCurrency(platformFee)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Delivery</span>
                <span className="font-semibold">{formatCurrency(resolvedDeliveryFee)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Tax{taxLabel ? ` (${taxLabel})` : ""}</span>
                <span className="font-semibold">{formatCurrency(taxAmount)}</span>
              </div>
              {taxQuoteError && (
                <p className="text-xs text-amber-600">
                  {taxQuoteError}
                </p>
              )}
              <div className="flex justify-between text-gray-700">
                <span>Tip</span>
                <span className="font-semibold">{formatCurrency(tipAmount)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between border-t-2 border-gray-300 pt-4 text-xl font-black text-gray-900">
              <span>Total due</span>
              <span className="text-2xl">{formatCurrency(totalAmount)}</span>
            </div>
            {estimatedPoints !== null && estimatedPoints > 0 && (
              <div className="rounded-lg bg-amber-100/70 px-3 py-2 text-xs font-medium text-amber-700">
                Earn {estimatedPoints} loyalty points with this order.
              </div>
            )}
          </section>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              {error}
            </div>
          )}

          {/* Payment Section - Always visible */}
          <section className="space-y-4 rounded-2xl border-2 border-gray-200 bg-white p-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-white text-lg"
                style={{ backgroundColor: restaurantIsOpen ? primaryColor : '#ef4444' }}
              >
                {restaurantIsOpen ? '🔒' : '🚫'}
              </div>
              <div>
                <p className="text-base font-bold text-gray-900">
                  {restaurantIsOpen ? 'Payment' : 'Restaurant Closed'}
                </p>
                <p className="text-xs text-gray-500">
                  {!restaurantIsOpen
                    ? restaurantClosedMessage
                    : clientSecret
                    ? "Choose your payment method"
                    : "Enter your email above to continue"}
                </p>
              </div>
            </div>

            {/* Show closed message when restaurant is not accepting orders */}
            {!restaurantIsOpen && (
              <div className="rounded-xl border-2 border-dashed border-red-300 bg-red-50 p-6 text-center">
                <p className="text-sm font-medium text-red-700">
                  {restaurantClosedMessage || "We're currently not accepting orders. Please check back later."}
                </p>
              </div>
            )}

            {restaurantIsOpen && loading && !clientSecret && (
              <div className="flex items-center justify-center py-6">
                <span className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"></span>
                  Preparing payment...
                </span>
              </div>
            )}

            {restaurantIsOpen && !isContactValid && !loading && (
              <div
                className="rounded-xl border-2 border-dashed p-6 text-center"
                style={{ borderColor: `${primaryColor}40`, backgroundColor: `${primaryColor}08` }}
              >
                <p className="text-sm font-medium text-gray-700">
                  Enter your email or phone above to see payment options
                </p>
              </div>
            )}

            {restaurantIsOpen && clientSecret && (
              <div className="relative">
                <StripeCheckoutWrapper
                  clientSecret={clientSecret}
                  successPath="/order/success"
                  totalAmount={totalAmount}
                  stripeAccount={stripeAccount}
                />
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
