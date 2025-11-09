# E2E Smoke Test: Customize → Live Order Flow

**Date**: 2025-11-09
**Environment**: Production (VPS)
**Tester**: Admin User
**URL**: https://lapoblanita.alessacloud.com

---

## Test Objectives

Validate the complete user journey from admin customization through live order placement and fulfillment, ensuring all features work end-to-end in production.

---

## Phase 1: Admin Customization

### Steps:

1. **Navigate to Admin Dashboard**
   - [ ] Login at `/admin/login`
   - [ ] Verify successful authentication
   - [ ] Dashboard loads without errors

2. **Access Customize Tab**
   - [ ] Click "Customize" tab in navigation
   - [ ] Preview panel loads with current settings
   - [ ] No console errors

3. **Update Hero Section**
   - [ ] Change hero title to: `La Poblanita – Presentation Test`
   - [ ] Verify live preview updates immediately
   - [ ] Confirm text appears in preview panel

4. **Update Brand Colors**
   - [ ] Set primary color: `#f97316` (orange)
   - [ ] Set secondary color: `#fde047` (yellow)
   - [ ] Check contrast ratio warning/success
   - [ ] Verify colors update in preview

5. **Add Feature Highlight**
   - [ ] Type "Freshly made mole poblano" in highlight input
   - [ ] Click "Add" or press Enter
   - [ ] Verify highlight appears in tag list
   - [ ] Check preview shows highlight in footer/hero area

6. **Enable Catering Feature**
   - [ ] Toggle "catering" checkbox ON
   - [ ] Verify catering button appears in preview (bottom-left)
   - [ ] Confirm button shows 🎉 icon and "Catering" text

7. **Publish Changes**
   - [ ] Click "Publish Changes" button
   - [ ] Wait for success message: "Settings published successfully!"
   - [ ] Verify audit log entry appears with timestamp
   - [ ] Check audit log shows all 4 changes (title, colors, highlight, flag)

**Expected Results:**
- ✅ All changes visible in live preview
- ✅ Publish succeeds with 200 response
- ✅ Audit log records changes with before/after values
- ✅ Status changes from "Unsaved changes" to "Published"

---

## Phase 2: Public Site Verification

### Steps:

1. **Open Public Order Page (Incognito)**
   - [ ] Open new incognito/private window
   - [ ] Navigate to: `https://lapoblanita.alessacloud.com/order`
   - [ ] Hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)
   - [ ] Wait for full page load

2. **Verify Hero Section**
   - [ ] Hero title displays: "La Poblanita – Presentation Test"
   - [ ] Hero subtitle/tagline visible
   - [ ] No layout issues or text cutoff

