"use client";

import Image from "next/image";
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

export default function Cart() {
  const tenant = useTenantTheme();
  const membershipProgram: any = tenant.membershipProgram;
  const {
    items,
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
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const [tipSelection, setTipSelection] = useState<TipOption>("15");
  const [customTip, setCustomTip] = useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [paymentSessionId, setPaymentSessionId] = useState<string | null>(null);
  const [stripeAccount, setStripeAccount] = useState<string | undefined>(undefined);
  const [checkoutStep, setCheckoutStep] = useState<"details" | "payment">("details");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taxQuote, setTaxQuote] = useState<{ amount: number; rate: number; provider: string } | null>(null);
  const [taxQuoteLoading, setTaxQuoteLoading] = useState(false);
  const [taxQuoteError, setTaxQuoteError] = useState<string | null>(null);
  const [becomeMember, setBecomeMember] = useState(false);
  const [rewardDiscount, setRewardDiscount] = useState<{ type: 'percent' | 'amount'; value: number; name: string } | null>(null);
  const [rewardFreeShipping, setRewardFreeShipping] = useState(false);

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
      deliveryPartner: fulfillmentMethod === "delivery" ? "doordash" : undefined,
      deliveryQuoteId: fulfillmentMethod === "delivery" && deliveryQuoteId ? deliveryQuoteId : undefined,
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
      
      // Use DoorDash API for delivery quotes
      const response = await fetch("/api/delivery/doordash/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to fetch delivery quote.");
      }
      setDeliveryQuote(Number(data.deliveryFee ?? defaultDeliveryFee));
      setDeliveryQuoteId(data.quoteId || null);
    } catch (err) {
      setDeliveryError(err instanceof Error ? err.message : "Failed to fetch delivery quote.");
      // Fallback to default fee
      setDeliveryQuote(defaultDeliveryFee);
    } finally {
      setDeliveryLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!orderPayload) {
      setError("Add items to your cart before checking out.");
      return;
    }
    if (!isContactValid) {
      setError("Please provide an email or phone number so we can send order updates.");
      return;
    }

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
      setCheckoutStep("payment");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initiate checkout.");
    } finally {
      setLoading(false);
    }
  };

  const resetPaymentState = () => {
    setClientSecret(null);
    setPaymentIntentId(null);
    setPaymentSessionId(null);
    setStripeAccount(undefined);
    setCheckoutStep("details");
  };

  useEffect(() => {
    if (items.length === 0) {
      resetPaymentState();
    }
  }, [items.length]);

  return (
    <div className="flex w-full max-w-lg flex-col gap-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-xl md:p-8">
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

      {/* Progress Indicator */}
      {items.length > 0 && (
        <div className="flex items-center gap-2">
          <div 
            className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold transition ${
              checkoutStep === "details"
                ? "text-white"
                : "border-green-500 bg-green-500 text-white"
            }`}
            style={checkoutStep === "details" ? {
              borderColor: primaryColor,
              backgroundColor: primaryColor,
            } : {}}
          >
            {checkoutStep === "payment" ? "✓" : "1"}
          </div>
          <div 
            className={`h-1 flex-1 transition ${
              checkoutStep === "payment" ? "" : "bg-gray-200"
            }`}
            style={checkoutStep === "payment" ? {
              backgroundColor: primaryColor,
            } : {}}
          ></div>
          <div 
            className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold transition ${
              checkoutStep === "payment"
                ? "text-white"
                : "border-gray-300 bg-white text-gray-400"
            }`}
            style={checkoutStep === "payment" ? {
              borderColor: primaryColor,
              backgroundColor: primaryColor,
            } : {}}
          >
            2
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 p-12 text-center">
          <div className="text-5xl mb-4">🛒</div>
          <p className="text-base font-semibold text-gray-700">Your cart is empty</p>
          <p className="mt-2 text-sm text-gray-500">Browse the menu to add something delicious!</p>
        </div>
      ) : (
        <>
          <section className="space-y-3">
            {items.map((item) => (
              <article
                key={item.id}
                className="group flex gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
              >
                <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 shadow-sm">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-cover transition-transform group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-bold text-gray-400">
                      {item.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-base font-bold text-gray-900">{item.name}</p>
                      {item.description && (
                        <p className="mt-1 text-xs text-gray-600 line-clamp-2">{item.description}</p>
                      )}
                      {item.addons?.length ? (
                        <p className="mt-1 text-xs font-medium text-gray-700">
                          + {item.addons.map((addon) => addon.name).join(", ")}
                        </p>
                      ) : null}
                      {item.note && (
                        <p className="mt-1 text-xs italic text-gray-600">Note: {item.note}</p>
                      )}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-medium text-rose-600 transition hover:border-rose-300 hover:bg-rose-50"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-gray-200 bg-white text-base font-bold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 hover:scale-110"
                        aria-label={`Decrease quantity of ${item.name}`}
                      >
                        −
                      </button>
                      <span className="w-10 text-center text-base font-bold text-gray-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-gray-200 bg-white text-base font-bold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 hover:scale-110"
                        aria-label={`Increase quantity of ${item.name}`}
                      >
                        +
                      </button>
                    </div>
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </section>

          {checkoutStep === "details" && (
            <section className="space-y-6 rounded-2xl border border-gray-100 bg-gray-50 p-6">
              <h3 className="text-lg font-bold text-gray-900">Order Details</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-gray-700">
                  Name
                  <input
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    className="mt-2 w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Maria Perez"
                  />
                </label>
                <label className="text-sm font-semibold text-gray-700">
                  Email<span className="ml-1 text-rose-500">*</span>
                  <input
                    value={customerEmail}
                    onChange={(event) => setCustomerEmail(event.target.value)}
                    type="email"
                    className="mt-2 w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="maria@example.com"
                  />
                </label>
                <label className="text-sm font-semibold text-gray-700">
                  Phone
                  <input
                    value={customerPhone}
                    onChange={(event) => setCustomerPhone(event.target.value)}
                    type="tel"
                    className="mt-2 w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="(123) 456-7890"
                  />
                </label>
                <label className="text-sm font-semibold text-gray-700">
                  Order notes
                  <input
                    value={orderNotes}
                    onChange={(event) => setOrderNotes(event.target.value)}
                    className="mt-2 w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Add utensils, etc."
                  />
                </label>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-800">Fulfillment Method</p>
                <div className="mt-3 flex gap-3">
                  <button
                    onClick={() => setFulfillmentMethod("pickup")}
                    className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-bold transition ${
                      fulfillmentMethod === "pickup"
                        ? "shadow-md"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    }`}
                    style={fulfillmentMethod === "pickup" ? {
                      borderColor: primaryColor,
                      backgroundColor: `${primaryColor}15`,
                      color: primaryColor,
                    } : {}}
                    type="button"
                  >
                    🏃 Pickup
                  </button>
                  <button
                    onClick={() => setFulfillmentMethod("delivery")}
                    className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-bold transition ${
                      fulfillmentMethod === "delivery"
                        ? "shadow-md"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    }`}
                    style={fulfillmentMethod === "delivery" ? {
                      borderColor: primaryColor,
                      backgroundColor: `${primaryColor}15`,
                      color: primaryColor,
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
                    <span className="text-sm font-bold text-gray-800">DoorDash Delivery</span>
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
                      {deliveryLoading ? "Getting quote..." : "Get DoorDash Quote"}
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
                        ✓ DoorDash delivery quote ready. Estimated 35-45 minutes.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

              <div>
                <p className="text-sm font-semibold text-gray-800">Tip the team</p>
                <div className="mt-3 grid grid-cols-4 gap-3">
                  {TIP_OPTIONS.map((option) => (
                    <button
                      key={option}
                      onClick={() => setTipSelection(option)}
                      type="button"
                      className={`rounded-xl border-2 px-3 py-2.5 text-sm font-bold transition ${
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
            </section>
          )}

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
            {paymentSessionId && checkoutStep === "payment" && (
              <p className="text-xs text-gray-500">
                Payment session ID: <span className="font-mono">{paymentSessionId}</span>
              </p>
            )}
          </section>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              {error}
            </div>
          )}

          {checkoutStep === "payment" && clientSecret ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                <div 
                  className="flex h-10 w-10 items-center justify-center rounded-full text-white text-lg"
                  style={{
                    backgroundColor: primaryColor,
                  }}
                >
                  🔒
                </div>
                <div>
                  <p className="text-base font-bold text-gray-900">
                    Secure Payment
                  </p>
                  <p className="text-xs text-gray-500">
                    Your payment information is encrypted and secure
                  </p>
                </div>
              </div>
              
              {/* Payment Form - ALWAYS visible */}
              <div className="relative">
                <StripeCheckoutWrapper clientSecret={clientSecret} successPath="/order/success" totalAmount={totalAmount} stripeAccount={stripeAccount} />
              </div>
              
              <button
                onClick={resetPaymentState}
                type="button"
                className="w-full rounded-lg border-2 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                style={{
                  borderColor: `${primaryColor}40`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = primaryColor;
                  e.currentTarget.style.backgroundColor = `${primaryColor}08`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = `${primaryColor}40`;
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                ← Back to order details
              </button>
            </div>
          ) : (
            <button
              onClick={handleCheckout}
              disabled={loading || items.length === 0 || !isContactValid}
              className="w-full rounded-lg px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              style={{
                backgroundColor: primaryColor,
                boxShadow: `0 10px 15px -3px ${primaryColor}40, 0 4px 6px -2px ${primaryColor}20`,
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.boxShadow = `0 10px 15px -3px ${primaryColor}60, 0 4px 6px -2px ${primaryColor}40`;
                }
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.boxShadow = `0 10px 15px -3px ${primaryColor}40, 0 4px 6px -2px ${primaryColor}20`;
                }
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Preparing secure payment…
                </span>
              ) : (
                `Proceed to Payment · ${formatCurrency(totalAmount)}`
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
}
