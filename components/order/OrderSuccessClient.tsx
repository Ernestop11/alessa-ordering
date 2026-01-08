"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/lib/store/cart";

export default function OrderSuccessClient() {
  const clearCart = useCart((state) => state.clearCart);
  const searchParams = useSearchParams();
  const [enrolled, setEnrolled] = useState(false);
  const [orderStatus, setOrderStatus] = useState<'checking' | 'confirmed' | 'retrying'>('checking');
  const confirmAttempted = useRef(false);

  useEffect(() => {
    clearCart();

    // Check if we need to enroll in rewards (from checkout metadata)
    const shouldEnroll = searchParams?.get('enrollRewards') === 'true';
    if (shouldEnroll) {
      setEnrolled(true);
    }

    // FAILSAFE: Verify order was created, retry if needed
    // This handles the case where sendBeacon/fetch didn't complete before navigation
    const paymentIntentId = searchParams?.get('payment_intent');
    if (paymentIntentId && !confirmAttempted.current) {
      confirmAttempted.current = true;

      // Give backend a moment to process any in-flight requests
      setTimeout(async () => {
        try {
          // Call confirm endpoint - it will return existing order if already created
          const response = await fetch('/api/payments/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentIntentId }),
          });

          const result = await response.json();

          if (response.ok) {
            console.log('[OrderSuccess] Order confirmed:', result.orderId, result.alreadyExists ? '(already existed)' : '(newly created)');
            setOrderStatus('confirmed');
          } else {
            console.error('[OrderSuccess] Confirm failed:', result);
            // Still show success - the payment went through, order may be created later by webhook
            setOrderStatus('confirmed');
          }
        } catch (err) {
          console.error('[OrderSuccess] Confirm error:', err);
          setOrderStatus('confirmed');
        }
      }, 500);
    } else {
      setOrderStatus('confirmed');
    }
  }, [clearCart, searchParams]);

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
