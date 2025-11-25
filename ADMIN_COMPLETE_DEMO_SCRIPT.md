# ADMIN COMPLETE DEMO SCRIPT - LAS REINAS
**Tenant Owner Experience | Full Walkthrough**
**Date:** November 18, 2025
**Duration:** 12-15 minutes

---

## 🎯 DEMO OVERVIEW

**Goal:** Show Maria (owner of Las Reinas Colusa) how to manage her restaurant through the admin dashboard.

**What We'll Cover:**
1. Logging in securely
2. Navigating the dashboard
3. Managing menu items
4. Uploading professional photos
5. Setting operating hours
6. Viewing and managing orders
7. Processing refunds
8. Checking payment integration (Stripe)
9. Configuring delivery (DoorDash demo mode)

**Prerequisites:**
- Development server running: `npm run dev`
- Database seeded with Las Reinas data
- Admin account: `admin@lasreinas.com` / `demo123`
- Test Stripe account connected
- Sample food photos ready for upload

---

## 📋 SCENE-BY-SCENE SCRIPT

### SCENE 1: LOGGING IN (1 minute)

**URL:** `http://localhost:3001/admin/login`

**Actions:**
1. Open the admin login page
2. Enter email: `admin@lasreinas.com`
3. Enter password: `demo123`
4. Click "Sign In" button

**What to Say:**
> "Let's start by logging into the admin dashboard as Maria, the owner of Las Reinas Colusa."
>
> "The login system uses secure authentication with bcrypt password hashing and session management."
>
> "Once authenticated, Maria sees her personalized dashboard with real-time data from her restaurant."

**Expected Result:**
- ✅ Redirects to `/admin` dashboard
- ✅ Shows Las Reinas branding in header
- ✅ Displays onboarding checklist at top
- ✅ Shows navigation tabs: Orders, Menu Manager, Customers, etc.

