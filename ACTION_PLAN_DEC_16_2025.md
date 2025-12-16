# Action Plan - December 16, 2025

## Current Status Summary

### 1. Stripe Connect (Revenue Split)
**Status:** Partially configured - needs completion

| Field | Value |
|-------|-------|
| Account ID | `acct_1SUxf2PdVzlsFbno` |
| Charges Enabled | `false` |
| Onboarding Complete | `false` |
| Platform Fee | 2.9% + $0.30 |

**Current Mode:** TEST mode (sk_test_*, pk_test_*)

**Action Required:**
1. Complete Stripe Connect onboarding for Las Reinas
2. Switch to LIVE keys when ready for production
3. Set up webhook secret

---

### 2. Apple Pay
**Status:** Not configured

**Missing Environment Variables:**
- `APPLE_PAY_MERCHANT_ID`
- `APPLE_PAY_CERTIFICATE_PATH` or `APPLE_PAY_CERTIFICATE_CONTENT`
- `APPLE_PAY_KEY_PATH` or `APPLE_PAY_KEY_CONTENT`

---

### 3. Tax Configuration
**Status:** Working with builtin provider

| Setting | Value |
|---------|-------|
| Tax Provider | `builtin` |
| Default Rate | `8.25%` |

---

### 4. Membership Program
**Status:** Configured and active

**Tiers:**
| Tier | Threshold | Badge Color |
|------|-----------|-------------|
| Bronze | 0 points | #b45309 |
| Silver | 250 points | #6b7280 |
| Gold | 500 points | #d97706 |

**Points Rate:** 10 points per $1 spent

**Test Members:**
- Ernesto Ponce: 0 points, Bronze tier

---

## Task 1: Complete Stripe Setup

### Step 1A: Complete Stripe Connect Onboarding

Go to: `https://lasreinas.ordernosh.com/admin/onboarding` or use the API:

```bash
# Generate new onboarding link
curl -X POST https://lasreinas.ordernosh.com/api/admin/stripe/connect/onboard \
  -H "Cookie: [your-session-cookie]"
```

The Las Reinas account owner needs to:
1. Click the onboarding link
2. Complete business verification (EIN, address, banking info)
3. Upload required documents
4. Accept Stripe terms

### Step 1B: Set Up Stripe Webhook (VPS)

1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://ordernosh.com/api/payments/webhook`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `account.updated` (for Connect)
4. Copy the webhook signing secret
5. Update VPS:

```bash
ssh root@77.243.85.8 "cd /var/www/alessa-ordering && sed -i 's/STRIPE_WEBHOOK_SECRET=.*/STRIPE_WEBHOOK_SECRET=\"whsec_YOUR_SECRET_HERE\"/' .env && pm2 restart alessa-ordering"
```

### Step 1C: Switch to Live Mode (When Ready)

```bash
ssh root@77.243.85.8 "cd /var/www/alessa-ordering && nano .env"
# Uncomment the live keys and comment out test keys
```

### Step 1D: Set Up Apple Pay

**Prerequisites:**
1. Apple Developer Account ($99/year)
2. Create Merchant ID: `merchant.com.ordernosh.lasreinas`

**Steps:**
1. Register domain in Apple Developer Portal
2. Download domain verification file
3. Place at: `/.well-known/apple-developer-merchantid-domain-association`
4. Create Payment Processing Certificate
5. Add to VPS .env:

```bash
APPLE_PAY_MERCHANT_ID=merchant.com.ordernosh.lasreinas
APPLE_PAY_CERTIFICATE_CONTENT="-----BEGIN CERTIFICATE-----..."
APPLE_PAY_KEY_CONTENT="-----BEGIN PRIVATE KEY-----..."
```

---

## Task 2: DNS Transfer (lasreinascolusa.com)

### Current: Squarespace DNS
### Target: Hostinger/VPS (77.243.85.8)

### DNS Records to Create in Hostinger:

```
Type    Host    Value                       TTL
----    ----    -----                       ---
A       @       77.243.85.8                 3600
A       www     77.243.85.8                 3600
CNAME   www     lasreinascolusa.com         3600  (alternative)
```

### Step-by-Step:

1. **In Squarespace:** (Domain Settings)
   - Note current DNS records
   - Either transfer domain OR point nameservers to Hostinger

2. **Option A - Nameserver Transfer:**
   In Squarespace, change nameservers to:
   ```
   ns1.hostinger.com
   ns2.hostinger.com
   ```

3. **Option B - Keep at Squarespace, Point A Records:**
   In Squarespace DNS:
   ```
   A    @      77.243.85.8
   A    www    77.243.85.8
   ```

