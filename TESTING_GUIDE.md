# 🧪 Complete Testing Guide - Alessa Ordering Platform

**Last Updated**: November 8, 2025
**Status**: ✅ MVP READY FOR TESTING

---

## 🎯 Quick Access Links

| Role | Login URL | Dashboard |
|------|-----------|-----------|
| **Super Admin** | https://alessacloud.com/admin/login | https://alessacloud.com/super-admin |
| **Tenant Admin (La Poblanita)** | https://lapoblanitamexicanfood.com/admin/login | https://lapoblanitamexicanfood.com/admin |
| **Customer Ordering** | N/A (public) | https://lapoblanitamexicanfood.com/order |

---

## 1️⃣ Super Admin Access

### Login

**URL**: https://alessacloud.com/admin/login

**Credentials**:
```
Email:    super@alessacloud.com
Password: TA7FfVDGCH05eqh+sa2zOSGVwHkkcz1E
```

**After Login**: Redirects to https://alessacloud.com/super-admin

---

### What to Test

#### ✅ Multi-Tenant Management
- [ ] View all tenants (La Poblanita, Las Reinas, Villa Corona)
- [ ] Click into each tenant to view details
- [ ] Verify tenant count is correct

#### ✅ Create New Tenant
- [ ] Navigate to "Create Tenant" section
- [ ] Fill in new restaurant details:
  - Name: Test Restaurant
  - Slug: test-restaurant
  - Domain: testrestaurant.com (optional)
  - Upload logo
  - Set primary/secondary colors
  - Configure contact info
- [ ] Save and verify new tenant appears in list

#### ✅ Platform Metrics
- [ ] View global order count
- [ ] View global revenue
- [ ] View active tenants count
- [ ] Verify metrics update when new orders placed

#### ✅ Global Settings
- [ ] View platform settings (tax rates, fees, etc.)
- [ ] Modify a setting (test only, revert after)
- [ ] Verify change takes effect

---

## 2️⃣ Tenant Admin Access (La Poblanita)

### Login

**URL**: https://lapoblanitamexicanfood.com/admin/login
*OR* https://alessacloud.com/admin/login

**Credentials**:
```
Email:    admin@lapoblanita.com
Password: lapoblanita_admin_2024
```

**After Login**: Redirects to https://lapoblanitamexicanfood.com/admin

---

### What to Test

#### ✅ Menu Management

**Test 1: Add New Menu Item**
- [ ] Navigate to Menu → Menu Items
- [ ] Click "Add Menu Item"
- [ ] Fill in details:
  ```
  Name:        Test Taco
  Description: A delicious test taco for testing purposes
  Price:       $9.99
  Category:    tacos
  Section:     Tacos Tradicionales  ← MUST SELECT A SECTION!
  Available:   Yes
  ```
- [ ] Upload an image (optional)
- [ ] Click Save
- [ ] **Immediately** open https://lapoblanitamexicanfood.com/order in new incognito tab
- [ ] **VERIFY**: New item appears (no cache delay)
- [ ] **VERIFY**: Item count increased by 1

**Test 2: Edit Existing Menu Item**
- [ ] Find "Menudo" in menu items list
- [ ] Click Edit
- [ ] Change price from $13.00 to $12.50
- [ ] Click Save
- [ ] **Immediately** refresh https://lapoblanitamexicanfood.com/order
- [ ] **VERIFY**: Price shows $12.50 (no cache delay)

**Test 3: Upload Item Image**
- [ ] Edit "Menudo" menu item
- [ ] Click "Upload Image"
- [ ] Select an image file (JPG or PNG, < 5MB)
- [ ] Click Save
- [ ] Wait for upload to complete
- [ ] **Immediately** open https://lapoblanitamexicanfood.com/order
- [ ] **VERIFY**: Menudo now shows uploaded image

**Test 4: Delete Menu Item** (optional)
- [ ] Delete the "Test Taco" created earlier
- [ ] Refresh frontend
- [ ] **VERIFY**: Item no longer appears

---

#### ✅ Branding & Settings

**Test 5: Change Logo**
- [ ] Navigate to Settings → Branding
- [ ] Click "Upload Logo"
- [ ] Select new logo image
- [ ] Click Save
- [ ] **Immediately** refresh https://lapoblanitamexicanfood.com/order
- [ ] **VERIFY**: New logo appears in header

