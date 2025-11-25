# 🚀 MVP SPRINT PLAN - Complete These Features

## Issues Identified

1. **Admin Routing**: Tenant admin redirects to super admin
2. **Checkout Modal**: Not visually consistent with page
3. **Payment**: Has Google Pay, needs Apple Pay
4. **Membership**: Need easy signup toggle in checkout
5. **Membership UI**: Need frontend reorder flow for members
6. **Rewards**: Need follow-up pages and flows
7. **Menu Editor & Fulfillment**: Need to verify access

## SPRINT EXECUTION PLAN

### Step 1: Fix Admin Routing (URGENT)
- Check VPS environment variables
- Ensure tenant-specific admin credentials work
- Verify /admin stays on tenant admin, not redirecting to super-admin

### Step 2: Fix Checkout Modal Styling
- Match tenant theme colors (primaryColor, secondaryColor)
- Consistent design with ordering page
- Better spacing and typography

### Step 3: Add Apple Pay & Improve Payment Flow
- Configure Apple Pay in Stripe PaymentRequest
- Ensure both Apple Pay and card input work
- Better payment form UX

### Step 4: Membership Toggle in Checkout
- Add "Become a member" checkbox/toggle
- Show benefits (reorder, points, etc.)
- Save customer info when checked

### Step 5: Membership Frontend UI
- Member login/account page
- Reorder from previous orders
- Points balance display

### Step 6: Rewards Follow-Up Pages
- Order success page with rewards info
- Points earned display
- Membership status page

### Step 7: Verify Menu Editor & Fulfillment
- Test owner access
- Verify fulfillment PWA works

---

Starting execution now!