3. **Verify Brand Colors**
   - [ ] Primary color (#f97316 orange) visible in:
     - Navigation active tabs
     - Hero gradient overlays
     - "Add to Cart" buttons
     - Cart launcher button
   - [ ] Secondary color (#fde047 yellow) visible in:
     - Gradient transitions
     - Accent elements
     - Button hover states

4. **Verify Feature Highlight**
   - [ ] Scroll to footer or hero stats section
   - [ ] Confirm "Freshly made mole poblano" appears in highlights
   - [ ] Badge/tag styling correct

5. **Verify Catering Button**
   - [ ] Catering button visible at bottom-left (desktop)
   - [ ] Button shows 🎉 icon
   - [ ] Button text: "Catering"
   - [ ] Click button to open catering panel
   - [ ] Verify panel contains:
     - Image carousel (5 images)
     - Menu highlights (4 options)
     - Inquiry form (name, email, phone, date, guest count, message)
   - [ ] Close panel with X button

**Expected Results:**
- ✅ All customization changes reflected on public site
- ✅ No cache issues (hard refresh works)
- ✅ Colors match exactly (#f97316, #fde047)
- ✅ Catering feature fully functional

---

## Phase 3: Live Order Placement

### Test Order Details:
- **Customer**: Test Customer
- **Email**: test@example.com
- **Phone**: (555) 123-4567
- **Payment**: Stripe test card `4242 4242 4242 4242`
- **Expiry**: Any future date (e.g., 12/25)
- **CVC**: Any 3 digits (e.g., 123)
- **ZIP**: Any 5 digits (e.g., 90210)

### Steps:

1. **Add Items to Cart**
   - [ ] Click "Add to Cart" on 2 tacos (e.g., Carne Asada, Al Pastor)
   - [ ] Scroll to bakery section
   - [ ] Add 1 dessert (e.g., Conchas or Tres Leches)
   - [ ] Verify cart badge shows "3 items"
   - [ ] Click cart launcher to open cart

2. **Review Cart**
   - [ ] Verify all 3 items appear
   - [ ] Check prices calculate correctly
   - [ ] Subtotal is accurate
   - [ ] Click "Checkout"

3. **Select Delivery Method**
   - [ ] Choose "Delivery" option
   - [ ] Enter delivery address:
     ```
     123 Main Street
     Atlixco, Puebla 74200
     ```
   - [ ] Click "Request DoorDash Quote" (if available)
   - [ ] Wait for delivery fee calculation
   - [ ] Verify delivery fee appears in order summary

4. **Enter Customer Information**
   - [ ] Name: `Test Customer`
   - [ ] Email: `test@example.com`
   - [ ] Phone: `(555) 123-4567`
   - [ ] Delivery instructions: `Test order - do not fulfill`

5. **Complete Payment**
   - [ ] Click "Proceed to Payment"
   - [ ] Stripe payment modal opens
   - [ ] Enter test card: `4242 4242 4242 4242`
   - [ ] Expiry: `12/25`
   - [ ] CVC: `123`
   - [ ] ZIP: `90210`
   - [ ] Click "Pay $XX.XX"
   - [ ] Wait for payment processing

6. **Verify Success Screen**
   - [ ] Redirected to `/order/success`
   - [ ] Order confirmation number displayed
   - [ ] Order summary shows all items
   - [ ] Total amount matches payment
   - [ ] Success message: "Order placed successfully!"

**Expected Results:**
- ✅ Cart functionality works
- ✅ Delivery quote calculates (if DoorDash integrated)
- ✅ Stripe payment succeeds with test card
- ✅ Order created in database
- ✅ Success page renders correctly

---

## Phase 4: Fulfillment Dashboard Validation

### Steps:

1. **Navigate to Fulfillment Dashboard**
   - [ ] In admin session, click "Fulfillment Board" link
   - [ ] Or navigate to `/admin/fulfillment`
   - [ ] Dashboard loads with real-time feed

2. **Verify New Order Alarm**
   - [ ] **Visual**: New order banner appears at top
   - [ ] **Audio**: Alert sound plays (chime/bell/ding based on settings)
   - [ ] Order card appears in "New Orders" section
   - [ ] Card shows:
     - Customer name: Test Customer
     - Order total
     - Delivery address
     - Items list (2 tacos, 1 dessert)
     - Timestamp

3. **Check Auto-Print (if configured)**
   - [ ] If Bluetooth printer configured:
     - Printer receives order automatically
     - Receipt prints with order details
     - Receipt includes delivery address
   - [ ] If no printer configured:
     - Manual print option available
     - Skip this check

4. **Acknowledge Order**
   - [ ] Click "Acknowledge" button on order card
   - [ ] Alarm sound stops
   - [ ] Banner dismisses or changes color
   - [ ] `acknowledgedAt` timestamp recorded
   - [ ] Order moves to "In Progress" or acknowledged state

5. **Verify Order Details**
   - [ ] Click order to expand details
   - [ ] Verify all fields:
     - Customer info correct
     - Items match cart
     - Delivery address complete
     - Payment status: "Paid"
     - Payment method: "Stripe"
     - Total matches success screen

**Expected Results:**
- ✅ New order appears within 2 seconds
- ✅ Alarm triggers (audio + visual)
- ✅ Auto-print dispatches (if enabled)
- ✅ Acknowledge functionality works
- ✅ All order data accurate

---

## Rollback Steps (If Issues Found)

If critical issues are discovered during testing:

1. **Revert Customization**
   - Admin Dashboard → Customize → "Reset to Defaults"
   - Publish changes
   - Verify public site returns to defaults

2. **Cancel Test Order**
   - Fulfillment Dashboard → Find test order
   - Mark as "Cancelled" or "Refunded"
   - Delete from database if needed

3. **Check Logs**
   - Admin → Integration Logs
   - Look for errors related to:
     - Payment processing
     - Delivery quotes
     - Printer dispatch
     - Order creation

---

## Success Criteria

### Phase 1 (Customization): ✅ / ❌
- [ ] All 4 changes applied successfully
- [ ] Audit log created
- [ ] No console errors

### Phase 2 (Public Site): ✅ / ❌
- [ ] Hero title updated
- [ ] Colors applied (#f97316, #fde047)
- [ ] Highlight visible
- [ ] Catering panel functional

### Phase 3 (Order Placement): ✅ / ❌
- [ ] Cart works
- [ ] Delivery quote generated
- [ ] Payment succeeded
- [ ] Success screen displayed

### Phase 4 (Fulfillment): ✅ / ❌
- [ ] Alarm triggered
- [ ] Order appears in dashboard
- [ ] Auto-print dispatched (if enabled)
- [ ] Acknowledge works

---

## Notes & Observations

**Console Errors**:
```
(Record any console errors encountered)
```

**Performance Issues**:
```
(Note any slow load times, API delays, etc.)
```

**UI/UX Issues**:
```
(Record any layout problems, mobile issues, etc.)
```

**Data Integrity**:
```
(Verify order data matches across success screen, fulfillment, and database)
```

---

## Final Sign-Off

- [ ] All phases completed successfully
- [ ] No critical bugs found
- [ ] Test order acknowledged and handled
- [ ] System ready for production use

**Tested By**: _______________
**Date**: _______________
**Status**: ✅ PASS / ❌ FAIL
**Notes**: _______________

---

## Next Steps

If all tests pass:
1. ✅ Mark feature as production-ready
2. ✅ Document any minor issues for future sprints
3. ✅ Consider expanding test coverage for edge cases

If any tests fail:
1. ❌ Document failure details above
2. ❌ Create bug tickets with reproduction steps
3. ❌ Retest after fixes are deployed