**Test 6: Change Brand Colors**
- [ ] Navigate to Settings → Branding
- [ ] Change Primary Color (e.g., from #dc2626 to #ef4444)
- [ ] Change Secondary Color
- [ ] Click Save
- [ ] **Immediately** refresh https://lapoblanitamexicanfood.com/order
- [ ] **VERIFY**: New colors applied to buttons, accents

**Test 7: Update Contact Info**
- [ ] Navigate to Settings → Contact
- [ ] Update phone number
- [ ] Update email
- [ ] Update address
- [ ] Click Save
- [ ] Refresh frontend
- [ ] **VERIFY**: New contact info appears in footer

---

#### ✅ Menu Section Management

**Test 8: Reorder Menu Sections**
- [ ] Navigate to Menu → Sections
- [ ] Drag "Panadería" above "Antojitos Poblanos"
- [ ] Click Save Order
- [ ] Refresh https://lapoblanitamexicanfood.com/order
- [ ] **VERIFY**: Section tabs reordered

**Test 9: Add New Menu Section**
- [ ] Click "Add Section"
- [ ] Fill in:
  ```
  Name: Breakfast Specials
  Description: Morning favorites
  Type: restaurant
  Position: 1
  ```
- [ ] Click Save
- [ ] Refresh frontend
- [ ] **VERIFY**: New section tab appears

---

#### ✅ Order Management

**Test 10: View Orders**
- [ ] Navigate to Orders
- [ ] View list of all orders
- [ ] Click on an order to view details
- [ ] Verify order items, total, customer info displayed

**Test 11: Update Order Status**
- [ ] Click on a pending order
- [ ] Change status to "Preparing"
- [ ] Click Save
- [ ] **VERIFY**: Order status updated in list

---

#### ✅ Customer Management

**Test 12: View Customers**
- [ ] Navigate to Customers
- [ ] View list of all customers
- [ ] Click on a customer to view details
- [ ] Verify order history, contact info

---

## 3️⃣ Customer Ordering (Public Frontend)

### Access

**URL**: https://lapoblanitamexicanfood.com/order
*OR* https://lapoblanitamexicanfood.com (redirects to /order)

**No login required for browsing**

---

### What to Test

#### ✅ Menu Browsing

**Test 13: View Menu**
- [ ] Open https://lapoblanitamexicanfood.com/order
- [ ] **VERIFY**: Page loads (HTTP 200)
- [ ] **VERIFY**: Logo displays correctly
- [ ] **VERIFY**: "24 Items crafted with love" shows (or current count)
- [ ] **VERIFY**: Hero image displays
- [ ] **VERIFY**: All 5 section tabs appear:
  - Tacos Tradicionales
  - Antojitos Poblanos
  - Panadería
  - Bebidas
  - Postres

**Test 14: Browse Menu Sections**
- [ ] Click "Antojitos Poblanos" tab
- [ ] **VERIFY**: Section switches, items display
- [ ] **VERIFY**: Menudo appears with image and price ($13.00)
- [ ] Click "Panadería" tab
- [ ] **VERIFY**: Bakery items display (Conchas, Pan Dulce, etc.)

**Test 15: View Item Details**
- [ ] Click on a menu item (e.g., "Menudo")
- [ ] **VERIFY**: Modal or detail view opens
- [ ] **VERIFY**: Full description displays
- [ ] **VERIFY**: Image displays in full size
- [ ] **VERIFY**: Price is correct
- [ ] **VERIFY**: Add to Cart button appears

---

#### ✅ Ordering Flow (if implemented)

**Test 16: Add to Cart**
- [ ] Click "Add to Cart" on Menudo
- [ ] **VERIFY**: Cart icon updates with item count
- [ ] **VERIFY**: Success message appears

**Test 17: View Cart**
- [ ] Click cart icon
- [ ] **VERIFY**: Menudo appears in cart
- [ ] **VERIFY**: Quantity can be adjusted
- [ ] **VERIFY**: Total price calculates correctly
- [ ] **VERIFY**: Remove button works

**Test 18: Checkout** (if implemented)
- [ ] Click "Checkout"
- [ ] Fill in customer details
- [ ] Choose delivery/pickup
- [ ] Enter payment info (if Stripe enabled)
- [ ] Submit order
- [ ] **VERIFY**: Order confirmation page
- [ ] **VERIFY**: Order appears in admin panel

---

#### ✅ Customer Login (if implemented)

**Test 19: Customer Registration**
- [ ] Click "Sign Up" or "Create Account"
- [ ] Fill in registration form:
  ```
  Name:     Test Customer
  Email:    testcustomer@example.com
  Password: Test123!
  Phone:    615-555-1234
  ```
- [ ] Submit
- [ ] **VERIFY**: Registration successful
- [ ] **VERIFY**: Redirects to order page or dashboard

**Test 20: Customer Login**
- [ ] Navigate to https://lapoblanitamexicanfood.com/customer/login
- [ ] Enter credentials:
  ```
  Email:    testcustomer@example.com
  Password: Test123!
  ```
- [ ] Click Login
- [ ] **VERIFY**: Redirects to customer dashboard or order page

**Test 21: Order History**
- [ ] While logged in, navigate to "Order History"
- [ ] **VERIFY**: Previous orders display
- [ ] Click on an order
- [ ] **VERIFY**: Order details appear (items, total, status)

---

## 4️⃣ Image Upload & Serving Tests

### Test Image URLs

**Current Logo** (should work):
```
https://lapoblanitamexicanfood.com/uploads/1762551053875-7b65c94e-fb64-485f-b6ae-306c9b23ef52.png
```

**Menudo Image** (should work):
```
https://lapoblanitamexicanfood.com/uploads/1762565005843-9048705a-9531-4f87-b01d-4e8d2daafc2e.jpeg
```

---

### What to Test

**Test 22: Direct Image Access**
```bash
# Should return HTTP 200
curl -I https://lapoblanitamexicanfood.com/uploads/1762551053875-7b65c94e-fb64-485f-b6ae-306c9b23ef52.png
```
- [ ] **VERIFY**: HTTP/2 200 OK
- [ ] **VERIFY**: Content-Type: image/png
- [ ] **VERIFY**: Cache-Control header present

**Test 23: Upload New Image via Admin**
- [ ] Login to admin panel
- [ ] Edit a menu item
- [ ] Upload new image (< 5MB, JPG/PNG)
- [ ] Save
- [ ] Note the image URL from the admin panel
- [ ] Test URL directly in browser
- [ ] **VERIFY**: Image loads
- [ ] **VERIFY**: Image appears on order page

**Test 24: Image Permissions**
```bash
ssh root@77.243.85.8 "ls -la /var/www/alessa-ordering/public/uploads/"
```
- [ ] **VERIFY**: Files owned by correct user
- [ ] **VERIFY**: Files have 644 permissions
- [ ] **VERIFY**: Directory has 755 permissions

---

## 5️⃣ Cache Busting Tests

**CRITICAL**: Admin changes must appear immediately on frontend (no cache delay)

---

### What to Test

**Test 25: Menu Item Cache Test**
1. **Before**: Note item count on https://lapoblanitamexicanfood.com/order
2. **Admin**: Add new menu item (assign to a section!)
3. **After**: Refresh order page in **incognito window**
4. **VERIFY**: New item appears **immediately** (< 2 seconds)
5. **VERIFY**: Item count incremented by 1

**Test 26: Logo Cache Test**
1. **Before**: Note current logo on order page
2. **Admin**: Upload new logo
3. **After**: Hard refresh order page (Ctrl+Shift+R)
4. **VERIFY**: New logo appears **immediately**

**Test 27: Price Change Cache Test**
1. **Before**: Note price of "Menudo" ($13.00)
2. **Admin**: Change price to $12.50
3. **After**: Refresh order page
4. **VERIFY**: Price shows $12.50 **immediately**

---

## 6️⃣ System Health Checks

### VPS Access

```bash
ssh root@77.243.85.8
```

---

### What to Test

**Test 28: PM2 Process Status**
```bash
pm2 status | grep alessa-ordering
```
**Expected**:
```
alessa-ordering | online | 0 restarts | port 4000
```
- [ ] **VERIFY**: Status = online
- [ ] **VERIFY**: Restarts = 0 (or very low)
- [ ] **VERIFY**: Uptime > 1 hour

**Test 29: Port Binding**
```bash
lsof -i :4000
```
**Expected**:
```
PM2 v6   [PID] root   IPv6   TCP *:4000 (LISTEN)
```
- [ ] **VERIFY**: Only PM2 process listening
- [ ] **VERIFY**: No other processes on port 4000

**Test 30: Application Logs**
```bash
pm2 logs alessa-ordering --lines 50
```
- [ ] **VERIFY**: No error messages
- [ ] **VERIFY**: No "EADDRINUSE" errors
- [ ] **VERIFY**: No "Tenant not found" errors
- [ ] **VERIFY**: No Prisma connection errors

**Test 31: Database Connection**
```bash
ssh root@77.243.85.8 "sudo -u postgres psql -d alessa_ordering -c 'SELECT COUNT(*) FROM \"MenuItem\";'"
```
**Expected**: Should return current item count (24+)
- [ ] **VERIFY**: Query succeeds
- [ ] **VERIFY**: Count matches frontend

**Test 32: Nginx Configuration**
```bash
ssh root@77.243.85.8 "nginx -t"
```
**Expected**:
```
nginx: configuration file /etc/nginx/nginx.conf test is successful
```
- [ ] **VERIFY**: No syntax errors
- [ ] **VERIFY**: No warnings

**Test 33: Disk Space**
```bash
ssh root@77.243.85.8 "df -h | grep -E '(Filesystem|/var)'"
```
- [ ] **VERIFY**: / has > 10% free space
- [ ] **VERIFY**: /var has > 20% free space

**Test 34: Memory Usage**
```bash
ssh root@77.243.85.8 "free -h"
```
- [ ] **VERIFY**: Available memory > 500MB
- [ ] **VERIFY**: No swap usage (or minimal)

---

## 7️⃣ URL Response Tests

**Run these commands to verify all URLs respond correctly**:

```bash
# Homepage (should redirect to /order)
curl -I https://lapoblanitamexicanfood.com
# Expected: HTTP/2 307

# Order page
curl -I https://lapoblanitamexicanfood.com/order
# Expected: HTTP/2 200

# Admin login
curl -I https://lapoblanitamexicanfood.com/admin/login
# Expected: HTTP/2 200

# Customer login
curl -I https://lapoblanitamexicanfood.com/customer/login
# Expected: HTTP/2 200

# Alessacloud homepage
curl -I https://alessacloud.com
# Expected: HTTP/2 307

# Alessacloud admin
curl -I https://alessacloud.com/admin/login
# Expected: HTTP/2 200

# Logo image
curl -I https://lapoblanitamexicanfood.com/uploads/1762551053875-7b65c94e-fb64-485f-b6ae-306c9b23ef52.png
# Expected: HTTP/2 200

# API health (if implemented)
curl -I https://lapoblanitamexicanfood.com/api/health
# Expected: HTTP/2 200
```

---

## 8️⃣ Load Testing (Optional)

**Test 35: Concurrent Requests**
```bash
# Install Apache Bench if not available
apt-get install apache2-utils

# Test with 100 concurrent requests
ab -n 100 -c 10 https://lapoblanitamexicanfood.com/order

# Verify:
# - All requests return 200 OK
# - Average response time < 500ms
# - No failed requests
```

**Test 36: Image Load Test**
```bash
# Test image serving under load
ab -n 50 -c 5 https://lapoblanitamexicanfood.com/uploads/1762551053875-7b65c94e-fb64-485f-b6ae-306c9b23ef52.png

# Verify:
# - All requests return 200 OK
# - Average response time < 200ms
```

---

## 9️⃣ Security Tests

**Test 37: HTTPS Enforcement**
```bash
curl -I http://lapoblanitamexicanfood.com
# Expected: HTTP/1.1 301 Moved Permanently
# Location: https://lapoblanitamexicanfood.com
```
- [ ] **VERIFY**: HTTP redirects to HTTPS

**Test 38: SSL Certificate**
```bash
openssl s_client -connect lapoblanitamexicanfood.com:443 -servername lapoblanitamexicanfood.com
```
- [ ] **VERIFY**: Certificate valid
- [ ] **VERIFY**: Not expired
- [ ] **VERIFY**: Issued by Let's Encrypt

**Test 39: Database Port Not Exposed**
```bash
nmap -p 5432 77.243.85.8
```
- [ ] **VERIFY**: Port 5432 filtered or closed
- [ ] **VERIFY**: Not accessible from internet

---

## 🔟 Rollback Test (Optional)

**Test 40: Rollback Procedure**
1. Note current git commit:
   ```bash
   ssh root@77.243.85.8 "cd /var/www/alessa-ordering && git log --oneline -n 1"
   ```
2. Make a test change and deploy
3. Verify change appears
4. Rollback to previous commit:
   ```bash
   ssh root@77.243.85.8 "cd /var/www/alessa-ordering && git reset --hard [commit-hash]"
   ssh root@77.243.85.8 "cd /var/www/alessa-ordering && npm run build && pm2 restart alessa-ordering"
   ```
5. **VERIFY**: Change reverted
6. **VERIFY**: App still running stable

---

## ✅ Testing Checklist Summary

### Critical Tests (Must Pass)
- [ ] Super admin can login
- [ ] Tenant admin can login
- [ ] Order page loads (HTTP 200)
- [ ] All menu items display (24+)
- [ ] Logo displays correctly
- [ ] Admin changes appear immediately (< 2 sec cache)
- [ ] Images upload and display
- [ ] PM2 process online with 0 restarts
- [ ] Port 4000 bound to alessa-ordering only
- [ ] No errors in logs
- [ ] Database queries succeed

### Important Tests (Should Pass)
- [ ] Can add/edit menu items
- [ ] Can change branding (logo, colors)
- [ ] Can manage menu sections
- [ ] Can view orders
- [ ] All URLs return correct status codes
- [ ] HTTPS enforced
- [ ] SSL certificate valid

### Nice-to-Have Tests (Optional)
- [ ] Load testing passes
- [ ] Customer registration/login works
- [ ] Checkout flow completes
- [ ] Email notifications sent
- [ ] Rollback procedure works

---

## 🚨 Common Issues & Solutions

### Issue: Admin changes don't appear on frontend

**Solution**:
1. Check cache headers:
   ```bash
   curl -I https://lapoblanitamexicanfood.com/order | grep -i cache
   ```
   Should see: `cache-control: private, no-cache, no-store, max-age=0`

2. Verify dynamic rendering in app/order/page.tsx:
   ```typescript
   export const dynamic = 'force-dynamic'
   export const revalidate = 0
   export const fetchCache = 'force-no-store'
   ```

3. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)

