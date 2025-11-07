# Stripe Connect Platform Fee Implementation Plan

## Overview

You want to collect **platform fees** (like Wix, Shopify, Square) on every transaction, then distribute funds to restaurant owners. This is exactly what **Stripe Connect** is designed for.

## How Platform Fees Work

### Example Transaction:
- Customer orders $100 of food
- Your platform fee: 2.9% + $0.30 = **$3.20**
- Restaurant receives: **$96.80**
- Stripe processing fee: ~2.9% + $0.30 (deducted from restaurant's portion)

### Payment Flow:
```
Customer → Stripe → [Platform Fee Held] → Restaurant Connected Account
  $100      $100        $3.20 (yours)         $96.80 (restaurant)
```

---

## Recommended Architecture: Stripe Connect Express

### Why Stripe Connect Express?

✅ **Fastest onboarding** - Stripe handles identity verification
✅ **Automatic payouts** - Funds go directly to restaurant's bank
✅ **You collect fees automatically** - Deducted during payment
✅ **Stripe handles compliance** - KYC, tax forms, regulations
✅ **Mobile-friendly** - Restaurant owners can onboard from phone

### Alternative: Stripe Connect Standard

- More control, but restaurant sees Stripe branding
- Better for larger enterprises
- More complex onboarding

**Recommendation: Start with Express, migrate to Standard later if needed.**

---

## Implementation Plan

### Phase 1: Platform Setup (Week 1)

#### 1.1 Create Stripe Platform Account
```bash
# Your main Stripe account becomes the "platform"
# Sign in: https://dashboard.stripe.com
# Enable Connect: Settings → Connect → Get Started
```

#### 1.2 Configure Platform Settings
- **Application name**: "Alessa Ordering Platform"
- **Account type**: Express (or Standard)
- **Platform fee structure**:
  - Percentage: 2.9% (adjustable per tenant)
  - Flat fee: $0.30 (adjustable per tenant)

#### 1.3 Update Environment Variables
```env
# Platform Stripe keys (already have these)
STRIPE_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."

# Stripe Connect settings
STRIPE_CONNECT_CLIENT_ID="ca_..." # Get from Connect settings
STRIPE_PLATFORM_ACCOUNT_ID="acct_..." # Your platform account ID

# Webhook secret for Connect events
STRIPE_CONNECT_WEBHOOK_SECRET="whsec_..."
```

---

### Phase 2: Admin Onboarding Flow (Week 1-2)

#### 2.1 Add "Connect Stripe" Button to Admin Settings

**Location**: `app/admin/settings/page.tsx` (or create new `/admin/stripe-connect`)

**UI Flow**:
```
┌─────────────────────────────────────┐
│  Stripe Account Status              │
├─────────────────────────────────────┤
│  ● Not Connected                    │
│                                     │
│  Connect your Stripe account to     │
│  receive payments from customers.   │
│                                     │
│  [ Connect with Stripe ]  ←── Button│
└─────────────────────────────────────┘
```

**After Connection**:
```
┌─────────────────────────────────────┐
│  Stripe Account Status              │
├─────────────────────────────────────┤
│  ✓ Connected                        │
│                                     │
│  Account: acct_1234567890          │
│  Payouts: Enabled                   │
│  Status: Active                     │
│                                     │
│  [ View Dashboard ] [ Disconnect ]  │
└─────────────────────────────────────┘
```

#### 2.2 Create Onboarding API Route

**File**: `app/api/admin/stripe/connect/route.ts` (new)

**Flow**:
1. Admin clicks "Connect with Stripe"
2. API generates Stripe Connect account link
3. Redirects to Stripe's onboarding (hosted by Stripe)
4. Stripe collects: business info, bank details, tax info
5. Returns to your app with account ID
6. Store `stripeAccountId` in database

#### 2.3 Handle Return Flow

**File**: `app/admin/stripe-connect/callback/page.tsx` (new)

Stripe redirects here after onboarding with account ID.

---

### Phase 3: Payment Processing with Fees (Week 2)

#### 3.1 Current Status (✅ Already Done!)

Your code in `app/api/payments/intent/route.ts` **already supports** platform fees:

```typescript
// Lines 46-50 - Already implemented!
const platformPercentFee = tenant.integrations?.platformPercentFee ?? 0.029; // 2.9%
const platformFlatFee = tenant.integrations?.platformFlatFee ?? 0.3; // $0.30
const applicationFeeAmount = Math.max(0, orderPayload.subtotalAmount * platformPercentFee + platformFlatFee);
const applicationFeeCents = Math.round(applicationFeeAmount * 100);
```

**What's missing**: Just need to populate `stripeAccountId` in database!

#### 3.2 Transaction Flow (Once Connected)

```typescript
// Customer pays $100
const paymentIntent = await stripe.paymentIntents.create(
  {
    amount: 10000, // $100.00
    currency: 'usd',
    application_fee_amount: 320, // $3.20 (your fee)
  },
  {
    stripeAccount: 'acct_restaurant123', // Restaurant's connected account
  }
);
```

**Result**:
- $100.00 charged to customer
- $3.20 held in your platform balance
- $96.80 goes to restaurant's connected account
- Restaurant pays Stripe processing fees (~2.9% + $0.30) from their portion

---

### Phase 4: Database Schema Updates (Week 2)

#### 4.1 Update `TenantIntegration` Table

```sql
-- Already have these columns! ✅
ALTER TABLE "TenantIntegration"
  ADD COLUMN IF NOT EXISTS "stripeAccountId" TEXT,
  ADD COLUMN IF NOT EXISTS "stripeOnboardingComplete" BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "stripePayoutsEnabled" BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "stripeChargesEnabled" BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "stripeOnboardedAt" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "stripeDashboardUrl" TEXT;
```

Schema already supports this! Just need to add a few status tracking fields.

#### 4.2 Add Transaction Tracking

```sql
-- New table for fee tracking
CREATE TABLE "PlatformTransaction" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "paymentIntentId" TEXT NOT NULL,
  "orderId" TEXT,
  "grossAmount" DECIMAL(10,2) NOT NULL,
  "platformFee" DECIMAL(10,2) NOT NULL,
  "netAmount" DECIMAL(10,2) NOT NULL,
  "stripeAccountId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),

  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE
);
```

---

### Phase 5: Webhook Handler (Week 3)

#### 5.1 Listen for Payment Events

**File**: `app/api/payments/webhook/route.ts` (already exists!)

**Events to handle**:
- `payment_intent.succeeded` - Payment completed, create order
- `account.updated` - Connected account status changed
- `payout.paid` - Restaurant received payout
- `application_fee.created` - Your fee was collected

#### 5.2 Sample Webhook Handler

```typescript
export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature');
  const body = await req.text();

  const event = stripe.webhooks.constructEvent(
    body,
    sig!,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      // Create order, mark as paid
      await createOrderFromPayment(paymentIntent);
      break;

    case 'account.updated':
      const account = event.data.object;
      // Update tenant integration status
      await updateTenantStripeStatus(account);
      break;
  }

  return NextResponse.json({ received: true });
}
```

---

## Technical Implementation Steps

### Step 1: Create Stripe Connect Onboarding (Priority 1)

**File**: `app/api/admin/stripe/connect/onboard/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { requireTenant } from '@/lib/tenant';
import { getStripeClient } from '@/lib/stripe';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  const tenant = await requireTenant();
  const stripe = getStripeClient();
  const { redirectUrl } = await req.json();

  // Check if account already exists
  let accountId = tenant.integrations?.stripeAccountId;

  if (!accountId) {
    // Create new Connect Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US', // or tenant.country
      email: tenant.contactEmail || undefined,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'company',
      business_profile: {
        name: tenant.name,
        url: `https://yourplatform.com/order?tenant=${tenant.slug}`,
        mcc: '5812', // MCC for restaurants
      },
    });

    accountId = account.id;

    // Save to database
    await prisma.tenantIntegration.update({
      where: { tenantId: tenant.id },
      data: { stripeAccountId: accountId },
    });
  }

  // Generate onboarding link
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${redirectUrl}/admin/stripe-connect/refresh`,
    return_url: `${redirectUrl}/admin/stripe-connect/complete`,
    type: 'account_onboarding',
  });

  return NextResponse.json({ url: accountLink.url });
}
```

