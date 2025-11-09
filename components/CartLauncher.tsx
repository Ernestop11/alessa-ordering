"use client";

import { useState } from "react";
import { ShoppingCart, X } from "lucide-react";
import Cart from "./Cart";
import { useCart } from "../lib/store/cart";

export default function CartLauncher() {
  const [open, setOpen] = useState(false);
  const { items } = useCart();

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const badge = itemCount > 99 ? "99+" : itemCount.toString();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 via-amber-500 to-yellow-400 px-3 py-2.5 text-sm font-bold text-black shadow-2xl shadow-rose-500/40 transition-all hover:scale-110 hover:shadow-rose-500/60 sm:px-4 sm:py-3"
      >
        <ShoppingCart className="h-5 w-5" />
        <span className="hidden sm:inline">Cart</span>
        <span className="rounded-full bg-black/80 px-2 py-0.5 text-xs font-black text-white shadow-lg">
          {itemCount > 0 ? badge : "0"}
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative flex h-full w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl sm:h-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-gray-300 hover:text-gray-700"
              aria-label="Close cart"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="max-h-[85vh] overflow-y-auto px-4 pb-6 pt-12 sm:px-6">
              <Cart />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
