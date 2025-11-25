# MVP Testing Checklist

## Pre-Testing Setup

```bash
# 1. Ensure all dependencies installed
npm install

# 2. Database setup
npm run db:setup

# 3. Start dev server
npm run dev

# 4. Verify environment variables
cat .env.local | grep -E "(STRIPE|DOORDASH|RESEND|TWILIO)"
```

---

## 1. Customer Ordering Flow ✅

### Test: Browse Menu
- [ ] Visit tenant storefront (e.g., `lapoblanita.alessacloud.com`)
- [ ] Menu sections display correctly
- [ ] Menu items show images, prices, descriptions
- [ ] "Add to Cart" buttons work
- [ ] Cart icon updates with item count

### Test: Cart Management
- [ ] Add multiple items to cart
- [ ] Update quantities in cart
- [ ] Remove items from cart
- [ ] Cart total calculates correctly
- [ ] Proceed to checkout works

### Test: Checkout Flow
- [ ] Customer info form displays
- [ ] Email/Phone OTP login works
- [ ] Delivery address form (if delivery selected)
- [ ] Pickup option works
- [ ] Order notes field works
- [ ] Tax calculation correct
- [ ] Delivery fee calculation (if applicable)

### Test: Payment
- [ ] Stripe payment form loads
- [ ] Test card works (4242 4242 4242 4242)
- [ ] Payment processes successfully
- [ ] Order confirmation page displays
- [ ] Order number shown

### Test: Order Confirmation
- [ ] Order details correct
- [ ] Total amount matches
- [ ] Confirmation email sent (check Resend logs)
- [ ] Order appears in admin dashboard

---

## 2. Admin Dashboard ✅

### Test: Login
- [ ] Admin login works
- [ ] Redirects to dashboard after login
- [ ] Session persists on refresh

### Test: Menu Management
- [ ] View menu sections
- [ ] Create new menu section
- [ ] Edit menu section
- [ ] Delete menu section
- [ ] Create menu item
- [ ] Edit menu item
- [ ] Upload item image
- [ ] Delete menu item
- [ ] Reorder sections (if implemented)

### Test: Settings
- [ ] View settings page
- [ ] Update restaurant name
- [ ] Update contact info
- [ ] Update colors (primary/secondary)
- [ ] Upload logo
- [ ] Upload hero image
- [ ] Update social media links
- [ ] Update delivery radius
- [ ] Update minimum order value
- [ ] Save changes works
- [ ] Changes reflect on storefront (check cache invalidation)

### Test: Order Management
- [ ] View orders list
- [ ] Filter orders by status
- [ ] View order details
- [ ] Update order status
- [ ] Acknowledge order
- [ ] Order notifications sent (if enabled)

### Test: Integrations
- [ ] Stripe Connect button works
- [ ] Stripe onboarding flow completes
- [ ] Stripe status shows "Connected"
- [ ] DoorDash Connect button works
- [ ] DoorDash store ID saves
- [ ] DoorDash status shows "Connected"
- [ ] Printer settings save

---

## 3. Super Admin Dashboard ✅

### Test: Login
- [ ] Super admin login works
- [ ] Dashboard loads with tenant list

### Test: Tenant Management
- [ ] View all tenants
- [ ] Tenant metrics display correctly
- [ ] Select tenant to edit
- [ ] Update tenant details
- [ ] Change tenant status
- [ ] Status badges update
- [ ] Preview storefront link works

### Test: Tenant Onboarding
- [ ] Create new tenant
- [ ] Template selection works
- [ ] Seed demo data works
- [ ] Tenant appears in list
- [ ] Status workflow: PENDING_REVIEW → READY_FOR_APPROVAL → APPROVED → LIVE

### Test: Metrics
- [ ] Total tenants count correct
- [ ] Total orders count correct
- [ ] 7-day volume calculates correctly
- [ ] Top performers list accurate
- [ ] Latest activity shows recent orders

---

## 4. Multi-Tenant Architecture ✅

### Test: Tenant Isolation
- [ ] Tenant A's data not visible to Tenant B
- [ ] Orders isolated per tenant
- [ ] Menu isolated per tenant
- [ ] Settings isolated per tenant

### Test: Subdomain Routing
- [ ] `lapoblanita.alessacloud.com` shows correct tenant
- [ ] `lasreinas.alessa.com` shows correct tenant
- [ ] Custom domain routing (if configured)

### Test: Branding
- [ ] Each tenant shows correct colors
- [ ] Each tenant shows correct logo
- [ ] Each tenant shows correct hero image
- [ ] CSS variables update per tenant

