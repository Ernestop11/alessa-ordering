# PRE-PRESENTATION CHECKLIST - LAS REINAS DEMO
**Complete Testing & Setup Guide**
**Last Updated:** November 18, 2025
**Demo Date:** [Fill in]

---

## 🎯 OVERVIEW

This checklist ensures the Las Reinas admin demo runs flawlessly. Complete all sections in order, checking off each item as you go.

**Total Time Required:** 90-120 minutes
- Database setup: 15 min
- Asset preparation: 20 min
- Feature testing: 45 min
- Rehearsal: 30 min

**Day Before Demo:** Complete sections 1-5
**Day of Demo:** Complete sections 6-8

---

## ✅ SECTION 1: ENVIRONMENT SETUP (15 min)

### Database:

- [ ] PostgreSQL is running
  ```bash
  # Check if PostgreSQL is running
  pg_isready
  # Should output: accepting connections
  ```

- [ ] Database exists and is accessible
  ```bash
  # Test connection
  psql $DATABASE_URL -c "SELECT 1;"
  # Should return: 1 row
  ```

- [ ] Run fresh migration
  ```bash
  npx prisma migrate deploy
  # Should complete without errors
  ```

- [ ] Seed Las Reinas tenant data
  ```bash
  npm run seed:lasreinas
  # Or if script doesn't exist:
  node scripts/seed-tenant.mjs lasreinas
  ```

- [ ] Verify 69 menu items seeded
  ```bash
  psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"MenuItem\" WHERE \"tenantId\" = (SELECT id FROM \"Tenant\" WHERE slug = 'lasreinas');"
  # Should return: 69
  ```

- [ ] Verify menu sections exist
  ```bash
  psql $DATABASE_URL -c "SELECT name FROM \"MenuSection\" WHERE \"tenantId\" = (SELECT id FROM \"Tenant\" WHERE slug = 'lasreinas') ORDER BY position;"
  # Should show: Desayunos, Quesabirrias, Tacos, Burritos, etc.
  ```

