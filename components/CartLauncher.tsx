"use client";

import { useState } from "react";
import { ShoppingCart, X } from "lucide-react";
import Cart from "./Cart";
import { useCart } from "../lib/store/cart";
import { useTenantTheme } from "./TenantThemeProvider";

export default function CartLauncher() {
  const [open, setOpen] = useState(false);
  const { items } = useCart();
  const tenant = useTenantTheme();

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const badge = itemCount > 99 ? "99+" : itemCount.toString();

  const primaryColor = tenant.primaryColor || "#dc2626";
  const secondaryColor = tenant.secondaryColor || "#f59e0b";

  return (
    <>
      {/* Hidden trigger button - triggered by header buttons */}
      <button
        type="button"
        data-cart-launcher
        onClick={() => setOpen(true)}
        className="hidden"
        aria-hidden="true"
      >
        <ShoppingCart className="h-5 w-5" />
        <span className="hidden sm:inline">Cart</span>
        <span className="rounded-full bg-black/80 px-2 py-0.5 text-xs font-black text-white shadow-lg">
          {itemCount > 0 ? badge : "0"}
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-title"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative flex h-full w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl sm:h-auto sm:max-h-[90vh]"
            onClick={(event) => event.stopPropagation()}
            style={{
              borderTop: `4px solid ${primaryColor}`,
            }}
          >
            <div 
              className="flex items-center justify-between border-b bg-gradient-to-r px-6 py-4"
              style={{
                borderBottomColor: `${primaryColor}20`,
                background: `linear-gradient(to right, ${primaryColor}08, ${secondaryColor}08)`,
              }}
            >
              <h2 id="cart-title" className="text-xl font-bold" style={{ color: primaryColor }}>
                Your Cart
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border text-gray-500 transition hover:bg-gray-50"
                style={{ 
                  borderColor: `${primaryColor}30`,
                  color: primaryColor,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${primaryColor}15`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                aria-label="Close cart"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[calc(85vh-80px)] overflow-y-auto px-4 pb-6 pt-4 sm:px-6">
              <Cart />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
