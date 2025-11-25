# TESTING SCENARIOS - SUCCESS & FAILURE PATHS
**Comprehensive Test Cases for Demo Day**
**Date:** November 18, 2025
**Coverage:** Happy paths, edge cases, failure scenarios

---

## 🎯 OVERVIEW

This document provides **complete testing scenarios** covering:
1. **Success Paths** - Everything works perfectly
2. **Failure Paths** - How system handles errors gracefully
3. **Edge Cases** - Unusual but valid scenarios
4. **Stripe Onboarding** - Live OAuth flow
5. **DoorDash Demo** - Mock integration testing

**Test Coverage:** Frontend, Admin, Payments, Integrations, Error Handling

---

## ✅ SCENARIO 1: SUCCESS PATH - COMPLETE ORDER FLOW

**Goal:** Verify end-to-end customer ordering works flawlessly

### **Prerequisites:**
- Dev server running
- Database seeded with Las Reinas menu (69 items)
- No items in cart (clean slate)

### **Steps:**

#### **1A: Customer Browses Menu**
```
1. Navigate to: http://localhost:3001?tenant=lasreinas
2. Verify hero banner loads (4 images carousel)
3. Scroll to menu
4. Verify 69 items display across 10 sections
5. Click "Grid" layout → Verify grid view
6. Click "List" layout → Verify list view
7. Click "Showcase" layout → Verify showcase view
```

**Expected Result:**
✅ All layouts display correctly
✅ Images load without errors
✅ No console errors

#### **1B: Add Item to Cart**
```
8. Scroll to "Quesabirrias" item
9. Click "Add to Cart" button
10. Verify modal opens
11. Uncheck "Onions" (removal)
12. Check "Add Guacamole" (add-on, +$2.00)
13. Increase quantity to 2
14. Verify price updates: $13.99 → $15.99 → $31.98
15. Type special instructions: "Extra consommé please"
16. Click "Add to Cart · $31.98"
```

**Expected Result:**
✅ Modal closes
✅ Success notification appears
✅ Cart badge shows (1)
✅ Item saved with customizations

#### **1C: Review Cart**
```
17. Click cart icon (top-right)
18. Verify cart drawer opens
19. Verify item displays:
    - 2x Quesabirrias
    - No: Onions
    - Add: Guacamole (+$2.00)
    - Special instructions: "Extra consommé please"
    - Price: $31.98
20. Verify subtotal calculation
```

**Expected Result:**
✅ Cart shows correct item + customizations
✅ Subtotal matches

#### **1D: Proceed to Checkout**
```
21. Click "Proceed to Checkout" button
22. Verify redirect to /checkout
23. Fill delivery info:
    - Name: John Doe
    - Phone: (530) 555-0123
    - Email: john@example.com
    - Address: 5678 Oak St, Colusa, CA 95932
24. Select fulfillment: Pickup
25. Click "Continue to Payment"
```

**Expected Result:**
✅ Checkout page loads
✅ Form validation works
✅ Data saves to session

#### **1E: Complete Payment**
```
26. Verify Stripe payment element loads
27. Enter test card:
    - Card: 4242 4242 4242 4242
    - Expiry: 12/34
    - CVC: 123
    - ZIP: 12345
28. Click "Pay Now" ($31.98)
29. Wait for processing (2-5 seconds)
```

**Expected Result:**
✅ Loading spinner appears
✅ No errors
✅ Redirects to order confirmation

#### **1F: Order Confirmation**
```
30. Verify confirmation page displays:
    - Order number (e.g., #1047)
    - Customer name: John Doe
    - Items list with customizations
    - Total: $31.98
    - Payment method: Card ending in 4242
    - Estimated pickup time: 20-25 minutes
31. Verify "View Order Status" button works
```

**Expected Result:**
✅ Confirmation page loads
✅ Order number generated
✅ All details correct

