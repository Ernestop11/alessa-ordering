import Stripe from 'stripe';

let cachedStripe: Stripe | null = null;

export function getStripeClient() {
  if (cachedStripe) return cachedStripe;

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) {
    throw new Error('STRIPE_SECRET_KEY is not set.');
  }

  cachedStripe = new Stripe(stripeSecret, {
    apiVersion: '2022-11-15',
  });

  return cachedStripe;
}
