# E2E Order Flow Tests - Quick Start

**Server:** ✅ Running on http://localhost:3001
**Ready to Test:** ✅ Yes

---

## 🚀 Start Testing Now

### 1. Open Test Page

**URL:** http://localhost:3001/test/order

### 2. Test Delivery Flow (5-10 minutes)

**Quick Steps:**
1. ✅ Add items to cart (click menu items)
2. ✅ Click cart icon → Review items
3. ✅ Select "Delivery" tab
4. ✅ Fill in address:
   ```
   Name: Test Customer
   Email: test@example.com
   Phone: 555-123-4567
   Address: 123 Main St
   City: San Francisco
   State: CA
   Zip: 94102
   ```
5. ✅ Click "Get Delivery Quote" (should show $4.99 fee)
6. ✅ Add tip (optional): 18%
7. ✅ Click "Proceed to Payment"
8. ✅ Enter Stripe test card:
   ```
   Card: 4242 4242 4242 4242
   Expiry: 12/34
   CVC: 123
   ZIP: 12345
   ```
9. ✅ Click "Pay" and wait for confirmation
10. ✅ Verify order success page displays

### 3. Test Pickup Flow (3-5 minutes)

**Quick Steps:**
1. ✅ Refresh page, add items
2. ✅ Click cart → Select "Pickup" tab
3. ✅ Fill in customer info (name, email, phone)
4. ✅ Click "Proceed to Payment"
5. ✅ Use same Stripe test card
6. ✅ Verify order success page (no delivery address)

### 4. Verify Database (30 seconds)

```bash
ssh root@77.243.85.8 "sudo -u postgres psql -d alessa_ordering -c \"SELECT o.id, o.\\\"customerName\\\", o.\\\"totalAmount\\\", o.\\\"fulfillmentMethod\\\", COUNT(oi.id) as items FROM \\\"Order\\\" o LEFT JOIN \\\"OrderItem\\\" oi ON o.id = oi.\\\"orderId\\\" WHERE o.\\\"createdAt\\\" > NOW() - INTERVAL '1 hour' GROUP BY o.id ORDER BY o.\\\"createdAt\\\" DESC LIMIT 5;\""
```

**Expected:** See your test orders with correct amounts and fulfillment methods

---

## 💳 Stripe Test Card

```
Card Number: 4242 4242 4242 4242
Expiry: 12/34 (any future date)
CVC: 123 (any 3 digits)
ZIP: 12345 (any 5 digits)
```

---

## ✅ Quick Checklist

**Delivery Flow:**
- [ ] Items add to cart
- [ ] Cart displays items
- [ ] Delivery address form works
- [ ] Delivery quote loads ($4.99 mock)
- [ ] Stripe payment completes
- [ ] Success page shows order details
- [ ] Order in database

**Pickup Flow:**
- [ ] Items add to cart
- [ ] Pickup tab selected
- [ ] No delivery address required
- [ ] No delivery fee charged
- [ ] Stripe payment completes
- [ ] Success page shows pickup order
- [ ] Order in database

---

## 🐛 Common Issues

### "Failed to get delivery quote"
**Fix:** Expected in mock mode - should still show $4.99 fee and allow checkout

### Stripe payment doesn't load
**Fix:** Check `.env.local` has `STRIPE_PUBLISHABLE_KEY` (starts with `pk_test_`)

### Order not in database
**Fix:** Check Prisma logs in terminal for errors

---

## 📊 Test Results

**Date:** _______________

**Delivery Flow:** [ ] PASS  [ ] FAIL

**Pickup Flow:** [ ] PASS  [ ] FAIL

**Database Verification:** [ ] PASS  [ ] FAIL

**Issues Found:**
________________________________________________________________
________________________________________________________________

---

## 📁 Full Documentation

See [docs/E2E_ORDER_FLOW_TESTS.md](docs/E2E_ORDER_FLOW_TESTS.md) for detailed test procedures, database queries, and troubleshooting.

---

**Server Running:** ✅ http://localhost:3001
**Test Page:** http://localhost:3001/test/order
**Status:** Ready to test!