#### **1G: Verify Admin Receives Order**
```
32. Open new tab: http://localhost:3001/admin
33. Login: admin@lasreinas.com / demo123
34. Navigate to Orders tab
35. Verify new order appears:
    - Order #1047
    - Status: NEW or CONFIRMED
    - Customer: John Doe
    - Total: $31.98
    - Items: 2x Quesabirrias (customizations listed)
36. Click order to expand details
37. Verify all customizations and special instructions visible
```

**Expected Result:**
✅ Order appears in admin dashboard
✅ All details match customer submission
✅ Real-time update (if SSE enabled)

#### **1H: Verify Fulfillment Board**
```
38. Navigate to: /admin/fulfillment
39. Verify order appears in "NEW" column
40. Click "Accept" or drag to "PREPARING"
41. Verify order moves to "PREPARING" column
42. Click "Mark Ready" or drag to "READY"
43. Verify order moves to "READY" column
44. Click "Complete" or drag to "COMPLETED"
45. Verify order moves to "COMPLETED" column
```

**Expected Result:**
✅ Order appears in correct columns
✅ Drag-and-drop works (if implemented)
✅ Status updates reflect in Orders tab

---

## ❌ SCENARIO 2: FAILURE PATH - PAYMENT DECLINED

**Goal:** Verify graceful handling of failed payment

### **Steps:**

#### **2A: Order with Declined Card**
```
1. Follow steps 1-26 from Scenario 1 (browse, add to cart, checkout)
2. At payment step, enter DECLINED test card:
   - Card: 4000 0000 0000 0002 (Stripe test card for decline)
   - Expiry: 12/34
   - CVC: 123
   - ZIP: 12345
3. Click "Pay Now"
4. Wait for response
```

**Expected Result:**
✅ Error message displays: "Your card was declined"
✅ User remains on checkout page
✅ Can retry with different card
✅ Order is NOT created in database

#### **2B: Verify No Order Created**
```
5. Navigate to admin Orders tab
6. Verify failed order does NOT appear
7. Check database (optional):
   SELECT * FROM "Order" WHERE customerEmail = 'john@example.com'
   → Should return 0 rows
```

**Expected Result:**
✅ No orphaned orders in database
✅ Clean error handling
✅ User can retry

#### **2C: Retry with Valid Card**
```
8. Return to checkout page
9. Enter valid card: 4242 4242 4242 4242
10. Click "Pay Now"
11. Verify payment succeeds
12. Verify order created
```

**Expected Result:**
✅ Second attempt succeeds
✅ Order created with correct details

---

## ⚠️ SCENARIO 3: EDGE CASE - EMPTY CART CHECKOUT

**Goal:** Prevent checkout with empty cart

### **Steps:**

#### **3A: Attempt Checkout with Empty Cart**
```
1. Navigate to customer site
2. Verify cart is empty (badge shows 0 or hidden)
3. Manually navigate to: /checkout
4. Observe behavior
```

**Expected Result:**
✅ Redirects to menu page
✅ Or shows "Your cart is empty" message
✅ "Proceed to Checkout" button disabled on empty cart

#### **3B: Remove Last Item from Cart**
```
5. Add 1 item to cart
6. Open cart drawer
7. Remove the item
8. Verify cart is empty
9. Verify "Proceed to Checkout" button disappears or is disabled
```

**Expected Result:**
✅ Cannot proceed with empty cart
✅ Clear user feedback

---

## ⚠️ SCENARIO 4: EDGE CASE - DUPLICATE ORDERS

**Goal:** Prevent accidental duplicate order submissions

### **Steps:**

#### **4A: Double-Click "Pay Now"**
```
1. Complete order flow up to payment step
2. Enter valid card
3. Rapidly double-click "Pay Now" button
4. Observe behavior
```

**Expected Result:**
✅ Button becomes disabled after first click
✅ Loading state prevents duplicate clicks
✅ Only one order created
✅ Stripe creates only one payment intent

#### **4B: Refresh Confirmation Page**
```
5. Complete order successfully
6. Land on confirmation page
7. Refresh page (Cmd+R / F5)
8. Observe behavior
```

**Expected Result:**
✅ Confirmation page still displays
✅ Order number persists
✅ No duplicate order created

---

## 🔐 SCENARIO 5: STRIPE CONNECT ONBOARDING (LIVE)

