# End-to-End Cache-Busting Test Guide

## 📋 Test Overview

**Objective:** Verify that uploading a new tenant logo triggers cache-busting and displays immediately without hard refresh

**Duration:** ~5 minutes

**Prerequisites:**
- Admin access to https://lapoblanita.alessacloud.com/admin
- SSH access to VPS (root@77.243.85.8)
- Test image file (PNG or JPG, < 5MB)

---

## 🧪 Test Methods

### **Method 1: Automated Test Script** (Recommended)

Run the interactive test script:

```bash
./scripts/test-cache-busting-live.sh
```

The script will:
1. ✅ Capture current state (timestamp, logo URL)
2. ⏸️ Pause for you to upload new logo via admin panel
3. ✅ Verify database timestamp updated
4. ✅ Verify HTML cache-buster updated
5. ✅ Display before/after comparison

---

### **Method 2: Manual Step-by-Step**

#### **Step 1: Record Baseline**

```bash
ssh root@77.243.85.8 "cd /var/www/alessa-ordering && node -e \"
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.tenant.findFirst({ where: { slug: 'lapoblanita' } })
  .then(t => {
    console.log('BEFORE UPLOAD:');
    console.log('Logo URL:', t.logoUrl);
    console.log('Updated At:', t.updatedAt);
    console.log('Timestamp:', new Date(t.updatedAt).getTime());
  })
  .finally(() => prisma.\\\$disconnect());
\""
```

**Note the timestamp** (e.g., `1762551064110`)

---

#### **Step 2: Upload New Logo**

1. **Access Admin Panel:**
   ```
   https://lapoblanita.alessacloud.com/admin/login
   ```

2. **Login** with admin credentials

3. **Navigate to Settings:**
   - Click "Settings" or "Tenant Settings"
   - Find "Logo Upload" section

4. **Upload New Image:**
   - Click "Upload Logo" button
   - Select test image (PNG/JPG)
   - Wait for preview
   - Click "Save" or "Update Settings"

5. **Wait for Success Message**

---

#### **Step 3: Verify Database Update**

```bash
ssh root@77.243.85.8 "cd /var/www/alessa-ordering && node -e \"
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.tenant.findFirst({ where: { slug: 'lapoblanita' } })
  .then(t => {
    const oldTimestamp = 1762551064110; // REPLACE WITH YOUR BASELINE
    const newTimestamp = new Date(t.updatedAt).getTime();
    console.log('AFTER UPLOAD:');
    console.log('Logo URL:', t.logoUrl);
    console.log('Updated At:', t.updatedAt);
    console.log('New Timestamp:', newTimestamp);
    console.log('');
    console.log('VERIFICATION:');
    console.log('Old:', oldTimestamp);
    console.log('New:', newTimestamp);
    console.log('Diff:', (newTimestamp - oldTimestamp), 'ms');
    console.log('Status:', newTimestamp > oldTimestamp ? '✅ UPDATED' : '❌ FAILED');
  })
  .finally(() => prisma.\\\$disconnect());
\""
```

**Expected:**
- ✅ New timestamp > old timestamp
- ✅ Logo URL changed (new filename)

---

#### **Step 4: Verify HTML Cache-Buster**

```bash
ssh root@77.243.85.8 "curl -s http://localhost:4000/order | grep -o 'logoUrl\":\"[^\"]*' | python3 -c 'import sys, urllib.parse; print(urllib.parse.unquote(sys.stdin.read()))'"
```

**Expected Output:**
```
logoUrl":"/uploads/1762XXXXXXXXX-NEW-IMAGE.png?t=1762XXXXXXXXX
```

**Verify:**
- ✅ Cache-buster `?t=` matches new timestamp from Step 3

---

#### **Step 5: Visual Frontend Test**

1. **Open Order Page:**
   ```
   https://lapoblanita.alessacloud.com/order
   ```

2. **Soft Refresh Only:**
   - Press F5 (or Cmd+R on Mac)
   - **DO NOT** hard refresh (Ctrl+Shift+R / Cmd+Shift+R)

3. **Check Logo:**
   - New logo should appear immediately
   - No browser cache clearing needed

4. **Inspect Element:**
   - Right-click logo → Inspect
   - Check `src` attribute
   - Should include `?t=` with new timestamp

