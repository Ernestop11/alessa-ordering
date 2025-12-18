"use client";
import { useState, useMemo } from "react";
import { ShoppingCart } from "lucide-react";
import Cart from "./Cart";
import { useCart } from "../lib/store/cart";
import StripeCheckout, { StripeCheckoutWrapper } from "./StripeCheckout";
import EnhancedCheckout, { CheckoutFormData } from "./EnhancedCheckout";

type CreateIntentResponse = { clientSecret?: string; stripeAccount?: string; error?: string };
type CheckoutStep = 'cart' | 'customer-info' | 'payment';

export default function CartDrawer() {
  const [open, setOpen] = useState(false);
  const { items } = useCart();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripeAccount, setStripeAccount] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('cart');
  const [customerData, setCustomerData] = useState<CheckoutFormData | null>(null);
  const drawerTotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg bg-amber-500 text-white font-semibold hover:bg-amber-600 transition-all"
      >
        <ShoppingCart className="w-5 h-5" />
        View Cart
      </button>

      {/* Slide-up drawer */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-end z-40"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full sm:w-[420px] bg-white rounded-l-2xl shadow-2xl p-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {checkoutStep === 'cart' && 'Your Cart'}
                {checkoutStep === 'customer-info' && 'Checkout'}
                {checkoutStep === 'payment' && 'Payment'}
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Step 1: Cart Review */}
            {checkoutStep === 'cart' && (
              <>
                <Cart />
                <div className="mt-4">
                  {items.length === 0 ? (
                    <p className="text-sm text-gray-500">Add items to checkout.</p>
                  ) : (
                    <button
                      onClick={() => setCheckoutStep('customer-info')}
                      className="w-full bg-amber-500 text-white py-3 rounded-lg font-medium hover:bg-amber-600 transition"
                    >
                      Proceed to Checkout
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Step 2: Customer Information & Options */}
            {checkoutStep === 'customer-info' && (
              <>
                <EnhancedCheckout
                  totalAmount={items.reduce((s: number, it: any) => s + it.price * it.quantity, 0)}
                  onSubmit={async (data: CheckoutFormData) => {
                    setCustomerData(data);
                    setLoading(true);
                    setError(null);
                    try {
                      // Build order payload with customer data and gift info
                      const order = {
                        items: items.map((i: any) => ({
                          menuItemId: i.id,
                          quantity: i.quantity,
                          price: i.price,
                          itemType: i.itemType || 'food', // Track food/grocery/bakery for fulfillment
                        })),
                        subtotalAmount: items.reduce((s: number, it: any) => s + it.price * it.quantity, 0),
                        tipAmount: data.tipAmount,
                        totalAmount: items.reduce((s: number, it: any) => s + it.price * it.quantity, 0) + data.tipAmount,
                        customerName: data.customerName,
                        customerEmail: data.customerEmail,
                        customerPhone: data.customerPhone,
                        fulfillmentMethod: data.fulfillmentMethod,
                        deliveryAddress: data.deliveryAddress,
                        notes: data.deliveryInstructions,
                        // Gift order metadata
                        metadata: {
                          becomeMember: data.becomeMember,
                          isGift: data.isGift,
                          giftRecipientName: data.giftRecipientName,
                          giftRecipientEmail: data.giftRecipientEmail,
                          giftRecipientPhone: data.giftRecipientPhone,
                          giftMessage: data.giftMessage,
                        },
                      };

                      const res = await fetch("/api/payments/intent", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ order }),
                      });

                      const responseData: CreateIntentResponse = await res.json();
                      if (responseData.clientSecret) {
                        setClientSecret(responseData.clientSecret);
                        setStripeAccount(responseData.stripeAccount);
                        setCheckoutStep('payment');
                      } else {
                        setError(responseData.error || "Failed to create payment intent");
                      }
                    } catch (err: any) {
                      setError(err?.message || "Failed to create payment intent");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  onBack={() => setCheckoutStep('cart')}
                  loading={loading}
                />
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              </>
            )}

            {/* Step 3: Payment */}
            {checkoutStep === 'payment' && clientSecret && (
              <div className="space-y-4">
                <button
                  onClick={() => {
                    setCheckoutStep('customer-info');
                    setClientSecret(null);
                  }}
                  className="text-sm text-blue-600 hover:underline"
                >
                  ← Edit Information
                </button>
                <StripeCheckoutWrapper clientSecret={clientSecret} totalAmount={drawerTotal} stripeAccount={stripeAccount} />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
