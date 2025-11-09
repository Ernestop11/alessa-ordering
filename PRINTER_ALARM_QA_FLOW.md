# Printer & Alarm QA Flow

## Prerequisites
- Dev server running at http://localhost:3001
- Admin access to fulfillment dashboard
- Test order page accessible at http://localhost:3001/test/order
- Bluetooth printer available (Brother QL-810W, Star TSP, or ESC/POS compatible)
- Audio enabled in browser (click anywhere on page to unlock Web Audio API)

## Test Flow Overview

### Phase 1: Printer Configuration ✓
### Phase 2: Test Print Verification ✓
### Phase 3: Alarm System Testing ✓
### Phase 4: Auto-Print Integration ✓
### Phase 5: End-to-End Order Flow ✓

---

## Phase 1: Printer Configuration

### 1.1 Navigate to Admin Fulfillment Dashboard
```
URL: http://localhost:3001/admin/fulfillment
```

### 1.2 Access Printer Settings
**Location**: Look for printer setup section in FulfillmentBoard component
- Click "Printer Setup" or "Configure Printer" button
- Verify PrinterSetup component loads

### 1.3 Bluetooth Printer Setup
**For Brother QL-810W, Star TSP, or compatible printers:**

1. **Select Printer Type**: Choose "Bluetooth Printer" from dropdown
2. **Scan for Devices**: Click "Scan for Printers" button
3. **Grant Permission**: Allow browser Bluetooth access when prompted
4. **Pair Device**:
   - Ensure printer is powered on
   - Ensure printer is in pairing mode
   - Select your printer from the list
5. **Verify Detection**:
   - Printer name should appear (e.g., "Brother QL-810W")
   - Device ID should be displayed
6. **Select Model**: Choose correct model from dropdown
   - Brother QL Series
   - Star TSPL
   - ESC/POS (Generic)
7. **Save Configuration**: Click "Save Configuration"

**Expected Result**: ✅ Success message "Printer configuration saved successfully"

### 1.4 Network Printer Setup (Alternative)
**If Bluetooth is unavailable:**

1. **Select Printer Type**: Choose "Network Printer (IP/Port)"
2. **Enter Printer Name**: e.g., "Kitchen Printer"
3. **Enter IP Address**: e.g., "192.168.1.100"
4. **Enter Port**: Default 9100 (raw printing port)
5. **Select Model**: Choose printer model
6. **Save Configuration**: Click "Save Configuration"

**Finding Printer IP:**
- Print configuration page from printer
- Check router DHCP client list
- Use network scanning tool (Angry IP Scanner)

### 1.5 Verify Configuration Saved
- Check "Current Configuration" section at bottom
- Verify all fields are correct
- Configuration should persist on page reload

**Document Issues:**
```
Printer Model: _______________
Vendor ID: _______________
Connection Status: _______________
Error Messages: _______________
```

---

## Phase 2: Test Print Verification

### 2.1 Trigger Test Print
1. With printer configured, click **"Test Print"** button
2. Wait for confirmation message

**Expected Behavior:**
- ✅ Message: "Test print sent successfully"
- ✅ Printer receives data and begins printing
- ✅ Receipt prints with test order data

### 2.2 Verify Receipt Content
**Receipt should contain:**
- ✅ Test order ID (e.g., "TEST-1234567890")
- ✅ Tenant name (e.g., "La Poblanita")
- ✅ Test items:
  - 2 × Test Item 1 - $20.00
  - 1 × Test Item 2 - $15.00
- ✅ Subtotal: $35.00
- ✅ Tax: $2.89
- ✅ Total: $37.89
- ✅ Customer: Test Customer
- ✅ Phone: (555) 123-4567
- ✅ Notes: "This is a test print"
- ✅ Proper formatting and line breaks
- ✅ No garbled characters

### 2.3 Document Printer Output Quality
```
Print Quality: [ ] Excellent [ ] Good [ ] Fair [ ] Poor
Formatting: [ ] Perfect [ ] Minor issues [ ] Major issues
Readability: [ ] Clear [ ] Readable [ ] Difficult [ ] Illegible
Character Encoding: [ ] Correct [ ] Some errors [ ] Many errors

Issues Noted:
_________________________________________________
_________________________________________________
```

---

## Phase 3: Alarm System Testing

