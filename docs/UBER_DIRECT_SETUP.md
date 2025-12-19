# Uber Direct Setup Guide

## Overview

Uber Direct integration allows your restaurant to offer delivery through Uber's delivery network. Each tenant can have their own Uber Direct account (similar to Stripe Connect), or fall back to global platform credentials.

## Account Strategy: Tenant-Owned Accounts (Recommended)

Like Stripe Connect, **each restaurant should create and own their own Uber Direct account**. This provides:

- Direct relationship with Uber
- Restaurant receives payments directly
- Restaurant controls their own delivery settings
- Clear accounting and tax implications
- Restaurant can use the same account with other systems

### Why NOT Use a Single Platform Account

- Complicates payment routing
- Creates liability issues
- Makes tax reporting difficult
- Uber may flag unusual activity from one account managing multiple restaurants

---

## Step-by-Step Tenant Onboarding

### Step 1: Create Uber Direct Account

1. Go to **https://direct.uber.com/**
2. Click **"Get started"**
3. Sign up with the **restaurant's business email** (not your personal email)
4. Complete the business verification:
   - Business name (exact legal name)
   - Business address
   - EIN/Tax ID
   - Bank account for payouts

### Step 2: Complete Business Verification

Uber requires verification before live deliveries:
- Business license or registration
- Tax ID verification
- Bank account verification

This typically takes 1-3 business days.

### Step 3: Get API Credentials

Once verified:

1. Log into **https://direct.uber.com/**
2. Go to **Developer** tab (or Settings > API)
3. Copy these three values:
   - **Client ID** (starts with `uber-...`)
   - **Client Secret** (keep this secure!)
   - **Customer ID** (unique to your account)

### Step 4: Connect in Admin Dashboard

1. Log into your restaurant admin dashboard
2. Go to **Settings > Delivery**
3. Click **"Connect Uber Direct"**
4. Enter the three credentials:
   - Client ID
   - Client Secret
   - Customer ID
5. Click **"Connect"**

The system will verify your credentials and show "Connected" status.

### Step 5: Configure Delivery Settings

After connecting:
- Set delivery hours
- Set delivery radius
- Enable/disable delivery in checkout
- Configure fee pass-through (charge customer or absorb)

---

## Technical Implementation

### Database Schema

Credentials are stored in `TenantIntegration`:

```prisma
model TenantIntegration {
  uberClientId      String?
  uberClientSecret  String?
  uberCustomerId    String?
  uberSandbox       Boolean? @default(true)
}
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/uber/status` | GET | Check connection status |
| `/api/admin/uber/connect` | POST | Connect Uber account |
| `/api/admin/uber/disconnect` | POST | Disconnect account |
| `/api/admin/uber/test-quote` | POST | Test delivery quote |
| `/api/delivery/uber/quote` | POST | Get delivery quote |
| `/api/delivery/uber/create` | POST | Create delivery |
| `/api/webhooks/uber` | POST | Receive status updates |

### Multi-Tenant Auth Flow

```
1. Request comes in for tenant
2. Get tenant's integration record from DB
3. Check for tenant-specific Uber credentials
4. If not found, fall back to global env vars
5. Get/cache access token per tenant
6. Make API call with tenant's customerId
```

---

## Webhook Configuration

Set up webhooks in Uber Direct dashboard:

1. Go to **Developer > Webhooks**
2. Add webhook URL: `https://yourdomain.com/api/webhooks/uber`
3. Select events:
   - `event.delivery_status` (required)
   - `event.courier_update` (optional, for live tracking)
   - `event.refund_request` (optional)

---

## Sandbox vs Production

### Sandbox Mode (Default)

- No real deliveries
- No charges
- Simulated courier behavior
- Use for testing

### Production Mode

To switch to production:

1. Complete all Uber verification requirements
2. In admin, update to sandbox: false
3. Or wait for Uber to auto-switch after verification

---

## Troubleshooting

### "Failed to verify credentials"

- Double-check Client ID, Secret, and Customer ID
- Ensure no extra spaces
- Verify account is fully verified with Uber

### "Mock delivery" messages

- Credentials not configured
- Check admin Settings > Delivery for connection status
- Check server logs for auth errors

### Webhook not receiving events

- Verify webhook URL is publicly accessible
- Check Uber dashboard for failed webhook attempts
- Verify SSL certificate is valid

---

## Migration from Villa Corona Account

If you previously had an Uber Direct account under a different name:

1. **Do NOT try to transfer the old account**
2. Create a new account under the correct business name
3. Complete verification as a new business
4. The old account can remain inactive (no charges)

---

## Environment Variables (Fallback Only)

For platform-level fallback (not recommended for production):

```env
UBER_CLIENT_ID=your_client_id
UBER_CLIENT_SECRET=your_client_secret
UBER_CUSTOMER_ID=your_customer_id
UBER_SANDBOX=true
```

These are only used if a tenant doesn't have their own credentials configured.

---

## Support

- Uber Direct Support: https://help.uber.com/direct
- API Documentation: https://developer.uber.com/docs/deliveries
