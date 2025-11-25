# 🔧 Checkout Modal Troubleshooting Guide

## Issues Reported
- Checkout modal UI doesn't match page design
- No card input option visible
- PaymentElement not rendering

## ✅ Fixes Applied

### 1. PaymentElement Always Renders
- Removed conditional rendering that was hiding PaymentElement
- Added clear visual container with border and padding
- PaymentElement now renders immediately when Stripe Elements is ready

### 2. Visual Improvements
- Added bordered container around card input
- Tenant theme colors applied throughout:
  - Modal header with gradient background
  - Payment section borders
  - Buttons with tenant colors
  - Close button styled

### 3. Loading States
- Clear loading indicator while Stripe initializes
- Better error messages if Stripe fails to load

## 🧪 Testing Steps

1. **Clear Browser Cache** (CRITICAL!)
   - Mac: `Cmd + Shift + R`
   - Windows: `Ctrl + Shift + R`
   - Or open DevTools → Network → Check "Disable cache"

2. **Test Checkout Flow**:
   ```
   1. Go to: https://lasreinas.alessacloud.com/order
   2. Add item to cart
   3. Click "View Cart" button (bottom right or header)
   4. Fill in customer info (email or phone required)
   5. Click "Proceed to Payment"
   6. Card input should be VISIBLE in a bordered container
   ```

3. **Check Browser Console**:
   - Open DevTools (F12)
   - Look for Stripe errors
   - Check if PaymentElement is mounting
   - Verify clientSecret is being passed

## 🔍 If Still Not Working

### Check Stripe Keys
```bash
# On VPS, verify Stripe keys are set:
ssh root@77.243.85.8
cd /var/www/alessa-ordering
grep NEXT_PUBLIC_STRIPE .env
```

### Check Console Errors
Common issues:
- `Stripe.js failed to load` → Check NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- `Invalid client secret` → Check payment intent creation
- `PaymentElement mount failed` → Check Stripe Elements initialization

### Verify Payment Intent API
Test if payment intent is created:
```bash
# Should return clientSecret
curl -X POST https://lasreinas.alessacloud.com/api/payments/intent \
  -H "Content-Type: application/json" \
  -d '{"order": {"items": [...]}, "currency": "usd"}'
```

## 📝 Files Changed

1. `components/StripeCheckout.tsx`
   - PaymentElement always renders when ready
   - Better visual container
   - Improved loading states

2. `components/Cart.tsx`
   - Payment section styled with tenant colors
   - Better error handling

3. `components/CartLauncher.tsx`
   - Modal header with tenant theme colors
   - Consistent styling

## 🚨 Common Fixes

1. **Browser Cache**: Always clear cache after deployment
2. **Stripe Keys**: Verify keys are set in `.env` on VPS
3. **Client Secret**: Ensure payment intent API is working
4. **Z-index**: PaymentElement container has z-index: 10

