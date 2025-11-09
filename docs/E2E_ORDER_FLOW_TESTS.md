# E2E Order Flow Tests

**Date:** January 8, 2025
**Server:** http://localhost:3001
**Status:** ✅ Server Running

---

## 🎯 Test Objectives

Verify the complete order flow from browsing menu to payment completion:

1. **Delivery Flow** - Add items → delivery address → quote → payment → order confirmation
2. **Pickup Flow** - Add items → pickup option → payment → order confirmation
3. **Database Verification** - Confirm orders are stored correctly in Prisma database

---

## 🚀 Quick Start

### Server Setup (Already Running ✅)

```bash
# Build and start dev server
npm run build
PORT=3001 npm run dev
```

**Server Status:** ✅ Running on http://localhost:3001

---

## 📋 Test Scenarios

### Scenario 1: Delivery Order Flow

**Test URL:** http://localhost:3001/test/order

#### Step 1: Browse Menu & Add Items

1. Open http://localhost:3001/test/order
2. Browse menu sections
3. Click on menu items to view details
4. Add multiple items to cart:
   - [ ] Add at least 1 item from Tacos section
   - [ ] Add at least 1 item from Burritos section
   - [ ] Add at least 1 beverage
5. Verify cart badge updates with item count

**Expected:**
- Menu items display with images, names, prices
- Cart icon shows item count
- Items can be added successfully

#### Step 2: Open Cart & Review

1. Click cart icon in top-right
2. Review items in cart:
   - [ ] Item names displayed
   - [ ] Quantities shown
   - [ ] Prices correct
   - [ ] Subtotal calculated
3. Test quantity adjustments:
   - [ ] Increase quantity (+)
   - [ ] Decrease quantity (-)
   - [ ] Remove item (trash icon)

**Expected:**
- Cart displays all added items
- Quantities can be adjusted
- Subtotal updates dynamically
- Items can be removed

#### Step 3: Select Delivery & Enter Address

1. In cart, select "Delivery" tab
2. Fill in customer information:
   ```
   Name: Test Customer
   Email: test@example.com
   Phone: (555) 123-4567
   ```
3. Fill in delivery address:
   ```
   Street: 123 Main St
   Apartment: Apt 4B (optional)
   City: San Francisco
   State: CA
   Zip: 94102
   ```
4. Add delivery instructions (optional):
   ```
   Leave at door, ring bell
   ```

**Expected:**
- Form fields accept input
- Address validation works
- Phone number formatted correctly

#### Step 4: Get Delivery Quote

1. Click "Get Delivery Quote" button
2. Wait for quote response
3. Verify quote displays:
   - [ ] Delivery fee amount
   - [ ] Estimated delivery time
   - [ ] Updated total with delivery fee

**Expected:**
- Quote loads within 2-3 seconds
- Delivery fee added to total
- ETA displayed (e.g., "30-45 minutes")

**Mock Mode (No DoorDash Credentials):**
- Delivery fee: $4.99
- ETA: 30-45 minutes

**Sandbox Mode (With DoorDash Credentials):**
- Live quote from DoorDash API
- Actual delivery fee and ETA

#### Step 5: Add Tip (Optional)

1. Select tip amount:
   - [ ] No Tip
   - [ ] 15% (~$X.XX)
   - [ ] 18% (~$X.XX)
   - [ ] 20% (~$X.XX)
   - [ ] Custom amount

**Expected:**
- Tip options calculated correctly
- Total updates with tip amount

#### Step 6: Review Order Summary

Before checkout, verify:
- [ ] Subtotal correct
- [ ] Delivery fee included
- [ ] Tip included (if added)
- [ ] Tax calculated (8.25% CA default)
- [ ] **Total Amount** accurate

**Example Calculation:**
```
Subtotal:     $25.00
Delivery:     $4.99
Tip (18%):    $4.50
Tax (8.25%):  $2.06
─────────────────────
TOTAL:        $36.55
```