**Goal:** Test complete Stripe OAuth flow

### **Prerequisites:**
- Stripe test API keys in `.env`
- Admin account logged in

### **Steps:**

#### **5A: Initiate Connection**
```
1. Navigate to: /admin
2. Login: admin@lasreinas.com / demo123
3. Click Settings tab
4. Scroll to Payments section
5. Verify blue card displays: "Connect Your Stripe Account"
6. Verify button: "Connect with Stripe"
7. Click button
```

**Expected Result:**
✅ Button shows loading spinner
✅ Text changes to "Redirecting to Stripe..."
✅ Redirects to Stripe OAuth page (or error if API keys invalid)

#### **5B: Complete Stripe Onboarding (Test Mode)**
```
8. On Stripe OAuth page, enter test business info:
   - Business name: Las Reinas Colusa
   - Business type: Individual (or LLC)
   - EIN/SSN: Use test SSN: 000-00-0000
   - Bank account: Use Stripe test routing/account
     - Routing: 110000000
     - Account: 000123456789
   - Business address: 1234 Main St, Colusa, CA 95932
   - Phone: (530) 555-0123
9. Click "Authorize access"
10. Wait for redirect
```

**Expected Result:**
✅ Stripe verifies info (instant in test mode)
✅ Redirects to: /admin/stripe-connect/complete
✅ Success page displays with green checkmark

#### **5C: Verify Connection Success**
```
11. On success page, verify:
    - Green checkmark icon
    - Message: "Your Stripe account is connected..."
    - Auto-redirect countdown (2 seconds)
12. Wait for redirect
13. Verify lands on: /admin?tab=settings
14. Scroll to Payments section
15. Verify green card displays:
    - "Stripe Connected ✓"
    - Account ID: acct_XXXXXXXX
    - Business name: Las Reinas Colusa
    - Payments enabled ✓
    - Payouts enabled ✓
```

**Expected Result:**
✅ Connection confirmed
✅ Tenant record updated in database
✅ Onboarding checklist shows green checkmark

#### **5D: Test Payment with Connected Account**
```
16. Open customer site
17. Place test order
18. Complete payment
19. Verify payment goes to connected Stripe account
20. Check Stripe Dashboard:
    - Login to Stripe test dashboard
    - Verify payment appears
    - Verify payment is connected to "Las Reinas Colusa" account
```

**Expected Result:**
✅ Payment processes through Connected Account
✅ Funds would deposit to Las Reinas bank account (in production)

---

## 🚚 SCENARIO 6: DOORDASH DEMO MODE

**Goal:** Test DoorDash integration stub

### **Prerequisites:**
- DoorDash demo mode enabled (or sandbox credentials)
- Customer site open

### **Steps:**

#### **6A: Get Delivery Quote**
```
1. Navigate to customer site
2. Add item to cart
3. Proceed to checkout
4. Fill delivery address:
   - Address: 5678 Oak St, Colusa, CA 95932
5. Select fulfillment: Delivery
6. Observe delivery quote section
```

**Expected Result:**
✅ Delivery quote displays: "$4.99" (mock) or real quote (if DoorDash connected)
✅ Estimated time displays: "25-35 minutes"
✅ No errors in console

#### **6B: Complete Delivery Order**
```
7. Continue to payment
8. Enter valid card
9. Complete payment
10. Verify order confirmation shows:
    - Delivery method: Delivery
    - Delivery address: 5678 Oak St, Colusa, CA 95932
    - Delivery fee: $4.99
    - Total includes delivery fee
```

**Expected Result:**
✅ Delivery order created
✅ Fee added to total
✅ Admin sees delivery order with address

#### **6C: Track Delivery (Demo)**
```
11. On confirmation page, click "Track Delivery" (if implemented)
12. Verify tracking page displays:
    - Driver status: "Driver assigned" (mock)
    - Driver name: "Miguel R. (4.9 ⭐)" (mock)
    - ETA: "30 minutes"
    - Map with route (mock or real if DoorDash connected)
```