**Expected HTML:**
```html
<img src="/_next/image?url=%2Fuploads%2F1762XXX-NEW.png%3Ft%3D1762XXX&w=128&q=75" />
```

---

## ✅ Success Criteria

| Test | Expected Result | Status |
|------|-----------------|--------|
| **Database Timestamp** | New timestamp > old timestamp | ☐ |
| **Logo URL** | New filename in database | ☐ |
| **HTML Cache-Buster** | `?t=` matches new timestamp | ☐ |
| **Frontend Display** | New logo visible without hard refresh | ☐ |
| **Browser DevTools** | Image URL includes new `?t=` parameter | ☐ |

**Overall Result:** Pass if all 5 tests succeed ✅

---

## 🔍 Troubleshooting

### **Issue: Timestamp didn't update**

**Cause:** Prisma not auto-updating `updatedAt`

**Fix:**
1. Check that you saved the settings (clicked "Save" button)
2. Verify Prisma schema has `@updatedAt` on tenant model
3. Check for errors in PM2 logs:
   ```bash
   ssh root@77.243.85.8 'pm2 logs alessa-ordering --lines 50'
   ```

---

### **Issue: HTML doesn't have new timestamp**

**Cause:** Next.js cache not invalidated

**Fix:**
1. Verify `revalidatePath` is called in upload route:
   ```bash
   ssh root@77.243.85.8 "grep -A 3 'revalidatePath' /var/www/alessa-ordering/app/api/admin/assets/upload/route.ts"
   ```
2. Manually restart PM2:
   ```bash
   ssh root@77.243.85.8 'pm2 restart alessa-ordering'
   ```

---

### **Issue: Old logo still showing in browser**

**Cause:** Browser cached the old image URL

**Fix:**
1. Check if the URL actually changed (different `?t=` value)
2. Try in incognito/private browser window
3. Clear browser cache manually (last resort)

**Note:** If cache-busting is working correctly, you should NOT need to clear browser cache

---

## 📊 Test Results Template

```
Date: _______________
Tester: _______________

Before Upload:
  Logo URL: ________________________________________________
  Timestamp: ________________________________________________

After Upload:
  Logo URL: ________________________________________________
  Timestamp: ________________________________________________

Verification:
  [ ] Database timestamp updated (+______ ms)
  [ ] Logo URL changed to new filename
  [ ] HTML cache-buster matches new timestamp
  [ ] New logo visible without hard refresh
  [ ] DevTools shows new ?t= parameter

Overall Result: [ ] PASS  [ ] FAIL

Notes:
________________________________________________________________
________________________________________________________________
________________________________________________________________
```

---

## 🎯 What This Tests

### **Cache-Busting Flow:**

```
1. Admin uploads new logo
   ↓
2. Image saved to /uploads/
   ↓
3. revalidatePath('/') called
   ↓
4. Admin saves tenant settings
   ↓
5. Prisma auto-updates tenant.updatedAt
   ↓
6. Next.js cache invalidated
   ↓
7. Next request re-renders with fresh data
   ↓
8. layout.tsx calculates new timestamp
   ↓
9. Image URL gets new ?t= parameter
   ↓
10. Browser sees new URL, fetches fresh image
    ✅ User sees updated logo immediately
```

---

## 🚀 Quick Test (30 seconds)

For a quick smoke test:

```bash
# 1. Get current timestamp
ssh root@77.243.85.8 "cd /var/www/alessa-ordering && node -e \"const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.tenant.findFirst({ where: { slug: 'lapoblanita' } }).then(t => console.log(new Date(t.updatedAt).getTime())).finally(() => p.\\\$disconnect());\""

# 2. Upload new logo via admin panel (manual)

# 3. Check new timestamp
ssh root@77.243.85.8 "cd /var/www/alessa-ordering && node -e \"const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.tenant.findFirst({ where: { slug: 'lapoblanita' } }).then(t => console.log(new Date(t.updatedAt).getTime())).finally(() => p.\\\$disconnect());\""

# 4. Compare: new timestamp should be higher
```

---

## 📖 Related Documentation

- [CACHE_BUSTING_SUMMARY.md](./CACHE_BUSTING_SUMMARY.md) - Technical implementation
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Complete overview
- [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - Quick commands

---

**Last Updated:** 2025-11-09
**Test Status:** ✅ Ready for production testing