### 3.1 Access Fulfillment Dashboard
```
URL: http://localhost:3001/admin/fulfillment
```

### 3.2 Verify Initial State
- ✅ NewOrderAlerts component is present
- ✅ No alert banner visible (no unacknowledged orders)
- ✅ Alert settings icon visible in top-right

### 3.3 Configure Alert Settings
1. **Open Settings**: Click settings icon (gear/cog)
2. **Test Built-in Sounds**:
   - Select "Chime" → Click "Test Sound" → Verify pleasant two-note chime
   - Select "Bell" → Click "Test Sound" → Verify harmonic bell sound
   - Select "Ding" → Click "Test Sound" → Verify simple ding
3. **Adjust Volume**: Move slider to 70% → Test sound → Verify volume
4. **Test Flashing**: Toggle "Enable Flashing" on/off → Verify toggle works

**Expected Results:**
- ✅ All three sounds play correctly
- ✅ Volume control affects sound level
- ✅ Test button plays sound immediately
- ✅ No errors in console

### 3.4 Custom Sound Upload (Optional)
1. Click "Custom Sound" from dropdown
2. Click "Upload Custom Sound" file input
3. Select an MP3 or audio file
4. Click "Test Sound"

**Expected Result**: ✅ Custom sound plays correctly

**Document Audio Issues:**
```
Browser: _______________
Sound Type Tested: _______________
Playback Status: _______________
Console Errors: _______________
```

---

## Phase 4: Auto-Print Integration

### 4.1 Enable Auto-Print
1. Navigate to admin settings or tenant integration settings
2. Enable "Auto-Print Orders" toggle
3. Verify printer is configured (from Phase 1)

### 4.2 Verify Auto-Print Setting
Check database or settings to confirm:
```sql
SELECT autoPrintOrders, printerConfig
FROM TenantIntegration
WHERE tenantId = '<your-tenant-id>';
```

**Expected**: `autoPrintOrders = true`

---

## Phase 5: End-to-End Order Flow

### 5.1 Pickup Order Test

#### Step 1: Place Order
1. Open new tab: http://localhost:3001/test/order
2. Add items to cart (e.g., 2 Tacos, 1 Burrito)
3. Open cart
4. Select **"Pickup"** as fulfillment method
5. Fill in customer details:
   - Name: "Test Customer Pickup"
   - Email: "pickup@test.com"
   - Phone: "(555) 111-2222"
6. Add note: "Extra salsa please"
7. Click "Continue to Payment"

#### Step 2: Complete Payment
1. Enter Stripe test card: **4242 4242 4242 4242**
2. Expiry: Any future date (e.g., 12/25)
3. CVC: Any 3 digits (e.g., 123)
4. Click "Pay"

**Expected Immediately After Payment:**
- ✅ Order confirmation page
- ✅ Order ID displayed

#### Step 3: Verify Alarm Fires
**Switch to Fulfillment Dashboard tab**

**Expected Behavior (within 1-2 seconds):**
- ✅ **Visual Alert**: Red/orange banner appears at top
- ✅ Banner shows: "1 New Order! Test Customer Pickup ($XX.XX)"
- ✅ **Audio Alert**: Selected sound plays (chime/bell/ding)
- ✅ **Repeating Alert**: Sound plays again after 10 seconds
- ✅ Banner has flashing/pulse animation (if enabled)

#### Step 4: Verify Auto-Print
**Check printer:**
- ✅ **Auto-Print Triggered**: Printer automatically prints receipt
- ✅ **Print Timing**: Receipt prints within 3-5 seconds of order
- ✅ **Single Print**: Only one receipt prints (no duplicates)

**Verify Receipt Content:**
- ✅ Correct order ID (last 6 characters match dashboard)
- ✅ Customer name: "Test Customer Pickup"
- ✅ Phone: "(555) 111-2222"
- ✅ Items match order (2 Tacos, 1 Burrito)
- ✅ Fulfillment: PICKUP
- ✅ Notes: "Extra salsa please"
- ✅ Correct total amount
- ✅ Timestamp matches order creation time

#### Step 5: Test Acknowledge
**In Fulfillment Dashboard:**
1. Wait for second alert sound (after 10 seconds)
2. Click **"Acknowledge All"** button in banner

**Expected Behavior:**
- ✅ Alert banner disappears immediately
- ✅ Sound stops playing
- ✅ No more repeating alerts
- ✅ Order card in dashboard no longer highlighted as "unacknowledged"

