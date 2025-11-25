# ADMIN TEST SCRIPT - LAS REINAS TENANT
**Complete Step-by-Step Testing Protocol**
**Environment:** Local Development (http://localhost:3001)
**Tenant:** Las Reinas (lasreinas)
**Test Duration:** 45-60 minutes

---

## 🎯 PRE-TEST SETUP

### Database Preparation
```bash
# 1. Seed Las Reinas menu
npm run seed:lasreinas

# 2. Verify seeding succeeded
# Expected: "✓ Seeded 69 menu items across 10 sections"

# 3. Start dev server
npm run dev

# 4. Open browser (incognito recommended)
http://localhost:3001/admin/login
```

### Test Account Credentials
- **Email:** `admin@lasreinas.com`
- **Password:** `demo123`
- **Role:** Admin (tenant-scoped)

### Browser Requirements
- Clear cache before testing
- Enable JavaScript console (F12)
- Test in Chrome/Edge (primary) and Safari (secondary)
- Screen resolution: 1920x1080 minimum

---

## TEST 1: ADMIN LOGIN & AUTHENTICATION (5 min)

### Test 1.1: Successful Login
**URL:** `http://localhost:3001/admin/login`

**Steps:**
1. Enter email: `admin@lasreinas.com`
2. Enter password: `demo123`
3. Click "Login" button

**Expected Results:**
- ✅ Redirects to `/admin` (dashboard)
- ✅ Shows navigation with 8 tabs
- ✅ Onboarding checklist visible at top
- ✅ No console errors

**Pass Criteria:**
- [ ] Login succeeds
- [ ] Dashboard loads in <2 seconds
- [ ] User stays logged in on refresh

---

### Test 1.2: Invalid Credentials
**Steps:**
1. Logout (click Logout button)
2. Try login with wrong password: `wrongpassword`

**Expected Results:**
- ✅ Error message: "Invalid credentials"
- ✅ Stays on login page
- ✅ Password field cleared

**Pass Criteria:**
- [ ] Error displays clearly
- [ ] No redirect on failure

---

### Test 1.3: Role-Based Access
**Steps:**
1. Login as admin (Las Reinas)
2. Try accessing: `http://localhost:3001/super-admin`

**Expected Results:**
- ✅ Redirected away from super-admin
- ✅ Cannot access other tenant data

**Pass Criteria:**
- [ ] Proper access control enforced

---

## TEST 2: MENU MANAGER TAB (10 min)

### Test 2.1: View Menu Diagnostic
**Steps:**
1. Click **Menu Manager** tab in navigation
2. Observe summary cards at top

**Expected Results:**
- ✅ 4 summary cards display:
  - Total Items: 69
  - Frontend Visible: ~62-69
  - Orphaned: 0-7 (may vary)
  - Hidden: 0-7
- ✅ Items list shows below with columns:
  - Name | Section | Status | Image | Actions
- ✅ Search bar functional
- ✅ Filter tabs: All | Live | Hidden | Orphaned

**Pass Criteria:**
- [ ] Summary counts accurate
- [ ] All 69 items display in "All" filter
- [ ] Visual status indicators correct:
  - Green dot = Live on frontend
  - Yellow warning = Orphaned
  - Red X = Hidden

---

### Test 2.2: Search Functionality
**Steps:**
1. Type "Quesabirrias" in search box
2. Observe filtered results

**Expected Results:**
- ✅ List filters to ~3 items containing "Quesabirrias"
- ✅ Filtering happens in real-time (no submit button)
- ✅ Summary counts don't change (they show total, not filtered)

**Pass Criteria:**
- [ ] Search is case-insensitive
- [ ] Partial matches work ("Quesa" finds "Quesabirrias")
- [ ] Clear search shows all items again

---

### Test 2.3: Filter by Status
**Steps:**
1. Click **Orphaned** filter tab
2. Observe list changes

**Expected Results:**
- ✅ Shows only items without assigned section
- ✅ Items have yellow warning icon
- ✅ Section column shows "—" or "No Section"

**Pass Criteria:**
- [ ] Filter count matches items shown
- [ ] Switching filters updates list immediately
- [ ] "All" filter resets view

---

### Test 2.4: Toggle Item Visibility
**Steps:**
1. Find item: "Churros con Chocolate"
2. Click eye icon (show/hide toggle)
3. Wait for action to complete

**Expected Results:**
- ✅ Loading spinner appears on that row
- ✅ Icon changes: Eye → Eye-off (or vice versa)
- ✅ Status changes: Live → Hidden (or vice versa)
- ✅ Summary cards update counts
- ✅ Success feedback (green flash or checkmark)

**Pass Criteria:**
- [ ] Toggle works both directions (show → hide → show)
- [ ] Change persists on page refresh
- [ ] Frontend visibility updates accordingly

---

### Test 2.5: Assign Item to Section
**Steps:**
1. Filter to **Orphaned** items
2. Select first orphaned item
3. Click "Assign to Section" dropdown
4. Select section: "Desserts"
5. Wait for save

**Expected Results:**
- ✅ Dropdown shows all available sections
- ✅ Loading indicator during save
- ✅ Item moves from Orphaned to Live
- ✅ Orphaned count decreases by 1
- ✅ Frontend Visible count increases by 1
- ✅ Section column updates to "Desserts"

**Pass Criteria:**
- [ ] Assignment saves successfully
- [ ] Item no longer appears in Orphaned filter
- [ ] Customer site shows item in Desserts section

---

### Test 2.6: Edit Item Details
**Steps:**
1. Search for "Quesabirrias (3)"
2. Click **Edit** icon (pencil)
3. Modal/form opens with current data
4. Change name to: "Quesabirrias de Birria (3)"
5. Change price to: $14.99
6. Click **Save**

**Expected Results:**
- ✅ Edit form pre-populates with existing data
- ✅ All fields editable:
  - Name, Description, Price
  - Category, Tags
  - Available toggle
  - Featured toggle
- ✅ Save button shows loading state
- ✅ Success message: "Item updated successfully"
- ✅ List refreshes with new data

**Pass Criteria:**
- [ ] Changes save to database
- [ ] New name/price display in list
- [ ] Customer site reflects updates immediately

---

### Test 2.7: Delete Item
**Steps:**
1. Select a test item (not a signature dish)
2. Click **Delete** icon (trash)
3. Confirmation dialog appears

**Expected Results:**
- ✅ Confirmation: "Are you sure you want to delete [Item Name]?"
- ✅ Warning: "This action cannot be undone"
- ✅ Two buttons: Cancel | Delete

**Steps (continued):**
4. Click **Cancel** → Dialog closes, item remains
5. Click **Delete** again → Click **Delete** in dialog

**Expected Results:**
- ✅ Loading indicator
- ✅ Item removed from list
- ✅ Total Items count decreases
- ✅ Success message: "Item deleted"

**Pass Criteria:**
- [ ] Cancel prevents deletion
- [ ] Delete removes item from database
- [ ] Customer site no longer shows item

---

## TEST 3: MENU SECTIONS MANAGER (8 min)

### Test 3.1: View Sections List
**Steps:**
1. Click **Sections** tab
2. Observe section list

**Expected Results:**
- ✅ List shows ~10 sections:
  - Desayunos, Quesabirrias, Tacos, Burritos, etc.
- ✅ Each section shows:
  - Name
  - Type (RESTAURANT, BAKERY, etc.)
  - Item count
  - Position/Order number
- ✅ Sections sorted by position

**Pass Criteria:**
- [ ] All sections display
- [ ] Item counts accurate
- [ ] Position numbers sequential (1, 2, 3...)

---

### Test 3.2: Reorder Sections (Drag/Drop or Arrows)
**Steps:**
1. Locate "Quesabirrias" section (position 2-3)
2. Click **↑ Up** arrow to move higher
3. Wait for save

**Expected Results:**
- ✅ Section moves up one position
- ✅ Adjacent section shifts down
- ✅ Position numbers update
- ✅ No page reload (smooth transition)

**Steps (continued):**
4. Click **↓ Down** arrow to move back

**Expected Results:**
- ✅ Section returns to original position
- ✅ Changes persist on refresh

**Pass Criteria:**
- [ ] Reordering saves to database
- [ ] Customer site displays sections in new order
- [ ] Up arrow disabled for first section
- [ ] Down arrow disabled for last section

---

### Test 3.3: Create New Section
**Steps:**
1. Click **Add Section** button
2. Form appears (modal or inline)
3. Fill fields:
   - Name: "Bebidas Especiales"
   - Type: BEVERAGE
   - Description: "Specialty drinks and aguas frescas"
4. Click **Save**

**Expected Results:**
- ✅ New section appears in list
- ✅ Assigned next position number (11)
- ✅ Item count: 0
- ✅ Success message displays

**Pass Criteria:**
- [ ] Section creates successfully
- [ ] Available in "Assign Section" dropdowns
- [ ] Visible on customer site (empty until items added)

---

### Test 3.4: Edit Section
**Steps:**
1. Select "Bebidas Especiales" (just created)
2. Click **Edit** icon
3. Change name to: "Bebidas"
4. Click **Save**

**Expected Results:**
- ✅ Name updates in list
- ✅ No other fields affected
- ✅ Items remain assigned (if any)

**Pass Criteria:**
- [ ] Edit saves successfully
- [ ] Changes reflect across admin

---

### Test 3.5: Delete Section
**Steps:**
1. Select "Bebidas" section (empty, just created)
2. Click **Delete** icon
3. Confirmation dialog

**Expected Results:**
- ✅ Warning: "Delete section 'Bebidas'?"
- ✅ If section has items: "Warning: 0 items will become orphaned"

**Steps (continued):**
4. Click **Delete**

**Expected Results:**
- ✅ Section removed from list
- ✅ If had items: those items now orphaned
- ✅ Total sections count updates

**Pass Criteria:**
- [ ] Cannot delete section with items (or orphans them)
- [ ] Deleted sections don't appear on customer site

---

## TEST 4: MENU ITEM CRUD (LEGACY EDITOR) (7 min)

### Test 4.1: View Menu Items Tab
**Steps:**
1. Click **Menu Items** tab (different from Menu Manager)
2. Observe interface

**Expected Results:**
- ✅ Shows similar list to Menu Manager
- ✅ May have different UI (older interface)
- ✅ CRUD buttons: Add | Edit | Delete

**Note:** This tab may be legacy. Menu Manager is newer/better.

**Pass Criteria:**
- [ ] Tab loads without errors
- [ ] Items display correctly

---

### Test 4.2: Add New Item
**Steps:**
1. Click **Add Item** button
2. Fill form:
   - Name: "Test Taco"
   - Description: "Demo item for testing"
   - Price: 5.99
   - Section: Tacos
   - Available: ✓ Checked
3. Click **Save**

**Expected Results:**
- ✅ Item appears in list
- ✅ Assigned to Tacos section
- ✅ Visible on customer site immediately

**Pass Criteria:**
- [ ] Item creates successfully
- [ ] All fields save correctly
- [ ] Image upload optional (can skip)

---

### Test 4.3: Edit Item via Menu Items Tab
**Steps:**
1. Find "Test Taco" (just created)
2. Click **Edit**
3. Change price to: 6.99
4. Click **Save**

**Expected Results:**
- ✅ Price updates
- ✅ No duplicate items created

**Pass Criteria:**
- [ ] Edit saves successfully

---

### Test 4.4: Delete Item via Menu Items Tab
**Steps:**
1. Select "Test Taco"
2. Click **Delete**
3. Confirm deletion

**Expected Results:**
- ✅ Item removed
- ✅ No longer on customer site

**Pass Criteria:**
- [ ] Deletion successful

---

## TEST 5: IMAGE UPLOAD (10 min)

### Test 5.1: Upload Logo
**Steps:**
1. Click **Settings** tab
2. Scroll to **Branding** section
3. Find "Logo Upload" field
4. Click **Choose File** or drag-drop area
5. Select image: `logo.png` (512x512, <100KB)
6. Wait for upload

**Expected Results:**
- ✅ Progress bar shows upload (0% → 100%)
- ✅ Image preview appears after upload
- ✅ File size validation (rejects >5MB)
- ✅ Format validation (accepts PNG, JPG, WEBP)
- ✅ Success message: "Logo uploaded successfully"

**Pass Criteria:**
- [ ] Upload completes in <5 seconds
- [ ] Preview shows correct image
- [ ] Logo URL saved to tenant settings

---

### Test 5.2: Upload Hero Image
**Steps:**
1. Still in Settings → Branding
2. Find "Hero Image Upload"
3. Upload: `hero-quesabirria-action.jpg` (1920x1080, <500KB)
4. Wait for upload

**Expected Results:**
- ✅ Same upload flow as logo
- ✅ Preview displays (may be smaller)
- ✅ URL saved to settings

**Pass Criteria:**
- [ ] Large images upload successfully
- [ ] Hero image displays on customer site

---

### Test 5.3: Upload Menu Item Photo
**Steps:**
1. Go to **Menu Manager** tab
2. Search for "Quesabirrias (3)"
3. Click **Edit**
4. Find "Image Upload" section in edit form
5. Upload: `quesabirrias.jpg` (800x800, <200KB)
6. Click **Save**

**Expected Results:**
- ✅ Image uploads within edit modal
- ✅ Thumbnail preview in modal
- ✅ After save, image shows in item list
- ✅ Customer site displays image on menu card

**Pass Criteria:**
- [ ] Item images upload successfully
- [ ] Multiple formats accepted (JPG, PNG, WEBP)
- [ ] Images display properly on frontend

---

### Test 5.4: Upload Error Handling
**Steps:**
1. Try uploading oversized file (>5MB)

**Expected Results:**
- ✅ Error message: "File too large. Maximum 5MB."
- ✅ Upload rejected
- ✅ Form still usable

**Steps (continued):**
2. Try uploading wrong format (PDF, DOC)

**Expected Results:**
- ✅ Error: "Invalid format. Use JPG, PNG, or WEBP."
- ✅ Upload rejected

**Pass Criteria:**
- [ ] Validation works correctly
- [ ] Error messages clear and helpful

---

## TEST 6: PAYMENT SETTINGS (8 min)

### Test 6.1: View Stripe Status (Not Connected)
**Steps:**
1. Click **Settings** tab
2. Scroll to **Payments** section
3. Observe Stripe Connect status

**Expected Results (if not connected):**
- ✅ Blue card with Stripe logo
- ✅ Heading: "Connect Your Stripe Account"
- ✅ Benefits listed:
  - Automatic daily payouts
  - PCI-compliant processing
  - 2.9% + $0.30 per transaction
- ✅ Button: "Connect with Stripe"

**Pass Criteria:**
- [ ] Card displays correctly
- [ ] Button is clickable (test in next section)

---

### Test 6.2: View Stripe Status (Connected)
**Expected Results (if already connected):**
- ✅ Green card with checkmark
- ✅ Heading: "Stripe Connected"
- ✅ Account ID shown: `acct_xxxxxxxxxxxxx`
- ✅ Status indicators:
  - ● Payments enabled (green dot)
  - ● Payouts enabled (green dot)
- ✅ Business name & email displayed
- ✅ "Refresh" button to check latest status

**Pass Criteria:**
- [ ] All account details display
- [ ] Status accurate

---

### Test 6.3: Payment Fee Configuration
**Steps:**
1. Still in Settings → Payments
2. Find fee configuration fields:
   - Platform percentage fee: 2.9
   - Platform flat fee: 0.30
   - Default tax rate: 7.5
3. Change default tax rate to: 8.25
4. Scroll to bottom → Click **Save Settings**

**Expected Results:**
- ✅ Save button shows loading spinner
- ✅ Success message: "Settings saved successfully"
- ✅ Page doesn't reload (updates in place)

**Pass Criteria:**
- [ ] Fee changes save correctly
- [ ] Tax rate applies to customer orders

---

## TEST 7: STRIPE CONNECT ONBOARDING (5 min)

### Test 7.1: Initiate Onboarding
**Steps:**
1. Settings → Payments
2. Click **Connect with Stripe** button

**Expected Results:**
- ✅ Button shows loading: "Connecting..."
- ✅ API call to `/api/admin/stripe/connect/onboard`
- ✅ Receives onboarding URL
- ✅ Redirects to Stripe OAuth page (external)

**Note:** In TEST mode, you'll see Stripe's test onboarding flow.

**Pass Criteria:**
- [ ] Redirect happens smoothly
- [ ] No errors in console

---

### Test 7.2: Complete Onboarding (Simulated)
**Steps:**
1. On Stripe page, fill test business info:
   - Business name: Las Reinas Colusa
   - EIN: 00-0000000 (test)
   - Bank account: Test routing/account numbers
2. Complete all required fields
3. Submit onboarding

**Expected Results:**
- ✅ Stripe redirects back to app
- ✅ Lands on: `/admin/stripe-connect/complete`
- ✅ Success page shows:
  - Green checkmark
  - "Success!" heading
  - Message: "Your Stripe account is connected..."
  - Auto-redirect countdown (2 seconds)
- ✅ Redirects to: `/admin?tab=settings`

**Pass Criteria:**
- [ ] OAuth flow completes
- [ ] Return URL works correctly
- [ ] Success page displays properly

---

### Test 7.3: Verify Connection Status
**Steps:**
1. After redirect, on Settings → Payments
2. Observe Stripe card

**Expected Results:**
- ✅ Now shows green "Connected" card
- ✅ Account ID visible
- ✅ Payments enabled
- ✅ Ready to accept payments

**Pass Criteria:**
- [ ] Status updated correctly
- [ ] Can process test payments

---

### Test 7.4: Onboarding Incomplete State
**Expected Results (if user abandons mid-flow):**
- ✅ Yellow warning card
- ✅ Heading: "Onboarding Incomplete"
- ✅ Message varies:
  - "You started but haven't finished..."
  - OR "Stripe is reviewing your information..."
- ✅ Button: "Continue Onboarding" or "Refresh Status"

**Pass Criteria:**
- [ ] Incomplete state handled gracefully
- [ ] User can resume onboarding

---

## TEST 8: ADA/ACCESSIBILITY TAB (5 min)

### Test 8.1: View Accessibility Defaults
**Steps:**
1. Click **Settings** tab
2. Scroll to **Accessibility Defaults** section

**Expected Results:**
- ✅ Section heading: "Accessibility Defaults"
- ✅ Description: "Choose which accessibility aids are enabled by default..."
- ✅ 3 checkboxes:
  - ☐ High contrast
  - ☐ Large text
  - ☐ Reduced motion
- ✅ All unchecked by default (or reflect current settings)

**Pass Criteria:**
- [ ] Section displays correctly
- [ ] Checkboxes functional

---

### Test 8.2: Enable Accessibility Features
**Steps:**
1. Check **Large text** checkbox
2. Check **Reduced motion** checkbox
3. Leave **High contrast** unchecked
4. Scroll to bottom → Click **Save Settings**

**Expected Results:**
- ✅ Settings save successfully
- ✅ Success message displays
- ✅ Checkboxes remain checked after save

**Pass Criteria:**
- [ ] Preferences persist on refresh
- [ ] Settings saved to tenant record

---

### Test 8.3: Verify on Customer Site
**Steps:**
1. Open new tab: `http://localhost:3001?tenant=lasreinas`
2. Observe page load

**Expected Results:**
- ✅ Large text applied by default (fonts bigger)
- ✅ Animations reduced/disabled (carousel, transitions)
- ✅ Accessibility panel button visible (♿)
- ✅ Customer can still toggle preferences

**Pass Criteria:**
- [ ] Defaults apply site-wide
- [ ] Customer overrides work
- [ ] No layout breaking

---

## TEST 9: CATERING TAB (7 min)

### Test 9.1: View Catering Options
**Steps:**
1. Click **Catering** tab in admin navigation
2. Observe catering manager interface

**Expected Results:**
- ✅ List of catering options (if seeded)
- ✅ Each option shows:
  - Name (e.g., "Taco Bar Catering")
  - Price
  - Serving info
  - Category (Regular or Holiday)
- ✅ Buttons: Add | Edit | Delete
- ✅ Empty state if no options: "No catering options yet"

**Pass Criteria:**
- [ ] Tab loads without errors
- [ ] Options display correctly

---

### Test 9.2: Add Catering Option
**Steps:**
1. Click **Add Catering Option** button
2. Fill form:
   - Name: "Enchilada Platter"
   - Description: "Cheese and chicken enchiladas with rice and beans"
   - Price: 120
   - Serving info: "Serves 10-15 people"
   - Category: Regular
3. Add removals:
   - "Sour Cream"
   - "Onions"
4. Add add-ons:
   - Label: "Extra Guacamole", Price: 15
   - Label: "Churros Dessert", Price: 20
5. Check **Featured** checkbox
6. Click **Save**

**Expected Results:**
- ✅ Form validates (price must be number, etc.)
- ✅ Removals/add-ons saved as arrays
- ✅ New option appears in list
- ✅ Success message displays

**Pass Criteria:**
- [ ] Option creates successfully
- [ ] All fields save correctly
- [ ] Available on customer site

---

### Test 9.3: Edit Catering Option
**Steps:**
1. Find "Enchilada Platter" (just created)
2. Click **Edit** icon
3. Change price to: 130
4. Add another add-on:
   - Label: "Aguas Frescas (2 gal)", Price: 25
5. Click **Save**

**Expected Results:**
- ✅ Price updates
- ✅ New add-on appears in list
- ✅ Existing add-ons preserved

**Pass Criteria:**
- [ ] Edit saves successfully
- [ ] No data loss

---

### Test 9.4: Delete Catering Option
**Steps:**
1. Select "Enchilada Platter"
2. Click **Delete** icon
3. Confirmation: "Are you sure?"
4. Click **Delete**

**Expected Results:**
- ✅ Option removed from list
- ✅ Success message
- ✅ Customer site no longer shows it

**Pass Criteria:**
- [ ] Deletion successful
- [ ] No orphaned data

---

### Test 9.5: Test on Customer Site
**Steps:**
1. Open customer site: `http://localhost:3001?tenant=lasreinas`
2. Scroll to see if catering button exists
3. Click **🎉 Catering** button (if feature enabled)

**Expected Results:**
- ✅ Catering panel slides in from right
- ✅ Gallery carousel displays
- ✅ All catering options listed
- ✅ Clicking option opens customization modal
- ✅ Removals and add-ons functional

**Pass Criteria:**
- [ ] Admin changes reflect on customer site
- [ ] Catering flow works end-to-end

---

## TEST 10: CUSTOMER CART TEST (via Frontend) (8 min)

### Test 10.1: Browse Catalog
**Steps:**
1. Navigate to: `http://localhost:3001?tenant=lasreinas`
2. Wait for page load
3. Observe hero banner and menu

**Expected Results:**
- ✅ Hero: 85vh height, gradient overlay
- ✅ Title: "Las Reinas Colusa" or personality title
- ✅ CTA button: "Explore Menu ✨"
- ✅ Stats grid: Total items, sections, featured
- ✅ Menu sections below

**Pass Criteria:**
- [ ] Page loads in <3 seconds
- [ ] All images load
- [ ] Red theme applied (#DC2626)

---

### Test 10.2: Layout Toggle Test
**Steps:**
1. Scroll to "Customize your view" section
2. See 3 layout buttons: Grid | List | Showcase
3. Click **List** button

**Expected Results:**
- ✅ Menu changes to list layout
- ✅ Items display horizontally (name on left, image on right)
- ✅ Button highlights: List becomes active

**Steps (continued):**
4. Click **Showcase** button

**Expected Results:**
- ✅ Menu changes to showcase layout
- ✅ Larger cards with prominent images
- ✅ Emphasis on visual presentation

**Steps (continued):**
5. Click **Grid** button (back to default)

**Expected Results:**
- ✅ Returns to 2-3 column grid layout

**Pass Criteria:**
- [ ] All 3 layouts work correctly
- [ ] Transitions smooth (no flash)
- [ ] Mobile: defaults to Showcase

---

### Test 10.3: Add Item to Cart
**Steps:**
1. Find "Quesabirrias (3)" item card
2. Click **Add to Cart** button (with cart icon)

**Expected Results:**
- ✅ Customization modal opens
- ✅ Shows item details:
  - Name, description, price
  - Image gallery (if multiple)
- ✅ Removals section:
  - Checkboxes for ingredients to exclude
- ✅ Add-ons section:
  - Checkboxes with prices
- ✅ Total price updates dynamically
- ✅ "Add to Cart · $XX.XX" button at bottom

**Steps (continued):**
3. Check removal: "Onions"
4. Check add-on: "Add Guacamole" (+$2.00)
5. Observe price change: $13.99 → $15.99
6. Click **Add to Cart**

**Expected Results:**
- ✅ Modal closes
- ✅ Success notification: "✓ Added to cart!"
- ✅ Cart button updates (shows count badge)

**Pass Criteria:**
- [ ] Customization works correctly
- [ ] Price calculations accurate
- [ ] Item added to cart state

---

### Test 10.4: View Cart
**Steps:**
1. Click floating **Cart** button (bottom-right)

**Expected Results:**
- ✅ Cart drawer slides in from right
- ✅ Shows added item:
  - Name: "Quesabirrias (3)"
  - Customizations: "No Onions, +Guacamole"
  - Price: $15.99
  - Quantity: 1
- ✅ Subtotal: $15.99
- ✅ Buttons: Continue Shopping | Proceed to Checkout

**Steps (continued):**
2. Increase quantity to 2
3. Observe price update: $15.99 → $31.98

**Pass Criteria:**
- [ ] Cart displays correctly
- [ ] Quantity changes work
- [ ] Price calculations accurate

---

### Test 10.5: Add Multiple Items
**Steps:**
1. Click "Continue Shopping" or close drawer
2. Add another item: "Burrito de Asada" (no customizations)
3. Add third item: "Horchata"
4. Open cart again

**Expected Results:**
- ✅ Cart shows 3 items
- ✅ Subtotal: sum of all items
- ✅ Can edit quantities
- ✅ Can remove items (X button)

**Pass Criteria:**
- [ ] Multiple items in cart
- [ ] All customizations preserved
- [ ] Totals accurate

---

### Test 10.6: Checkout Flow (Basic)
**Steps:**
1. Click **Proceed to Checkout**
2. Observe checkout form

**Expected Results:**
- ✅ Form sections:
  - Customer info (name, email, phone)
  - Fulfillment method (Pickup or Delivery)
  - Delivery address (if delivery selected)
  - Tip selection (15%, 20%, 25%, custom)
  - Payment method section
- ✅ All fields validated

**Note:** Full payment testing requires Stripe test cards. For now, verify form displays correctly.

**Pass Criteria:**
- [ ] Checkout form loads
- [ ] Validation works
- [ ] Can proceed to payment step

---

## TEST 11: CATALOG HERO BANNER TEST (5 min)

### Test 11.1: Hero Background Carousel
**Steps:**
1. On customer site: `http://localhost:3001?tenant=lasreinas`
2. Observe hero section (top, 85vh tall)
3. Wait 5 seconds

**Expected Results:**
- ✅ Background image rotates (4 images in carousel)
- ✅ Transition smooth (fade or slide)
- ✅ Gradient overlay maintains red theme
- ✅ Content (title, CTA) stays visible during transition

**Pass Criteria:**
- [ ] Carousel auto-rotates
- [ ] No flickering
- [ ] Images load properly

---

### Test 11.2: Hero CTA Button
**Steps:**
1. Click **Explore Menu ✨** button

**Expected Results:**
- ✅ Smooth scroll to `#menu` anchor
- ✅ Menu section comes into view
- ✅ No page jump or jarring movement

**Pass Criteria:**
- [ ] Scroll behavior smooth
- [ ] Button hover effect works (scale 1.05)

---

### Test 11.3: Stats Grid
**Steps:**
1. Observe stats grid below hero title
2. Verify displayed numbers

**Expected Results:**
- ✅ 4 stats displayed (or 2 on mobile):
  - Total items: 69
  - Sections: 10
  - Featured items: 7
  - Avg price: ~$11
- ✅ Stats are accurate (match database)
- ✅ Responsive: 2 columns mobile, 4 desktop

**Pass Criteria:**
- [ ] Stats display correctly
- [ ] Numbers accurate
- [ ] Layout responsive

---

## TEST 12: OPERATING HOURS TEST (5 min)

### Test 12.1: Set Operating Hours
**Steps:**
1. Admin → Settings → Scroll to **Operating Hours**
2. Set hours for Monday:
   - Open: 10:00 AM
   - Close: 9:00 PM
   - Closed: ☐ Unchecked
3. Repeat for all days (vary weekend hours)
4. Click **Save Settings**

**Expected Results:**
- ✅ Time pickers functional
- ✅ AM/PM selection works
- ✅ Can mark days as closed
- ✅ Settings save successfully

**Pass Criteria:**
- [ ] Hours save correctly
- [ ] Customer site shows accurate hours

---

### Test 12.2: Winter Mode Hours
**Steps:**
1. Toggle **Winter Mode** checkbox
2. Set winter date range:
   - Start: 12/01/2025
   - End: 03/01/2026
3. Set different winter hours (e.g., close 1 hour earlier)
4. Save settings

**Expected Results:**
- ✅ Winter hours section appears
- ✅ Date pickers work
- ✅ Can set different hours per day
- ✅ Saves successfully

**Pass Criteria:**
- [ ] Winter mode configurable
- [ ] Dates validate (end after start)

---

### Test 12.3: Holiday Closures
**Steps:**
1. Scroll to **Holiday Closures**
2. Click **Add Holiday**
3. Fill:
   - Date: 12/25/2025
   - Name: Christmas Day
4. Click **Add**
5. Repeat for New Year's Day (01/01/2026)
6. Save settings

**Expected Results:**
- ✅ Holidays appear in list
- ✅ Can add multiple holidays
- ✅ Can delete holidays
- ✅ Saves successfully

**Pass Criteria:**
- [ ] Holidays save correctly
- [ ] Customer site shows "Closed" on those dates

---

## TEST 13: CROSS-BROWSER & RESPONSIVE (10 min)

### Test 13.1: Desktop Browsers
**Test in each:**
- Chrome/Edge (primary)
- Firefox
- Safari (Mac only)

**Verify:**
- [ ] Admin loads correctly
- [ ] All tabs functional
- [ ] Forms submit successfully
- [ ] Images upload
- [ ] Customer site displays properly

---

### Test 13.2: Tablet View (768px - 1024px)
**Steps:**
1. Resize browser to 768px width
2. Test admin navigation

**Expected Results:**
- ✅ Tabs stack or collapse into hamburger menu
- ✅ Forms remain usable
- ✅ Tables scroll horizontally if needed

**Customer Site:**
- ✅ Hero maintains 85vh
- ✅ Menu grid: 2 columns
- ✅ Cart drawer full-width

**Pass Criteria:**
- [ ] All features accessible on tablet
- [ ] No layout breaking

---

### Test 13.3: Mobile View (375px - 414px)
**Steps:**
1. Resize to 375px (iPhone size)
2. Test navigation

**Expected Results:**
- ✅ Admin: Hamburger menu or bottom tab bar
- ✅ Forms: single column, large inputs
- ✅ Tables: card-based layout or horizontal scroll

**Customer Site:**
- ✅ Hero: 85vh (may adjust)
- ✅ Menu grid: 1 column
- ✅ Floating buttons: right side, above cart
- ✅ Cart drawer: full screen

**Pass Criteria:**
- [ ] All features work on mobile
- [ ] Touch targets ≥44px
- [ ] No horizontal overflow

---

## TEST 14: PERFORMANCE & LOAD TIME (5 min)

### Test 14.1: Page Load Speed
**Steps:**
1. Open Chrome DevTools → Network tab
2. Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
3. Observe load metrics

**Expected Results:**
- ✅ Admin dashboard: <2 seconds
- ✅ Customer site: <3 seconds
- ✅ Lighthouse Performance: 80+

**Pass Criteria:**
- [ ] Fast load times
- [ ] No render-blocking resources
- [ ] Images optimized

---

### Test 14.2: Memory & Console Errors
**Steps:**
1. Open Console tab
2. Navigate through all admin tabs
3. Check for errors

**Expected Results:**
- ✅ No JavaScript errors
- ✅ No 404s for assets
- ✅ No memory leaks (check Performance monitor)

**Pass Criteria:**
- [ ] Console clean (warnings ok, errors not)
- [ ] No critical issues

---

## 📊 TEST COMPLETION CHECKLIST

### Admin Dashboard
- [ ] Login & authentication
- [ ] Menu Manager (search, filter, CRUD)
- [ ] Sections Manager (reorder, CRUD)
- [ ] Menu Items (legacy editor)
- [ ] Image uploads (logo, hero, item photos)
- [ ] Payment settings
- [ ] Stripe Connect onboarding
- [ ] ADA/Accessibility settings
- [ ] Catering tab (CRUD)

### Customer Site
- [ ] Catalog display
- [ ] Layout toggles (Grid, List, Showcase)
- [ ] Add to cart with customization
- [ ] Cart drawer
- [ ] Checkout form
- [ ] Hero banner carousel
- [ ] Operating hours display

### Cross-Functional
- [ ] Tenant isolation (no cross-contamination)
- [ ] Responsive design (desktop, tablet, mobile)
- [ ] Cross-browser compatibility
- [ ] Performance metrics
- [ ] No console errors

---

## 🐛 BUG TRACKING TEMPLATE

**Bug ID:** #001
**Severity:** High | Medium | Low
**Component:** Admin/Customer Site
**Description:** [What went wrong]
**Steps to Reproduce:**
1.
2.
3.
**Expected:** [What should happen]
**Actual:** [What actually happened]
**Screenshot:** [If applicable]
**Browser:** Chrome 120.0 / Safari 17.0
**Resolution:** [Fix notes]

---

## ✅ SIGN-OFF

**Tester Name:** ___________________________
**Date:** ___________________________
**Pass Rate:** _____ / 100 tests passed
**Critical Issues:** _____ (must be 0 for production)
**Medium Issues:** _____ (should be <5)
**Low Issues:** _____ (acceptable <10)

**Overall Status:** ☐ PASS  ☐ FAIL  ☐ CONDITIONAL PASS

**Notes:**
_____________________________________________
_____________________________________________
_____________________________________________

---

**END OF TEST SCRIPT**
**Version:** 1.0
**Last Updated:** November 18, 2025
**Total Tests:** ~100 test cases
**Estimated Duration:** 45-60 minutes
