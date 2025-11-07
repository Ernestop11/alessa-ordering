# Cart Checkout Error - Diagnosis & Fix

## Issue Discovered

When clicking "View Cart" and attempting checkout, the system was returning:
```
{"error":"Stripe account not configured for this tenant."}
```

## Root Cause

The payment intent API ([app/api/payments/intent/route.ts](../app/api/payments/intent/route.ts)) was checking for `tenant.integrations.stripeAccountId`, which is required for **Stripe Connect** (multi-tenant payment processing where each restaurant has their own Stripe account).

However, in the database, all tenants have `stripeAccountId` set to `NULL`:

```sql
SELECT "tenantId", "stripeAccountId", "paymentProcessor" FROM "TenantIntegration";
```

Result:
```
tenantId                              | stripeAccountId | paymentProcessor
--------------------------------------+-----------------+------------------
 5eb8aef5-5629-4630-b45d-e18c5a6fb741 |                 | stripe
 79bd3027-5520-480b-8979-2e37b21e58d0 |                 | stripe
 c691a7d1-882b-4dac-bf9d-90e28142fa49 |                 | stripe
```

## Fix Applied

Modified [app/api/payments/intent/route.ts](../app/api/payments/intent/route.ts) to support **two modes**:

### 1. Development Mode (Direct Stripe Integration)
- Used when `stripeAccountId` is NULL and `NODE_ENV !== "production"`
- Creates payment intents directly with your platform Stripe account
- Perfect for development and testing
- No application fees

### 2. Production Mode (Stripe Connect)
- Used when `stripeAccountId` is configured
- Creates payment intents on connected tenant accounts
- Supports platform fees
- Required for true multi-tenant SaaS

## What's Still Needed

### For Testing (Now)

1. **Get Stripe Test Keys**
   - Go to https://dashboard.stripe.com/test/apikeys
   - Copy your **Publishable key** (starts with `pk_test_`)
   - Copy your **Secret key** (starts with `sk_test_`)

2. **Update `.env` file**
   ```env
   STRIPE_SECRET_KEY="sk_test_YOUR_ACTUAL_KEY_HERE"
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_YOUR_ACTUAL_KEY_HERE"
   ```

3. **Restart the dev server**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

4. **Test the cart**
   - Visit http://localhost:3001/order
   - Add items to cart
   - Click "View Cart"
   - Click "Proceed to Checkout"
   - Use Stripe test card: `4242 4242 4242 4242`, any future expiry, any CVC

### For Production (Later)

1. **Set up Stripe Connect**
   - Each tenant needs their own Stripe account
   - Use the admin onboarding flow at `/api/admin/stripe/onboard`
   - Store the connected account ID in `TenantIntegration.stripeAccountId`

2. **Configure Webhooks**
   - Set up webhook endpoint at `/api/payments/webhook`
   - Add webhook secret to `.env`: `STRIPE_WEBHOOK_SECRET="whsec_..."`
   - Listen for `payment_intent.succeeded` events

3. **Enable Platform Fees**
   - Configure `platformPercentFee` and `platformFlatFee` per tenant
   - Fees automatically calculated on connected account charges

## Testing Without Real Stripe Keys

If you want to test the UI without actual Stripe integration:

1. **Mock the payment intent endpoint** (temporary dev workaround):
   ```typescript
   // In app/api/payments/intent/route.ts
   // Add at the top of POST function for quick testing:
   if (process.env.NODE_ENV === 'development' && process.env.MOCK_STRIPE === 'true') {
     return NextResponse.json({
       clientSecret: 'mock_client_secret_for_ui_testing',
       paymentIntentId: 'mock_pi_test',
       paymentSessionId: 'mock_session_test',
     });
   }
   ```

2. **Add to `.env`**:
   ```env
   MOCK_STRIPE=true
   ```

This will let you see the checkout UI without real Stripe keys (payment submission will still fail, but you can test the flow).

## Current Status

✅ API endpoint fixed to support development mode
✅ Database is properly isolated and working
⚠️ Need valid Stripe test keys to complete checkout testing
⚠️ Stripe Connect setup needed for production multi-tenant usage

## Next Steps

1. Get Stripe test API keys
2. Update `.env` with real keys
3. Test full checkout flow with test card
4. Set up webhook handler for payment confirmation
5. Configure Stripe Connect for production tenants
