# Stripe Connect Setup & Testing Guide

## ✅ Implementation Complete!

The Stripe Connect platform fee system has been successfully implemented. Here's what was built:

### Files Created/Modified:

1. **Database Schema** - [prisma/schema.prisma](../prisma/schema.prisma)
   - Added Stripe Connect status tracking fields
   - `stripeOnboardingComplete`, `stripeChargesEnabled`, `stripePayoutsEnabled`, etc.

2. **API Routes**:
   - [app/api/admin/stripe/connect/onboard/route.ts](../app/api/admin/stripe/connect/onboard/route.ts) - Creates Connect account & onboarding link
   - [app/api/admin/stripe/connect/status/route.ts](../app/api/admin/stripe/connect/status/route.ts) - Checks account status
   - [app/api/payments/intent/route.ts](../app/api/payments/intent/route.ts) - Already supports platform fees!

3. **UI Components**:
   - [components/admin/StripeConnectButton.tsx](../components/admin/StripeConnectButton.tsx) - Smart Connect button
   - [components/admin/Settings.tsx](../components/admin/Settings.tsx) - Integrated into admin

4. **Callback Pages**:
   - [app/admin/stripe-connect/complete/page.tsx](../app/admin/stripe-connect/complete/page.tsx) - Success handler
   - [app/admin/stripe-connect/refresh/page.tsx](../app/admin/stripe-connect/refresh/page.tsx) - Refresh handler

---

## 🚀 How to Test

### Step 1: Get Real Stripe Test Keys

You **must** have valid Stripe test API keys to test this feature.

1. Go to https://dashboard.stripe.com/test/apikeys
2. Sign up or log in
3. Copy your keys:
   - **Publishable key**: `pk_test_51...`
   - **Secret key**: `sk_test_51...`

### Step 2: Update Your .env File

```env
# Replace these placeholder values with your REAL Stripe test keys
STRIPE_SECRET_KEY="sk_test_51ABC..." # ← Your actual secret key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_51ABC..." # ← Your actual publishable key
```

### Step 3: Restart the Dev Server

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

### Step 4: Test the Onboarding Flow

1. **Visit Admin Settings**:
   ```
   http://localhost:3001/admin?tab=settings
   ```

2. **Scroll to "Payments" Section**:
   - You should see the blue "Connect with Stripe" card

3. **Click "Connect with Stripe"**:
   - This will redirect you to Stripe's hosted onboarding

4. **Fill Out Stripe's Form** (use test data):
   ```
   Business name: Test Restaurant
   Email: test@restaurant.com
   Phone: 555-555-5555

   Bank Account:
   - Routing: 110000000
   - Account: 000123456789

   Personal Info (for sole proprietorship):
   - SSN: 000-00-0000
   - DOB: 01/01/1990
   - Address: 123 Main St, San Francisco, CA 94102
   ```

5. **Complete Onboarding**:
   - Stripe will redirect back to your app
   - You'll see a success message
   - You'll be redirected to `/admin?tab=settings`

6. **Verify Connection**:
   - The Payments section should now show a green "Stripe Connected" card
   - Shows account ID, business name, and status indicators

### Step 5: Test a Payment with Platform Fee

1. **Visit the storefront**:
   ```
   http://localhost:3001/order
   ```

2. **Add items to cart**

3. **Open cart and checkout**:
   - Fill in customer details
   - Click "Proceed to Checkout"
   - This should now work (no more "Stripe account not configured" error!)

4. **Use a test card**:
   ```
   Card: 4242 4242 4242 4242
   Expiry: 12/34
   CVC: 123
   ```

5. **Check the payment in Stripe**:
   - Go to https://dashboard.stripe.com/test/connect/accounts
   - Click on the connected account
   - Go to "Payments" tab
   - You should see the test payment
   - **Platform fee was automatically deducted!**

---

## 🎯 How Platform Fees Work

### Example Transaction:

**Customer Order**: $100.00
- Subtotal: $100.00
- Tax: $8.25 (8.25%)
- **Total charged**: $108.25

**Platform Fee** (2.9% + $0.30 on subtotal):
- Calculation: ($100.00 × 0.029) + $0.30 = **$3.20**

**Restaurant Receives**:
- Gross: $108.25
- Platform fee: -$3.20
- Stripe fee: ~$3.44 (2.9% + $0.30 on $108.25)
- **Net to restaurant**: ~$101.61

**Your Platform Receives**:
- **$3.20** per transaction (held in your Stripe balance)

### Fee Configuration

You can adjust fees per tenant in the database:

```sql
UPDATE "TenantIntegration"
SET
  "platformPercentFee" = 0.029,  -- 2.9%
  "platformFlatFee" = 0.3        -- $0.30
WHERE "tenantId" = 'tenant_id_here';
```

Or create tiered pricing:

```sql
-- Starter tier: 3.9% + $0.30
-- Professional tier: 2.9% + $0.30
-- Enterprise tier: 1.9% + $0.30
```

---

## 📊 Monitoring Platform Fees

### View in Stripe Dashboard

