# FINAL MVP CHECKLIST - ALESSA ORDERING
**Presentation-Ready Verification**
**Date:** November 18, 2025
**Target:** Demo Day Readiness

---

## 🎯 OVERVIEW

This checklist ensures **100% presentation readiness** across all system components. Complete each section in order, marking items as you verify them.

**Estimated Time:** 2-3 hours
**Prerequisites:** Development server running, database seeded, assets uploaded

---

## ✅ SECTION 1: FRONTEND - CUSTOMER EXPERIENCE (30 min)

### 1.1 Hero Banner & Branding

- [ ] **Navigate to customer site:** `http://localhost:3001?tenant=lasreinas`
- [ ] **Hero banner displays**
  - Height: 85vh (fills viewport)
  - Gradient overlay: Red (#DC2626) fading to transparent
  - Text: "Welcome to Las Reinas Colusa" visible and centered
  - "Explore Menu" button present and styled

- [ ] **Hero carousel works**
  - Wait 5 seconds
  - Image transitions smoothly to next hero
  - 4 total images cycle: quesabirria-action, tacos-spread, restaurant-interior, family-dining
  - No broken images (check browser console for 404s)

- [ ] **Logo displays correctly**
  - Check top-left corner: Las Reinas logo visible
  - Logo is clickable (returns to top of page)
  - Logo loads quickly (< 500ms)

- [ ] **Theme colors correct**
  - Primary: Red (#DC2626)
  - Secondary: Gold/Amber (#F59E0B)
  - Text: High contrast against backgrounds
  - Buttons: Red with white text

### 1.2 Menu Catalog

- [ ] **Menu statistics display**
  - Below hero: "69 items across 10 sections" (or similar)
  - Icons present for stats

- [ ] **"Customize your view" section exists**
  - Located below hero, above menu
  - 3 buttons visible: Grid, List, Showcase

- [ ] **Layout toggles work**
  - Click "Grid": Items display in 2-3 column grid ✅
  - Click "List": Items display horizontally with image on left ✅
  - Click "Showcase": Items display with large images, card layout ✅
  - Selected button highlighted (darker background)

- [ ] **Menu sections render**
  - Sections appear in order: Desayunos, Quesabirrias, Tacos, Burritos, Tortas, Quesadillas, Sides, Drinks, Desserts, Specials
  - Each section has header with name
  - Section headers are sticky or clearly visible

- [ ] **Menu items display correctly**
  - Each item shows:
    - ✅ Name (e.g., "Quesabirrias")
    - ✅ Description (if exists)
    - ✅ Price (formatted: $13.99)
    - ✅ Image (if uploaded)
    - ✅ "Add to Cart" button (red, prominent)

- [ ] **Item images load**
  - Uploaded images appear (no broken image icons)
  - Images are optimized (load quickly)
  - Placeholder for items without images (optional)

- [ ] **Prices formatted correctly**
  - Show: $13.99 (NOT 13.99 or $13.990000)
  - Two decimal places always
  - Dollar sign present

### 1.3 Add to Cart Flow

- [ ] **Click "Add to Cart" on Quesabirrias**
  - Modal opens immediately
  - Modal is centered on screen
  - Background dims (overlay visible)

- [ ] **Customization modal displays**
  - Item name: "Quesabirrias"
  - Description: Full text visible
  - Base price: $13.99
  - Image (if exists)

- [ ] **Removals section works**
  - Checkboxes for removals (e.g., "No Onions", "No Cilantro")
  - Uncheck "Onions"
  - Checkbox unchecks (visual feedback)
  - Price remains same (removals are free)

- [ ] **Add-ons section works**
  - Checkboxes for add-ons (e.g., "Add Guacamole $2.00")
  - Check "Add Guacamole"
  - Checkbox checks (visual feedback)
  - **Price updates in real-time:** $13.99 → $15.99 ✅

- [ ] **Quantity selector works**
  - Default quantity: 1
  - Click "+" button: Quantity increases to 2
  - Price doubles: $15.99 → $31.98 ✅
  - Click "-" button: Quantity decreases to 1
  - Price returns to: $15.99 ✅
  - Cannot decrease below 1 (button disabled)

- [ ] **Special instructions field**
  - Text area visible
  - Type: "Please add extra napkins"
  - Text appears in field
  - Character limit: 200 (or reasonable limit)

- [ ] **"Add to Cart" button**
  - Button displays updated price: "Add to Cart · $15.99"
  - Click button
  - Modal closes smoothly
  - Success notification appears (toast or banner)

### 1.4 Shopping Cart

- [ ] **Cart icon shows item count**
  - After adding item, badge shows: (1)
  - Badge is red/prominent
  - Count updates correctly

- [ ] **Click cart icon**
  - Cart drawer slides in from right
  - Smooth animation
  - Background dims (overlay)

- [ ] **Cart displays items correctly**
  - Item name: "Quesabirrias"
  - Quantity: 1
  - Customizations listed:
    - "No: Onions"
    - "Add: Guacamole (+$2.00)"
  - Price: $15.99

- [ ] **Quantity can be updated in cart**
  - Click "+" button: Quantity increases to 2
  - Subtotal updates: $31.98 ✅
  - Click "-" button: Quantity decreases to 1
  - Subtotal updates: $15.99 ✅

- [ ] **Items can be removed from cart**
  - Click "Remove" or trash icon
  - Confirmation prompt (optional)
  - Item disappears from cart
  - Subtotal updates to $0.00
  - Cart shows empty state: "Your cart is empty"

- [ ] **Add multiple items**
  - Close cart drawer
  - Add "Horchata (Large)" to cart
  - Reopen cart drawer
  - Both items visible
  - Subtotal sums correctly

- [ ] **Subtotal calculation**
  - Quesabirrias: $15.99
  - Horchata: $3.50
  - **Subtotal: $19.49** ✅

- [ ] **"Proceed to Checkout" button**
  - Button visible at bottom of cart
  - Button is prominent (red/gold)
  - Click button → Redirects to checkout page

### 1.5 Accessibility Panel

- [ ] **Accessibility button exists**
  - Desktop: Left side of screen (floating button)
  - Mobile: Right side of screen
  - Icon: ♿ or universal access icon
  - Button is always visible (sticky)

- [ ] **Click accessibility button**
  - Panel slides in from left
  - 3 toggles visible:
    - High Contrast
    - Large Text
    - Reduced Motion

- [ ] **High contrast toggle**
  - Toggle ON
  - Colors change (higher contrast)
  - Text becomes more readable
  - Toggle OFF
  - Colors revert to normal

- [ ] **Large text toggle**
  - Toggle ON
  - Font sizes increase (1.2x or similar)
  - Layout adjusts gracefully
  - Toggle OFF
  - Font sizes return to normal

- [ ] **Reduced motion toggle**
  - Toggle ON
  - Hero carousel slows/stops
  - Smooth scrolling disabled
  - Animations reduced
  - Toggle OFF
  - Animations resume

- [ ] **Preferences persist**
  - Enable all 3 toggles
  - Close panel
  - Refresh page (Cmd+R / F5)
  - Reopen panel
  - All 3 toggles still enabled ✅

### 1.6 Catering Panel

- [ ] **Catering button exists**
  - Desktop: Left side (below accessibility)
  - Mobile: Right side
  - Icon: 🎉 or party/catering icon
  - Button is always visible (sticky)

- [ ] **Click catering button**
  - Panel slides in from left
  - Header: "Catering Services"
  - Gallery: 4-6 catering setup photos

- [ ] **Catering options display**
  - 8 options visible:
    1. Taco Bar
    2. Family Platters
    3. Breakfast Catering
    4. Quesabirria Feast
    5. Burrito Station
    6. Dessert Platter
    7. Aguas Frescas Bar
    8. Full Event Catering

- [ ] **Each option shows**
  - Name
  - Price (e.g., $150)
  - Serving info (e.g., "Serves 15-20 people")
  - Category badge (Regular or Holiday)
  - "Add to Cart" button

- [ ] **Click "Taco Bar" option**
  - Modal opens with customization form
  - Shows: name, description, price, serving info
  - Removals section (if applicable)
  - Add-ons section (e.g., "Extra Tortillas $10")

- [ ] **Add catering option to cart**
  - Customize as needed
  - Click "Add to Cart"
  - Modal closes
  - Cart count updates
  - Catering item appears in cart

- [ ] **Close catering panel**
  - Click X or click outside panel
  - Panel slides out smoothly

### 1.7 Mobile Responsiveness

- [ ] **Open dev tools (F12)**
- [ ] **Toggle device toolbar (Cmd+Shift+M or Ctrl+Shift+M)**

- [ ] **Test iPhone SE (375px width)**
  - Hero: 85vh, gradient visible
  - Menu: Single column layout
  - Buttons: Large enough to tap (44px min)
  - Cart icon: Visible in top-right
  - Accessibility/Catering buttons: Right side, stacked
  - Text: Readable without zooming
  - Images: Load properly, not stretched

- [ ] **Test iPad (768px width)**
  - Hero: Full width, gradient visible
  - Menu: 2-column grid
  - Layout: Tablet-optimized spacing
  - Navigation: Touch-friendly

- [ ] **Test Desktop (1920px width)**
  - Hero: Full width, centered content
  - Menu: 3-column grid
  - Floating buttons: Left side
  - Max width: ~1280px (centered)

- [ ] **Rotate device (portrait/landscape)**
  - Layout adapts gracefully
  - No horizontal scrolling
  - All content accessible

### 1.8 Performance & Loading

- [ ] **Page load time**
  - Open Network tab in dev tools
  - Hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)
  - Check "Load" time at bottom
  - **Should be: < 2 seconds** ✅

- [ ] **Images load quickly**
  - Hero images appear immediately
  - Menu item images load progressively
  - No broken images (check console)

- [ ] **No console errors**
  - Open Console tab (F12)
  - Check for red errors
  - Warnings OK, but no critical errors
  - No 404s for assets

- [ ] **Smooth scrolling**
  - Scroll through menu
  - No jank or stuttering
  - 60 FPS (smooth)

---

## ✅ SECTION 2: ADMIN DASHBOARD (45 min)

### 2.1 Login & Authentication

- [ ] **Navigate to:** `http://localhost:3001/admin/login`

- [ ] **Login page displays**
  - Title: "Admin Login" or similar
  - Email field
  - Password field
  - "Sign In" button
  - No console errors

- [ ] **Enter credentials**
  - Email: `admin@lasreinas.com`
  - Password: `demo123`
  - Click "Sign In"

- [ ] **Successful login**
  - Redirects to: `/admin`
  - Dashboard loads
  - No error messages
  - Session cookie set (check dev tools → Application → Cookies)

- [ ] **Dashboard header displays**
  - Logo/Name: "Restaurant Dashboard" (or Las Reinas logo if Fix #1 applied)
  - Tab navigation visible
  - Logout button present

### 2.2 Onboarding Checklist

- [ ] **Checklist visible at top**
  - 4 items displayed:
    1. Publish Menu
    2. Connect Stripe
    3. Configure Delivery
    4. Set Up Printer

- [ ] **"Publish Menu" status**
  - Shows green checkmark ✅
  - Text: "69 items" or "Complete"

- [ ] **Other items show status**
  - Stripe: Green ✅ (if connected) or Red ❌ / Yellow ⚠️
  - Delivery: Status indicator
  - Printer: Status indicator

- [ ] **Progress bar (if exists)**
  - Shows: "2 of 4 complete" or similar
  - Visual progress indicator (e.g., 50%)

### 2.3 Tab Navigation

- [ ] **8 tabs visible**
  1. Orders
  2. Menu Manager
  3. Customers
  4. Sections
  5. Menu Items
  6. Catering
  7. Customize
  8. Settings

- [ ] **"Fulfillment Board" button**
  - Visible in navigation
  - Styled as pill/badge (blue background)
  - Links to: `/admin/fulfillment`

- [ ] **Active tab highlighted**
  - Current tab: Blue underline or background
  - Other tabs: Gray text

- [ ] **Click each tab - verify loads**
  - Orders: ✅ Order list appears
  - Menu Manager: ✅ Item table loads
  - Customers: ✅ Customer list loads
  - Sections: ✅ Section list loads
  - Menu Items: ✅ Item list loads
  - Catering: ✅ Catering options load
  - Customize: ✅ Customization page (or "Coming soon")
  - Settings: ✅ Settings form loads

- [ ] **No errors on tab switching**
  - Check console for errors
  - All tabs load data correctly

### 2.4 Orders Tab

- [ ] **Order list displays**
  - If orders exist: Shows order cards
  - If no orders: "No orders yet" empty state

- [ ] **Create test order** (if none exist)
  - Open customer site in new tab
  - Add item to cart
  - Complete checkout
  - Return to admin Orders tab
  - Refresh (or wait for real-time update)

- [ ] **Order card shows**
  - Order number: #1047 (or similar)
  - Customer: Name, phone
  - Status badge: NEW / PREPARING / READY / COMPLETED
  - Total: $19.60
  - Timestamp: "5 minutes ago"
  - Items count: "2 items"

- [ ] **Click order to expand**
  - Full details appear:
    - Customer info (name, phone, email)
    - Delivery address (if delivery order)
    - Items list with customizations
    - Payment method: "Card ending in 4242"
    - Special instructions: "Please add extra napkins"

- [ ] **Change order status**
  - Click "Mark as Preparing"
  - Status badge changes: NEW → PREPARING ✅
  - Badge color updates
  - Click "Mark as Ready"
  - Status badge changes: PREPARING → READY ✅
  - Click "Mark as Completed"
  - Status badge changes: READY → COMPLETED ✅

- [ ] **Action buttons work**
  - Print button (if exists)
  - Refund button (if exists)
  - Cancel button (if exists)

### 2.5 Menu Manager Tab

- [ ] **Click "Menu Manager" tab**

- [ ] **Summary cards display**
  - **Total Items:** 69
  - **Frontend Visible:** 62 (or similar)
  - **Orphaned Items:** 7 (or similar)
  - Cards styled with icons and colors

- [ ] **Filter tabs exist**
  - All
  - Live
  - Orphaned
  - Hidden

- [ ] **Click "All" filter**
  - Shows all 69 items in table
  - Table has columns: Name, Section, Status, Visibility, Actions

- [ ] **Click "Orphaned" filter**
  - Shows only orphaned items (no section assigned)
  - Count matches summary card (e.g., 7 items)

- [ ] **Click "Live" filter**
  - Shows only items visible on frontend
  - Count matches summary card (e.g., 62 items)

- [ ] **Click "Hidden" filter**
  - Shows only unavailable items
  - Badge shows "Hidden"

- [ ] **Search bar works**
  - Type: "Quesabirria"
  - List filters instantly to matching items
  - Shows: "Quesabirrias (3 count)", "Quesabirria Plate", etc.
  - Clear search: List returns to all items

- [ ] **Assign section to orphaned item**
  - Click "Orphaned" filter
  - Find first orphaned item (e.g., "Churros")
  - Click "Assign Section" dropdown
  - Select "Desserts"
  - Item moves from Orphaned to Live ✅
  - Orphaned count decreases by 1 ✅
  - Frontend Visible count increases by 1 ✅

- [ ] **Toggle visibility**
  - Find any item with green "Visible" badge
  - Click eye icon or toggle switch
  - Badge changes to gray "Hidden" ✅
  - Click again
  - Badge returns to green "Visible" ✅

- [ ] **Edit item**
  - Click pencil/edit icon on "Quesabirrias"
  - Modal opens
  - Fields display: name, price, description, section, removals, add-ons
  - Update description: Add "with consommé for dipping"
  - Click "Save Changes"
  - Modal closes
  - Success notification appears
  - Change persists (verify on customer site)

- [ ] **Upload item photo**
  - Click edit icon on item
  - Scroll to Image Upload section
  - Click "Upload Image" button
  - Select file: `quesabirria-professional.jpg`
  - Upload progress bar appears
  - Image preview renders
  - Click "Save Changes"
  - Thumbnail appears in table
  - Verify on customer site: Image displays

### 2.6 Settings Tab

- [ ] **Click "Settings" tab**

- [ ] **Settings page loads**
  - Multiple sections visible
  - No loading errors

#### Restaurant Information

- [ ] **Fields display**
  - Name: "Las Reinas Colusa"
  - Phone: (530) XXX-XXXX
  - Email: info@lasreinascolusa.com
  - Address: 1234 Main St, Colusa, CA 95932

- [ ] **Edit restaurant name**
  - Change to: "Las Reinas Colusa - Authentic Mexican Food"
  - Scroll to bottom
  - Click "Save Settings"
  - Success notification appears
  - Refresh page
  - Change persists ✅

#### Operating Hours

- [ ] **7-day grid displays**
  - Monday - Sunday rows
  - Each row: Closed checkbox, Open time, Close time

- [ ] **Set hours**
  - Monday-Thursday: 10:00 AM - 9:00 PM
  - Friday-Saturday: 10:00 AM - 10:00 PM
  - Sunday: Check "Closed"

- [ ] **Winter Mode toggle**
  - Check "Enable Winter Mode"
  - Additional fields appear:
    - Start Date: December 1, 2025
    - End Date: March 1, 2026
    - Winter hours grid (7 days)
  - Set winter hours: 11:00 AM - 8:00 PM (all days)

- [ ] **Holiday closures**
  - Click "Add Holiday" button
  - New row appears
  - Enter:
    - Date: 12/25/2025
    - Name: "Christmas Day"
  - Click "Add" or auto-saves
  - Holiday appears in list
  - Add second holiday:
    - Date: 01/01/2026
    - Name: "New Year's Day"

- [ ] **Save settings**
  - Scroll to bottom
  - Click "Save Settings"
  - Success notification appears

#### Payments (Stripe Connect)

- [ ] **If Stripe NOT connected:**
  - Blue card visible: "Connect Your Stripe Account"
  - Benefits listed:
    - Secure payment processing
    - Automatic daily payouts
    - PCI-compliant
    - 2.9% + $0.30 per transaction
  - Button: "Connect with Stripe"

- [ ] **Click "Connect with Stripe"**
  - Button shows loading spinner
  - Text changes to "Redirecting to Stripe..."
  - (In production: Redirects to Stripe OAuth)
  - **For demo:** Manually navigate to `/admin/stripe-connect/complete`

- [ ] **Stripe success page**
  - Navigate to: `http://localhost:3001/admin/stripe-connect/complete`
  - Green checkmark icon displays
  - Title: "Success!"
  - Message: "Your Stripe account is connected..."
  - Auto-redirect countdown: "Redirecting in 2 seconds..."
  - Wait for redirect

- [ ] **After connection (back on Settings)**
  - Payments section now shows green card:
    - "Stripe Connected ✓"
    - Account ID: `acct_XXXXXXXX`
    - Business name: "Las Reinas Colusa"
    - Status indicators:
      - ✓ Payments enabled
      - ✓ Payouts enabled
  - Button: "Disconnect" (gray)
  - Link: "View in Stripe Dashboard"

- [ ] **Onboarding checklist updates**
  - Scroll to top
  - "Connect Stripe" shows green checkmark ✅
  - Progress: "2 of 4 complete" (or similar)

#### Accessibility Defaults

- [ ] **Section exists**
  - Title: "Accessibility Defaults"
  - Description: "Choose which aids are enabled by default..."

- [ ] **3 checkboxes display**
  - [ ] High contrast mode
  - [ ] Large text
  - [ ] Reduced motion

- [ ] **Check "Large text"**
  - Checkbox checks ✅

- [ ] **Check "High contrast"**
  - Checkbox checks ✅

- [ ] **Save settings**
  - Click "Save Settings"
  - Success notification

- [ ] **Test on customer site**
  - Open: `http://localhost:3001?tenant=lasreinas` in new tab
  - Text should be larger by default
  - Contrast should be higher
  - Customers can still override via accessibility panel

#### Notification Preferences (if Fix #2 applied)

- [ ] **Section exists**
  - Title: "Notification Preferences"

- [ ] **Email toggle**
  - [ ] Email me when new orders arrive
  - Check the checkbox
  - Should enable ✅

- [ ] **SMS toggle**
  - [ ] Send SMS for urgent orders
  - Should be disabled
  - Shows "Coming Soon" badge

- [ ] **Webhook URL**
  - Field visible
  - Enter: `https://webhook.site/unique-id`
  - Should accept text

- [ ] **Save settings**
  - Click "Save Settings"
  - Success notification

### 2.7 Catering Tab

- [ ] **Click "Catering" tab**

- [ ] **Catering options list displays**
  - 8 options visible (or similar)

- [ ] **Each option shows**
  - Name (e.g., "Taco Bar")
  - Price ($150)
  - Serving info ("Serves 15-20 people")
  - Category (Regular or Holiday)
  - Edit button
  - Delete button

- [ ] **Add new catering option**
  - Click "Add Catering Option" button
  - Modal opens
  - Fill form:
    - Name: "Enchilada Platter"
    - Description: "Cheese and chicken enchiladas with rice and beans"
    - Price: 120
    - Serving Info: "Serves 10-15 people"
    - Category: Regular
  - Add removal: "Sour Cream"
  - Add add-on: "Extra Guacamole", $15
  - Click "Save"
  - New option appears in list ✅

- [ ] **Edit catering option**
  - Click edit icon on existing option
  - Modal opens with pre-filled data
  - Change price: 120 → 125
  - Click "Save"
  - Price updates in list ✅

- [ ] **Delete catering option**
  - Click delete icon on test option ("Enchilada Platter")
  - Confirmation modal appears
  - Click "Confirm"
  - Option disappears from list ✅

- [ ] **Verify on customer site**
  - Open customer site
  - Click Catering button
  - Deleted option should be gone
  - Edited option should show updated price

### 2.8 Fulfillment Board

- [ ] **Click "Fulfillment Board" button** (in nav)
  - Redirects to: `/admin/fulfillment`

- [ ] **Fulfillment board displays**
  - 4 columns:
    1. NEW
    2. PREPARING
    3. READY
    4. COMPLETED

- [ ] **Orders appear in correct columns**
  - NEW column: Orders with status "pending" or "confirmed"
  - PREPARING column: Orders with status "preparing"
  - READY column: Orders with status "ready"
  - COMPLETED column: Orders with status "completed"

- [ ] **Order cards show**
  - Order number
  - Customer name
  - Items count
  - Total
  - Timestamp

- [ ] **Accept order (NEW → PREPARING)**
  - Find order in NEW column
  - Click "Accept" or drag to PREPARING
  - Order moves to PREPARING column ✅
  - (Optional: Kitchen printer auto-prints)

- [ ] **Mark ready (PREPARING → READY)**
  - Find order in PREPARING column
  - Click "Mark Ready" or drag to READY
  - Order moves to READY column ✅

- [ ] **Mark completed (READY → COMPLETED)**
  - Find order in READY column
  - Click "Complete" or drag to COMPLETED
  - Order moves to COMPLETED column ✅

- [ ] **Print button works (if implemented)**
  - Click "Print" on any order
  - Print dialog opens or ticket sent to printer

---

## ✅ SECTION 3: FULFILLMENT & PRINTING (20 min)

### 3.1 Fulfillment Notifications

- [ ] **Place new test order**
  - Open customer site
  - Add item to cart
  - Complete checkout

- [ ] **Admin receives notification**
  - Browser notification appears (if enabled)
  - Sound plays (if enabled)
  - Order appears in NEW column immediately
  - Real-time SSE update (no refresh needed)

### 3.2 Printer Configuration

- [ ] **Navigate to:** Settings → Printer Setup (or dedicated Printer tab)

- [ ] **Printer settings display**
  - Printer type dropdown: Bluetooth / Network / Clover
  - Printer name/IP field
  - Auto-print checkbox
  - Test print button

- [ ] **Select printer type**
  - Choose: "Bluetooth" (or "Network" if available)

- [ ] **Enter printer details**
  - Name: "Kitchen Printer"
  - IP/Address: (if network) or MAC (if Bluetooth)

- [ ] **Enable auto-print**
  - Check "Auto-print on new orders"
  - Save settings

- [ ] **Test print**
  - Click "Test Print" button
  - (If hardware connected): Printer prints test ticket
  - (If stub): Success message appears "Test print sent"

### 3.3 Auto-Print Workflow

- [ ] **Ensure auto-print enabled** (from above)

- [ ] **Place new order**
  - Open customer site
  - Add item, checkout

- [ ] **Verify auto-print triggers**
  - (If hardware): Printer automatically prints order ticket
  - (If stub): Check server logs for print event
  - Order ticket shows:
    - Order number
    - Customer name
    - Items with customizations
    - Total
    - Timestamp

---

## ✅ SECTION 4: PAYMENTS & STRIPE (15 min)

### 4.1 Stripe Connect Status

- [ ] **Navigate to:** Settings → Payments

- [ ] **If connected:**
  - Green card displays
  - Account ID visible
  - Business name correct
  - Payments enabled ✅
  - Payouts enabled ✅

- [ ] **If NOT connected:**
  - Complete connection flow (see Section 2.6)

### 4.2 Test Payment Processing

- [ ] **Open customer site**
  - Add item to cart
  - Proceed to checkout

- [ ] **Checkout page loads**
  - Order summary displays
  - Stripe payment element loads
  - "Pay Now" button visible

- [ ] **Enter test card**
  - Card number: `4242 4242 4242 4242`
  - Expiry: `12/34`
  - CVC: `123`
  - ZIP: `12345`

- [ ] **Submit payment**
  - Click "Pay Now"
  - Loading spinner appears
  - Redirects to order confirmation page

- [ ] **Verify order created**
  - Confirmation page shows order number
  - Navigate to admin Orders tab
  - Order appears with status "paid" or "confirmed"
  - Payment method: "Card ending in 4242"

### 4.3 Stripe Webhook Handling

- [ ] **Check webhook endpoint**
  - Navigate to: `http://localhost:3001/api/webhooks/stripe`
  - (Or check Stripe Dashboard → Webhooks)

- [ ] **Verify webhook events** (in Stripe Dashboard)
  - Events logged: `payment_intent.succeeded`
  - Webhook response: 200 OK

- [ ] **Test failed payment**
  - Use test card: `4000 0000 0000 0002` (declined)
  - Attempt payment
  - Error message displays
  - Order NOT created in admin

---

## ✅ SECTION 5: NOTIFICATIONS (15 min)

### 5.1 Email Notifications (Resend/SendGrid)

- [ ] **Check notification settings**
  - Admin → Settings → Notification Preferences
  - "Email on new order" should be enabled

- [ ] **Place test order**
  - Complete order on customer site

- [ ] **Verify email sent** (if production credentials configured)
  - Check inbox: admin@lasreinas.com
  - Email received: "New Order #1047"
  - Email contains:
    - Order number
    - Customer name
    - Items list
    - Total
    - Link to admin dashboard

- [ ] **If stub mode:**
  - Check server logs
  - Should see: "Email notification sent (stub): New Order #1047"

### 5.2 SMS Notifications (Twilio)

- [ ] **Check notification settings**
  - Admin → Settings → Notification Preferences
  - "SMS for urgent orders" should show "Coming Soon" (disabled)

- [ ] **If implemented:**
  - Enable SMS toggle
  - Place urgent order
  - Verify SMS received at admin phone

- [ ] **If stub mode:**
  - Server logs: "SMS notification sent (stub)"

### 5.3 Webhook Notifications

- [ ] **Check webhook URL configured**
  - Admin → Settings → Notification Preferences
  - Webhook URL: `https://webhook.site/unique-id` (or similar)

- [ ] **Place test order**
  - Complete order on customer site

- [ ] **Verify webhook POST sent**
  - Open webhook.site URL
  - Latest request visible
  - Payload contains:
    ```json
    {
      "event": "order.created",
      "order": {
        "id": "...",
        "total": 19.60,
        "customer": "John Doe"
      }
    }
    ```

---

## ✅ SECTION 6: TABLETS & MOBILE DEVICES (10 min)

### 6.1 Tablet Display (Fulfillment Station)

- [ ] **Open fulfillment board on iPad/tablet**
  - Navigate to: `/admin/fulfillment`

- [ ] **Landscape orientation**
  - 4 columns fit on screen
  - No horizontal scrolling
  - Cards are touch-friendly (large tap targets)

- [ ] **Portrait orientation**
  - Columns stack or scroll horizontally
  - Still usable

- [ ] **Touch interactions**
  - Tap order card to expand
  - Drag order between columns (if implemented)
  - Buttons are tappable

- [ ] **Auto-refresh works**
  - Leave tablet open
  - Place new order from another device
  - Tablet receives update without refresh

### 6.2 Mobile Admin (Phone)

- [ ] **Open admin dashboard on phone**
  - Navigate to: `/admin`

- [ ] **Login works**
  - Login form is mobile-friendly
  - Keyboard appears when tapping fields
  - Login successful

- [ ] **Tab navigation (mobile)**
  - Tabs become dropdown (if Fix #7 applied)
  - Or tabs scroll horizontally
  - All tabs accessible

- [ ] **Orders tab (mobile)**
  - Order cards stack vertically
  - Tappable to expand
  - Action buttons are large enough to tap

- [ ] **Settings tab (mobile)**
  - Form fields are full-width
  - Input fields keyboard-accessible
  - Save button visible

### 6.3 Customer Site on Tablet

- [ ] **Open customer site on tablet**
  - Navigate to: `?tenant=lasreinas`

- [ ] **Hero displays correctly**
  - Full width, 85vh
  - Text readable
  - CTA button tappable

- [ ] **Menu layout**
  - 2-column grid (768px width)
  - Images load properly
  - Add to cart buttons are large

- [ ] **Cart drawer**
  - Opens smoothly
  - Touch-friendly buttons
  - Easy to review/edit items

---

## ✅ SECTION 7: PERFORMANCE & BROWSER COMPATIBILITY (15 min)

### 7.1 Performance Metrics

- [ ] **Lighthouse audit (Desktop)**
  - Open dev tools → Lighthouse tab
  - Select: Performance, Accessibility, Best Practices, SEO
  - Click "Generate report"
  - Wait for results
  - **Scores:**
    - Performance: > 85
    - Accessibility: > 90
    - Best Practices: > 85
    - SEO: > 80

- [ ] **Lighthouse audit (Mobile)**
  - Switch to mobile mode
  - Run Lighthouse again
  - **Scores:**
    - Performance: > 75
    - Accessibility: > 90

- [ ] **Network performance**
  - Open Network tab
  - Hard refresh
  - Check metrics:
    - DOMContentLoaded: < 1s
    - Load: < 2s
    - Total requests: < 50
    - Total size: < 2 MB

### 7.2 Browser Compatibility

#### Chrome

- [ ] **Open in Chrome**
- [ ] Admin login works ✅
- [ ] Customer site loads ✅
- [ ] Cart works ✅
- [ ] Checkout works ✅
- [ ] No console errors ✅

#### Firefox

- [ ] **Open in Firefox**
- [ ] Admin login works ✅
- [ ] Customer site loads ✅
- [ ] Cart works ✅
- [ ] Checkout works ✅
- [ ] No console errors ✅

#### Safari (Mac only)

- [ ] **Open in Safari**
- [ ] Admin login works ✅
- [ ] Customer site loads ✅
- [ ] Cart works ✅
- [ ] Checkout works ✅
- [ ] No console errors ✅

#### Edge (Windows/Mac)

- [ ] **Open in Edge**
- [ ] Admin login works ✅
- [ ] Customer site loads ✅
- [ ] Cart works ✅
- [ ] Checkout works ✅
- [ ] No console errors ✅

---

## ✅ SECTION 8: FINAL PRE-DEMO CHECKS (10 min)

### 8.1 Data Consistency

- [ ] **Verify menu items count**
  - Admin: Menu Manager shows 69 items
  - Customer site: Count matches (62 visible + 7 orphaned)

- [ ] **Verify all images load**
  - Customer site: No broken images
  - Admin: All thumbnails display

- [ ] **Verify prices match**
  - Admin: Quesabirrias = $13.99
  - Customer site: Quesabirrias = $13.99
  - Cart: Price calculates correctly with add-ons

### 8.2 Critical Paths

#### Path 1: Customer Order Flow

- [ ] Browse → Add to Cart → Checkout → Payment → Confirmation ✅
- [ ] Order appears in admin Orders tab ✅
- [ ] Order appears in Fulfillment Board ✅

#### Path 2: Admin Menu Update

- [ ] Edit menu item → Save → Customer site updates ✅
- [ ] Upload image → Save → Image displays on customer site ✅

#### Path 3: Stripe Connect

- [ ] Click Connect → OAuth (simulated) → Success → Settings shows connected ✅

#### Path 4: Accessibility

- [ ] Customer toggles accessibility → Preferences persist → Admin defaults work ✅

#### Path 5: Catering

- [ ] Admin adds catering option → Customer sees option → Can add to cart ✅

### 8.3 Clean Slate for Demo

- [ ] **Clear test data (optional)**
  - Delete test orders
  - Keep seeded menu items
  - Keep Las Reinas tenant

- [ ] **Reset browser**
  - Clear cache
  - Open incognito window
  - Bookmark demo URLs

- [ ] **Server is running**
  ```bash
  npm run dev
  # Should show: Ready on http://localhost:3001
  ```

- [ ] **No errors in terminal**
  - Check for red error messages
  - Warnings OK, but no critical errors

---

## 🎯 FINAL CHECKLIST SUMMARY

### ✅ All Systems Verified:

- [ ] **Frontend:** Hero, menu, cart, checkout, accessibility, catering
- [ ] **Admin:** Login, 8 tabs, orders, menu manager, settings, fulfillment
- [ ] **Payments:** Stripe Connect, test payments
- [ ] **Fulfillment:** Board, auto-print, notifications
- [ ] **Notifications:** Email, SMS (stub), webhooks
- [ ] **Tablets:** Responsive, touch-friendly
- [ ] **Performance:** < 2s load, Lighthouse > 85
- [ ] **Browser:** Chrome, Firefox, Safari, Edge

### 🚀 Ready for Presentation:

- [ ] Demo script reviewed (`ADMIN_COMPLETE_DEMO_SCRIPT.md`)
- [ ] Backup screenshots prepared
- [ ] Fallback plan ready
- [ ] Rehearsed at least once

### 📊 Score Summary:

**Feature Completeness:** ___/100
**Performance:** ___/100
**UX Polish:** ___/100
**Demo Readiness:** ___/100

**OVERALL SCORE:** ___/100

---

## ✅ SIGN-OFF

**Completed By:** _________________
**Date:** _________________
**Time:** _________________

**Ready for Demo:** ☐ YES  ☐ NO (if no, list blockers below)

**Blockers:**
1. _________________
2. _________________
3. _________________

---

**🎉 CONGRATULATIONS!**

If all sections are checked, your Alessa Ordering MVP is **100% presentation-ready**.

**Next Step:** Run through the demo script one final time, then present with confidence! 🚀