- [ ] Create admin user (if doesn't exist)
  ```bash
  # Run admin creation script or manually insert
  # Email: admin@lasreinas.com
  # Password: demo123
  ```

- [ ] Verify admin user can authenticate
  ```bash
  # Test login via API or UI
  curl -X POST http://localhost:3001/api/admin/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@lasreinas.com","password":"demo123"}'
  # Should return: success + session token
  ```

### Environment Variables:

- [ ] `.env` file exists and has all required variables
  ```bash
  cat .env | grep -E "DATABASE_URL|STRIPE_SECRET_KEY|STRIPE_PUBLISHABLE_KEY|NEXTAUTH_SECRET"
  ```

- [ ] `DATABASE_URL` points to correct database
- [ ] `STRIPE_SECRET_KEY` is set (use TEST mode: `sk_test_...`)
- [ ] `STRIPE_PUBLISHABLE_KEY` is set (use TEST mode: `pk_test_...`)
- [ ] `NEXTAUTH_SECRET` is set (generate if missing: `openssl rand -base64 32`)
- [ ] `DOORDASH_DEVELOPER_ID` is set (or empty for demo mode)
- [ ] `DOORDASH_SIGNING_SECRET` is set (or empty for demo mode)

### Node & Dependencies:

- [ ] Node version is correct (v18+)
  ```bash
  node --version
  # Should be: v18.x or higher
  ```

- [ ] Dependencies are installed
  ```bash
  npm install
  # Should complete without errors
  ```

- [ ] No outdated critical packages
  ```bash
  npm outdated
  # Check for security vulnerabilities
  npm audit --production
  ```

- [ ] TypeScript compiles without errors
  ```bash
  npm run test:types
  # Should show: No errors found
  ```

- [ ] Build succeeds
  ```bash
  npm run build
  # Should complete without errors (may take 2-3 min)
  ```

---

## ✅ SECTION 2: ASSETS & MEDIA (20 min)

### Las Reinas Assets:

- [ ] Logo exists at correct path
  ```bash
  ls -lh public/tenant/lasreinas/images/logo.png
  # Should exist, ~50-200 KB
  ```

- [ ] Logo loads in browser
  - Open: `http://localhost:3001/tenant/lasreinas/images/logo.png`
  - Should display: Las Reinas logo (red/gold)

- [ ] Hero images exist (4 total for carousel)
  ```bash
  ls -lh public/tenant/lasreinas/images/hero-*
  # Should list 4 files:
  # hero-quesabirria-action.jpg
  # hero-tacos-spread.jpg
  # hero-restaurant-interior.jpg
  # hero-family-dining.jpg
  ```

- [ ] All hero images load in browser
  - Test each: `http://localhost:3001/tenant/lasreinas/images/hero-quesabirria-action.jpg`

- [ ] Upload directory is writable
  ```bash
  mkdir -p public/uploads
  chmod 755 public/uploads
  ls -ld public/uploads
  # Should show: drwxr-xr-x
  ```

### Demo Sample Assets:

- [ ] Prepare sample food photo for upload demo
  - File: `quesabirria-professional.jpg`
  - Size: 500-800 KB (high quality)
  - Dimensions: 1200x800 or similar
  - Location: Desktop or easily accessible folder

- [ ] Prepare backup screenshots (in case live demo fails)
  - Screenshot: Admin dashboard with orders
  - Screenshot: Menu Manager with 69 items
  - Screenshot: Settings page
  - Screenshot: Stripe connected success
  - Screenshot: Customer catalog page
  - Save to: `demo-screenshots/` folder

---

## ✅ SECTION 3: DEVELOPMENT SERVER (10 min)

### Start Server:

- [ ] Start development server
  ```bash
  npm run dev
  ```

- [ ] Server starts without errors
  - Check console for "Ready on http://localhost:3001"
  - Should NOT see red error messages

- [ ] Server responds to requests
  ```bash
  curl -I http://localhost:3001
  # Should return: HTTP/1.1 200 OK
  ```

- [ ] Hot reload works
  - Edit any file (add a comment)
  - Save
  - Check console for "compiled successfully"

### Port & Network:

- [ ] Port 3001 is not blocked by firewall
- [ ] localhost resolves correctly
  ```bash
  ping localhost
  # Should ping 127.0.0.1
  ```

- [ ] No port conflicts
  ```bash
  lsof -i :3001
  # Should only show node process
  ```

---

## ✅ SECTION 4: CUSTOMER-FACING SITE TESTING (20 min)

### Basic Load:

- [ ] Customer site loads
  - Navigate to: `http://localhost:3001?tenant=lasreinas`
  - Page should load in < 2 seconds

- [ ] Hero banner displays
  - Should show: Las Reinas hero image with overlay
  - Height: ~85vh (tall, prominent)
  - Colors: Red/gold gradient overlay

- [ ] Hero carousel works
  - Wait 5 seconds
  - Image should transition to next hero
  - Should cycle through 4 images

- [ ] Menu statistics display
  - Below hero, should show: "69 items across 10 sections"

### Menu Catalog:

- [ ] Menu sections render
  - Should see sections: Desayunos, Quesabirrias, Tacos, Burritos, etc.
  - Each section should have a header

- [ ] Menu items display
  - Each item should show:
    - Name
    - Description (if exists)
    - Price
    - Image (if uploaded)
    - "Add to Cart" button

- [ ] Item images load
  - Check that uploaded images appear
  - No broken image icons

- [ ] Prices formatted correctly
  - Should show: $13.99 (not 13.99 or $13.990000)

### Layout Toggles:

- [ ] "Customize your view" section exists
  - Should be below hero, above menu

- [ ] Grid view button works
  - Click "Grid"
  - Items should display in 2-3 column grid

- [ ] List view button works
  - Click "List"
  - Items should display horizontally with image on left

- [ ] Showcase view button works
  - Click "Showcase"
  - Items should display with large images, card layout

- [ ] Layout preference persists
  - Select "List"
  - Refresh page
  - Should still be in List view

### Add to Cart:

- [ ] Click "Add to Cart" on any item
  - Modal should open
  - Should show: item name, price, description, image

- [ ] Removals section works
  - If item has removals (e.g., "No Onions"), checkboxes appear
  - Uncheck "Onions"
  - Should remain unchecked

- [ ] Add-ons section works
  - If item has add-ons (e.g., "Add Guacamole $2.00"), checkboxes appear
  - Check "Add Guacamole"
  - Price should update: $13.99 → $15.99

- [ ] Quantity selector works
  - Increase quantity to 2
  - Price should double: $15.99 → $31.98

- [ ] Special instructions field works
  - Type: "Please add extra napkins"
  - Should accept text

- [ ] "Add to Cart" button works
  - Click button
  - Modal should close
  - Cart icon should show badge: (1)

### Cart:

- [ ] Cart icon shows item count
  - After adding item, badge should show: (1)

- [ ] Click cart icon
  - Cart drawer should slide in from right

- [ ] Cart displays items correctly
  - Should show: item name, quantity, price, customizations

- [ ] Quantity can be updated in cart
  - Click + or - buttons
  - Quantity should update
  - Total should recalculate

- [ ] Items can be removed from cart
  - Click "Remove" or trash icon
  - Item should disappear
  - Total should update

- [ ] Cart shows correct subtotal
  - Add multiple items
  - Subtotal should sum correctly

### Catering Panel:

- [ ] Catering button exists
  - Should be on left side (desktop) or right side (mobile)
  - Icon: 🎉 or party icon

- [ ] Click catering button
  - Slide-in panel should appear from left

- [ ] Catering gallery displays
  - Should show 4-6 catering setup photos

- [ ] Catering options display
  - Should show 8 options:
    - Taco Bar
    - Family Platters
    - Breakfast Catering
    - Quesabirria Feast
    - Burrito Station
    - Dessert Platter
    - Aguas Frescas Bar
    - Full Event Catering

- [ ] Click a catering option
  - Modal should open with customization form
  - Should show: name, description, price, serving info

- [ ] Catering removals/add-ons work
  - Similar to regular menu items

- [ ] Close catering panel
  - Click X or outside panel
  - Panel should slide out

### Accessibility Panel:

- [ ] Accessibility button exists
  - Should be on left side (desktop)
  - Icon: ♿ or accessibility icon

- [ ] Click accessibility button
  - Panel should open

- [ ] High contrast toggle works
  - Toggle on
  - Colors should change (higher contrast)
  - Toggle off
  - Colors should revert

- [ ] Large text toggle works
  - Toggle on
  - Text should increase in size
  - Toggle off
  - Text should return to normal

- [ ] Reduced motion toggle works
  - Toggle on
  - Animations should slow or stop (hero carousel, transitions)
  - Toggle off
  - Animations should resume

- [ ] Accessibility preferences persist
  - Enable all 3 toggles
  - Refresh page
  - All 3 should still be enabled

### Mobile Responsiveness:

- [ ] Open dev tools (F12)
- [ ] Toggle device toolbar (Cmd+Shift+M or Ctrl+Shift+M)

- [ ] Test on iPhone SE (375px)
  - Hero should be 85vh
  - Menu should be single column
  - Cart icon should be visible
  - Catering/accessibility buttons should be on right side

- [ ] Test on iPad (768px)
  - Menu should be 2 columns
  - Layout should be tablet-optimized

- [ ] Test on desktop (1920px)
  - Menu should be 3 columns
  - Full desktop layout

---

## ✅ SECTION 5: ADMIN DASHBOARD TESTING (45 min)

### Login:

- [ ] Navigate to: `http://localhost:3001/admin/login`
- [ ] Page loads without errors

- [ ] Enter credentials:
  - Email: `admin@lasreinas.com`
  - Password: `demo123`

- [ ] Click "Sign In"
  - Should redirect to `/admin`
  - Should NOT show login error

- [ ] Dashboard loads
  - Should see header with logo/name (or "Restaurant Dashboard")
  - Should see onboarding checklist
  - Should see tab navigation

### Onboarding Checklist:

- [ ] Checklist displays 4 items:
  - [ ] Publish Menu
  - [ ] Connect Stripe
  - [ ] Configure Delivery
  - [ ] Set Up Printer

- [ ] "Publish Menu" shows green checkmark (✅)
  - Should show: "69 items"

- [ ] Other items show status (green ✅ or red ❌ or yellow ⚠️)

### Menu Manager Tab:

- [ ] Click "Menu Manager" tab
- [ ] Page loads without errors

- [ ] Summary cards display:
  - Total Items: 69
  - Frontend Visible: 62 (or similar)
  - Orphaned Items: 7 (or similar)

- [ ] Filter tabs exist:
  - All
  - Live
  - Orphaned
  - Hidden

- [ ] Click "All" filter
  - Should show all 69 items in table

- [ ] Click "Orphaned" filter
  - Should show only orphaned items (no section assigned)
  - Count should match summary card

- [ ] Click "Live" filter
  - Should show only items visible on frontend

- [ ] Click "Hidden" filter
  - Should show only items marked unavailable

- [ ] Search bar works:
  - Type: "Quesabirria"
  - List should filter to matching items
  - Should find: Quesabirrias (3 count), Quesabirria Plate, etc.

- [ ] Clear search:
  - Delete text
  - All items should reappear

- [ ] Assign section to orphaned item:
  - Click "Orphaned" filter
  - Find first orphaned item
  - Click "Assign Section" dropdown
  - Select "Desserts" (or any section)
  - Item should move to "Live" filter
  - Orphaned count should decrease by 1

- [ ] Toggle visibility:
  - Find any visible item (green badge)
  - Click eye icon or toggle
  - Badge should change to gray "Hidden"
  - Click again
  - Badge should return to green "Visible"

- [ ] Edit item:
  - Click pencil/edit icon
  - Modal should open
  - Should show: name, price, description, section, removals, add-ons
  - Make a change (e.g., update description)
  - Click "Save"
  - Modal should close
  - Success notification should appear

- [ ] Reordering (if Fix #3 applied):
  - Find item with up/down arrows
  - Click down arrow
  - Item should move down one position
  - Click up arrow
  - Item should move back up

### Menu Sections Tab:

- [ ] Click "Sections" tab
- [ ] Sections list displays
  - Should show: Desayunos, Quesabirrias, Tacos, Burritos, etc.

- [ ] Sections are in correct order
  - Should match customer site order

- [ ] Reorder sections:
  - Find section with up/down arrows
  - Click down arrow
  - Section should move down
  - Click up arrow
  - Section should move back up

- [ ] Edit section:
  - Click edit icon
  - Modal should open
  - Change name (e.g., "Breakfast" → "Desayunos")
  - Click "Save"
  - Change should persist

- [ ] Add new section:
  - Click "Add Section" button
  - Modal should open
  - Enter: Name "Seasonal Specials", Description "Limited time offers"
  - Click "Create"
  - New section should appear in list

- [ ] Delete section:
  - Click delete icon on test section
  - Confirmation modal should appear
  - Click "Confirm"
  - Section should disappear

### Orders Tab:

- [ ] Click "Orders" tab
- [ ] Orders list displays

- [ ] If no orders exist:
  - Should show empty state: "No orders yet"
  - Place test order from customer site (see Section 4)
  - Return to Orders tab
  - Order should appear

- [ ] If orders exist:
  - Should show list of order cards
  - Each card should show:
    - Order number (#1047)
    - Customer name & phone
    - Status badge (NEW, PREPARING, READY, COMPLETED)
    - Total price
    - Timestamp

- [ ] Click order to expand:
  - Full details should appear:
    - Customer info
    - Delivery address (if delivery order)
    - Items list with customizations
    - Payment method
    - Special instructions

- [ ] Change order status:
  - Click "Mark as Preparing"
  - Status should change to PREPARING
  - Badge color should update
  - Click "Mark as Ready"
  - Status should change to READY
  - Click "Mark as Completed"
  - Status should change to COMPLETED

- [ ] Fulfillment Board (if exists):
  - Click "Open Fulfillment Board" button
  - Kanban board should appear
  - Should show 4 columns: NEW, PREPARING, READY, COMPLETED
  - Drag order from NEW to PREPARING
  - Order should move
  - Status should update

- [ ] Refund order (if implemented):
  - Find completed order
  - Click "Refund" button
  - Confirmation modal should appear
  - Select "Full refund"
  - Enter reason: "Customer cancelled"
  - Click "Confirm"
  - Success message should appear
  - Order status should change to REFUNDED

### Settings Tab:

- [ ] Click "Settings" tab
- [ ] Settings page loads without errors

**Restaurant Information Section:**

- [ ] Fields display:
  - Name: "Las Reinas Colusa"
  - Phone: (530) XXX-XXXX
  - Email: info@lasreinascolusa.com
  - Address: 1234 Main St, Colusa, CA 95932

- [ ] Edit restaurant name:
  - Change to: "Las Reinas Colusa - Authentic Mexican Food"
  - Scroll down, click "Save Settings"
  - Success notification should appear
  - Refresh page
  - Change should persist

**Operating Hours Section:**

- [ ] 7-day grid displays:
  - Monday - Sunday rows
  - Each has: Closed checkbox, Open time, Close time

- [ ] Set hours:
  - Monday: 10:00 AM - 9:00 PM
  - Friday: 10:00 AM - 10:00 PM
  - Sunday: Check "Closed"

- [ ] Winter Mode toggle:
  - Check "Enable Winter Mode"
  - Additional fields should appear:
    - Start Date
    - End Date
    - Winter hours grid
  - Set dates: Dec 1 2025 - Mar 1 2026
  - Set winter hours: 11:00 AM - 8:00 PM (all days)

- [ ] Holiday closures:
  - Click "Add Holiday"
  - New row should appear
  - Enter: Date 12/25/2025, Name "Christmas Day"
  - Click "Add"
  - Holiday should appear in list
  - Add another: 01/01/2026, "New Year's Day"

- [ ] Save settings:
  - Scroll to bottom
  - Click "Save Settings"
  - Success notification should appear

**Payments Section (Stripe):**

- [ ] If Stripe NOT connected:
  - Should show blue card: "Connect Your Stripe Account"
  - Should list benefits:
    - Secure payment processing
    - Automatic daily payouts
    - PCI-compliant
    - 2.9% + $0.30 per transaction
  - Should show button: "Connect with Stripe"

- [ ] Click "Connect with Stripe":
  - Button should show loading spinner
  - Text should change to "Redirecting to Stripe..."
  - *In production*: Would redirect to Stripe OAuth
  - *For demo*: Manually navigate to `/admin/stripe-connect/complete`

- [ ] Stripe success page:
  - Navigate to: `http://localhost:3001/admin/stripe-connect/complete`
  - Should show:
    - Green checkmark icon
    - "Success!"
    - "Your Stripe account is connected..."
    - Auto-redirect countdown (2 seconds)
  - Wait for redirect back to `/admin?tab=settings`

- [ ] After connection:
  - Payments section should now show green card:
    - "Stripe Connected ✓"
    - Account ID: acct_XXXXXXXX
    - Business name: Las Reinas Colusa
    - Status: Payments enabled ✓, Payouts enabled ✓
  - Should show button: "Disconnect"
  - Should show link: "View in Stripe Dashboard"

**Accessibility Defaults Section:**

- [ ] Section exists with title: "Accessibility Defaults"
- [ ] 3 checkboxes display:
  - [ ] High contrast mode
  - [ ] Large text
  - [ ] Reduced motion

- [ ] Check "Large text"
  - Checkbox should be checked

- [ ] Check "High contrast"
  - Checkbox should be checked

- [ ] Save settings:
  - Click "Save Settings"
  - Success notification

- [ ] Test on customer site:
  - Open: `http://localhost:3001?tenant=lasreinas` in new tab
  - Text should be larger by default
  - Contrast should be higher
  - (Note: Customers can still override via accessibility panel)

**Notification Preferences Section (if Fix #2 applied):**

- [ ] Section exists with title: "Notification Preferences"

- [ ] Email toggle:
  - [ ] Email me when new orders arrive
  - Check the checkbox
  - Should enable

- [ ] SMS toggle:
  - [ ] Send SMS for urgent orders
  - Should be disabled
  - Should show "Coming Soon" badge

- [ ] Webhook URL:
  - Field should accept text
  - Enter: `https://webhook.site/unique-id`
  - Should save

- [ ] Save settings:
  - Click "Save Settings"
  - Success notification

### Catering Tab:

- [ ] Click "Catering" tab
- [ ] Catering options list displays

- [ ] Should show 8 options:
  - Taco Bar
  - Family Platters
  - Breakfast Catering
  - Quesabirria Feast
  - Burrito Station
  - Dessert Platter
  - Aguas Frescas Bar
  - Full Event Catering

- [ ] Each option shows:
  - Name
  - Price
  - Serving info (e.g., "Serves 10-15")
  - Category (Regular or Holiday)
  - Edit/Delete buttons

- [ ] Add new catering option:
  - Click "Add Catering Option"
  - Modal should open
  - Fill form:
    - Name: "Enchilada Platter"
    - Description: "Cheese and chicken enchiladas with rice and beans"
    - Price: 120
    - Serving Info: "Serves 10-15 people"
    - Category: Regular
  - Add removal: "Sour Cream"
  - Add add-on: "Extra Guacamole", $15
  - Click "Save"
  - New option should appear in list

- [ ] Edit catering option:
  - Click edit icon on existing option
  - Modal should open
  - Change price: 120 → 125
  - Click "Save"
  - Price should update

- [ ] Delete catering option:
  - Click delete icon on test option
  - Confirmation modal should appear
  - Click "Confirm"
  - Option should disappear

- [ ] Verify on customer site:
  - Open customer site
  - Click Catering button
  - New option should appear
  - Deleted option should be gone

### Customers Tab:

- [ ] Click "Customers" tab
- [ ] Customers list displays (may be empty if no orders placed)

- [ ] If customers exist:
  - Should show: name, email, phone, order count, total spent

### Customize Tab (Theme/Branding):

- [ ] Click "Customize" tab (if exists)
- [ ] Theme settings display

- [ ] Primary color picker:
  - Should show current color (red for Las Reinas)
  - Click color picker
  - Change color (test only - don't save)

- [ ] Logo upload:
  - Click "Upload Logo"
  - Select file
  - Upload should complete
  - Preview should appear

- [ ] Hero images:
  - Should show current hero images
  - Can upload new ones (test only)

### Logs Tab (if exists):

- [ ] Click "Logs" tab
- [ ] Activity logs display:
  - Recent admin actions
  - Login events
  - Order status changes
  - Settings updates

---

## ✅ SECTION 6: IMAGE UPLOAD TESTING (10 min)

### Prepare Test Image:

- [ ] Have sample image ready:
  - File: `quesabirria-professional.jpg`
  - Size: 500-800 KB
  - Format: JPG or PNG
  - Dimensions: 1200x800 (landscape)

### Upload via Menu Manager:

- [ ] Navigate to: `/admin?tab=menu-manager`
- [ ] Search for: "Quesabirrias"
- [ ] Click edit icon

- [ ] In edit modal:
  - Scroll to Image Upload section
  - Click "Upload Image" button (or drag-and-drop zone)

- [ ] Select file:
  - Choose `quesabirria-professional.jpg`
  - Click "Open"

- [ ] Watch upload:
  - Progress bar should appear
  - Should show: 0% → 25% → 50% → 75% → 100%
  - Upload should complete in < 5 seconds (locally)

- [ ] Preview appears:
  - Image should render in modal
  - Should show file name and size

- [ ] Save changes:
  - Click "Save Changes"
  - Modal should close
  - Success notification

- [ ] Verify in Menu Manager:
  - Find "Quesabirrias" in list
  - Thumbnail should show new image

- [ ] Verify on customer site:
  - Open: `http://localhost:3001?tenant=lasreinas`
  - Scroll to Quesabirrias item
  - Should show new uploaded image

### Upload Error Handling:

- [ ] Test oversized file (if validation exists):
  - Try uploading 10 MB file
  - Should show error: "File too large"

- [ ] Test wrong file type (if validation exists):
  - Try uploading .txt or .pdf
  - Should show error: "Invalid file type"

- [ ] Test no network (simulate):
  - Open dev tools
  - Go to Network tab
  - Set throttling to "Offline"
  - Try upload
  - Should show error: "Upload failed"
  - Restore network

---

## ✅ SECTION 7: CROSS-BROWSER & PERFORMANCE (15 min)

### Browser Testing:

**Chrome:**
- [ ] Open in Chrome
- [ ] Admin login works
- [ ] Dashboard loads correctly
- [ ] All tabs functional
- [ ] No console errors (F12 → Console)

**Firefox:**
- [ ] Open in Firefox
- [ ] Admin login works
- [ ] Dashboard loads correctly
- [ ] All tabs functional
- [ ] No console errors

**Safari (if on Mac):**
- [ ] Open in Safari
- [ ] Admin login works
- [ ] Dashboard loads correctly
- [ ] All tabs functional
- [ ] No console errors

### Performance:

- [ ] Page load time (admin dashboard):
  - Open dev tools → Network tab
  - Hard refresh (Cmd+Shift+R or Ctrl+Shift+F5)
  - Check "Load" time at bottom
  - Should be: < 2 seconds

- [ ] Page load time (customer site):
  - Open: `http://localhost:3001?tenant=lasreinas`
  - Hard refresh
  - Should be: < 2 seconds

- [ ] Menu Manager load time:
  - Navigate to Menu Manager tab
  - Should load 69 items in < 1 second

- [ ] Image load time:
  - Customer site, scroll through menu
  - Images should appear immediately (no lazy loading delay)

- [ ] No memory leaks:
  - Open dev tools → Memory tab
  - Take heap snapshot
  - Navigate through all tabs
  - Take another heap snapshot
  - Compare - should not grow significantly (< 50 MB increase)

### Accessibility (WCAG):

- [ ] Run Lighthouse audit:
  - Open dev tools
  - Go to Lighthouse tab
  - Select "Accessibility"
  - Click "Generate report"
  - Score should be: > 90

- [ ] Test keyboard navigation:
  - Tab through admin dashboard
  - All interactive elements should be focusable
  - Focus indicators should be visible
  - Enter/Space should activate buttons

- [ ] Test screen reader (VoiceOver on Mac, NVDA on Windows):
  - Enable screen reader
  - Navigate admin dashboard
  - All labels should be read correctly
  - Form fields should announce their labels

---

## ✅ SECTION 8: DEMO DAY SETUP (30 min)

### Browser Preparation:

- [ ] Clear browser cache:
  - Chrome: Settings → Privacy → Clear browsing data
  - Select: Cached images and files
  - Time range: All time
  - Click "Clear data"

- [ ] Open incognito/private window:
  - Chrome: Cmd+Shift+N (Mac) or Ctrl+Shift+N (Windows)
  - Firefox: Cmd+Shift+P or Ctrl+Shift+P
  - Safari: Cmd+Shift+N

- [ ] Bookmark critical URLs:
  - `http://localhost:3001/admin/login` → "Admin Login"
  - `http://localhost:3001/admin` → "Admin Dashboard"
  - `http://localhost:3001?tenant=lasreinas` → "Las Reinas Customer Site"
  - `http://localhost:3001/admin/stripe-connect/complete` → "Stripe Success"

- [ ] Set browser zoom to 100%:
  - View → Actual Size (or Cmd+0 / Ctrl+0)

- [ ] Hide bookmarks bar (cleaner look):
  - View → Hide Bookmarks Bar (or Cmd+Shift+B / Ctrl+Shift+B)

- [ ] Close dev tools console:
  - Unless presenting to technical audience
  - F12 or Cmd+Option+I to toggle

- [ ] Disable browser notifications:
  - Settings → Privacy → Site Settings → Notifications
  - Block all (prevent demo interruptions)

- [ ] Use full-screen mode (optional):
  - View → Enter Full Screen (or F11)
  - Exit: Press Esc

### Display Setup:

- [ ] If using external monitor/projector:
  - Connect display
  - Set to "Mirror Displays" (same content on both screens)
  - Or "Extend Displays" (browser on external, notes on laptop)

- [ ] Adjust screen resolution:
  - Set to: 1920x1080 or 1280x720 (readable from back row)

- [ ] Increase font size (if needed):
  - Browser zoom: 110% or 125%
  - OS zoom: System Preferences → Displays → Scaled

- [ ] Hide desktop icons (cleaner look):
  - Mac: Right-click desktop → Show View Options → Uncheck "Show items"
  - Windows: Right-click desktop → View → Uncheck "Show desktop icons"

- [ ] Close unnecessary apps:
  - Email, Slack, Messages, Spotify, etc.
  - Keep only: Browser, Terminal (for server), Notes (for script)

### Script & Notes:

- [ ] Print or have digital copy of demo script:
  - File: `ADMIN_COMPLETE_DEMO_SCRIPT.md`
  - Keep on second screen or printed paper

- [ ] Have backup screenshots ready:
  - In case live demo fails
  - Folder: `demo-screenshots/`

- [ ] Prepare Q&A notes:
  - File: Section in `DEMO_SPEAKING_SCRIPT.md`
  - Common questions + answers

### Audio/Video (if remote presentation):

- [ ] Test microphone:
  - Open Zoom/Meet test call
  - Speak, verify audio is clear

- [ ] Test camera:
  - Verify video feed is working
  - Check lighting, background

- [ ] Test screen sharing:
  - Share screen in test call
  - Verify browser window is visible
  - Check resolution is readable

- [ ] Mute notifications:
  - Mac: System Preferences → Notifications → Do Not Disturb
  - Windows: Settings → System → Focus Assist → Alarms only

### Final Checks:

- [ ] Server is running:
  ```bash
  # In terminal
  npm run dev
  # Should show: Ready on http://localhost:3001
  ```

- [ ] No errors in server logs:
  - Check terminal for red error messages
  - Should only see: "Compiled successfully"

- [ ] Admin login works:
  - Navigate to `/admin/login`
  - Enter credentials
  - Should reach dashboard

- [ ] Customer site loads:
  - Navigate to `?tenant=lasreinas`
  - Should see hero, menu, catering button

- [ ] Test order flow:
  - Add item to cart
  - Go to checkout
  - Verify order appears in admin Orders tab

- [ ] Stripe success page loads:
  - Navigate to `/admin/stripe-connect/complete`
  - Should show green checkmark
  - Should auto-redirect after 2 seconds

---

## ✅ SECTION 9: REHEARSAL (30 min)

### Full Run-Through:

- [ ] Set a timer for 15 minutes (or target demo duration)

- [ ] Follow demo script from start to finish:
  - SCENE 1: Login
  - SCENE 2: Dashboard overview
  - SCENE 3: Menu Manager
  - SCENE 4: Editing items
  - SCENE 5: Uploading photos
  - SCENE 6: Setting hours
  - SCENE 7: Viewing orders
  - SCENE 8: Processing refund
  - SCENE 9: Stripe connection
  - SCENE 10: DoorDash demo
  - SCENE 11: Accessibility settings
  - SCENE 12: Final overview

- [ ] Practice transitions between tabs:
  - Smooth, deliberate clicks
  - Pause after each tab to let content load

- [ ] Practice speaking script:
  - Read aloud
  - Speak slowly, clearly
  - Make eye contact with imaginary audience (not screen)

- [ ] Time each section:
  - Note which sections are too long
  - Identify areas to trim if needed

- [ ] Practice handling errors:
  - What if image upload fails?
  - What if server crashes?
  - Have fallback plan ready

### Record Rehearsal (Optional):

- [ ] Record screen + audio:
  - Mac: Cmd+Shift+5 → Record Entire Screen
  - Windows: Xbox Game Bar (Win+G) → Capture

- [ ] Watch recording:
  - Note awkward pauses
  - Identify unclear explanations
  - Check for technical glitches

- [ ] Refine script based on recording

### Backup Plan:

- [ ] Create backup video recording:
  - Record full demo in advance
  - Save as: `las-reinas-demo-backup.mp4`
  - Use if live demo fails

- [ ] Prepare slideshow backup:
  - Screenshots of each scene
  - PowerPoint or Keynote
  - Use if video and live demo both fail

---

## ✅ SECTION 10: DAY-OF CHECKLIST (15 min before demo)

### 15 Minutes Before:

- [ ] Restart computer (fresh start, clear memory)
- [ ] Close all applications except browser and terminal
- [ ] Start development server:
  ```bash
  npm run dev
  ```
- [ ] Wait for "Ready on http://localhost:3001"

### 10 Minutes Before:

- [ ] Open browser in incognito mode
- [ ] Navigate to admin login page
- [ ] Verify page loads
- [ ] Navigate to customer site
- [ ] Verify page loads

### 5 Minutes Before:

- [ ] Log into admin dashboard
- [ ] Click through all tabs to verify they load
- [ ] Place test order from customer site
- [ ] Verify order appears in Orders tab

### 2 Minutes Before:

- [ ] Return to admin login page (starting point)
- [ ] Close dev tools (unless showing to technical audience)
- [ ] Set browser to full screen (or desired view)
- [ ] Take a deep breath
- [ ] Have water nearby

---

## 🎯 CRITICAL PATHS TO VERIFY

These are the **must-work** features for the demo. If any of these fail, the demo is at risk.

### Critical Path 1: Admin Login

1. Navigate to `/admin/login`
2. Enter `admin@lasreinas.com` / `demo123`
3. Click "Sign In"
4. Should reach `/admin` dashboard

**If fails:** Use backup screenshots or video

### Critical Path 2: Menu Manager

1. Click "Menu Manager" tab
2. Should show 69 items
3. Search for "Quesabirria"
4. Should filter results

**If fails:** Use "Menu" tab instead, or show screenshots

### Critical Path 3: Settings

1. Click "Settings" tab
2. Scroll through sections
3. All sections should load

**If fails:** Describe features verbally, use screenshots

### Critical Path 4: Customer Site

1. Navigate to `?tenant=lasreinas`
2. Hero should display
3. Menu items should load
4. Add to cart should work

**If fails:** Use backup screenshots or pre-recorded walkthrough

### Critical Path 5: Stripe Flow

1. Navigate to `/admin/stripe-connect/complete`
2. Success page should display
3. Should auto-redirect to Settings

**If fails:** Explain flow verbally, show Stripe documentation

---

## 🚨 TROUBLESHOOTING GUIDE

### Server won't start:

**Symptom:** `npm run dev` fails or hangs

**Solutions:**
1. Check port 3001 is free: `lsof -i :3001` → kill process if needed
2. Delete `.next` folder: `rm -rf .next`
3. Reinstall dependencies: `rm -rf node_modules && npm install`
4. Check database is running: `pg_isready`

### Database connection fails:

**Symptom:** "Could not connect to database" error

**Solutions:**
1. Verify PostgreSQL is running: `pg_isready`
2. Check `.env` has correct `DATABASE_URL`
3. Test connection: `psql $DATABASE_URL -c "SELECT 1;"`
4. Restart PostgreSQL: `brew services restart postgresql` (Mac)

### Admin login fails:

**Symptom:** "Invalid credentials" error

**Solutions:**
1. Verify admin user exists in database
2. Check password is correct (`demo123`)
3. Reset password via database if needed
4. Check session configuration in `.env`

### Images don't load:

**Symptom:** Broken image icons

**Solutions:**
1. Check files exist in `public/tenant/lasreinas/images/`
2. Verify correct paths (no typos)
3. Check file permissions: `chmod 644 public/tenant/lasreinas/images/*`
4. Clear browser cache and hard refresh

### Stripe page redirects to wrong URL:

**Symptom:** Redirects to 404 or wrong page

**Solutions:**
1. Manually navigate to `/admin/stripe-connect/complete`
2. Explain OAuth flow verbally
3. Show green "Connected" card screenshot

### Menu Manager shows 0 items:

**Symptom:** Empty table, no items

**Solutions:**
1. Check tenant slug is correct: `lasreinas` (not `lasreinas-colusa`)
2. Re-run seeder: `npm run seed:lasreinas`
3. Check database: `SELECT COUNT(*) FROM "MenuItem";`
4. Use screenshots as fallback

---

## 📊 SUCCESS CRITERIA

After completing this checklist, you should have:

- ✅ Database seeded with 69 Las Reinas menu items
- ✅ Admin user created and tested
- ✅ All assets uploaded (logo, hero images, sample food photos)
- ✅ Development server running without errors
- ✅ Customer site fully functional (hero, menu, cart, catering, accessibility)
- ✅ Admin dashboard fully functional (all 8 tabs working)
- ✅ Menu Manager tested (search, filter, edit, upload)
- ✅ Settings tested (hours, accessibility, notifications, Stripe)
- ✅ Orders workflow tested (place order, view in admin, change status)
- ✅ Image upload tested and working
- ✅ Cross-browser testing complete (Chrome, Firefox, Safari)
- ✅ Performance acceptable (< 2 sec load times)
- ✅ Demo rehearsed at least once
- ✅ Backup plan ready (screenshots, video recording)
- ✅ Browser configured for presentation
- ✅ All critical paths verified

**If all items are checked:** You're ready to present! 🎉

**If any items are unchecked:** Address those before demo day.

---

## 📞 EMERGENCY CONTACTS (Optional)

**Technical Support:**
- Developer on standby: [Name, Phone]
- Database admin: [Name, Phone]

**Presentation Support:**
- A/V technician: [Contact]
- Backup presenter: [Name]

---

**GOOD LUCK! 🚀**

**Remember:**
- Speak slowly and clearly
- Pause after key features
- Make eye contact with audience
- Show enthusiasm for the product
- If something breaks, stay calm and use backup plan

**You've got this!**
