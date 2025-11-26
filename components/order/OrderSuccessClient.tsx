"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/lib/store/cart";

export default function OrderSuccessClient() {
  const clearCart = useCart((state) => state.clearCart);

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  // Use default colors - simple and works without tenant context
  const primaryColor = "#dc2626";
  const secondaryColor = "#f59e0b";

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      <div className="space-y-4">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full" style={{ backgroundColor: `${primaryColor}20` }}>
          <span className="text-4xl">✅</span>
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.4em]" style={{ color: primaryColor }}>Order Confirmed</p>
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Gracias! Your order is on the way.</h1>
        <p className="text-base text-gray-600 sm:text-lg">
          We emailed and texted your receipt. One of our teammates will begin preparing your items right away.
        </p>
      </div>
      
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/order"
          className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-105"
          style={{
            background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})`,
          }}
        >
          Continue ordering
        </Link>
        <Link
          href="/customer/orders"
          className="inline-flex items-center justify-center rounded-full border px-6 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
          style={{
            borderColor: `${primaryColor}30`,
          }}
        >
          View my orders
        </Link>
      </div>
    </div>
  );
}
