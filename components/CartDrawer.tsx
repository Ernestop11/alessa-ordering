"use client";
import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import Cart from "./Cart";
import { useCart } from "../lib/store/cart";
import StripeCheckout, { StripeCheckoutWrapper } from "./StripeCheckout";

type CreateIntentResponse = { clientSecret?: string; error?: string };

export default function CartDrawer() {
  const [open, setOpen] = useState(false);
  const { items } = useCart();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
              <h2 className="text-xl font-semibold">Your Cart</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <Cart />

            {/* Checkout area */}
            <div className="mt-4">
              {!clientSecret ? (
                <>
                  {items.length === 0 ? (
                    <p className="text-sm text-gray-500">Add items to checkout.</p>
                  ) : (
                    <div className="space-y-2">
                      <button
                        onClick={async () => {
                          setLoading(true);
                          setError(null);
                          try {
                            // Build a minimal order payload
                            const order = {
                              items: items.map((i: any) => ({
                                menuItemId: i.id,
                                quantity: i.quantity,
                                price: i.price,
                              })),
                              totalAmount: items.reduce((s: number, it: any) => s + it.price * it.quantity, 0),
                            };

                            const res = await fetch("/api/payments/intent", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ order }),
                            });

                            const data: CreateIntentResponse = await res.json();
                            if (data.clientSecret) {
                              setClientSecret(data.clientSecret);
                            } else {
                              setError(data.error || "Failed to create payment intent");
                            }
                          } catch (err: any) {
                            setError(err?.message || "Failed to create payment intent");
                          } finally {
                            setLoading(false);
                          }
                        }}
                        disabled={loading}
                        className="w-full bg-amber-500 text-white py-2 rounded-md font-medium hover:bg-amber-600"
                      >
                        {loading ? "Preparing…" : "Proceed to Checkout"}
                      </button>
                      {error && <p className="text-red-500 text-sm">{error}</p>}
                    </div>
                  )}
                </>
              ) : (
                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-2">Payment</h3>
                  <StripeCheckoutWrapper clientSecret={clientSecret} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