4. **Configure Nginx on VPS:**
   ```bash
   ssh root@77.243.85.8 "cat /etc/nginx/sites-available/alessa-ordering"
   ```

   Add `lasreinascolusa.com` to server_name:
   ```nginx
   server {
       server_name ordernosh.com lasreinas.ordernosh.com lasreinascolusa.com www.lasreinascolusa.com;
       # ... rest of config
   }
   ```

5. **Get SSL Certificate:**
   ```bash
   ssh root@77.243.85.8 "certbot --nginx -d lasreinascolusa.com -d www.lasreinascolusa.com"
   ```

6. **Map Domain to Tenant:**
   ```sql
   UPDATE "Tenant"
   SET "customDomain" = 'lasreinascolusa.com'
   WHERE slug = 'lasreinas';
   ```

---

## Task 3: Test Membership Program

### Test Flow:

1. **Create Test Customer Order:**
   - Go to: `https://lasreinas.ordernosh.com/order`
   - Add items totaling ~$20
   - At checkout, enter email/phone and check "Join Rewards"
   - Complete payment

2. **Verify Points Earned:**
   ```sql
   SELECT name, email, "loyaltyPoints", "membershipTier"
   FROM "Customer"
   WHERE "tenantId" = 'f941ea79-5af8-4c33-bb17-9a98a992a232'
   ORDER BY "loyaltyPoints" DESC;
   ```

   Expected: 10 points per $1 = 200 points for $20 order

3. **Test Membership UI:**
   - Go to: `https://lasreinas.ordernosh.com/customer/login`
   - Login with phone/email
   - Verify points display
   - Check tier badge
   - View order history

4. **Test Tier Upgrades:**
   - Make orders until reaching 250 points = Silver tier
   - Make orders until reaching 500 points = Gold tier

### Membership URLs:
- Login: `/customer/login`
- Orders: `/customer/orders`
- Admin Rewards: `/admin/rewards`

---

## Task 4: Verify Tax Feature

### Current Config:
- Provider: `builtin`
- Rate: `8.25%` (California + Colusa County)

### Test Tax Calculation:

1. **Add items to cart** (subtotal $10)
2. **Expected tax:** $10 × 8.25% = $0.83
3. **Verify in order:**
   ```sql
   SELECT id, "subtotalAmount", "taxAmount", "totalAmount"
   FROM "Order"
   WHERE "tenantId" = 'f941ea79-5af8-4c33-bb17-9a98a992a232'
   ORDER BY "createdAt" DESC LIMIT 5;
   ```

### Alternative: Avalara Tax (If Needed)

To use Avalara for automatic tax calculation:
1. Get Avalara account
2. Update TenantIntegration:
   ```sql
   UPDATE "TenantIntegration"
   SET "taxProvider" = 'avalara',
       "taxConfig" = '{"accountId": "xxx", "licenseKey": "xxx"}'
   WHERE "tenantId" = 'f941ea79-5af8-4c33-bb17-9a98a992a232';
   ```

---

## Quick Commands Reference

### Check Stripe Status
```bash
curl https://lasreinas.ordernosh.com/api/admin/stripe/connect/status
```

### Restart VPS App
```bash
ssh root@77.243.85.8 "pm2 restart alessa-ordering && pm2 logs alessa-ordering --lines 20"
```

### Check Customer Points
```bash
ssh root@77.243.85.8 "sudo -u postgres psql -d alessa_ordering -c \"SELECT name, \\\"loyaltyPoints\\\", \\\"membershipTier\\\" FROM \\\"Customer\\\" WHERE \\\"tenantId\\\" = 'f941ea79-5af8-4c33-bb17-9a98a992a232';\""
```

### Check Recent Orders
```bash
ssh root@77.243.85.8 "sudo -u postgres psql -d alessa_ordering -c \"SELECT id, \\\"customerName\\\", \\\"totalAmount\\\", \\\"taxAmount\\\", status FROM \\\"Order\\\" WHERE \\\"tenantId\\\" = 'f941ea79-5af8-4c33-bb17-9a98a992a232' ORDER BY \\\"createdAt\\\" DESC LIMIT 5;\""
```

---

## Priority Order

1. **HIGH:** Complete Stripe Connect onboarding (required for real payments)
2. **HIGH:** DNS transfer for lasreinascolusa.com
3. **MEDIUM:** Test membership program end-to-end
4. **LOW:** Apple Pay setup (requires Apple Developer account)
5. **LOW:** Avalara tax integration (builtin works fine for now)

---

## Notes

- Keep test mode until all features verified
- Document webhook secret securely
- DNS propagation takes 24-48 hours
- Test on real iOS device for Apple Pay
