import Stripe from 'stripe';

let cachedStripe: Stripe | null = null;

/**
 * Validates Stripe API keys and warns if test keys are used in production
 */
export function validateStripeKeys(): { isValid: boolean; isLive: boolean; warnings: string[] } {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const stripePublishable = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const nodeEnv = process.env.NODE_ENV || 'development';
  const warnings: string[] = [];

  if (!stripeSecret) {
    return { isValid: false, isLive: false, warnings: ['STRIPE_SECRET_KEY is not set'] };
  }

  if (!stripePublishable) {
    warnings.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set');
  }

  const isTestSecret = stripeSecret.startsWith('sk_test_');
  const isLiveSecret = stripeSecret.startsWith('sk_live_');
  const isTestPublishable = stripePublishable?.startsWith('pk_test_');
  const isLivePublishable = stripePublishable?.startsWith('pk_live_');

  // Check for mismatched keys
  if (isTestSecret && isLivePublishable) {
    warnings.push('Mismatched keys: Secret key is TEST but Publishable key is LIVE');
  }
  if (isLiveSecret && isTestPublishable) {
    warnings.push('Mismatched keys: Secret key is LIVE but Publishable key is TEST');
  }

  // Critical: Test keys in production
  if (nodeEnv === 'production' && isTestSecret) {
    warnings.push('CRITICAL: Using TEST Stripe keys in PRODUCTION environment!');
    console.error('[STRIPE] ⚠️  CRITICAL WARNING: Test keys detected in production!');
  }

  // Warning: Live keys in development (could be intentional for testing)
  if (nodeEnv === 'development' && isLiveSecret) {
    warnings.push('WARNING: Using LIVE Stripe keys in DEVELOPMENT environment');
  }

  return {
    isValid: isLiveSecret || isTestSecret,
    isLive: isLiveSecret,
    warnings,
  };
}

export function getStripeClient() {
  if (cachedStripe) return cachedStripe;

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) {
    throw new Error('STRIPE_SECRET_KEY is not set.');
  }

  // Validate keys on initialization
  const validation = validateStripeKeys();
  if (!validation.isValid) {
    throw new Error(`Invalid Stripe configuration: ${validation.warnings.join(', ')}`);
  }

  // Log warnings but don't block (allow test keys in dev)
  if (validation.warnings.length > 0) {
    validation.warnings.forEach((warning) => {
      if (warning.includes('CRITICAL')) {
        console.error(`[STRIPE] ${warning}`);
        // In production, throw error for test keys
        if (process.env.NODE_ENV === 'production' && warning.includes('TEST')) {
          throw new Error('Cannot use test Stripe keys in production environment.');
        }
      } else {
        console.warn(`[STRIPE] ${warning}`);
      }
    });
  }

  cachedStripe = new Stripe(stripeSecret, {
    apiVersion: '2024-10-28.acacia' as any,
  });

  return cachedStripe;
}