#### Step 7: Proceed to Payment

1. Click "Proceed to Payment" button
2. Stripe Checkout loads in modal/redirect
3. Fill in Stripe test card:
   ```
   Card Number: 4242 4242 4242 4242
   Expiry: 12/34 (any future date)
   CVC: 123 (any 3 digits)
   ZIP: 12345 (any 5 digits)
   ```
4. Click "Pay" in Stripe Checkout

**Expected:**
- Stripe Checkout loads successfully
- Test card accepted
- Payment processes without errors

#### Step 8: Order Confirmation

After successful payment:
- [ ] Redirected to success page: `/order/success?session_id=xxx`
- [ ] Order confirmation displays:
  - Order number
  - Customer details
  - Delivery address
  - Items ordered
  - Total amount
  - Estimated delivery time
- [ ] Success message shown

**Expected:**
- Success page loads
- Order details accurate
- Order number generated

#### Step 9: Database Verification

Check that order was stored in database:

```bash
# SSH to production VPS
ssh root@77.243.85.8

# Query recent orders
sudo -u postgres psql -d alessa_ordering -c "
SELECT
  o.id,
  o.\"customerName\",
  o.\"totalAmount\",
  o.\"fulfillmentMethod\",
  o.status,
  o.\"createdAt\",
  COUNT(oi.id) as item_count
FROM \"Order\" o
LEFT JOIN \"OrderItem\" oi ON o.id = oi.\"orderId\"
WHERE o.\"createdAt\" > NOW() - INTERVAL '1 hour'
GROUP BY o.id
ORDER BY o.\"createdAt\" DESC
LIMIT 5;
"
```

**Expected Output:**
```
         id         | customerName  | totalAmount | fulfillmentMethod | status  |         createdAt          | item_count
────────────────────┼───────────────┼─────────────┼───────────────────┼─────────┼────────────────────────────┼───────────
 order-uuid-here    | Test Customer |       36.55 | delivery          | pending | 2025-01-08 10:30:00.000000 |          3
```

**Verify:**
- [ ] Order record exists
- [ ] Customer name correct
- [ ] Total amount matches
- [ ] Fulfillment method = "delivery"
- [ ] Status = "pending"
- [ ] Order items count matches cart

---

### Scenario 2: Pickup Order Flow

**Test URL:** http://localhost:3001/test/order

#### Step 1: Browse Menu & Add Items

Same as Delivery Flow Step 1

#### Step 2: Open Cart & Select Pickup

1. Click cart icon
2. Select "Pickup" tab
3. Fill in customer information:
   ```
   Name: Test Pickup Customer
   Email: pickup@example.com
   Phone: (555) 987-6543
   ```
4. Add pickup notes (optional):
   ```
   Please have order ready by 6pm
   ```

**Expected:**
- No delivery address required
- No delivery fee
- Simpler checkout flow

#### Step 3: Review Order Summary

Verify:
- [ ] Subtotal correct
- [ ] No delivery fee
- [ ] Tip optional (for in-store tip jar or service)
- [ ] Tax calculated
- [ ] **Total Amount** accurate

**Example Calculation (Pickup):**
```
Subtotal:     $25.00
Tip:          $0.00
Tax (8.25%):  $2.06
─────────────────────
TOTAL:        $27.06
```

#### Step 4: Proceed to Payment

Same Stripe test card flow as Delivery

#### Step 5: Order Confirmation

- [ ] Success page shows "Pickup" order
- [ ] No delivery address displayed
- [ ] Pickup instructions shown (if provided)
- [ ] Estimated pickup time displayed

#### Step 6: Database Verification

```bash
sudo -u postgres psql -d alessa_ordering -c "
SELECT
  o.id,
  o.\"customerName\",
  o.\"totalAmount\",
  o.\"fulfillmentMethod\",
  o.status
FROM \"Order\" o
WHERE o.\"fulfillmentMethod\" = 'pickup'
  AND o.\"createdAt\" > NOW() - INTERVAL '1 hour'
ORDER BY o.\"createdAt\" DESC
LIMIT 5;
"
```

