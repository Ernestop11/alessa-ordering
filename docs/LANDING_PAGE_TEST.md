# Landing Page Testing Guide

## 📋 Test Overview

**Objective:** Verify landing page displays on root domain and tenant routing works correctly

**Components to Test:**
1. Root domain shows landing page
2. Tenant domains redirect to /order
3. Admin login links functional
4. Super admin dashboard access
5. Responsive design (mobile/tablet/desktop)
6. Session-aware navigation

---

## 🧪 Test Methods

### **Method 1: Local Testing** (Recommended for Development)

#### **Step 1: Start Development Server**

```bash
npm run dev
```

**Expected Output:**
```
▲ Next.js 14.0.3
- Local:        http://localhost:3000
✓ Ready in XXXms
```

---

#### **Step 2: Test Root Domain → Landing Page**

**Visit:** http://localhost:3000

**Expected Behavior:**
- ✅ Landing page displays (not order page)
- ✅ Header shows "Alessa Cloud" logo
- ✅ Hero section: "Multi-Tenant Restaurant Ordering Platform"
- ✅ Features grid with 6 cards (Stripe, Menu, Fulfillment, Branding, Multi-Tenant, Analytics)
- ✅ CTA section: "Ready to get started?"
- ✅ Footer with copyright and description

**Visual Check:**
```
┌─────────────────────────────────────┐
│ ☁️ Alessa Cloud    [Admin Login]   │ ← Header
├─────────────────────────────────────┤
│   Multi-Tenant Restaurant           │
│   Ordering Platform                 │
│                                     │
│   [Admin Login]  [Super Admin →]   │ ← CTAs
├─────────────────────────────────────┤
│   💳 Payments  │ 📱 Menu  │ 🚀...   │ ← Features
├─────────────────────────────────────┤
│   Ready to get started?             │ ← CTA
│   [Admin Login]                     │
└─────────────────────────────────────┘
```

**✅ Checkpoint:** Landing page displays correctly

---

#### **Step 3: Test Tenant Domain → Order Page Redirect**

**Simulate Tenant Subdomain:**

You need to modify your `/etc/hosts` file to test tenant routing locally:

```bash
# Edit hosts file (requires sudo)
sudo nano /etc/hosts

# Add these lines:
127.0.0.1 lapoblanita.localhost
127.0.0.1 villacorona.localhost
127.0.0.1 taqueriarosita.localhost
```

**Visit:** http://lapoblanita.localhost:3000

**Expected Behavior:**
- ✅ Automatically redirects to `/order`
- ✅ Shows order page with menu items
- ✅ No landing page content

**Status Code Check:**
```bash
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' http://lapoblanita.localhost:3000
```

**Expected:** `307 http://lapoblanita.localhost:3000/order`

**✅ Checkpoint:** Tenant subdomain redirects to /order

---

#### **Step 4: Test Admin Login Links**

**From Landing Page:**
1. Click "Admin Login" button in header
2. Should navigate to `/admin/login`

**Expected URL:** http://localhost:3000/admin/login

**Expected Page:**
- ✅ Admin login form
- ✅ Email and password fields
- ✅ "Sign in" button

**✅ Checkpoint:** Admin login link works

---

#### **Step 5: Test Super Admin Dashboard Access**

**Method A: Click "Super Admin" link on landing page**
1. Visit http://localhost:3000
2. Click "Super Admin →" link
3. Should navigate to `/super-admin`

**Method B: Direct URL**
- Visit: http://localhost:3000/super-admin

**Expected Behavior:**
- If not logged in: Redirects to login
- If logged in as super admin: Shows dashboard

**✅ Checkpoint:** Super admin links work

---

#### **Step 6: Test Responsive Design**

**Option A: Browser DevTools**

1. Open DevTools (F12 or Cmd+Option+I)
2. Toggle device toolbar (Cmd+Shift+M / Ctrl+Shift+M)
3. Test these screen sizes:

**Mobile (375px):**
```
┌─────────────────┐
│  Logo  [Login]  │
├─────────────────┤
│  Multi-Tenant   │ ← text-4xl
│    Restaurant   │
│    Platform     │
│                 │
│  [Admin Login]  │
│  Super Admin →  │
├─────────────────┤
│  💳 Payments    │ ← 1 column
│  Description    │
├─────────────────┤
│  📱 Menu        │
│  Description    │
└─────────────────┘
```

**Tablet (768px):**
- Hero text larger (text-6xl)
- Still 1 column for features
- More padding

