"use client";

import Image from "next/image";
import React, { useEffect, useMemo, useState } from "react";
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

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [fulfillmentMethod, setFulfillmentMethod] = useState<"pickup" | "delivery">("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryQuote, setDeliveryQuote] = useState<number | null>(null);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const [tipSelection, setTipSelection] = useState<TipOption>("15");
  const [customTip, setCustomTip] = useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [paymentSessionId, setPaymentSessionId] = useState<string | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<"details" | "payment">("details");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taxQuote, setTaxQuote] = useState<{ amount: number; rate: number; provider: string } | null>(null);
  const [taxQuoteLoading, setTaxQuoteLoading] = useState(false);
  const [taxQuoteError, setTaxQuoteError] = useState<string | null>(null);

  const subtotal = useMemo(
    () => roundCurrency(items.reduce((sum, item) => sum + item.price * item.quantity, 0)),
    [items],
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
    return roundCurrency(subtotal * ((Number.isFinite(percent) ? percent : 15) / 100));
  }, [customTip, items.length, subtotal, tipSelection]);

  const resolvedDeliveryFee = useMemo(() => {
    if (items.length === 0 || fulfillmentMethod !== "delivery") return 0;
    const fee = deliveryQuote ?? defaultDeliveryFee;
    return roundCurrency(fee);
  }, [defaultDeliveryFee, deliveryQuote, fulfillmentMethod, items.length]);

  const platformFee = useMemo(() => {
    if (items.length === 0) return 0;
    const fee = subtotal * platformPercentFee + platformFlatFee;
    return roundCurrency(Math.max(fee, 0));
  }, [items.length, platformFlatFee, platformPercentFee, subtotal]);

  const taxBase = useMemo(() => {
    if (items.length === 0) return 0;
    const base = subtotal + resolvedDeliveryFee + platformFee;
    return roundCurrency(base);
  }, [items.length, platformFee, resolvedDeliveryFee, subtotal]);

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
    () => roundCurrency(subtotal + resolvedDeliveryFee + platformFee + taxAmount + tipAmount),
    [platformFee, resolvedDeliveryFee, subtotal, taxAmount, tipAmount],
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
      customerName: customerName.trim() || undefined,
      customerEmail: customerEmail.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      notes: orderNotes.trim() || undefined,
      paymentMethod: "card",
      destination,
    };
  }, [
    deliveryAddress,
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
  ]);

  const fetchDeliveryQuote = async () => {
    if (items.length === 0) {
      setDeliveryError("Add items to your cart before requesting delivery.");
      return;
    }

    setDeliveryLoading(true);
    setDeliveryError(null);
    try {
      const response = await fetch("/api/delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subtotalAmount: subtotal,
          address: deliveryAddress.trim() || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Unable to fetch delivery quote.");
      }
      setDeliveryQuote(Number(data.deliveryFee ?? data.amount ?? defaultDeliveryFee));
    } catch (err) {
      setDeliveryError(err instanceof Error ? err.message : "Failed to fetch delivery quote.");
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
        throw new Error(data.error || "Failed to create Stripe payment intent.");
      }

      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId ?? null);
      setPaymentSessionId(data.paymentSessionId ?? null);
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
    setCheckoutStep("details");
  };

  useEffect(() => {
    if (items.length === 0) {
      resetPaymentState();
    }
  }, [items.length]);

  return (
    <div className="flex w-full max-w-lg flex-col gap-6 rounded-2xl bg-white p-4 shadow-lg ring-1 ring-black/5 md:p-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Checkout</h2>
          <p className="text-sm text-gray-500">You have {items.length} item{items.length === 1 ? "" : "s"} in your cart.</p>
        </div>
        <button
          onClick={() => {
            clearCart();
            resetPaymentState();
          }}
          className="text-sm font-semibold text-rose-600 transition hover:text-rose-500"
        >
          Clear cart
        </button>
      </header>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
          Your cart is empty. Browse the menu to add something delicious!
        </p>
      ) : (
        <>
          <section className="space-y-4">
            {items.map((item) => (
              <article
                key={item.id}
                className="flex gap-4 rounded-xl border border-gray-200 p-4 shadow-sm transition hover:border-gray-300"
              >
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                      {item.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                      {item.description && (
                        <p className="text-xs text-gray-500">{item.description}</p>
                      )}
                      {item.addons?.length ? (
                        <p className="text-xs text-gray-500">
                          Add-ons: {item.addons.map((addon) => addon.name).join(", ")}
                        </p>
                      ) : null}
                      {item.note && (
                        <p className="text-xs italic text-gray-500">Note: {item.note}</p>
                      )}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-xs font-medium text-rose-500 transition hover:text-rose-400"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                        aria-label={`Decrease quantity of ${item.name}`}
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-semibold text-gray-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                        aria-label={`Increase quantity of ${item.name}`}
                      >
                        +
                      </button>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </section>

          <section className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium text-gray-700">
                Name
                <input
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                  placeholder="Maria Perez"
                />
              </label>
              <label className="text-sm font-medium text-gray-700">
                Email<span className="text-rose-500">*</span>
                <input
                  value={customerEmail}
                  onChange={(event) => setCustomerEmail(event.target.value)}
                  type="email"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                  placeholder="maria@example.com"
                />
              </label>
              <label className="text-sm font-medium text-gray-700">
                Phone
                <input
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  type="tel"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                  placeholder="(123) 456-7890"
                />
              </label>
              <label className="text-sm font-medium text-gray-700">
                Order notes
                <input
                  value={orderNotes}
                  onChange={(event) => setOrderNotes(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                  placeholder="Add utensils, etc."
                />
              </label>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-800">Fulfillment</p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => setFulfillmentMethod("pickup")}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    fulfillmentMethod === "pickup"
                      ? "border-amber-500 bg-amber-50 text-amber-600"
                      : "border-gray-300 text-gray-600 hover:border-gray-400"
                  }`}
                  type="button"
                >
                  Pickup
                </button>
                <button
                  onClick={() => setFulfillmentMethod("delivery")}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    fulfillmentMethod === "delivery"
                      ? "border-amber-500 bg-amber-50 text-amber-600"
                      : "border-gray-300 text-gray-600 hover:border-gray-400"
                  }`}
                  type="button"
                >
                  Delivery
                </button>
              </div>
              {fulfillmentMethod === "delivery" && (
                <div className="mt-3 space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <label className="text-sm font-medium text-gray-700">
                    Delivery address
                    <textarea
                      value={deliveryAddress}
                      onChange={(event) => setDeliveryAddress(event.target.value)}
                      rows={2}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                      placeholder="Street, city, instructions"
                    />
                  </label>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={fetchDeliveryQuote}
                      type="button"
                      className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-amber-300"
                      disabled={deliveryLoading}
                    >
                      {deliveryLoading ? "Fetching quote..." : "Update delivery quote"}
                    </button>
                    {deliveryQuote !== null && (
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(deliveryQuote)}
                      </span>
                    )}
                  </div>
                  {deliveryError && <p className="text-sm text-rose-500">{deliveryError}</p>}
                </div>
              )}
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-800">Tip the team</p>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {TIP_OPTIONS.map((option) => (
                  <button
                    key={option}
                    onClick={() => setTipSelection(option)}
                    type="button"
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      tipSelection === option
                        ? "border-amber-500 bg-amber-50 text-amber-600"
                        : "border-gray-300 text-gray-600 hover:border-gray-400"
                    }`}
                  >
                    {option === "custom" ? "Custom" : `${option}%`}
                  </button>
                ))}
              </div>
              {tipSelection === "custom" && (
                <div className="mt-2">
                  <input
                    value={customTip}
                    onChange={(event) => setCustomTip(event.target.value)}
                    type="number"
                    min="0"
                    step="0.25"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                    placeholder="Enter custom tip amount"
                  />
                </div>
              )}
            </div>
          </section>

          <section className="space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Platform fee</span>
              <span>{formatCurrency(platformFee)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery</span>
              <span>{formatCurrency(resolvedDeliveryFee)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax{taxLabel ? ` (${taxLabel})` : ""}</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>
            {taxQuoteError && (
              <p className="text-xs text-amber-600">
                {taxQuoteError}
              </p>
            )}
            <div className="flex justify-between">
              <span>Tip</span>
              <span>{formatCurrency(tipAmount)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-dashed border-gray-300 pt-3 text-base font-semibold text-gray-900">
              <span>Total due</span>
              <span>{formatCurrency(totalAmount)}</span>
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
            <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-inner">
              <p className="text-sm font-medium text-gray-700">
                Securely enter your payment details below. You will be redirected to a confirmation page once the payment succeeds.
              </p>
              <StripeCheckoutWrapper clientSecret={clientSecret} successPath="/order/success" />
              <button
                onClick={resetPaymentState}
                type="button"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
              >
                ← Adjust order details
              </button>
            </div>
          ) : (
            <button
              onClick={handleCheckout}
              disabled={loading || items.length === 0}
              className="w-full rounded-full bg-gradient-to-r from-rose-500 via-amber-500 to-yellow-400 px-5 py-3 text-sm font-semibold text-black shadow-lg shadow-amber-500/30 transition hover:shadow-amber-400/50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Preparing secure payment…" : `Proceed to payment · ${formatCurrency(totalAmount)}`}
            </button>
          )}
        </>
      )}
    </div>
  );
}