**Expected Result:**
✅ Tracking page loads
✅ Mock data displays correctly
✅ Or real data if DoorDash production credentials configured

---

## ❌ SCENARIO 7: FAILURE PATH - ADMIN IMAGE UPLOAD ERROR

**Goal:** Verify graceful handling of upload failures

### **Steps:**

#### **7A: Upload Oversized File**
```
1. Login to admin
2. Navigate to Menu Manager
3. Click edit on any item
4. Scroll to Image Upload section
5. Attempt to upload 10 MB file (if validation exists)
```

**Expected Result:**
✅ Error message: "File too large (max 5 MB)"
✅ Upload prevented
✅ User can retry with smaller file

#### **7B: Upload Invalid File Type**
```
6. Attempt to upload .txt or .pdf file
```

**Expected Result:**
✅ Error message: "Invalid file type (JPG, PNG, WebP only)"
✅ Upload prevented

#### **7C: Simulate Network Error**
```
7. Open dev tools → Network tab
8. Set throttling to "Offline"
9. Attempt to upload valid image
10. Wait for timeout
```

**Expected Result:**
✅ Error message: "Upload failed. Please check your connection."
✅ User can retry
✅ No partial upload in database

---

## ✅ SCENARIO 8: SUCCESS PATH - MENU MANAGER WORKFLOW

**Goal:** Test complete admin menu management

### **Steps:**

#### **8A: Search and Filter**
```
1. Login to admin
2. Navigate to Menu Manager
3. Type "Quesabirria" in search
4. Verify filtered results (3-4 items)
5. Clear search
6. Click "Orphaned" filter
7. Verify only orphaned items display
8. Click "Live" filter
9. Verify only live items display
```

**Expected Result:**
✅ Search works instantly
✅ Filters work correctly
✅ Counts match filtered results

#### **8B: Fix Orphaned Item**
```
10. Click "Orphaned" filter
11. Select first orphaned item
12. Click "Assign Section" dropdown
13. Select "Desserts"
14. Verify item moves to Live
15. Verify counts update:
    - Orphaned: 7 → 6
    - Frontend Visible: 62 → 63
```

**Expected Result:**
✅ Item assigned successfully
✅ Real-time count update
✅ Item appears on customer site

#### **8C: Toggle Visibility**
```
16. Find any visible item
17. Click visibility toggle (eye icon)
18. Verify badge changes: Green → Gray
19. Refresh customer site
20. Verify item hidden from menu
21. Toggle visibility back on
22. Verify item reappears on customer site
```

**Expected Result:**
✅ Visibility toggle works
✅ Changes reflect on customer site immediately

---

## ❌ SCENARIO 9: FAILURE PATH - DATABASE CONNECTION LOSS

**Goal:** Test graceful degradation when database is unavailable

### **Steps:**

#### **9A: Simulate Database Down**
```
1. Stop PostgreSQL:
   brew services stop postgresql (Mac)
   or
   sudo systemctl stop postgresql (Linux)

2. Navigate to customer site
3. Observe behavior
```

**Expected Result:**
✅ Shows error page: "Service temporarily unavailable"
✅ Or cached menu loads (if caching implemented)
✅ No crash, no blank page

#### **9B: Simulate Database During Order**
```
4. Start PostgreSQL
5. Begin order flow (add to cart, proceed to checkout)
6. Stop PostgreSQL during payment
7. Submit payment
8. Observe behavior
```

**Expected Result:**
✅ Error message: "Unable to process order. Please try again."
✅ Payment is NOT charged (Stripe prevents duplicate)
✅ User can retry when DB is back

---

## ⚠️ SCENARIO 10: EDGE CASE - MENU ITEM PRICE CHANGES MID-CHECKOUT

**Goal:** Verify price consistency during checkout

### **Steps:**

#### **10A: Price Change During Cart Session**
```
1. Customer adds Quesabirrias to cart ($13.99)
2. Cart shows $13.99
3. Admin changes price to $15.99
4. Customer proceeds to checkout
5. Observe final price
```