---

### Issue: Menu item doesn't appear after adding

**Solution**:
1. Check if item has a section assigned:
   ```sql
   SELECT name, "menuSectionId" FROM "MenuItem" WHERE name = '[item-name]';
   ```
2. If `menuSectionId` is NULL, edit item and select a section
3. Save and refresh

---

### Issue: Image upload fails

**Solution**:
1. Check file size (< 5MB)
2. Check file format (JPG, PNG, WebP)
3. Check uploads directory permissions:
   ```bash
   ssh root@77.243.85.8 "ls -la /var/www/alessa-ordering/public/uploads"
   ```
4. Should be 755 for directory, 644 for files

---

### Issue: PM2 process keeps restarting

**Solution**:
1. Check logs:
   ```bash
   pm2 logs alessa-ordering --err --lines 50
   ```
2. Common causes:
   - Port conflict (check with `lsof -i :4000`)
   - Database connection error
   - Missing environment variables
3. Restart once:
   ```bash
   pm2 restart alessa-ordering
   ```

---

## 📊 Expected Test Results

After completing all tests, you should have:

- ✅ **100% uptime** on PM2 process
- ✅ **< 2 second** cache-busting delay
- ✅ **0 errors** in last 100 log lines
- ✅ **< 500ms** average page load time
- ✅ **100% success rate** on all API endpoints
- ✅ **24+ menu items** displaying correctly
- ✅ **All images** loading with HTTP 200

---

## 📞 Support

**If any tests fail**:

1. Check [DO_NOT_MODIFY.md](./DO_NOT_MODIFY.md) for critical configurations
2. Check [VPS_PORT_REGISTRY.md](./VPS_PORT_REGISTRY.md) for port conflicts
3. Check [PRISMA_ISOLATION_REVIEW.md](./PRISMA_ISOLATION_REVIEW.md) for database issues
4. Review PM2 logs: `pm2 logs alessa-ordering --lines 100`
5. Contact project owner with:
   - Test number that failed
   - Error message (if any)
   - Screenshots
   - PM2 logs

---

**Happy Testing!** 🎉

Your MVP is stable and ready to go. All systems are operational.

---

**END OF TESTING GUIDE**
