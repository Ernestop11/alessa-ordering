"use client";

import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
  Elements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface StripeCheckoutProps {
  clientSecret: string;
  successPath?: string;
}

export default function StripeCheckout({ clientSecret, successPath = "/order/success" }: StripeCheckoutProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    const returnUrl = `${window.location.origin}${successPath}`;
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
    });

    if (error) setMessage(error.message || "An unexpected error occurred.");
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <button
        disabled={!stripe || loading}
        className="w-full bg-primary text-white py-2 rounded-md font-medium hover:opacity-90"
      >
        {loading ? "Processing..." : "Pay Now"}
      </button>
      {message && <p className="text-red-500 text-sm">{message}</p>}
    </form>
  );
}

// Wrapper to load the Elements provider
interface StripeCheckoutWrapperProps {
  clientSecret: string;
  successPath?: string;
}

export function StripeCheckoutWrapper({ clientSecret, successPath }: StripeCheckoutWrapperProps) {
  if (!clientSecret) return null;
  const options = { clientSecret };
  return (
    <Elements stripe={stripePromise} options={options}>
      <StripeCheckout clientSecret={clientSecret} successPath={successPath} />
    </Elements>
  );
}