**Desktop (1920px):**
```
┌─────────────────────────────────────┐
│  Logo                    [Login]    │
├─────────────────────────────────────┤
│    Multi-Tenant Restaurant          │
│         Platform                    │
│                                     │
│   [Admin Login]  Super Admin →     │
├─────────────────────────────────────┤
│  💳 Stripe │ 📱 Menu  │ 🚀 Fulfill. │ ← 3 columns
│  Desc.     │ Desc.    │ Desc.       │
│  🎨 Brand  │ 👥 Multi │ 📊 Analytics│
│  Desc.     │ Desc.    │ Desc.       │
└─────────────────────────────────────┘
```

**Option B: Test on Real Devices**

Find your local IP:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Visit on phone: `http://YOUR_IP:3000`

**✅ Checkpoint:** Responsive design works on all screen sizes

---

### **Method 2: Production Testing**

#### **Step 1: Test Root Domain**

**Visit:** https://alessacloud.com

**Expected:**
- ✅ Landing page displays
- ✅ HTTPS certificate valid
- ✅ All images load
- ✅ No console errors

**Verify with curl:**
```bash
curl -s https://alessacloud.com | grep -o '<h1.*h1>' | head -1
```

**Expected:** Should contain "Multi-Tenant Restaurant"

---

#### **Step 2: Test Tenant Redirect**

**Visit:** https://lapoblanita.alessacloud.com

**Expected:**
- ✅ Redirects to `/order`
- ✅ Shows order page (not landing page)

**Verify redirect:**
```bash
curl -s -o /dev/null -w '%{http_code}\n' https://lapoblanita.alessacloud.com
```

**Expected:** `200` (after redirect to /order)

---

#### **Step 3: Verify on VPS**

Check VPS routing:

```bash
ssh root@77.243.85.8 "curl -s http://localhost:4000 | grep -o '<h1.*h1>' | head -1"
```

**Expected:** Landing page title

```bash
ssh root@77.243.85.8 "curl -s -L http://localhost:4000/order | grep -o 'Order from' | head -1"
```

**Expected:** "Order from" (order page content)

---

## 📋 Test Checklist

### **Routing Tests**

- [ ] Root domain (localhost:3000) shows landing page
- [ ] Root domain (alessacloud.com) shows landing page
- [ ] Tenant subdomain (lapoblanita.localhost:3000) redirects to /order
- [ ] Tenant subdomain (lapoblanita.alessacloud.com) redirects to /order
- [ ] www subdomain (www.alessacloud.com) shows landing page

### **Navigation Tests**

- [ ] "Admin Login" button in header navigates to /admin/login
- [ ] "Admin Login" in hero navigates to /admin/login
- [ ] "Super Admin →" link navigates to /super-admin
- [ ] Footer links are present and styled correctly

### **Content Tests**

- [ ] Hero section displays correct title and subtitle
- [ ] Features grid shows 6 feature cards
- [ ] Feature cards have icons (emojis), titles, and descriptions
- [ ] CTA section displays call-to-action
- [ ] Footer shows copyright year and description

### **Responsive Design Tests**

- [ ] Mobile (375px): 1 column layout, text-4xl title
- [ ] Tablet (768px): 1 column layout, text-6xl title
- [ ] Desktop (1024px+): 3 column grid, text-6xl title
- [ ] Header responsive (logo + button stack on mobile)
- [ ] Touch targets minimum 44px on mobile

### **Session-Aware Tests**

- [ ] Not logged in: Shows "Admin Login" button
- [ ] Logged in as admin: Still shows "Admin Login" (can have multiple logins)
- [ ] Logged in as super admin: Shows "Dashboard" button instead

---

## 🔍 Verification Commands

### **Local Development**

```bash
# Start dev server
npm run dev

# Test root domain shows landing page
curl -s http://localhost:3000 | grep -o 'Multi-Tenant Restaurant' || echo "❌ Landing page not found"

# Test build works
npm run build

# Test production build locally
npm start
```

### **Production VPS**

```bash
# Test landing page HTML
ssh root@77.243.85.8 "curl -s http://localhost:4000 | grep 'Multi-Tenant Restaurant' && echo '✅ Landing page working' || echo '❌ Landing page not found'"

# Test tenant redirect
ssh root@77.243.85.8 "curl -s -o /dev/null -w 'HTTP %{http_code} → %{redirect_url}\n' -H 'Host: lapoblanita.alessacloud.com' http://localhost:4000"

# Check component file exists
ssh root@77.243.85.8 "test -f /var/www/alessa-ordering/components/LandingPage.tsx && echo '✅ Component exists' || echo '❌ Component missing'"

# Check routing logic
ssh root@77.243.85.8 "grep -A 5 'ROOT_DOMAIN' /var/www/alessa-ordering/app/page.tsx"
```