### Step 2: Admin UI Component

**File**: `components/admin/StripeConnectButton.tsx` (new)

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function StripeConnectButton({
  isConnected,
  accountId
}: {
  isConnected: boolean;
  accountId?: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleConnect = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stripe/connect/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          redirectUrl: window.location.origin,
        }),
      });

      const { url } = await res.json();
      window.location.href = url; // Redirect to Stripe
    } catch (error) {
      console.error('Connect failed:', error);
      setLoading(false);
    }
  };

  if (isConnected && accountId) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <p className="font-medium text-green-900">Stripe Connected</p>
        </div>
        <p className="mt-1 text-sm text-green-700">Account: {accountId}</p>
        <p className="mt-2 text-xs text-green-600">
          You're ready to accept payments!
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <p className="font-medium text-amber-900">Connect Stripe Account</p>
      <p className="mt-1 text-sm text-amber-700">
        Connect your Stripe account to receive payments from customers.
      </p>
      <button
        onClick={handleConnect}
        disabled={loading}
        className="mt-3 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Connecting...' : 'Connect with Stripe'}
      </button>
    </div>
  );
}
```

### Step 3: Add to Admin Settings

**File**: `components/admin/Settings.tsx`

```typescript
// Add import
import StripeConnectButton from './StripeConnectButton';