#### Step 6: Verify Database
Check order acknowledgment:
```sql
SELECT id, customerName, acknowledgedAt, createdAt
FROM "Order"
ORDER BY createdAt DESC
LIMIT 1;
```

**Expected**: `acknowledgedAt` is NOT NULL (timestamp set)

### 5.2 Delivery Order Test

#### Step 1: Place Delivery Order
1. Open: http://localhost:3001/test/order
2. Add items to cart (e.g., 1 Burrito, 1 Quesadilla)
3. Open cart
4. Select **"Delivery"** as fulfillment method
5. Fill in customer details:
   - Name: "Test Customer Delivery"
   - Email: "delivery@test.com"
   - Phone: "(555) 333-4444"
6. Enter delivery address:
   - Street: "123 Main St"
   - Apartment: "Apt 4B"
   - City: "Los Angeles"
   - State: "CA"
   - Zip: "90001"
7. Get delivery quote (if applicable)
8. Add note: "Ring doorbell twice"
9. Continue to payment

#### Step 2: Complete Payment
- Use Stripe test card: **4242 4242 4242 4242**
- Complete payment

**Expected Immediately:**
- ✅ Order confirmation
- ✅ Order ID displayed

#### Step 3: Verify Alarm & Auto-Print
**Switch to Fulfillment Dashboard**

**Expected (same as pickup):**
- ✅ Red/orange alert banner appears
- ✅ Shows: "1 New Order! Test Customer Delivery ($XX.XX)"
- ✅ Audio alert plays
- ✅ Repeats every 10 seconds
- ✅ **Auto-print triggers** (receipt prints)

**Verify Delivery Receipt Content:**
- ✅ Customer: "Test Customer Delivery"
- ✅ Phone: "(555) 333-4444"
- ✅ Fulfillment: DELIVERY
- ✅ Delivery Address:
  - 123 Main St, Apt 4B
  - Los Angeles, CA 90001
- ✅ Notes: "Ring doorbell twice"
- ✅ Delivery fee included in total
- ✅ Items correct (1 Burrito, 1 Quesadilla)

#### Step 4: Test Individual Acknowledge
1. Find the order card in dashboard
2. Click **acknowledge button** on individual order card (if available)
   OR
3. Click **"Acknowledge All"** in banner

**Expected:**
- ✅ Alert clears
- ✅ Sound stops
- ✅ Order marked as acknowledged in database

### 5.3 Multiple Orders Test

#### Step 1: Create Multiple Unacknowledged Orders
1. Place 3 orders in quick succession (pickup or delivery)
2. Do NOT acknowledge any orders yet

**Expected in Dashboard:**
- ✅ Banner shows: "3 New Orders! [Customer1], [Customer2], [Customer3]"
- ✅ Sound continues to repeat every 10 seconds
- ✅ Each order auto-printed (3 separate receipts)

#### Step 2: Test Acknowledge All
1. Click **"Acknowledge All"** button

**Expected:**
- ✅ All 3 orders acknowledged simultaneously
- ✅ Alert banner disappears
- ✅ Sound stops
- ✅ Database shows acknowledgedAt for all 3 orders

### 5.4 New Order After Acknowledgment Test

#### Step 1: Acknowledge All Existing Orders
- Clear all current alerts

#### Step 2: Place New Order
- Create 1 new pickup order

**Expected:**
- ✅ Alert **resets** and fires again for new order
- ✅ New alert banner appears
- ✅ Sound plays for new order
- ✅ Printer auto-prints new receipt
- ✅ Previous acknowledged orders do NOT trigger alerts

---

## Issue Documentation Template

### Printer Issues
```
Test Date: _______________
Printer Model: _______________
Connection Type: [ ] Bluetooth [ ] Network [ ] USB

Issue Category:
[ ] Connection Failed
[ ] Print Job Failed
[ ] Receipt Formatting
[ ] Character Encoding
[ ] Auto-Print Not Triggering
[ ] Multiple Prints (Duplicate)
[ ] Other: _______________

Error Messages:
_________________________________________________
_________________________________________________

Console Logs:
_________________________________________________
_________________________________________________

Vendor ID (if Bluetooth): _______________
IP Address (if Network): _______________
Browser: _______________
OS: _______________

Steps to Reproduce:
1. _______________
2. _______________
3. _______________

Expected vs Actual:
Expected: _______________
Actual: _______________
```