---

## 🐛 Troubleshooting

### **Issue: Landing page not showing on root domain**

**Check:**
1. ROOT_DOMAIN environment variable:
   ```bash
   grep ROOT_DOMAIN .env
   ```
   Should be: `ROOT_DOMAIN=alessacloud.com`

2. Verify routing logic in app/page.tsx:
   ```bash
   cat app/page.tsx | grep -A 10 'if (hostname'
   ```

3. Check browser URL exactly matches root domain (not subdomain)

---

### **Issue: Tenant domains show landing page instead of redirecting**

**Check:**
1. Hostname detection:
   ```typescript
   // app/page.tsx should have:
   const hostname = hostHeader.split(':')[0];

   if (hostname === ROOT_DOMAIN || hostname === `www.${ROOT_DOMAIN}` || hostname === 'localhost') {
     // Show landing page
   } else {
     // Redirect to /order
   }
   ```

2. Test with curl:
   ```bash
   curl -s -o /dev/null -w '%{redirect_url}\n' -H 'Host: lapoblanita.alessacloud.com' http://localhost:4000
   ```

---

### **Issue: Session-aware navigation not working**

**Check:**
1. Session provider wrapping component:
   ```bash
   grep -B 2 -A 2 'SessionProvider' components/LandingPage.tsx
   ```

2. useSession hook:
   ```bash
   grep 'useSession' components/LandingPage.tsx
   ```

---

### **Issue: Responsive design broken**

**Check:**
1. Tailwind CSS classes:
   ```bash
   grep 'sm:' components/LandingPage.tsx | head -5
   ```

2. Viewport meta tag in layout:
   ```bash
   grep 'viewport' app/layout.tsx
   ```

---

## 📊 Test Results Template

```
Date: _______________
Environment: [ ] Local  [ ] Production
Tester: _______________

Routing:
  [ ] Root domain → Landing page
  [ ] Tenant domain → /order redirect
  [ ] www.domain → Landing page

Navigation:
  [ ] Admin Login links work
  [ ] Super Admin link works
  [ ] All links functional

Content:
  [ ] Hero section displays
  [ ] 6 feature cards present
  [ ] CTA section visible
  [ ] Footer correct

Responsive:
  [ ] Mobile (375px) - 1 column
  [ ] Tablet (768px) - 1 column
  [ ] Desktop (1920px) - 3 columns

Session-Aware:
  [ ] Not logged in: "Admin Login"
  [ ] Super admin: "Dashboard"

Overall Result: [ ] PASS  [ ] FAIL

Notes:
________________________________________________________________
________________________________________________________________
```

---

## 🎯 Quick Smoke Test

**30-second verification:**

```bash
# 1. Check landing page component exists
test -f components/LandingPage.tsx && echo "✅ Component exists" || echo "❌ Missing"

# 2. Check routing logic
grep -q "ROOT_DOMAIN" app/page.tsx && echo "✅ Routing logic present" || echo "❌ Missing"

# 3. Test locally (if dev server running)
curl -s http://localhost:3000 | grep -q "Multi-Tenant Restaurant" && echo "✅ Landing page working" || echo "❌ Not found"

# 4. Test on VPS
ssh root@77.243.85.8 "curl -s http://localhost:4000 | grep -q 'Multi-Tenant Restaurant' && echo '✅ Production working' || echo '❌ Not found'"
```

---

## 📖 Related Files

**Source Code:**
- `app/page.tsx` - Routing logic (root vs tenant)
- `components/LandingPage.tsx` - Landing page component
- `app/layout.tsx` - Root layout wrapper
- `app/providers.tsx` - Session provider

**Configuration:**
- `.env` - ROOT_DOMAIN setting
- `tailwind.config.ts` - Responsive breakpoints
- `next.config.js` - Next.js configuration

**Documentation:**
- [PROJECT_COMPLETE_SUMMARY.md](./PROJECT_COMPLETE_SUMMARY.md)
- [test-responsive.html](../test-responsive.html) - Visual tester

---

## 🌐 Test URLs

**Local:**
- Root: http://localhost:3000
- Tenant: http://lapoblanita.localhost:3000 (requires /etc/hosts)

**Production:**
- Root: https://alessacloud.com
- Tenant: https://lapoblanita.alessacloud.com
- Admin: https://alessacloud.com/admin/login
- Super Admin: https://alessacloud.com/super-admin

---

**Last Updated:** 2025-11-09
**Test Status:** ✅ Ready for testing