// Add to component render (in the Payments section)
<div className="space-y-4">
  <h3 className="text-lg font-medium">Payment Processing</h3>

  <StripeConnectButton
    isConnected={!!integration.stripeAccountId}
    accountId={integration.stripeAccountId}
  />

  {/* Existing fee configuration fields */}
  <div>
    <label>Platform Fee (%)</label>
    <input
      type="number"
      value={integration.platformPercentFee || 2.9}
      onChange={...}
      step="0.1"
    />
  </div>
</div>
```

---

## Fee Structure Recommendations

### Tiered Pricing Model

```typescript
// lib/pricing-tiers.ts
export const PRICING_TIERS = {
  starter: {
    monthlyFee: 0,
    transactionPercent: 0.039, // 3.9%
    transactionFlat: 0.30,
    features: ['Basic POS', 'Online Ordering', 'Email Support'],
  },
  professional: {
    monthlyFee: 49,
    transactionPercent: 0.029, // 2.9%
    transactionFlat: 0.30,
    features: ['Everything in Starter', 'Custom Branding', 'Analytics', 'Priority Support'],
  },
  enterprise: {
    monthlyFee: 199,
    transactionPercent: 0.019, // 1.9%
    transactionFlat: 0.30,
    features: ['Everything in Pro', 'Multi-location', 'API Access', 'Dedicated Account Manager'],
  },
};
```

### Competitive Analysis

| Platform | Transaction Fee | Monthly Fee | Notes |
|----------|----------------|-------------|-------|
| **Square** | 2.6% + $0.10 | $0-$60 | Leader in restaurant POS |
| **Shopify** | 2.9% + $0.30 | $29-$299 | Ecommerce focused |
| **Wix** | 2.9% + $0.30 | $27-$59 | Website + payments |
| **Toast** | 2.49% + $0.15 | $69+ | Restaurant-specific |
| **Your Platform** | 2.9% + $0.30 | $0-$199 | **Recommended starting point** |

---

## Timeline & Milestones

### Week 1: Foundation
- [ ] Enable Stripe Connect in dashboard
- [ ] Create onboarding API routes
- [ ] Build Connect button component
- [ ] Test with one restaurant

### Week 2: Integration
- [ ] Add to admin settings UI
- [ ] Update database schema with status tracking
- [ ] Test full onboarding flow
- [ ] Deploy to staging

### Week 3: Production
- [ ] Set up webhook handlers
- [ ] Add fee reporting dashboard
- [ ] Test with 3-5 beta restaurants
- [ ] Launch! 🚀

---

## Testing Strategy

### Test Mode (Recommended for now)

1. **Use Stripe Test Mode**
   - All Connect accounts are test accounts
   - Use test bank accounts (Stripe provides these)
   - No real money moves

2. **Test Onboarding Flow**
   ```
   Test SSN: 000-00-0000
   Test Bank: Routing 110000000, Account 000123456789
   Test DOB: 01/01/1990
   ```

3. **Test Payment with Fees**
   - Add items to cart
   - Complete checkout with test card
   - Verify platform fee is collected
   - Check restaurant received net amount

### Production Checklist

- [ ] Switch to live Stripe keys
- [ ] Update webhook URLs to production
- [ ] Enable payouts (automatic or manual)
- [ ] Set up bank account for platform fees
- [ ] Configure tax reporting
- [ ] Add fraud prevention rules

---

## Next Steps (What to Do Now)

### Option A: Quick Start (Recommended)

1. **Enable Stripe Connect**:
   - Go to https://dashboard.stripe.com/settings/connect
   - Click "Get Started"
   - Choose "Express" accounts

2. **I'll build the onboarding flow** (2-3 hours of dev work):
   - API routes for Connect
   - Admin UI button
   - Callback handling
   - Database updates

3. **You test with one restaurant**:
   - Connect test account
   - Place test order
   - Verify fee collection

### Option B: Manual Setup (Temporary)

1. **Manually create Connect accounts**:
   - Go to Stripe Dashboard → Connect → Accounts
   - Click "Add Account"
   - Fill in restaurant info
   - Copy account ID

2. **Update database manually**:
   ```sql
   UPDATE "TenantIntegration"
   SET "stripeAccountId" = 'acct_...'
   WHERE "tenantId" = (SELECT id FROM "Tenant" WHERE slug = 'lapoblanita');
   ```

3. **Test payments immediately**

---

## My Recommendation

**Let me build the automated Connect flow** (Option A). It will take 2-3 hours of focused work and give you:

✅ Professional onboarding experience
✅ Self-service for restaurant owners
✅ Automatic fee collection
✅ Scalable to 100s of restaurants
✅ No manual database edits needed

Would you like me to proceed with building the Stripe Connect onboarding system?