---

## 5. Payment Processing ✅

### Test: Stripe Connect Onboarding
- [ ] Click "Connect Stripe" in admin
- [ ] Redirects to Stripe onboarding
- [ ] Complete onboarding flow
- [ ] Redirects back to admin
- [ ] Stripe account ID saved
- [ ] Status shows "Connected"

### Test: Payment Processing
- [ ] Create test order
- [ ] Payment intent created
- [ ] Payment processes successfully
- [ ] Webhook received (check logs)
- [ ] Order status updates to "paid"
- [ ] Payment session created in database

### Test: Failed Payments
- [ ] Use declined card (4000 0000 0000 0002)
- [ ] Error message displays
- [ ] Order not created
- [ ] User can retry

---

## 6. DoorDash Integration 🟡

### Test: Sandbox (Current)
- [ ] Quote API endpoint works
- [ ] Returns delivery fee and ETA
- [ ] Create delivery endpoint works
- [ ] Delivery created in DoorDash
- [ ] Track delivery endpoint works
- [ ] Returns delivery status

### Test: Tenant Onboarding
- [ ] DoorDash Connect button works
- [ ] Store ID input saves
- [ ] Connection status updates
- [ ] Disconnect works

### Test: Production (Tomorrow)
- [ ] Update production credentials
- [ ] Set `DOORDASH_SANDBOX=false`
- [ ] Test quote API
- [ ] Test create delivery
- [ ] Test track delivery
- [ ] Verify real deliveries work

---

## 7. Notifications ✅

### Test: Customer Login OTP
- [ ] Request OTP via email
- [ ] Email received (check Resend logs)
- [ ] Request OTP via SMS
- [ ] SMS received (check Twilio logs)
- [ ] OTP verification works
- [ ] Session created

### Test: Fulfillment Notifications
- [ ] Create order
- [ ] Update order status to "ready"
- [ ] Notification sent (if enabled)
- [ ] Check email/SMS logs

---

## 8. Printer Integration ✅

### Test: Configuration
- [ ] Select printer type (Bluetooth/Network/Clover)
- [ ] Enter printer endpoint/config
- [ ] Save settings

### Test: Auto-Print
- [ ] Enable auto-print in settings
- [ ] Create new order
- [ ] Verify print job dispatched
- [ ] Check integration logs

---

## 9. Error Handling ⚠️

### Test: Network Errors
- [ ] Disconnect internet
- [ ] Try to place order
- [ ] Error message displays
- [ ] User can retry

### Test: API Errors
- [ ] Invalid payment card
- [ ] DoorDash API error
- [ ] Database connection error
- [ ] Appropriate error messages shown

---

## 10. Performance ✅

### Test: Page Load Times
- [ ] Storefront loads < 2s
- [ ] Admin dashboard loads < 2s
- [ ] Menu images lazy load
- [ ] Cart updates don't block UI

### Test: Database Queries
- [ ] No N+1 queries
- [ ] Indexes used properly
- [ ] Pagination works for large lists

---

## Test Results Template

```
Date: ___________
Tester: ___________

### Critical Issues Found:
1. [Issue description]
   - Severity: Critical/High/Medium/Low
   - Steps to reproduce:
   - Expected:
   - Actual:

### Bugs Found:
[Same format]

### Test Coverage:
- Order Flow: ✅ / ⚠️ / ❌
- Admin Dashboard: ✅ / ⚠️ / ❌
- Super Admin: ✅ / ⚠️ / ❌
- Multi-Tenant: ✅ / ⚠️ / ❌
- Payments: ✅ / ⚠️ / ❌
- DoorDash: ✅ / ⚠️ / ❌
- Notifications: ✅ / ⚠️ / ❌
- Printer: ✅ / ⚠️ / ❌

### Overall Status:
[ ] Ready for Production
[ ] Needs Fixes (list above)
[ ] Blocked (by what?)
```

---

## Quick Test Commands

```bash
# Run type checking
npm run test:types

# Run smoke tests
npm run test:smoke

# Run full verification
npm run verify

# Check linting
npm run lint

# Build for production
npm run build
```

---

## Priority Testing Order

1. **Critical Path** (Do First):
   - Order flow end-to-end
   - Payment processing
   - Admin dashboard basics

2. **Important** (Do Second):
   - Multi-tenant isolation
   - DoorDash integration
   - Notifications

3. **Polish** (Do Third):
   - Super admin features
   - Printer integration
   - Edge cases










