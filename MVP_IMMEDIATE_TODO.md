# 🚀 MVP IMMEDIATE TODO - NO WEEKS, DAYS ONLY

**Date:** November 9, 2024
**Goal:** Get to functional MVP for customer demos ASAP

---

## ✅ COMPLETED TODAY

1. **Business Hours Editor** - Full operating hours management in Settings
2. **Settings UI Redesign** - Removed amateur platform fee section, added professional Integrations section
3. **Integrations UI** - Visual cards for Stripe, DoorDash, Printer with status indicators

---

## 🔥 CRITICAL PATH (DO NOW - 1-2 DAYS MAX)

### 1. Refund Functionality (2-3 hours)
**Status:** In Progress
**What:** Add refund button in OrderList that calls Stripe refund API
**Files:**
- Create `/app/api/admin/refund/route.ts`
- Update `/components/admin/OrderList.tsx` with refund button + modal
**Test:** Process refund on test order, verify Stripe dashboard shows refund

---

### 2. Frontend Sync Test (30 mins)
**Status:** Pending
**What:** Verify menu/image changes in admin immediately reflect on lapoblanitamexicanfood.com
**Test Steps:**
1. Admin → Menu → Edit item price/image
2. Save
3. Refresh lapoblanitamexicanfood.com
4. Verify changes appear immediately

**If broken:** Check revalidatePath() calls in API routes

---

### 3. Super Admin Dashboard (3-4 hours)
**Status:** Pending
**What:** Separate dashboard at `/super-admin` for YOU to manage all tenants
**Features:**
- View all tenants (list with status)
- Add new tenant button (opens onboarding form)
- See tenant metrics (orders, revenue)
- Platform fee configuration (belongs here, NOT in tenant settings)

**Files to create:**
- `/app/super-admin/page.tsx` - Main dashboard
- `/app/super-admin/onboard/page.tsx` - New tenant form
- `/app/api/super/tenants/create/route.ts` - Tenant creation API

---

### 4. DoorDash OAuth Flow (2-3 hours)
**Status:** Pending
**What:** Copy Stripe Connect pattern for DoorDash
**Flow:**
1. Tenant clicks "Connect DoorDash" in Settings
2. Redirect to DoorDash OAuth
3. DoorDash redirects back with credentials
4. Store in `TenantIntegration` table
5. Show "Connected" status in Settings

**Files:**
- `/app/api/admin/doordash/connect/route.ts`
- `/app/admin/doordash-connect/callback/page.tsx`
- Update Settings.tsx button to link to flow

---

### 5. Printer Discovery UI (2 hours)
**Status:** Pending
**What:** Add Bluetooth printer discovery modal
**Flow:**
1. Click "Discover Printers" in Settings
2. Open modal showing available Bluetooth printers
3. Select printer → Test print → Save to settings
4. Auto-print toggle works when printer connected

**Files:**
- Update `/components/admin/Settings.tsx` with modal
- Use existing `/app/api/admin/fulfillment/printer/test/route.ts`

---

## 📋 TENANT ONBOARDING FLOW (SUPER ADMIN)

**When you (super admin) onboard a new restaurant:**

1. Go to `/super-admin/onboard`
2. Fill in form:
   - Restaurant name
   - Contact email
   - Domain/subdomain
   - Choose template (from 3-5 options)
   - Stripe subscription setup ($40/mo + $20/mo ADA)
3. System creates:
   - New `Tenant` record
   - Default `TenantSettings`
   - Admin user account
   - Send onboarding email with login
4. Charge $60 first month to YOUR (super admin) Stripe
5. After 30 days, charge tenant's own Stripe

---

## 🎨 TEMPLATE SYSTEM (2-3 hours)

**How it works:**
- Template = JSON with colors, fonts, logo URL
- Store in `Tenant.branding` field
- Apply via CSS variables in TenantThemeProvider
- NO code changes between templates, just styling

**Example templates:**
1. **Classic Taqueria** (current lapoblanita style)
2. **Modern Bistro** (clean, minimalist)
3. **Bakery Charm** (warm, inviting)
4. **Fast Casual** (bold, energetic)
5. **Fine Dining** (elegant, sophisticated)

**Files:**
- `/templates/classic-taqueria.json`
- `/templates/modern-bistro.json`
- etc.
- Update super admin onboarding to show template previews

---

## 🧪 END-TO-END TEST CHECKLIST

Before customer demos, verify:

- [ ] Customer places order on lapoblanitamexicanfood.com
- [ ] Payment processes through Stripe Connect
- [ ] Order appears in `/admin` Orders tab
- [ ] Order appears in `/admin/fulfillment` board in real-time
- [ ] Printer auto-prints receipt (if enabled)
- [ ] Admin can refund order
- [ ] Stripe dashboard shows refund
- [ ] Customer receives refund email
- [ ] Menu changes reflect on frontend immediately
- [ ] Image uploads work and appear on frontend
- [ ] Business hours close store automatically when outside hours

---

## 📊 SUCCESS CRITERIA FOR DEMO

**You're ready for customer demos when:**
1. You can onboard a new tenant in < 10 minutes via super admin
2. Tenant admin dashboard is fully functional
3. Stripe Connect works end-to-end
4. DoorDash API connected (or ready to connect)
5. Printer integration works
6. 3 customer websites cloned with templates applied
7. Zero crashes for 24 hours with test orders

---

## 🎯 NEXT 48 HOURS PLAN

### Day 1 (Today - Nov 9)
- ✅ Settings UI redesign
- [ ] Refund functionality
- [ ] Frontend sync verification
- [ ] Super admin dashboard structure

### Day 2 (Nov 10)
- [ ] DoorDash OAuth flow
- [ ] Printer discovery UI
- [ ] Template system setup
- [ ] Tenant onboarding form

### Day 3 (Nov 11)
- [ ] Clone 3 customer websites
- [ ] End-to-end testing
- [ ] Bug fixes
- [ ] Demo preparation

---

## 🚨 BLOCKERS TO CALL OUT

1. **Platform fees** - Moved to super admin only ✅
2. **Checkout flow issues** - Need to investigate on live site
3. **Image upload** - Already works, just needs testing
4. **Fulfillment PWA** - Notifications can wait, focus on core flows first

---

**FOCUS:** Get super admin tenant onboarding working, then everything else falls into place.
