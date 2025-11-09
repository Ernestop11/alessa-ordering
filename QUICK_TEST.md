# 🧪 Quick Test Guide - November 8, 2025

## ✅ All URLs Working - Test Results

### 1. Super Admin Login
**URL**: https://alessacloud.com/admin/login
**Status**: ✅ 200 OK

**Test Steps**:
```
1. Visit: https://alessacloud.com/admin/login
2. Enter credentials:
   Email: super@alessacloud.com
   Password: TA7FfVDGCH05eqh+sa2zOSGVwHkkcz1E
3. Click "Sign in"
4. Expected: Redirect to https://alessacloud.com/super-admin
5. Should see: Dashboard with all 3 tenants listed
```

**What You Can Do**:
- View La Poblanita, Las Reinas, Villa Corona tenants
- Create new restaurant tenants
- View platform metrics
- Access global fulfillment dashboard

---

### 2. Restaurant Admin Login (La Poblanita)
**URL**: https://lapoblanitamexicanfood.com/admin/login
**Status**: ✅ 200 OK

**Test Steps**:
```
1. Visit: https://lapoblanitamexicanfood.com/admin/login
2. Enter credentials:
   Email: admin@lapoblanita.com
   Password: LYa++lSuolc0Yf5U+aa2AX/1i1VIpYaX
3. Click "Sign in"
4. Expected: Redirect to https://lapoblanitamexicanfood.com/admin
5. Should see: Restaurant admin dashboard
```

**What You Can Do**:
- Edit 23 pre-loaded menu items (Tacos, Antojitos, Pan Dulce, Bebidas, Postres)
- Upload restaurant logo and images
- Change restaurant colors/branding
- Manage orders
- Configure Stripe payments

---

### 3. Customer Ordering Page
**URL**: https://lapoblanitamexicanfood.com/order
**Status**: ✅ 200 OK

**Test Steps**:
```
1. Visit: https://lapoblanitamexicanfood.com/order
2. Should see: Menu with 23 items across 5 sections
3. Test: Add items to cart
4. Test: Proceed to checkout
5. Test: Complete order (Stripe test mode)
```

---

### 4. Root Domain Behavior
**URL**: https://alessacloud.com
**Status**: ✅ 307 Redirect → /order

**Current Behavior**:
- Redirects to `/order` and shows La Poblanita menu (DEFAULT_TENANT)
- This is correct based on current configuration

**Future Enhancement**:
- Should show a landing page for web hosting services
- Allow businesses to sign up for new restaurant sites

---

## 📋 Quick Reference Card

### Super Admin
```
URL:  https://alessacloud.com/admin/login
User: super@alessacloud.com
Pass: TA7FfVDGCH05eqh+sa2zOSGVwHkkcz1E
→ After login: Redirects to /super-admin dashboard
```

### La Poblanita Admin
```
URL:  https://lapoblanitamexicanfood.com/admin/login
User: admin@lapoblanita.com
Pass: LYa++lSuolc0Yf5U+aa2AX/1i1VIpYaX
→ After login: Redirects to /admin dashboard
```

### Customer Ordering
```
URL: https://lapoblanitamexicanfood.com/order
→ No login required, open to public
```

---

## 🔍 Why URLs Weren't Working Before

### Issue 1: Wrong Super Admin URL
**Problem**: Documentation said `/super-admin/login`
**Reality**: Should be `/admin/login` (shared login page)
**Fix**: Updated documentation

### Issue 2: Perceived "Not Working"
**Problem**: URLs were actually working but returning redirects
**Reality**:
- Root domain: 307 redirect (correct behavior)
- Super admin: Redirects to login (correct - needs auth)
- Admin pages: All loading properly with 200 OK

### Issue 3: PM2 Was Previously Errored
**Problem**: Earlier alessa-ordering had 45 restarts
**Fix**: Flushed PM2, deleted all processes, restarted fresh
**Status**: Now stable with 0 restarts

---

## 🎯 Test Checklist

**Before Testing**:
- [ ] Verify PM2 status: `ssh root@77.243.85.8 "pm2 status"`
- [ ] Confirm alessa-ordering is "online" with 0 recent restarts
- [ ] Confirm port 3000 is listening

**Login Tests**:
- [ ] Super admin login works
- [ ] Super admin dashboard loads
- [ ] Can see all 3 tenants
- [ ] La Poblanita admin login works
- [ ] La Poblanita admin dashboard loads
- [ ] Can see menu items (23 items)

**Functionality Tests**:
- [ ] Upload image in admin panel
- [ ] Image displays on frontend
- [ ] Edit menu item price/description
- [ ] Changes appear immediately on /order page
- [ ] Customer can add items to cart
- [ ] Checkout flow works

**Multi-Tenant Tests**:
- [ ] https://lapoblanita.alessacloud.com loads La Poblanita
- [ ] https://lasreinas.alessacloud.com loads Las Reinas (empty menu)
- [ ] https://villacorona.alessacloud.com loads Villa Corona (empty menu)
- [ ] Custom domain https://lapoblanitamexicanfood.com works

---

## 🐛 If Something Doesn't Work

### Login Page Shows 404
```bash
# Check if app is running
ssh root@77.243.85.8 "pm2 status | grep alessa-ordering"

# Check app logs
ssh root@77.243.85.8 "pm2 logs alessa-ordering --lines 50"

# Restart if needed
ssh root@77.243.85.8 "pm2 restart alessa-ordering"
```

### Login Credentials Don't Work
```bash
# Verify environment variables
ssh root@77.243.85.8 "grep -E '(SUPER_ADMIN|ADMIN_EMAIL)' /var/www/alessa-ordering/.env"

# Restart to reload .env
ssh root@77.243.85.8 "pm2 restart alessa-ordering"
```

### Pages Load But Show Errors
```bash
# Check database connection
ssh root@77.243.85.8 "sudo -u postgres psql -d alessa_ordering -c '\dt'"

# Check app errors
ssh root@77.243.85.8 "pm2 logs alessa-ordering --err --lines 50"
```

### Images Don't Upload
```bash
# Check uploads directory exists
ssh root@77.243.85.8 "ls -la /var/www/alessa-ordering/public/uploads/"

# Check Nginx config
ssh root@77.243.85.8 "grep uploads /etc/nginx/sites-enabled/alessacloud.com"
```

---

## ✅ Current Status Summary

**VPS**: 77.243.85.8
**Apps Running**: 2 (alessa-ordering on 3000, azteka-api on 3002)
**PM2 Status**: All online, 0 restarts
**Nginx**: Clean config, no conflicts
**SSL**: Active for alessacloud.com and lapoblanitamexicanfood.com
**Database**: PostgreSQL with 3 tenants, 23 menu items for La Poblanita

**All Systems**: 🟢 Operational
