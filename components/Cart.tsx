"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Trash2, Pencil, X } from "lucide-react";
import type { OrderPayload } from "../lib/order-service";
import { useCart, CartItem } from "../lib/store/cart";
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
    addToCart,
    removeFromCart,
    updateQuantity,
    updateItem,
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

  // Logged-in customer state
  const [loggedInCustomer, setLoggedInCustomer] = useState<{
    id: string;
    name?: string;
    email?: string;
    phone?: string;
    loyaltyPoints?: number;
  } | null>(null);
  const [sendAsGift, setSendAsGift] = useState(false);
  const [customerInfoLocked, setCustomerInfoLocked] = useState(false);

  // Edit item state
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [editQuantity, setEditQuantity] = useState(1);
  const [editNote, setEditNote] = useState("");
  const [editModifiers, setEditModifiers] = useState<string[]>([]);
  const [editAddons, setEditAddons] = useState<Array<{id: string; name: string; price: number}>>([]);

  // Default fallback customization options (used if item doesn't have menu-specific options)
  const DEFAULT_MODIFIERS = ['No cilantro', 'No onions', 'No salsa', 'No rice', 'No beans', 'No crema'];
  const DEFAULT_ADDONS = [
    { id: 'extra_guac', name: 'Extra guacamole', price: 0.75 },
    { id: 'extra_cheese', name: 'Extra cheese', price: 0.50 },
    { id: 'extra_salsa', name: 'Side of salsa', price: 0.35 },
  ];

  // Get available modifiers and addons for the editing item (from menu editor or fallback)
  const availableModifiers = editingItem?.availableModifiers?.length
    ? editingItem.availableModifiers
    : DEFAULT_MODIFIERS;
  const availableAddons = editingItem?.availableAddons?.length
    ? editingItem.availableAddons
    : DEFAULT_ADDONS;

  // Fetch logged-in customer data on mount
  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const res = await fetch('/api/rewards/customer', {
          credentials: 'include',
          cache: 'no-store',
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.id) {
            setLoggedInCustomer(data);
            // Auto-fill customer info if not sending as gift
            if (!sendAsGift) {
              if (data.name && !customerName) setCustomerName(data.name);
              if (data.email && !customerEmail) setCustomerEmail(data.email);
              if (data.phone && !customerPhone) setCustomerPhone(data.phone);
              setCustomerInfoLocked(true);
            }
          }
        }
      } catch (err) {
        console.error('[Cart] Failed to fetch customer:', err);
      }
    };
    fetchCustomer();
  }, []); // Only run once on mount

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
          // Use menuItemId if available, otherwise extract UUID from cart id (which has timestamp suffix)
          menuItemId: item.menuItemId || item.id.replace(/-\d{13}$/, ''),
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
      // Use menuItemId if available, otherwise extract UUID from cart id (which has timestamp suffix)
      menuItemId: item.menuItemId || item.id.replace(/-\d{13}$/, ''),
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
                className="group flex gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-3 sm:p-4 shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
              >
                <div className="relative h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 overflow-hidden rounded-lg sm:rounded-xl bg-gray-100 shadow-sm">
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
                    <div className="flex h-full w-full items-center justify-center text-lg font-bold text-gray-400">
                      {item.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-bold text-gray-900 truncate">{item.name}</p>
                      {item.description && (
                        <p className="mt-0.5 text-xs text-gray-600 line-clamp-1 sm:line-clamp-2">{item.description}</p>
                      )}
                      {item.addons?.length ? (
                        <p className="mt-0.5 text-xs font-medium text-gray-700 truncate">
                          + {item.addons.map((addon) => addon.name).join(", ")}
                        </p>
                      ) : null}
                      {item.note && (
                        <p className="mt-0.5 text-xs text-amber-600 italic truncate">
                          Note: {item.note}
                        </p>
                      )}
                    </div>
                    {/* Edit & Delete buttons */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setEditQuantity(item.quantity);
                          setEditNote(item.note || "");
                          setEditModifiers(item.modifiers || []);
                          setEditAddons(item.addons || []);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-600"
                        aria-label={`Edit ${item.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:border-rose-400 hover:bg-rose-50 hover:text-rose-600"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-black transition hover:scale-105 active:scale-95"
                        style={{
                          background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
                          boxShadow: '0 2px 8px rgba(251, 191, 36, 0.3)',
                        }}
                        aria-label={`Decrease quantity of ${item.name}`}
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm sm:text-base font-bold text-gray-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold text-black transition hover:scale-105 active:scale-95"
                        style={{
                          background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
                          boxShadow: '0 2px 8px rgba(251, 191, 36, 0.3)',
                        }}
                        aria-label={`Increase quantity of ${item.name}`}
                      >
                        +
                      </button>
                    </div>
                    <span className="text-sm sm:text-lg font-bold text-gray-900 flex-shrink-0">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </section>

          {/* Edit Item Modal */}
          {editingItem && (
            <div
              className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
              onClick={() => setEditingItem(null)}
            >
              <div
                className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 bg-gray-50">
                  <h3 className="text-lg font-bold text-gray-900">Edit Item</h3>
                  <button
                    onClick={() => setEditingItem(null)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                  {/* Item Preview */}
                  <div className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                    {editingItem.image && (
                      <img
                        src={editingItem.image}
                        alt={editingItem.name}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900">{editingItem.name}</p>
                      <p className="text-sm text-amber-600 font-semibold">
                        {formatCurrency(editingItem.price)} each
                      </p>
                    </div>
                  </div>

                  {/* Customizations/Removals - Toggleable */}
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Customizations (tap to toggle):</p>
                    <div className="flex flex-wrap gap-2">
                      {availableModifiers.map((mod: string) => {
                        const isActive = editModifiers.includes(mod);
                        return (
                          <button
                            key={mod}
                            onClick={() => {
                              if (isActive) {
                                setEditModifiers(editModifiers.filter(m => m !== mod));
                              } else {
                                setEditModifiers([...editModifiers, mod]);
                              }
                            }}
                            className={`px-3 py-1.5 text-xs rounded-full font-medium transition-all ${
                              isActive
                                ? 'bg-rose-100 text-rose-700 border-2 border-rose-300'
                                : 'bg-gray-100 text-gray-500 border-2 border-transparent hover:border-gray-300'
                            }`}
                          >
                            {isActive ? '✓ ' : ''}{mod}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Add-ons - Toggleable */}
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs font-semibold text-amber-700 mb-2">Add-ons (tap to toggle):</p>
                    <div className="grid grid-cols-2 gap-2">
                      {availableAddons.map((addon: {id: string; name: string; price: number}) => {
                        const isActive = editAddons.some(a => a.id === addon.id);
                        return (
                          <button
                            key={addon.id}
                            onClick={() => {
                              if (isActive) {
                                setEditAddons(editAddons.filter(a => a.id !== addon.id));
                              } else {
                                setEditAddons([...editAddons, addon]);
                              }
                            }}
                            className={`flex items-center justify-between px-3 py-2 text-xs rounded-xl font-medium transition-all ${
                              isActive
                                ? 'bg-amber-200 text-amber-800 border-2 border-amber-400'
                                : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-amber-300'
                            }`}
                          >
                            <span className="text-left">{addon.name}</span>
                            <span className={isActive ? 'text-amber-700' : 'text-amber-600'}>
                              {isActive ? '✓' : `+${formatCurrency(addon.price)}`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Quantity</label>
                    <div className="mt-2 flex items-center gap-3">
                      <button
                        onClick={() => setEditQuantity(Math.max(1, editQuantity - 1))}
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold text-black transition hover:scale-105 active:scale-95"
                        style={{
                          background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
                          boxShadow: '0 2px 8px rgba(251, 191, 36, 0.3)',
                        }}
                      >
                        −
                      </button>
                      <span className="w-12 text-center text-xl font-bold text-gray-900">
                        {editQuantity}
                      </span>
                      <button
                        onClick={() => setEditQuantity(editQuantity + 1)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold text-black transition hover:scale-105 active:scale-95"
                        style={{
                          background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
                          boxShadow: '0 2px 8px rgba(251, 191, 36, 0.3)',
                        }}
                      >
                        +
                      </button>
                      <span className="ml-auto text-lg font-bold text-gray-900">
                        {formatCurrency((editingItem.price + editAddons.reduce((sum, a) => sum + a.price, 0)) * editQuantity)}
                      </span>
                    </div>
                  </div>

                  {/* Special Instructions */}
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Special Instructions</label>
                    <textarea
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      placeholder="Add any special requests..."
                      className="mt-2 w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm transition focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex gap-3 border-t border-gray-200 p-4 bg-gray-50">
                  <button
                    onClick={() => {
                      removeFromCart(editingItem.id);
                      setEditingItem(null);
                    }}
                    className="flex-1 py-3 rounded-xl border-2 border-rose-200 text-rose-600 font-bold hover:bg-rose-50 transition flex items-center justify-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                  <button
                    onClick={() => {
                      // Calculate new price including addons
                      const basePrice = editingItem.price - (editingItem.addons?.reduce((sum, a) => sum + a.price, 0) || 0);
                      const newAddonTotal = editAddons.reduce((sum, a) => sum + a.price, 0);
                      const newPrice = Math.round((basePrice + newAddonTotal) * 100) / 100;

                      updateItem(editingItem.id, {
                        quantity: editQuantity,
                        note: editNote.trim() || null,
                        modifiers: editModifiers.length > 0 ? editModifiers : undefined,
                        addons: editAddons.length > 0 ? editAddons : undefined,
                        price: newPrice,
                      });
                      setEditingItem(null);
                    }}
                    className="flex-1 py-3 rounded-xl text-black font-bold hover:scale-[1.02] transition"
                    style={{
                      background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
                      boxShadow: '0 4px 12px rgba(251, 191, 36, 0.4)',
                    }}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          <section className="space-y-4 sm:space-y-6 rounded-xl sm:rounded-2xl border border-gray-100 bg-gray-50 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-900">Order Details</h3>

            {/* Logged-in member banner */}
            {loggedInCustomer && (
              <div className="flex items-center gap-3 rounded-xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 p-3 sm:p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-400 text-lg">
                  👤
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {loggedInCustomer.name || 'Rewards Member'}
                  </p>
                  <p className="text-xs text-amber-700">
                    {loggedInCustomer.loyaltyPoints || 0} points • Order as yourself
                  </p>
                </div>
              </div>
            )}

              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                <label className="text-xs sm:text-sm font-semibold text-gray-700">
                  Name
                  <input
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    disabled={customerInfoLocked}
                    className={`mt-1.5 sm:mt-2 w-full rounded-lg sm:rounded-xl border-2 px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-medium text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                      customerInfoLocked
                        ? 'border-gray-100 bg-gray-100 cursor-not-allowed'
                        : 'border-gray-200 bg-white'
                    }`}
                    placeholder="Maria Perez"
                  />
                </label>
                <label className="text-xs sm:text-sm font-semibold text-gray-700">
                  Email<span className="ml-1 text-rose-500">*</span>
                  <input
                    value={customerEmail}
                    onChange={(event) => setCustomerEmail(event.target.value)}
                    disabled={customerInfoLocked}
                    type="email"
                    className={`mt-1.5 sm:mt-2 w-full rounded-lg sm:rounded-xl border-2 px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-medium text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                      customerInfoLocked
                        ? 'border-gray-100 bg-gray-100 cursor-not-allowed'
                        : 'border-gray-200 bg-white'
                    }`}
                    placeholder="maria@example.com"
                  />
                </label>
                <label className="text-xs sm:text-sm font-semibold text-gray-700">
                  Phone
                  <input
                    value={customerPhone}
                    onChange={(event) => setCustomerPhone(event.target.value)}
                    disabled={customerInfoLocked}
                    type="tel"
                    className={`mt-1.5 sm:mt-2 w-full rounded-lg sm:rounded-xl border-2 px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-medium text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                      customerInfoLocked
                        ? 'border-gray-100 bg-gray-100 cursor-not-allowed'
                        : 'border-gray-200 bg-white'
                    }`}
                    placeholder="(123) 456-7890"
                  />
                </label>
                <label className="text-xs sm:text-sm font-semibold text-gray-700">
                  Order notes
                  <input
                    value={orderNotes}
                    onChange={(event) => setOrderNotes(event.target.value)}
                    className="mt-1.5 sm:mt-2 w-full rounded-lg sm:rounded-xl border-2 border-gray-200 bg-white px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-medium text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    placeholder="Add utensils, etc."
                  />
                </label>
              </div>

              <div>
                <p className="text-xs sm:text-sm font-semibold text-gray-800">Fulfillment Method</p>
                <div className="mt-2 sm:mt-3 flex gap-2 sm:gap-3">
                  <button
                    onClick={() => setFulfillmentMethod("pickup")}
                    className={`flex-1 rounded-lg sm:rounded-xl border-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold transition ${
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
                    onClick={() => tenant.deliveryEnabled && setFulfillmentMethod("delivery")}
                    disabled={!tenant.deliveryEnabled}
                    className={`flex-1 rounded-lg sm:rounded-xl border-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-bold transition relative ${
                      !tenant.deliveryEnabled
                        ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60"
                        : fulfillmentMethod === "delivery"
                          ? "shadow-md"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    }`}
                    style={tenant.deliveryEnabled && fulfillmentMethod === "delivery" ? {
                      borderColor: primaryColor,
                      backgroundColor: `${primaryColor}15`,
                      color: primaryColor,
                    } : {}}
                    type="button"
                  >
                    🚗 Delivery
                    {!tenant.deliveryEnabled && (
                      <span className="absolute -top-2 -right-2 text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                        Coming soon
                      </span>
                    )}
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

              {/* Membership Toggle - Only for guests */}
              {membershipProgram && !loggedInCustomer && (
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

              {/* Points preview for logged-in members */}
              {membershipProgram && loggedInCustomer && estimatedPoints && estimatedPoints > 0 && (
                <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
                  <span className="text-2xl">⭐</span>
                  <div>
                    <p className="font-semibold text-gray-900">You'll earn {estimatedPoints} points</p>
                    <p className="text-xs text-gray-600">Current balance: {loggedInCustomer.loyaltyPoints || 0} points</p>
                  </div>
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
                                  className="px-4 py-2 text-xs sm:text-sm font-bold text-black rounded-lg transition-all hover:scale-105 active:scale-95"
                                  style={{
                                    background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
                                    boxShadow: '0 2px 8px rgba(251, 191, 36, 0.4)',
                                  }}
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

            {/* California SB 1524 Fee Disclosure - must be clear and conspicuous */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 mb-3">
              <p className="text-xs text-blue-800">
                <strong>Service Fee Notice:</strong> A {((platformPercentFee * 100).toFixed(0))}% + ${platformFlatFee.toFixed(2)} service fee supports our online ordering platform and is charged on all orders.
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal</span>
                <span className="font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span className="flex items-center gap-1">
                  Service fee
                  <span className="text-xs text-gray-500" title="Supports online ordering platform">ⓘ</span>
                </span>
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