**Expected Result:**
✅ Price at checkout matches price at time of adding to cart ($13.99)
✅ Or shows warning: "Price has changed. Review cart."
✅ Prevents surprise charges

---

## ✅ SCENARIO 11: SUCCESS PATH - ACCESSIBILITY FEATURES

**Goal:** Test all accessibility options

### **Steps:**

#### **11A: Customer Toggles Accessibility**
```
1. Navigate to customer site
2. Click accessibility button (♿)
3. Toggle "High Contrast" ON
4. Verify colors change (higher contrast)
5. Toggle "Large Text" ON
6. Verify font sizes increase
7. Toggle "Reduced Motion" ON
8. Verify animations slow/stop
9. Close panel
10. Refresh page
11. Verify all 3 toggles persist
```

**Expected Result:**
✅ All toggles work
✅ Preferences persist in localStorage
✅ Page remains usable

#### **11B: Admin Sets Defaults**
```
12. Login to admin
13. Navigate to Settings → Accessibility Defaults
14. Check "Large Text"
15. Check "High Contrast"
16. Save settings
17. Open customer site in incognito (fresh session)
18. Verify large text and high contrast enabled by default
```

**Expected Result:**
✅ Admin defaults apply to all new visitors
✅ Existing users can override

---

## ❌ SCENARIO 12: FAILURE PATH - STRIPE WEBHOOK FAILURE

**Goal:** Test order status updates when webhook fails

### **Steps:**

#### **12A: Simulate Webhook Timeout**
```
1. Place order on customer site
2. Payment succeeds
3. Webhook fails to reach server (simulate with network error)
4. Check order status in admin
```

**Expected Result:**
✅ Order created with status "pending"
✅ Background job retries webhook processing
✅ Or manual "Refresh Status" button available
✅ Eventually syncs to "paid" status

---

## 🎯 TESTING MATRIX

| Scenario | Type | Priority | Duration | Status |
|----------|------|----------|----------|--------|
| 1. Complete Order Flow | Success | 🔴 Critical | 10 min | ☐ |
| 2. Payment Declined | Failure | 🔴 Critical | 3 min | ☐ |
| 3. Empty Cart Checkout | Edge Case | 🟡 High | 2 min | ☐ |
| 4. Duplicate Orders | Edge Case | 🟡 High | 3 min | ☐ |
| 5. Stripe Onboarding | Success | 🔴 Critical | 5 min | ☐ |
| 6. DoorDash Demo | Success | 🟡 High | 5 min | ☐ |
| 7. Image Upload Error | Failure | 🟢 Medium | 3 min | ☐ |
| 8. Menu Manager Workflow | Success | 🔴 Critical | 8 min | ☐ |
| 9. Database Connection Loss | Failure | 🟢 Medium | 5 min | ☐ |
| 10. Price Change Mid-Checkout | Edge Case | 🟢 Medium | 3 min | ☐ |
| 11. Accessibility Features | Success | 🟡 High | 5 min | ☐ |
| 12. Webhook Failure | Failure | 🟢 Medium | 3 min | ☐ |

**Total Testing Time:** ~55 minutes

---

## 📋 PRE-DEMO TESTING CHECKLIST

Before presenting, run these critical scenarios:

**Must Test (15 min):**
- [ ] Scenario 1: Complete Order Flow
- [ ] Scenario 5: Stripe Onboarding
- [ ] Scenario 8: Menu Manager Workflow

**Should Test (10 min):**
- [ ] Scenario 2: Payment Declined
- [ ] Scenario 11: Accessibility Features

**Nice to Test (5 min):**
- [ ] Scenario 6: DoorDash Demo

**Total Pre-Demo Testing:** 30 minutes

---

## 🚀 CONCLUSION

These 12 scenarios provide **comprehensive test coverage** for demo day:

✅ **Success Paths** - Prove everything works
❌ **Failure Paths** - Prove graceful error handling
⚠️ **Edge Cases** - Prove robustness

**Testing Confidence:** Run critical scenarios (1, 5, 8) before every demo to ensure readiness.

**Bug Tracking:** Document any failures in GitHub Issues for post-demo fixes.
