"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { PaymentRequest, Stripe } from "@stripe/stripe-js";
import {
  PaymentElement,
  useStripe,
  useElements,
  Elements,
  PaymentRequestButtonElement,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useTenantTheme } from "./TenantThemeProvider";

// Cache for stripe instances by account ID
const stripePromiseCache: Record<string, Promise<Stripe | null>> = {};

// Get or create a stripe instance for a specific account
function getStripePromise(stripeAccount?: string): Promise<Stripe | null> {
  const cacheKey = stripeAccount || 'platform';

  if (!stripePromiseCache[cacheKey]) {
    const options = stripeAccount ? { stripeAccount } : undefined;
    stripePromiseCache[cacheKey] = loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
      options
    );
  }

  return stripePromiseCache[cacheKey];
}

interface StripeCheckoutProps {
  clientSecret: string;
  successPath?: string;
  totalAmount?: number;
}

export default function StripeCheckout({ clientSecret, successPath = "/order/success", totalAmount }: StripeCheckoutProps) {
  const stripe = useStripe();
  const elements = useElements();
  const tenant = useTenantTheme();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [paymentElementReady, setPaymentElementReady] = useState(false);

  const primaryColor = tenant.primaryColor || "#dc2626";
  const secondaryColor = tenant.secondaryColor || "#f59e0b";

  // Wait for Stripe and Elements to be ready
  useEffect(() => {
    if (stripe && elements) {
      setIsReady(true);
    } else {
      setIsReady(false);
      setPaymentElementReady(false);
    }
  }, [stripe, elements]);

  useEffect(() => {
    if (!stripe || !totalAmount) {
      setPaymentRequest(null);
      return;
    }
    const pr = stripe.paymentRequest({
      country: "US",
      currency: "usd",
      total: {
        label: `${tenant.name} Order`,
        amount: Math.max(50, Math.round(totalAmount * 100)),
      },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    // Handle Apple Pay merchant validation
    pr.on('paymentmethod', async (event) => {
      // For Apple Pay, we need to validate the merchant
      if (event.paymentMethod.type === 'apple_pay') {
        try {
          const validationResponse = await fetch('/api/payments/apple/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              validationURL: event.paymentMethod.applePay?.validationURL,
            }),
          });

          if (validationResponse.ok) {
            const data = await validationResponse.json();
            if (data.merchantSession) {
              // Complete the payment method
              event.complete('success');
            } else {
              event.complete('fail');
            }
          } else {
            event.complete('fail');
          }
        } catch (error) {
          console.error('[Apple Pay] Validation error:', error);
          event.complete('fail');
        }
      } else {
        // For other payment methods, complete normally
        event.complete('success');
      }
    });

    pr.canMakePayment().then((result) => {
      if (result) {
        setPaymentRequest(pr);
      } else {
        setPaymentRequest(null);
      }
    });
  }, [stripe, totalAmount, tenant.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !isReady || !paymentElementReady) {
      setMessage("Payment form is still loading. Please wait...");
      return;
    }

    // Double-check that PaymentElement is actually mounted
    const paymentElement = elements.getElement('payment');
    if (!paymentElement) {
      setMessage("Payment form is not ready. Please wait...");
      return;
    }

    setLoading(true);
    setMessage(null);
    const returnUrl = `${window.location.origin}${successPath}`;
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
    });

    if (error) {
      setMessage(error.message || "An unexpected error occurred.");
      setLoading(false);
    }
    // If successful, user will be redirected
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Show loading state while Stripe initializes */}
      {!stripe || !elements ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-600"></div>
            <p className="mt-3 text-sm text-gray-600">Loading payment form...</p>
          </div>
        </div>
      ) : (
        <>
          {paymentRequest ? (
            <div className="mb-4">
              <PaymentRequestButtonElement
                options={{
                  paymentRequest,
                  style: {
                    paymentRequestButton: {
                      type: "buy",
                      theme: "dark",
                      height: "44px",
                    },
                  },
                }}
              />
              <div className="text-center mt-2 text-xs text-gray-500">
                Or enter card details below
              </div>
            </div>
          ) : null}
          
          {/* ALWAYS render PaymentElement - match frontend UI styling */}
          <div 
            className="relative w-full bg-white rounded-lg border border-gray-200 p-4" 
            style={{ 
              minHeight: '350px',
            }}
          >
            <PaymentElement 
              key={clientSecret}
              onReady={() => {
                console.log('[Stripe] PaymentElement ready');
                setPaymentElementReady(true);
                setMessage(null);
              }}
              onLoadError={(error) => {
                console.error('[Stripe] PaymentElement load error:', error);
                const errorMessage = error?.error?.message || 'Failed to load payment form';
                setMessage(`Payment form error: ${errorMessage}`);
                setPaymentElementReady(false);
              }}
              onChange={(e) => {
                if (e.complete) {
                  setPaymentElementReady(true);
                  setMessage(null);
                }
              }}
              options={{
                layout: 'tabs',
                defaultValues: {
                  billingDetails: {
                    name: '',
                    email: '',
                    phone: '',
                  },
                },
              }}
            />
          </div>
        </>
      )}
      
      <button
        type="submit"
        disabled={!stripe || !elements || loading || !isReady || !paymentElementReady}
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
            Processing...
          </span>
        ) : (
          "Complete Payment"
        )}
      </button>
      {message && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {message}
        </div>
      )}
    </form>
  );
}

// Wrapper to load the Elements provider
interface StripeCheckoutWrapperProps {
  clientSecret: string;
  successPath?: string;
  totalAmount?: number;
  stripeAccount?: string; // Stripe Connect account ID
}

export function StripeCheckoutWrapper({ clientSecret, successPath, totalAmount, stripeAccount }: StripeCheckoutWrapperProps) {
  // Get the appropriate stripe instance for this account
  const stripePromise = useMemo(() => {
    if (stripeAccount) {
      console.log('[Stripe] Using Stripe Connect account:', stripeAccount);
    }
    return getStripePromise(stripeAccount);
  }, [stripeAccount]);

  if (!clientSecret) return null;

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <StripeCheckout clientSecret={clientSecret} successPath={successPath} totalAmount={totalAmount} />
    </Elements>
  );
}
