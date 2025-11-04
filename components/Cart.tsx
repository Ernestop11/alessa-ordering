'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { cycleFallbackImage } from '../lib/menu-imagery';
import { useCart } from '../lib/store/cart';
import { useTenantTheme } from './TenantThemeProvider';
import type { UpsellBundleConfig, MembershipProgramConfig } from './TenantThemeProvider';

type UpsellWithPrice = UpsellBundleConfig & { price: number };

const DEFAULT_PLATFORM_PERCENT_FEE = 0.029;
const DEFAULT_PLATFORM_FLAT_FEE = 0.3;
const DEFAULT_TAX_RATE = 0.0825;
const DEFAULT_DELIVERY_BASE_FEE = 4.99;

type FulfillmentMethod = 'pickup' | 'delivery';
type PaymentMethod = 'card' | 'apple_pay';
type TipSelection = 'none' | '15' | '18' | '20' | 'custom';

export default function Cart() {
  const [isOpen, setIsOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentMethod>('pickup');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [tipSelection, setTipSelection] = useState<TipSelection>('none');
  const [customTip, setCustomTip] = useState('');
  const [notification, setNotification] = useState('');
  const [deliveryQuote, setDeliveryQuote] = useState<number | null>(null);
  const [deliveryEta, setDeliveryEta] = useState<number | null>(null);
  const [quotingDelivery, setQuotingDelivery] = useState(false);

  const tenant = useTenantTheme();
  const membershipProgram: MembershipProgramConfig | null | undefined = tenant.membershipProgram;
  const { items, addToCart, removeFromCart, updateQuantity, clearCart } = useCart();

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  const platformPercentFee = tenant.platformPercentFee ?? DEFAULT_PLATFORM_PERCENT_FEE;
  const platformFlatFee = tenant.platformFlatFee ?? DEFAULT_PLATFORM_FLAT_FEE;
  const defaultTaxRate = tenant.defaultTaxRate ?? DEFAULT_TAX_RATE;
  const deliveryBaseFee = tenant.deliveryBaseFee ?? DEFAULT_DELIVERY_BASE_FEE;

  const tipAmount = useMemo(() => {
    if (tipSelection === 'custom') {
      const parsed = parseFloat(customTip);
      return Number.isFinite(parsed) ? Math.max(parsed, 0) : 0;
    }
    if (tipSelection === 'none') return 0;
    const percent = parseInt(tipSelection, 10);
    return subtotal * (percent / 100);
  }, [tipSelection, customTip, subtotal]);

  const computedDeliveryFee = fulfillmentMethod === 'delivery'
    ? deliveryQuote ?? deliveryBaseFee
    : 0;
  const platformFee = subtotal > 0 ? subtotal * platformPercentFee + platformFlatFee : 0;
  const taxBase = subtotal + computedDeliveryFee + platformFee;
  const taxAmount = taxBase * defaultTaxRate;
  const totalAmount = subtotal + computedDeliveryFee + platformFee + taxAmount + tipAmount;

  const minimumOrder = tenant.minimumOrderValue ?? 0;
  const meetsDeliveryMinimum = subtotal >= minimumOrder;
  const canCheckout =
    items.length > 0 &&
    (fulfillmentMethod === 'pickup' || (fulfillmentMethod === 'delivery' && meetsDeliveryMinimum));

  const configuredUpsells = useMemo<UpsellWithPrice[]>(() => {
    const bundles = Array.isArray(tenant.upsellBundles) ? tenant.upsellBundles : [];
    return bundles
      .filter((bundle) =>
        !bundle.surfaces || bundle.surfaces.length === 0 || bundle.surfaces.includes('cart'),
      )
      .map((bundle) => ({
        ...bundle,
        price: Number(bundle.price ?? 0),
      }));
  }, [tenant.upsellBundles]);

  const recommendedUpsells = useMemo(
    () => configuredUpsells.filter((upsell) => !items.some((item) => item.name === upsell.name)),
    [items, configuredUpsells],
  );

  useEffect(() => {
    if (fulfillmentMethod !== 'delivery' || subtotal <= 0) {
      setDeliveryQuote(null);
      setDeliveryEta(null);
      return;
    }

    let active = true;

    const fetchQuote = async () => {
      setQuotingDelivery(true);
      try {
        const res = await fetch('/api/delivery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subtotalAmount: subtotal,
            address: deliveryAddress || tenant.addressLine1,
          }),
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        if (!active) return;
        setDeliveryQuote(data.deliveryFee ?? deliveryBaseFee);
        setDeliveryEta(data.etaMinutes ?? null);
      } catch (err) {
        console.error('Failed to fetch delivery quote', err);
        if (!active) return;
        setDeliveryQuote(deliveryBaseFee);
        setDeliveryEta(null);
      } finally {
        if (active) setQuotingDelivery(false);
      }
    };

    fetchQuote();

    return () => {
      active = false;
    };
  }, [fulfillmentMethod, subtotal, deliveryAddress, deliveryBaseFee, tenant.addressLine1]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCheckout) return;
    setCheckingOut(true);

    const orderPayload = {
      items: items.map(i => ({ menuItemId: String(i.id), quantity: i.quantity, price: i.price })),
      subtotalAmount: subtotal,
      deliveryFee: computedDeliveryFee,
      taxAmount,
      tipAmount,
      platformFee,
      totalAmount,
      fulfillmentMethod,
      deliveryPartner: fulfillmentMethod === 'delivery' ? 'doordash' : null,
      paymentMethod,
      customerName,
      customerEmail,
      customerPhone,
      notes: fulfillmentMethod === 'delivery' && deliveryAddress
        ? `${notes ? `${notes}\n` : ''}Delivery address: ${deliveryAddress}`
        : notes || null,
    };

    try {
      const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderPayload) });
      if (!res.ok) throw new Error('Order failed');
      const data = await res.json();
      clearCart();
      setShowCheckoutForm(false);
      setIsOpen(false);
      setFulfillmentMethod('pickup');
      setPaymentMethod('card');
      setTipSelection('none');
      setCustomTip('');
      setDeliveryAddress('');
      setNotes('');
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
      setNotification('Order placed!');
      setTimeout(() => setNotification(''), 3000);
    } catch (err) {
      console.error('Checkout error', err);
      setNotification('Failed to place order');
      setTimeout(() => setNotification(''), 3000);
    } finally {
      setCheckingOut(false);
    }
  };

  const handleAddUpsell = (upsell: UpsellWithPrice) => {
    addToCart({
      id: `${upsell.id}-${Date.now()}`,
      name: upsell.name,
      description: upsell.description,
      price: upsell.price,
      quantity: 1,
      image: upsell.image,
      modifiers: upsell.tag ? [upsell.tag] : undefined,
      isUpsell: true,
    });
    setNotification(`Added ${upsell.name}`);
    setTimeout(() => setNotification(''), 2400);
  };

  const pointsEarned = useMemo(() => {
    if (!membershipProgram || membershipProgram.enabled === false) return 0;
    const rate = Number(membershipProgram.pointsPerDollar ?? 0);
    if (!Number.isFinite(rate) || rate <= 0) return 0;
    return Math.round(subtotal * rate);
  }, [membershipProgram, subtotal]);

  if (!isOpen) {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 via-amber-500 to-yellow-400 px-5 py-3 text-sm font-semibold text-black shadow-2xl shadow-amber-500/40 transition hover:scale-105"
        >
          <span className="sr-only">Open cart</span>
          🛒 View Order
          {items.length > 0 && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/80 text-xs font-bold text-white">
              {items.length}
            </span>
          )}
        </button>
        {notification && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
            {notification}
          </div>
        )}
      </>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur">
      <div className="absolute right-0 top-0 h-full w-full max-w-md overflow-hidden rounded-l-3xl bg-gradient-to-b from-[#0B142B] via-[#101C33] to-[#0B142B] shadow-2xl shadow-black/40">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between border-b border-white/10 bg-black/20 px-5 py-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Your Order</h2>
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">Curate your feast</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="rounded-full border border-white/20 px-3 py-1 text-sm text-white/60 hover:border-white/40 hover:text-white">
              Close
            </button>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4">
            {items.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/20 bg-black/30 p-10 text-center">
                <p className="text-sm font-semibold text-white/70">Your cart is empty</p>
                <p className="mt-2 text-xs text-white/50">Explore the menu and add your favorites.</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {items.map((item, index) => (
                  <li key={item.id} className="rounded-3xl border border-white/10 bg-white/10 p-4 shadow-lg shadow-black/20 backdrop-blur">
                    <div className="flex items-start gap-4">
                      <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-black/20">
                        <Image
                          src={item.image || cycleFallbackImage(index)}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>
                      <div className="flex-1 text-sm text-white/70">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-base font-semibold text-white">{item.name}</h3>
                            <p className="text-xs uppercase tracking-wide text-white/40">Qty {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-base font-semibold text-white">${(item.price * item.quantity).toFixed(2)}</p>
                            <p className="text-xs text-white/50">${item.price.toFixed(2)} ea.</p>
                          </div>
                        </div>
                        {item.modifiers && item.modifiers.length > 0 && (
                          <p className="mt-2 text-xs text-white/60">• {item.modifiers.join(' · ')}</p>
                        )}
                        {item.addons && item.addons.length > 0 && (
                          <p className="mt-1 text-xs text-amber-300/80">
                            + {item.addons.map((addon) => `${addon.name} (+$${addon.price.toFixed(2)})`).join(' · ')}
                          </p>
                        )}
                        {item.description && (
                          <p className="mt-1 text-xs text-white/50 line-clamp-3">{item.description}</p>
                        )}
                        <div className="mt-3 flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white/70 hover:border-white/40 hover:text-white"
                          >
                            −
                          </button>
                          <span className="text-sm text-white">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white/70 hover:border-white/40 hover:text-white"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="ml-auto rounded-full border border-red-500/30 px-3 py-1 text-xs font-semibold text-red-300 hover:border-red-500/60 hover:text-red-200"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {recommendedUpsells.length > 0 && (
              <div className="space-y-4 rounded-3xl border border-white/10 bg-white/10 p-4 shadow-inner shadow-black/20">
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50">Boost Your Order</h3>
                <div className="space-y-3">
                  {recommendedUpsells.map((upsell, index) => (
                    <div key={upsell.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-3">
                      <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-black/40">
                        <Image
                          src={upsell.image || cycleFallbackImage(index + 5)}
                          alt={upsell.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">{upsell.name}</p>
                        {upsell.tag && (
                          <p className="text-xs uppercase tracking-wide text-amber-200/80">{upsell.tag}</p>
                        )}
                        <p className="text-xs text-white/60">{upsell.description}</p>
                      </div>
                      <button
                        onClick={() => handleAddUpsell(upsell)}
                        className="rounded-full bg-gradient-to-r from-rose-500 to-amber-500 px-3 py-1 text-xs font-semibold text-white shadow hover:scale-105"
                      >
                        {(upsell.cta || 'Add to order')} · ${upsell.price.toFixed(2)}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4 rounded-3xl border border-white/10 bg-white/10 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50">Order Type</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => setFulfillmentMethod('pickup')}
                  className={`rounded-xl border px-3 py-2 font-medium transition ${
                    fulfillmentMethod === 'pickup'
                      ? 'border-emerald-400 bg-emerald-500/20 text-emerald-100'
                      : 'border-white/10 bg-black/30 text-white/70 hover:border-white/30 hover:text-white'
                  }`}
                >
                  Pickup
                </button>
                <button
                  type="button"
                  onClick={() => setFulfillmentMethod('delivery')}
                  className={`rounded-xl border px-3 py-2 font-medium transition ${
                    fulfillmentMethod === 'delivery'
                      ? 'border-sky-400 bg-sky-500/20 text-sky-100'
                      : 'border-white/10 bg-black/30 text-white/70 hover:border-white/30 hover:text-white'
                  }`}
                >
                  Delivery
                </button>
              </div>
              {fulfillmentMethod === 'delivery' && (
                <div className="space-y-3 text-sm text-white/70">
                  {tenant.minimumOrderValue ? (
                    <p>
                      Minimum order for delivery:{' '}
                      <span className="font-semibold text-white">${tenant.minimumOrderValue.toFixed(2)}</span>
                    </p>
                  ) : null}
                  <textarea
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Delivery address"
                    className="w-full rounded-xl border border-white/20 bg-black/30 p-3 text-sm text-white focus:border-white/40 focus:outline-none"
                    rows={2}
                    required
                  />
                  <p className="text-xs text-white/50">
                    Delivery powered by DoorDash Drive. {quotingDelivery ? 'Requesting quote…' : 'Quote refreshes when totals change.'}
                    {deliveryQuote && (
                      <> Est. fee ${deliveryQuote.toFixed(2)}{deliveryEta ? ` · ~${deliveryEta} mins` : ''}.</>
                    )}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3 rounded-3xl border border-white/10 bg-white/10 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50">Add a Tip</h3>
              <div className="grid grid-cols-4 gap-2 text-sm">
                {['none', '15', '18', '20'].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setTipSelection(value as TipSelection);
                      if (value !== 'custom') setCustomTip('');
                    }}
                    className={`rounded-xl border px-2 py-2 font-medium transition ${
                      tipSelection === value
                        ? 'border-amber-400 bg-amber-500/20 text-amber-100'
                        : 'border-white/10 bg-black/30 text-white/70 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    {value === 'none' ? 'No Tip' : `${value}%`}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setTipSelection('custom')}
                  className={`rounded-xl border px-2 py-2 font-medium transition ${
                    tipSelection === 'custom'
                      ? 'border-amber-400 bg-amber-500/20 text-amber-100'
                      : 'border-white/10 bg-black/30 text-white/70 hover:border-white/30 hover:text-white'
                  }`}
                >
                  Custom
                </button>
              </div>
              {tipSelection === 'custom' && (
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={customTip}
                  onChange={(e) => setCustomTip(e.target.value)}
                  placeholder="Enter tip amount"
                  className="w-full rounded-xl border border-white/20 bg-black/30 p-3 text-sm text-white focus:border-white/40 focus:outline-none"
                />
              )}
            </div>

            <div className="space-y-3 rounded-3xl border border-white/10 bg-white/10 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50">Payment</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`rounded-xl border px-3 py-2 font-medium transition ${
                    paymentMethod === 'card'
                      ? 'border-purple-400 bg-purple-500/20 text-purple-100'
                      : 'border-white/10 bg-black/30 text-white/70 hover:border-white/30 hover:text-white'
                  }`}
                >
                  Credit / Debit
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('apple_pay')}
                  className={`rounded-xl border px-3 py-2 font-medium transition ${
                    paymentMethod === 'apple_pay'
                      ? 'border-purple-400 bg-purple-500/20 text-purple-100'
                      : 'border-white/10 bg-black/30 text-white/70 hover:border-white/30 hover:text-white'
                  }`}
                >
                   Pay
                </button>
              </div>
              {paymentMethod === 'apple_pay' && (
                <p className="text-xs text-white/50">
                  Apple Pay will open after you place the order. Merchant validation happens on the server.
                </p>
              )}
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add order notes (allergies, pickup details, etc.)"
              className="w-full rounded-3xl border border-white/10 bg-white/10 p-4 text-sm text-white focus:border-white/40 focus:outline-none"
              rows={3}
            />
          </div>

          <div className="border-t border-white/10 bg-black/30 p-5">
            <div className="space-y-2 text-sm text-white/70">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {computedDeliveryFee > 0 && (
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span>${computedDeliveryFee.toFixed(2)}</span>
                </div>
              )}
              {platformFee > 0 && (
                <div className="flex justify-between">
                  <span>Platform Fee</span>
                  <span>${platformFee.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Tax</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
              {tipAmount > 0 && (
                <div className="flex justify-between">
                  <span>Tip</span>
                  <span>${tipAmount.toFixed(2)}</span>
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-between border-t border-white/10 pt-4 text-lg font-semibold text-white">
              <span>Total</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
            {pointsEarned > 0 && (
              <p className="mt-2 text-xs text-emerald-200">
                Earn approximately {pointsEarned.toLocaleString()} {pointsEarned === 1 ? 'point' : 'points'} with this order.
              </p>
            )}
            {fulfillmentMethod === 'delivery' && !meetsDeliveryMinimum && (
              <p className="mt-2 text-xs text-rose-300">
                Delivery requires a minimum order of ${minimumOrder.toFixed(2)}.
              </p>
            )}
            {!showCheckoutForm ? (
              <>
                <button
                  onClick={() => setShowCheckoutForm(true)}
                  disabled={!canCheckout}
                  className="w-full rounded-full bg-gradient-to-r from-rose-500 via-amber-500 to-yellow-400 px-4 py-3 text-sm font-semibold text-black shadow-lg shadow-amber-500/40 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/40 disabled:opacity-60"
                >
                  Proceed to Checkout
                </button>
              </>
            ) : (
              <form onSubmit={handleCheckout} className="space-y-3">
                <input required placeholder="Name" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full rounded-xl border border-white/20 bg-black/30 p-3 text-sm text-white focus:border-white/40 focus:outline-none" />
                <input placeholder="Phone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="w-full rounded-xl border border-white/20 bg-black/30 p-3 text-sm text-white focus:border-white/40 focus:outline-none" />
                <input placeholder="Email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} className="w-full rounded-xl border border-white/20 bg-black/30 p-3 text-sm text-white focus:border-white/40 focus:outline-none" />
                <div className="flex gap-2">
                  <button type="submit" disabled={checkingOut || !canCheckout} className="flex-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-sm font-semibold text-black shadow-lg shadow-emerald-500/30 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/40">
                    {checkingOut
                      ? 'Submitting...'
                      : paymentMethod === 'apple_pay'
                        ? 'Place Order with  Pay'
                        : 'Place Order'}
                  </button>
                  <button type="button" onClick={() => setShowCheckoutForm(false)} className="flex-1 rounded-full border border-white/20 px-4 py-3 text-sm font-semibold text-white/70 transition hover:border-white/40 hover:text-white">
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