**Expected:**
- [ ] Fulfillment method = "pickup"
- [ ] No delivery address stored
- [ ] Total matches (no delivery fee)

---

## 🧪 Test Cases Summary

### Delivery Flow Tests

| Test Case | Description | Status |
|-----------|-------------|--------|
| **DE-01** | Add items to cart | ⏳ |
| **DE-02** | Open cart and review items | ⏳ |
| **DE-03** | Enter delivery address | ⏳ |
| **DE-04** | Get delivery quote | ⏳ |
| **DE-05** | Add tip to order | ⏳ |
| **DE-06** | Verify order summary | ⏳ |
| **DE-07** | Complete Stripe payment | ⏳ |
| **DE-08** | Order confirmation page | ⏳ |
| **DE-09** | Database verification | ⏳ |

### Pickup Flow Tests

| Test Case | Description | Status |
|-----------|-------------|--------|
| **PU-01** | Add items to cart | ⏳ |
| **PU-02** | Select pickup option | ⏳ |
| **PU-03** | Enter customer details | ⏳ |
| **PU-04** | Verify order summary (no delivery fee) | ⏳ |
| **PU-05** | Complete Stripe payment | ⏳ |
| **PU-06** | Order confirmation page | ⏳ |
| **PU-07** | Database verification | ⏳ |

Legend:
- ✅ Passed
- ❌ Failed
- ⏳ Pending
- ⚠️ Warning

---

## 🔍 Detailed Verification Steps

### 1. Check Order Items in Database

```bash
sudo -u postgres psql -d alessa_ordering -c "
SELECT
  oi.\"orderId\",
  mi.name as item_name,
  oi.quantity,
  oi.\"unitPrice\",
  oi.\"totalPrice\"
FROM \"OrderItem\" oi
JOIN \"MenuItem\" mi ON oi.\"menuItemId\" = mi.id
WHERE oi.\"orderId\" = 'ORDER_ID_HERE'
ORDER BY oi.\"createdAt\";
"
```

**Expected:**
- All cart items stored
- Quantities match
- Prices accurate

### 2. Check Payment Session

```bash
sudo -u postgres psql -d alessa_ordering -c "
SELECT
  \"orderId\",
  \"stripeSessionId\",
  \"paymentIntentId\",
  status,
  \"amountTotal\"
FROM \"PaymentSession\"
WHERE \"orderId\" = 'ORDER_ID_HERE';
"
```

**Expected:**
- Payment session created
- Stripe session ID stored
- Status = "complete"
- Amount matches order total

### 3. Check Customer Record

```bash
sudo -u postgres psql -d alessa_ordering -c "
SELECT
  email,
  \"phoneNumber\",
  \"orderCount\",
  \"totalSpent\",
  \"lastOrderAt\"
FROM \"Customer\"
WHERE email = 'test@example.com';
"
```

**Expected:**
- Customer record created
- Order count incremented
- Total spent updated
- Last order timestamp set

---

## 💳 Stripe Test Cards

### Successful Payment
```
Card: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/34)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

### Declined Payment (for testing error handling)
```
Card: 4000 0000 0000 0002
Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