### Alarm Issues
```
Test Date: _______________
Browser: _______________

Issue Category:
[ ] Sound Not Playing
[ ] Visual Alert Not Showing
[ ] Alert Not Repeating
[ ] Acknowledge Not Working
[ ] Volume Control Not Working
[ ] Custom Sound Upload Failed
[ ] Other: _______________

Error Messages:
_________________________________________________

Console Errors:
_________________________________________________

Audio Permissions: [ ] Granted [ ] Denied [ ] Not Prompted

Web Audio API Support: [ ] Yes [ ] No [ ] Unknown

Steps to Reproduce:
1. _______________
2. _______________
3. _______________
```

---

## Success Criteria Checklist

### Printer System ✓
- [ ] Bluetooth printer detected and paired
- [ ] OR Network printer configured with IP/Port
- [ ] Test print successful with correct formatting
- [ ] Auto-print triggers on new order
- [ ] Receipt contains all required information
- [ ] No duplicate prints
- [ ] Print quality acceptable
- [ ] Character encoding correct (no garbled text)

### Alarm System ✓
- [ ] Alert banner appears for unacknowledged orders
- [ ] Audio alert plays (chime/bell/ding)
- [ ] Custom sound upload works
- [ ] Volume control affects playback
- [ ] Alert repeats every 10 seconds
- [ ] Flashing animation works (when enabled)
- [ ] Acknowledge single order works
- [ ] Acknowledge all orders works
- [ ] Alerts stop after acknowledgment
- [ ] Alerts reset for new orders after acknowledgment
- [ ] No console errors

### Integration ✓
- [ ] Pickup order flow complete (alarm + auto-print)
- [ ] Delivery order flow complete (alarm + auto-print)
- [ ] Multiple orders handled correctly
- [ ] Database acknowledgedAt field set correctly
- [ ] WebSocket updates orders in real-time
- [ ] No race conditions or timing issues
- [ ] Performance acceptable with multiple orders

---

## Known Limitations

1. **Bluetooth Printing**:
   - Web Bluetooth API only supported in Chrome, Edge, Opera
   - Safari and Firefox do not support Web Bluetooth
   - Requires HTTPS in production (localhost OK for development)

2. **Audio Playback**:
   - Requires user interaction before audio can play (browser restriction)
   - User must click anywhere on page to unlock Web Audio API
   - Mute toggle expires after 1 hour

3. **Network Printing**:
   - Requires printer to be on same network
   - Firewall may block port 9100
   - Server-side endpoint needed for actual network printing

---

## Troubleshooting Guide

### Printer Not Detected
1. Verify printer is powered on
2. Check Bluetooth is enabled on computer
3. Ensure printer is in pairing mode
4. Try "Forget Device" and re-pair
5. Check browser Bluetooth permissions
6. Try different browser (Chrome/Edge recommended)

### Auto-Print Not Working
1. Verify autoPrintOrders enabled in settings
2. Check printerConfig exists in database
3. Check integration logs for errors
4. Verify printer is connected
5. Test manual test print to isolate issue

### Sound Not Playing
1. Click anywhere on page to unlock audio
2. Check browser audio permissions
3. Verify volume not at 0%
4. Check system volume not muted
5. Try different browser
6. Check console for Web Audio API errors

### Alert Not Repeating
1. Verify unacknowledged orders exist
2. Check acknowledgedAt is NULL in database
3. Check console for JavaScript errors
4. Verify interval is being set (debug logs)

---

## Next Steps After QA

1. **Document all issues** found during testing
2. **Create tickets** for any bugs discovered
3. **Update documentation** with any printer-specific notes
4. **Add printer models** to compatibility list
5. **Consider production deployment** if all tests pass

## Support Resources

- **Printer Setup Documentation**: [PRINTER_SETUP_IMPLEMENTATION.md](./PRINTER_SETUP_IMPLEMENTATION.md)
- **Alerts Documentation**: [FULFILLMENT_ALERTS_IMPLEMENTATION.md](./FULFILLMENT_ALERTS_IMPLEMENTATION.md)
- **E2E Testing Guide**: [docs/E2E_ORDER_FLOW_TESTS.md](./docs/E2E_ORDER_FLOW_TESTS.md)