1. **Your Platform Balance**:
   - Go to https://dashboard.stripe.com/test/balance
   - Click "Application fees" - this is your revenue!

2. **Per-Transaction Breakdown**:
   - Go to https://dashboard.stripe.com/test/connect/application_fees
   - See all fees collected from connected accounts

3. **Connected Account List**:
   - Go to https://dashboard.stripe.com/test/connect/accounts
   - See all restaurant accounts and their status

### In Your Database

```sql
-- Check which tenants are connected
SELECT
  t."name",
  t."slug",
  ti."stripeAccountId",
  ti."stripeOnboardingComplete",
  ti."stripeChargesEnabled",
  ti."platformPercentFee",
  ti."platformFlatFee"
FROM "Tenant" t
JOIN "TenantIntegration" ti ON t."id" = ti."tenantId"
WHERE ti."stripeAccountId" IS NOT NULL;
```

---

## 🔧 Troubleshooting

### Issue: "Invalid API Key provided"

**Problem**: Placeholder Stripe keys in `.env`
**Solution**: Add your real Stripe test keys (see Step 1 above)

### Issue: Button says "Onboarding Incomplete"

**Problem**: User started onboarding but didn't finish
**Solution**: Click "Continue Onboarding" to resume

### Issue: "Charges disabled" after onboarding

**Problem**: Stripe is reviewing the account
**Solution**: Wait 1-2 minutes, then click "Refresh Status"

In test mode, accounts are usually approved instantly. In production, it can take 1-2 business days.

### Issue: No platform fee showing in Stripe

**Problem**: Testing with development mode (direct integration)
**Solution**: Ensure the tenant has a `stripeAccountId` set. Only Stripe Connect payments include platform fees.

### Issue: Can't see connected accounts in Stripe

**Problem**: Looking at live dashboard instead of test
**Solution**: Use https://dashboard.stripe.com/test/connect/accounts

---

## 🔐 Production Checklist

Before going live with real customers:

### 1. Switch to Live Keys

```env
# In production .env
STRIPE_SECRET_KEY="sk_live_..." # ← Live secret key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..." # ← Live publishable key
```

### 2. Enable Stripe Connect in Production

- Go to https://dashboard.stripe.com/settings/connect
- Click "Get Started" (if not already enabled)
- Choose "Express" account type
- Fill in your platform details

### 3. Update Webhook Endpoint

```bash
# Set up webhook for production
stripe listen --forward-to https://yourplatform.com/api/payments/webhook --live
```

Or configure in Stripe Dashboard:
- Settings → Webhooks → Add endpoint
- URL: `https://yourplatform.com/api/payments/webhook`
- Events: `payment_intent.succeeded`, `account.updated`

### 4. Verify Business Requirements

- Terms of Service includes platform fee disclosure
- Privacy policy covers payment processing
- Support email is configured
- Refund policy is clear

### 5. Test with Real Bank Account

- Create a test Connect account with your personal bank
- Make a real $1 payment
- Verify payout arrives in 2-7 days
- Then remove the test account

---

## 💡 Tips & Best Practices

### Fee Transparency

Always show customers that platform fees are included:

```
Subtotal:        $100.00
Tax:              $8.25
Service Fee:      $3.20  ← Make this visible
────────────────────────
Total:          $111.45
```

### Competitive Fees

Industry benchmarks:
- Square: 2.6% + $0.10 per transaction
- Toast: 2.49% + $0.15 per transaction
- Your platform: 2.9% + $0.30 (competitive!)

### Volume Discounts

Offer lower fees for high-volume restaurants:

```typescript
// Example pricing logic
const fee = monthlyVolume > 50000
  ? { percent: 0.019, flat: 0.30 }  // 1.9% for $50k+ volume
  : { percent: 0.029, flat: 0.30 }; // 2.9% standard
```

### Monthly Subscriptions

Alternative revenue model:

```typescript
// Charge monthly fee + lower transaction fee
const pricing = {
  starter: { monthly: 0, percent: 0.039 },      // Free + 3.9%
  pro: { monthly: 49, percent: 0.029 },         // $49/mo + 2.9%
  enterprise: { monthly: 199, percent: 0.019 }, // $199/mo + 1.9%
};
```

---

## 🎉 What's Next?

Now that Stripe Connect is working, you can:

1. **Add More Restaurants**:
   - Each can onboard themselves via admin settings
   - All fees collected automatically

2. **Build Analytics**:
   - Track total platform revenue
   - Show per-restaurant performance
   - Calculate growth metrics

3. **Implement Webhooks**:
   - Auto-create orders on successful payment
   - Send email receipts
   - Update order statuses

4. **Add Features**:
   - Subscription tiers with different fees
   - Promotional fee waivers
   - Volume-based discounts
   - Revenue sharing with partners

---

## 📞 Need Help?

- Stripe Connect docs: https://stripe.com/docs/connect
- Test cards: https://stripe.com/docs/testing
- Contact Stripe support: https://support.stripe.com

**Everything is ready to go! Just add your Stripe test keys and start testing!** 🚀