### 3D Secure Required (for testing authentication)
```
Card: 4000 0025 0000 3155
Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Delivery Quote Fails

**Symptom:** "Failed to get delivery quote" error

**Possible Causes:**
1. DoorDash API credentials missing (expected in mock mode)
2. Invalid delivery address
3. Address outside delivery radius

**Solution:**
- Check `.env.local` for DoorDash credentials
- Verify address is valid
- Try a different address within delivery area
- In mock mode, should return $4.99 fee

### Issue 2: Stripe Payment Fails

**Symptom:** Payment doesn't process

**Possible Causes:**
1. Stripe keys not configured
2. Test mode not enabled
3. Invalid card number

**Solution:**
- Verify `STRIPE_SECRET_KEY` in `.env.local`
- Ensure using test mode keys (starts with `sk_test_`)
- Use correct test card: `4242 4242 4242 4242`

### Issue 3: Order Not in Database

**Symptom:** Order confirmation shows but database empty

**Possible Causes:**
1. Database connection failed
2. Transaction rolled back
3. Looking at wrong database

**Solution:**
- Check Prisma logs in terminal
- Verify database connection string
- Confirm tenant ID matches

### Issue 4: Cart Not Updating

**Symptom:** Items added but cart count doesn't update

**Possible Causes:**
1. React state not updating
2. JavaScript error in console
3. Browser cache issue

**Solution:**
- Check browser console for errors
- Hard refresh (Cmd+Shift+R)
- Clear browser cache

---

## 📊 Test Results Template

```
Date: _______________
Tester: _______________
Server: http://localhost:3001/test/order

DELIVERY FLOW:
  [ ] DE-01: Add items to cart
  [ ] DE-02: Open cart and review
  [ ] DE-03: Enter delivery address
  [ ] DE-04: Get delivery quote
  [ ] DE-05: Add tip
  [ ] DE-06: Verify order summary
  [ ] DE-07: Complete Stripe payment
  [ ] DE-08: Order confirmation
  [ ] DE-09: Database verification

PICKUP FLOW:
  [ ] PU-01: Add items to cart
  [ ] PU-02: Select pickup option
  [ ] PU-03: Enter customer details
  [ ] PU-04: Verify order summary
  [ ] PU-05: Complete Stripe payment
  [ ] PU-06: Order confirmation
  [ ] PU-07: Database verification

OVERALL RESULT: [ ] PASS  [ ] FAIL

Notes:
________________________________________________________________
________________________________________________________________
```

---

## 🎬 Testing Workflow

### Before Testing

1. ✅ Server running on port 3001
2. [ ] Database accessible
3. [ ] Stripe test keys configured
4. [ ] Browser dev tools open (Console + Network tabs)

### During Testing

1. [ ] Take screenshots of each step
2. [ ] Monitor console for errors
3. [ ] Check network requests (especially Stripe)
4. [ ] Note any warnings or issues

### After Testing

1. [ ] Verify orders in database
2. [ ] Check Stripe dashboard for test payments
3. [ ] Review server logs for errors
4. [ ] Document any issues found
5. [ ] Update test results template

---

## 🔗 Related Files

- [Cart Component](../components/Cart.tsx) - Cart UI and checkout logic
- [Order Page](../app/order/page.tsx) - Order page wrapper
- [Order Page Client](../components/order/OrderPageClient.tsx) - Menu and cart integration
- [Orders API](../app/api/orders/route.ts) - Order creation endpoint
- [Payment Intent API](../app/api/payments/intent/route.ts) - Stripe payment intent
- [Prisma Schema](../prisma/schema.prisma) - Database models

---

## 📈 Success Criteria

**Must Pass:**
- ✅ Items can be added to cart
- ✅ Cart displays correctly with quantities and totals
- ✅ Delivery address form works
- ✅ Delivery quote returns fee and ETA
- ✅ Stripe payment completes successfully
- ✅ Order confirmation page displays
- ✅ Order stored in database with correct data
- ✅ Order items stored with correct quantities and prices
- ✅ Payment session recorded
- ✅ Customer record created/updated
- ✅ Pickup flow works without delivery address
- ✅ No JavaScript console errors

**Nice to Have:**
- Form validation prevents invalid input
- Loading states during API calls
- Error messages are user-friendly
- Mobile responsive design
- Accessibility features work

---

**Server Status:** ✅ Running on http://localhost:3001
**Ready to Test:** ✅ Yes
**Next Step:** Open http://localhost:3001/test/order and begin testing

---

**Last Updated:** 2025-01-08
**Test Status:** Ready to begin