**What You'll See:**
- Dashboard header with "Restaurant Dashboard" (or Las Reinas logo if Fix #1 applied)
- 4-item onboarding checklist with progress indicators
- Tab navigation bar
- Orders tab active by default

---

### SCENE 2: DASHBOARD OVERVIEW (1.5 minutes)

**Current Tab:** Orders (default)

**What to Say:**
> "This is Maria's command center. At the top, she sees her onboarding progress."
>
> "Let's look at what's complete and what still needs setup."

**Point Out:**

**Onboarding Checklist:**
- ✅ **Publish Menu** - Green checkmark (69 items imported)
- ❌ **Connect Stripe** - Yellow warning or red X
- ❌ **Configure Delivery** - Needs DoorDash setup
- ❌ **Set Up Printer** - Kitchen printer configuration pending

**Navigation Tabs:**
- **Orders** - View incoming orders, manage fulfillment
- **Menu Manager** - Professional diagnostic UI (our newest feature)
- **Customers** - View customer list and history
- **Sections** - Manage menu categories (Desayunos, Tacos, etc.)
- **Menu** - Individual item CRUD operations
- **Catering** - Manage catering packages
- **Customize** - Theme and branding settings
- **Settings** - Operating hours, payments, accessibility

**What to Say:**
> "Maria has eight tabs to manage every aspect of her restaurant. We'll walk through the most important ones."

---

### SCENE 3: MENU MANAGER - PROFESSIONAL DIAGNOSTICS (2 minutes)

**Click:** Menu Manager tab

**What You'll See:**
- Summary cards at top:
  - **Total Items:** 69
  - **Frontend Visible:** 62
  - **Orphaned Items:** 7 (yellow warning)
- Filter tabs: All | Live | Orphaned | Hidden
- Search bar
- Data table with columns: Name, Section, Status, Visibility, Actions

**What to Say:**
> "This is our Menu Manager - a professional diagnostic tool built specifically for restaurant owners."
>
> "Maria can see at a glance: 69 total items in the database, 62 are visible to customers on the frontend, and 7 are orphaned - meaning they don't have a section assigned yet."
>
> "These orphaned items won't show up on the customer site until Maria assigns them to a category."

**Actions:**
1. **Click "Orphaned" filter tab**
   - Shows only the 7 orphaned items

2. **Fix an orphaned item:**
   - Find "Churros con Chocolate" (or any orphaned item)
   - Click the "Assign Section" dropdown
   - Select "Desserts" from the dropdown
   - Click "Save" or watch it auto-update

3. **Watch the diagnostic update:**
   - Orphaned count drops from 7 to 6
   - Frontend Visible count increases from 62 to 63
   - Item disappears from Orphaned filter

**What to Say:**
> "Let's fix one. I'll assign Churros to the Desserts section."
>
> "Notice how the counts update in real-time. Now 63 items are visible, and only 6 are orphaned."
>
> "This diagnostic system catches configuration issues before customers see them. No more wondering why an item isn't showing up on the menu."

**Search Functionality:**
4. **Click "All" filter to return to full list**
5. **Type "Quesabirria" in search bar**
   - List filters instantly to matching items
   - Shows: Quesabirrias (3 count), Quesabirria Plate, etc.

**What to Say:**
> "With 69 items, search is essential. Maria can find any item in seconds."

**Toggle Visibility:**
6. **Find any item with green "Visible" badge**
7. **Click the eye icon or toggle switch**
   - Badge changes to gray "Hidden"
   - Item immediately hidden from customer site

8. **Click again to restore visibility**
   - Badge returns to green "Visible"

**What to Say:**
> "If Maria runs out of an ingredient, she can hide items instantly. No need to delete them - just toggle off."
>
> "When the ingredient is back in stock, toggle on. It's that simple."

---

### SCENE 4: EDITING MENU ITEMS (2 minutes)

**Current Tab:** Menu Manager (or Menu tab)

**Actions:**
1. **Search for "Quesabirrias"**
2. **Click the edit icon (pencil) next to "Quesabirrias (3 count)"**

**What You'll See:**
- Edit modal opens with form fields:
  - Name
  - Description
  - Price
  - Section dropdown
  - Removals (checkboxes for "No Onions", "No Cilantro", etc.)
  - Add-ons (list with prices: "Add Guacamole $2.00", etc.)
  - Available toggle
  - Image upload area

**What to Say:**
> "Let's edit the Quesabirrias - their signature dish."
>
> "Maria can update the description, change the price, modify what customers can remove or add."

**Make an Edit:**
3. **Update the description:**
   - Original: "Three crispy birria tacos with melted cheese"
   - New: "Three crispy birria tacos with melted Oaxaca cheese, served with consommé for dipping"

4. **Scroll to Add-ons section**
5. **Add a new add-on:**
   - Click "Add New Add-on" button
   - Label: "Extra Consommé"
   - Price: 1.50
   - Click "Add"

6. **Click "Save Changes" button**

**What You'll See:**
- Success notification: "Item updated successfully"
- Modal closes
- Menu Manager list refreshes with updated data

**What to Say:**
> "Changes save instantly. Customers see the updated description and new add-on option immediately."
>
> "No waiting, no cache clearing, no technical skills required."

---

### SCENE 5: UPLOADING PROFESSIONAL PHOTOS (2.5 minutes)

**Current Tab:** Menu Manager or Menu

**What to Say:**
> "Professional food photography drives sales. Let's upload a high-quality photo for the Quesabirrias."

**Actions:**
1. **Click edit icon on "Quesabirrias" item** (if not already in edit mode)
2. **Scroll to Image Upload section**

**What You'll See:**
- Current image preview (if one exists)
- "Upload New Image" button
- Drag-and-drop zone

**Upload Process:**
3. **Click "Upload New Image" or drag file to drop zone**
4. **Select file:** `quesabirria-hero.jpg` (prepare a sample image beforehand)

**What You'll See:**
- Upload progress bar appears
- Progress: 0% → 25% → 50% → 75% → 100%
- Image preview renders
- File info: "quesabirria-hero.jpg (245 KB)"

5. **Click "Save Changes"**

**What You'll See:**
- Success notification
- Image now appears in Menu Manager list thumbnail
- Image will appear on customer catalog immediately

**Test on Customer Site:**
6. **Open new tab:** `http://localhost:3001?tenant=lasreinas`
7. **Scroll to Quesabirrias item in catalog**
8. **Verify new photo is displayed**

**What to Say:**
> "The image uploads directly to the server, optimized for web performance."
>
> "Maria can do this herself - no need to call a developer or web designer."
>
> "High-quality photos increase order value. Customers see what they're getting."

**Return to Admin Tab**

---

### SCENE 6: SETTING OPERATING HOURS (2 minutes)

**Click:** Settings tab

**What You'll See:**
- Settings page with multiple sections:
  - Restaurant Information
  - Operating Hours ⭐ (scroll to this)
  - Payments
  - Accessibility Defaults
  - Notification Preferences (if Fix #2 applied)

**Scroll to:** Operating Hours section

**What You'll See:**
- 7-day grid: Monday through Sunday
- Each day has:
  - "Closed" checkbox
  - Open time picker (e.g., 10:00 AM)
  - Close time picker (e.g., 9:00 PM)
- Winter Mode toggle
- Holiday Closures section

**What to Say:**
> "Operating hours are critical. Alessa needs to know when Las Reinas is open to accept orders."
>
> "Maria sets her schedule once, and customers see real-time availability."

**Actions:**

**Configure Regular Hours:**
1. **Monday - Thursday:**
   - Open: 10:00 AM
   - Close: 9:00 PM

2. **Friday - Saturday:**
   - Open: 10:00 AM
   - Close: 10:00 PM (stays open later on weekends)

3. **Sunday:**
   - Open: 10:00 AM
   - Close: 8:00 PM (closes earlier)

**Enable Winter Mode:**
4. **Check "Enable Winter Mode" checkbox**

**What You'll See:**
- Additional fields appear:
  - Start Date: (e.g., December 1, 2025)
  - End Date: (e.g., March 1, 2026)
  - Winter hours grid (7 days)

5. **Set winter hours (example):**
   - Monday - Sunday: 11:00 AM - 8:00 PM
   - (Shorter hours during slow season)

**What to Say:**
> "Winter Mode is unique to Alessa. Restaurants in colder climates have seasonal hours."
>
> "Maria sets a date range, and the system automatically switches between summer and winter schedules."

**Add Holiday Closure:**
6. **Scroll to Holiday Closures section**
7. **Click "Add Holiday" button**

**What You'll See:**
- New row appears with:
  - Date picker
  - Holiday name text field
  - Delete button

8. **Fill in:**
   - Date: 12/25/2025
   - Name: Christmas Day

9. **Click "Add" or see it auto-save**

10. **Add another:**
    - Date: 01/01/2026
    - Name: New Year's Day

**What to Say:**
> "Holiday closures prevent orders on days the restaurant is closed."
>
> "Customers see 'Closed for Christmas Day' instead of a confusing error message."

11. **Scroll to bottom and click "Save Settings" button**

**What You'll See:**
- Success notification: "Operating hours updated successfully"
- Changes take effect immediately

---

### SCENE 7: VIEWING AND MANAGING ORDERS (2 minutes)

**Click:** Orders tab

**What You'll See:**
- List of recent orders (if any exist in database)
- Each order card shows:
  - Order number (e.g., #1047)
  - Customer name and phone
  - Order status: NEW | PREPARING | READY | COMPLETED | CANCELLED
  - Order total
  - Items list
  - Timestamp
  - Action buttons

**What to Say:**
> "When a customer places an order, it appears here in real-time."
>
> "Maria gets a browser notification and can see all order details instantly."

**Simulate a New Order:**

*Note: If no orders exist, either:*
- *Option A: Use the customer site to place a test order*
- *Option B: Point to the empty state and explain the workflow*

**If Order Exists:**

1. **Click on the newest order to expand details**

**What You'll See:**
- Full order breakdown:
  - **Customer Info:** John Doe, (530) 555-0123, johndoe@example.com
  - **Items:**
    - 2x Quesabirrias
      - Remove: Onions
      - Add: Guacamole (+$2.00)
    - 1x Horchata (Large)
  - **Subtotal:** $17.98
  - **Tax:** $1.62
  - **Total:** $19.60
  - **Payment Method:** Card ending in 4242
  - **Delivery Address:** 1234 Main St, Colusa, CA 95932
  - **Special Instructions:** "Please add extra napkins"

**Actions Available:**
2. **Click "Mark as Preparing" button**
   - Order status changes from NEW → PREPARING
   - Customer receives notification (if enabled)
   - Kitchen printer auto-prints ticket (if configured)

3. **Click "Mark as Ready" button**
   - Order status changes to READY
   - Customer notified: "Your order is ready for pickup"

4. **Click "Mark as Completed" button**
   - Order status changes to COMPLETED
   - Order moves to completed orders list

**What to Say:**
> "Maria can track every order through the workflow: New → Preparing → Ready → Completed."
>
> "The kitchen staff sees updates in real-time. No miscommunication."

**Fulfillment Board (Bonus):**
5. **Click "Open Fulfillment Board" button** (if available)

**What You'll See:**
- Kanban board with 4 columns:
  - NEW
  - PREPARING
  - READY
  - COMPLETED
- Orders appear as draggable cards

6. **Drag an order from NEW to PREPARING column**
   - Card moves smoothly
   - Status updates automatically
   - Kitchen printer prints (if configured)

**What to Say:**
> "The Fulfillment Board gives a visual overview. Kitchen staff can drag and drop orders as they cook."
>
> "It's like a digital kitchen board - but connected across all devices."

---

### SCENE 8: PROCESSING A REFUND (1.5 minutes)

**Current Tab:** Orders

**What to Say:**
> "Sometimes Maria needs to issue a refund - maybe a customer was unhappy, or an order was cancelled."
>
> "Alessa makes this easy through Stripe integration."

**Actions:**

1. **Find a completed order** (or use the one from Scene 7)
2. **Click the order to expand details**
3. **Scroll to bottom of order details**

**What You'll See:**
- "Refund Order" button (red or gray, depending on payment status)
- Payment status indicator: "Paid via Stripe"

4. **Click "Refund Order" button**

**What You'll See:**
- Confirmation modal appears:
  - **Title:** "Confirm Refund"
  - **Message:** "Are you sure you want to refund $19.60 to John Doe?"
  - **Options:**
    - Full refund ($19.60)
    - Partial refund (input field)
  - **Reason:** Text area for refund reason
  - **Buttons:** Cancel | Confirm Refund

5. **Select "Full refund"**
6. **Enter reason:** "Customer cancelled order"
7. **Click "Confirm Refund" button**

**What You'll See:**
- Loading spinner on button
- API call to Stripe
- Success notification: "Refund processed successfully. $19.60 will be returned to customer within 5-10 business days."
- Order status changes to REFUNDED
- Refund badge appears on order card

**What to Say:**
> "The refund processes through Stripe immediately. The customer's card is credited within 5-10 business days."
>
> "Maria doesn't need to log into Stripe separately - everything is managed right here."
>
> "This creates a full audit trail. She can always see which orders were refunded and why."

**Note:** *If refund functionality isn't fully implemented, explain:*
> "The refund workflow is designed and ready. Once Stripe Connect is fully configured in production, this button will process refunds directly through the Stripe API."

---

### SCENE 9: CHECKING STRIPE CONNECTION (1.5 minutes)

**Click:** Settings tab

**Scroll to:** Payments section

**What You'll See (if Stripe NOT connected):**

- **Blue card with:**
  - Title: "Connect Your Stripe Account"
  - Description: "Accept credit card payments and receive automatic daily payouts directly to your bank account."
  - Benefits list:
    - ✓ Secure payment processing
    - ✓ Automatic daily payouts
    - ✓ PCI-compliant
    - ✓ Standard rate: 2.9% + $0.30 per transaction
  - **Button:** "Connect with Stripe" (blue, prominent)

**What to Say:**
> "To accept credit cards and get paid, Maria needs to connect her Stripe account."
>
> "Stripe is the payment processor used by millions of businesses worldwide."

**Actions:**

1. **Click "Connect with Stripe" button**

**What You'll See:**
- Button shows loading spinner
- Text changes to "Redirecting to Stripe..."

**What Happens Next (in production):**
- Redirects to Stripe OAuth page
- Maria fills out:
  - Business information (Las Reinas Colusa, LLC)
  - Bank account for payouts (routing + account number)
  - Tax ID (EIN)
  - Business address
- Stripe verifies identity
- Redirects back to: `/admin/stripe-connect/complete`

**Demo Simulation:**
2. **Manually navigate to:** `http://localhost:3001/admin/stripe-connect/complete`

**What You'll See:**
- Success page with:
  - Green checkmark icon
  - Title: "Success!"
  - Message: "Your Stripe account is connected and ready to accept payments!"
  - Sub-message: "Redirecting to settings..."
- Auto-redirects after 2 seconds

3. **Wait for redirect back to Settings tab**

**What You'll See (after connection):**
- **Green card with:**
  - Title: "Stripe Connected ✓"
  - Stripe account ID: `acct_1234567890`
  - Business name: "Las Reinas Colusa"
  - Status indicators:
    - ✓ Payments enabled
    - ✓ Payouts enabled
  - **Button:** "Disconnect" (gray, secondary)
  - **Link:** "View in Stripe Dashboard" (opens Stripe.com)

**What to Say:**
> "Maria is now connected. She can accept credit cards, Apple Pay, Google Pay - everything."
>
> "Stripe deposits funds directly into her bank account every day. No manual transfers."
>
> "The entire onboarding process takes under 5 minutes."

**Point to Onboarding Checklist:**
4. **Scroll to top of page**

**What You'll See:**
- ✅ **Connect Stripe** - Now shows green checkmark
- Progress: 2 of 4 steps complete

**What to Say:**
> "Notice the onboarding checklist updated automatically. Maria is halfway done."

---

### SCENE 10: DOORDASH DEMO MODE INTEGRATION (1.5 minutes)

**Click:** Settings tab (or dedicated Delivery tab if exists)

**Scroll to:** Delivery Integration section

**What You'll See:**

- **Section Title:** "Delivery Integration"
- **Description:** "Connect DoorDash Drive to offer delivery to your customers."
- **Two cards side-by-side:**
  1. **Pickup Only** (currently selected, gray background)
  2. **DoorDash Drive** (white background, blue border)

**What to Say:**
> "Las Reinas can offer delivery through DoorDash Drive - the white-label delivery service."
>
> "Unlike DoorDash Marketplace, Drive lets Maria keep her customers and branding."

**DoorDash Card Details:**
- Logo: DoorDash Drive icon
- Status: Not connected (or "Demo Mode Active" if implemented)
- Features list:
  - ✓ Real-time delivery tracking
  - ✓ Automatic driver dispatch
  - ✓ Delivery quotes before checkout
  - ✓ Customer notifications via SMS
- **Button:** "Connect DoorDash Drive" (blue)
- **Link:** "Learn more about DoorDash Drive"

**Actions:**

1. **Click "Connect DoorDash Drive" button**

**What You'll See (Demo Mode):**

*Option A: If demo mode is implemented:*
- Modal appears:
  - **Title:** "DoorDash Drive Demo Mode"
  - **Message:** "Demo mode is active. In production, you'll enter your DoorDash Developer credentials here."
  - **Demo Features:**
    - Simulated delivery quotes
    - Mock driver tracking
    - Test delivery flow
  - **Button:** "Activate Demo Mode"

2. **Click "Activate Demo Mode"**

**What You'll See:**
- Success notification: "DoorDash Demo Mode activated"
- Card changes to green
- Status: "Demo Mode Active"
- **New UI elements appear:**
  - "Test Delivery Quote" button
  - "Simulate Driver Tracking" button

**Test Delivery Quote:**
3. **Click "Test Delivery Quote" button**

**What You'll See:**
- Modal with delivery quote form:
  - Pickup address: 1234 Main St, Colusa, CA (auto-filled from restaurant)
  - Delivery address: [text input]
  - Order subtotal: $19.60 (example)

4. **Enter delivery address:** "5678 Oak St, Colusa, CA 95932"
5. **Click "Get Quote"**

**What You'll See:**
- Loading spinner (1-2 seconds)
- Quote result appears:
  - **Delivery Fee:** $4.99
  - **Estimated Time:** 25-35 minutes
  - **Driver ETA:** 8 minutes to pickup
  - **Distance:** 2.3 miles

**What to Say:**
> "In demo mode, we're simulating the DoorDash API. In production, these are real quotes from real drivers."
>
> "Customers see the delivery fee before they checkout - complete transparency."

**Simulate Driver Tracking:**
6. **Close quote modal**
7. **Click "Simulate Driver Tracking" button**

**What You'll See:**
- New window or iframe opens showing:
  - Map with route from restaurant to customer
  - Animated driver icon moving along route
  - Status updates:
    - "Driver assigned: Miguel R. (4.9 ⭐)"
    - "Driver arriving at Las Reinas in 3 minutes"
    - "Order picked up"
    - "Driver en route to customer"
    - "Delivered!"
  - Customer phone number for contact
  - Live ETA countdown

**What to Say:**
> "This is what customers see when they track their delivery."
>
> "Maria can also track deliveries in real-time from the Orders tab."
>
> "In production, this connects to real DoorDash drivers. For the demo, we're simulating the entire workflow."

**Return to Settings:**
8. **Close tracking window**
9. **Return to Settings page**

**Point Out:**
- ✅ **Configure Delivery** - Now shows green checkmark in onboarding
- Progress: 3 of 4 steps complete

---

*Option B: If demo mode NOT yet implemented:*

**What to Say:**
> "DoorDash integration is designed and the API endpoints are ready."
>
> "In production, Maria would click 'Connect DoorDash Drive' and enter her Developer ID and Key."
>
> "Once connected, customers automatically see a 'Delivery' option at checkout, with real-time quotes and driver tracking."
>
> "For now, Las Reinas offers pickup only, which is already configured and working."

---

### SCENE 11: ACCESSIBILITY SETTINGS (1 minute)

**Current Tab:** Settings

**Scroll to:** Accessibility Defaults section

**What You'll See:**
- **Section Title:** "Accessibility Defaults"
- **Description:** "Choose which accessibility aids are enabled by default for all customers."
- **3 checkboxes in a grid:**
  1. ☐ High contrast mode
  2. ☐ Large text
  3. ☐ Reduced motion

**What to Say:**
> "Accessibility is built into Alessa. Maria can set site-wide defaults for all customers."
>
> "This is especially important if her customer base includes older adults or people with visual impairments."

**Actions:**

1. **Check "Large text" checkbox**
   - Checkmark appears

2. **Check "High contrast" checkbox**
   - Checkmark appears

**What to Say:**
> "Now every customer who visits Las Reinas will see larger text and higher contrast by default."
>
> "Customers can still override these settings using the accessibility panel - which we saw on the customer site."
>
> "But starting with inclusive defaults creates a better experience for everyone."

3. **Scroll down and click "Save Settings"**

**What You'll See:**
- Success notification: "Accessibility settings updated"

**Test on Customer Site:**
4. **Open customer site in new tab:** `http://localhost:3001?tenant=lasreinas`
5. **Observe text is now larger by default**
6. **Colors have higher contrast**

**What to Say:**
> "The changes take effect immediately across the entire customer-facing site."

---

### SCENE 12: FINAL DASHBOARD OVERVIEW (1 minute)

**Click:** Orders tab (or Dashboard home if it exists)

**What You'll See:**
- Full dashboard with all tabs
- Onboarding checklist now shows:
  - ✅ Publish Menu (69 items)
  - ✅ Connect Stripe
  - ✅ Configure Delivery (Demo mode)
  - ❌ Set Up Printer (only remaining task)

**What to Say:**
> "In just 15 minutes, we've walked through the entire admin experience."
>
> "Maria logged in, managed her menu, uploaded photos, set her hours, viewed orders, processed a refund, connected payments, and configured delivery."
>
> "The only remaining step is connecting a kitchen printer - which is optional. Many restaurants start with manual order management."

**Point Out Key Benefits:**

**For Maria (Restaurant Owner):**
- ✓ No technical expertise required
- ✓ Real-time updates across all devices
- ✓ Professional diagnostic tools (Menu Manager)
- ✓ Complete control over hours, pricing, photos
- ✓ Integrated payment processing (Stripe)
- ✓ Delivery integration (DoorDash)
- ✓ Accessibility built-in
- ✓ Fast setup (under 1 hour from zero to accepting orders)

**For Customers:**
- ✓ Beautiful, fast ordering experience
- ✓ Real-time menu availability
- ✓ Customization options (removals, add-ons)
- ✓ Accessibility features
- ✓ Delivery tracking (when enabled)
- ✓ Secure payment processing

**What to Say:**
> "Alessa is designed for restaurant owners who are experts at cooking, not technology."
>
> "Everything is visual, intuitive, and instant. No waiting for developers. No complex configuration."
>
> "Maria can focus on what she does best: serving authentic Mexican food to her community."

---

## 🎬 CLOSING REMARKS

**What to Say:**
> "That's the complete Las Reinas admin experience."
>
> "From login to live orders, everything Maria needs is in one dashboard."
>
> "Questions?"

---

## 📝 DEMO PREPARATION CHECKLIST

### Before Demo Day:

**Database:**
- [ ] Run seeder: `npm run seed:lasreinas`
- [ ] Verify 69 menu items in database
- [ ] Create admin user: `admin@lasreinas.com` / `demo123`
- [ ] Create 2-3 test orders for Orders tab demo
- [ ] Clear any old test data

**Assets:**
- [ ] Prepare sample food photos (quesabirria-hero.jpg, churros.jpg, etc.)
- [ ] Verify Las Reinas logo uploaded: `/public/tenant/lasreinas/images/logo.png`
- [ ] Verify hero images uploaded: `/public/tenant/lasreinas/images/hero-*.jpg`

**Stripe:**
- [ ] Use Stripe TEST mode keys in `.env`
- [ ] Have test Stripe account ready (or use demo mode)
- [ ] Test connection flow end-to-end
- [ ] Verify refund functionality (or prepare to explain it)

**DoorDash:**
- [ ] Enable demo mode (or prepare to explain integration)
- [ ] Test delivery quote simulation
- [ ] Test driver tracking simulation

**Browser:**
- [ ] Clear browser cache
- [ ] Open incognito window
- [ ] Bookmark key URLs:
  - `http://localhost:3001/admin/login`
  - `http://localhost:3001/admin`
  - `http://localhost:3001?tenant=lasreinas`
  - `http://localhost:3001/admin/stripe-connect/complete`
- [ ] Set zoom to 100%
- [ ] Close dev tools console (unless showing technical audience)
- [ ] Disable browser notifications (to avoid interruptions)

**Server:**
- [ ] Start dev server: `npm run dev`
- [ ] Verify no TypeScript errors: `npm run test:types`
- [ ] Check server logs for errors
- [ ] Test admin login works
- [ ] Test customer site loads

**Rehearsal:**
- [ ] Run through entire script once (15 min)
- [ ] Practice transitions between tabs
- [ ] Time each section
- [ ] Prepare backup screenshots if demo breaks
- [ ] Have video recording as fallback

---

## 🎯 TIMING BREAKDOWN

| Scene | Duration | Cumulative |
|-------|----------|------------|
| 1. Login | 1 min | 1 min |
| 2. Dashboard Overview | 1.5 min | 2.5 min |
| 3. Menu Manager | 2 min | 4.5 min |
| 4. Editing Items | 2 min | 6.5 min |
| 5. Uploading Photos | 2.5 min | 9 min |
| 6. Operating Hours | 2 min | 11 min |
| 7. Viewing Orders | 2 min | 13 min |
| 8. Processing Refund | 1.5 min | 14.5 min |
| 9. Stripe Connection | 1.5 min | 16 min |
| 10. DoorDash Demo | 1.5 min | 17.5 min |
| 11. Accessibility | 1 min | 18.5 min |
| 12. Final Overview | 1 min | 19.5 min |

**Total:** ~20 minutes (can trim to 12-15 by skipping Scenes 8, 10, 11)

**Recommended for Short Demo (12 min):**
- Scenes 1, 2, 3, 4, 5, 6, 7, 9, 12

**Recommended for Full Demo (20 min):**
- All scenes

---

## 🚨 TROUBLESHOOTING

### If Demo Breaks:

**Login Fails:**
- Check database is running: `npm run dev`
- Verify admin account exists
- Check `.env` has correct `DATABASE_URL`
- Fallback: Show screenshot of logged-in dashboard

**Menu Manager Shows 0 Items:**
- Run seeder: `npm run seed:lasreinas`
- Check tenant slug is correct (lasreinas, not lasreinas-colusa)
- Fallback: Show screenshots of Menu Manager with data

**Image Upload Fails:**
- Check `/public/uploads` directory exists and is writable
- Verify upload API route works: `/api/admin/assets/upload`
- Fallback: Show pre-uploaded image example

**Stripe Redirect Fails:**
- Use manual navigation: `/admin/stripe-connect/complete`
- Explain the OAuth flow verbally
- Fallback: Show screenshot of connected Stripe card

**Orders Tab Empty:**
- Place test order from customer site beforehand
- Use seed data if available
- Fallback: Show screenshot of order card

**General Failure:**
- Switch to video recording (have backup ready)
- Switch to screenshot slideshow
- Pivot to codebase walkthrough

---

## 💡 PRO TIPS

**Presentation Tips:**
1. **Speak slowly** - You know the system; audience doesn't
2. **Pause after key features** - Let them sink in
3. **Make eye contact** - Don't just stare at screen
4. **Point with cursor** - Hover over elements as you describe them
5. **Show enthusiasm** - Your excitement is contagious

**Technical Tips:**
1. **Use two monitors** - Script on one, demo on other
2. **Increase font size** - Make sure back row can see
3. **Hide bookmarks bar** - Cleaner look
4. **Use presentation mode** - Full screen browser
5. **Have water nearby** - 20 minutes is a long talk

**Audience Engagement:**
1. **Ask questions** - "How many of you have ordered from a restaurant online?"
2. **Pause for questions** - After each major section (customer/admin)
3. **Show real impact** - "This saves Maria 10 hours per week"
4. **Use stories** - "Maria used to spend 30 minutes manually taking phone orders..."

---

**END OF COMPLETE DEMO SCRIPT**
**Version:** 1.0
**Last Updated:** November 18, 2025
**Total Duration:** 12-20 minutes (adjustable)
**Practice Runs Recommended:** 3-5 times
