# 🧪 Image Cache-Busting Testing Guide

## ✅ Implementation Verified

All cache-busting functionality is implemented and deployed:

1. **Tenant Logo/Hero Images**: Using `tenant.updatedAt` timestamp
2. **Menu Item Images**: Using `menuItem.updatedAt` timestamp  
3. **Path Revalidation**: Triggered on upload and settings save
4. **Cache-Busting URLs**: Format: `?t={timestamp}` appended to image URLs

---

## 🧪 Manual Testing Steps

### Test 1: Upload New Tenant Logo

**Steps:**
1. Navigate to admin panel: `http://lapoblanitamexicanfood.com:4000/admin/login`
2. Login with admin credentials
3. Go to **Settings** page
4. Find **Tenant Logo** section
5. Click **Upload Logo** or drag-and-drop a new image
6. Click **Save** or **Update**
7. Open a new tab: `http://lapoblanitamexicanfood.com:4000/order`
8. Open DevTools (F12) → **Network** tab
9. Refresh the page (F5)
10. Find the logo image request in the Network tab
11. Check the image URL - it should have `?t={timestamp}` parameter
12. The timestamp should be **NEWER** than the previous one

**Expected Result:**
- ✅ New logo appears immediately (no hard refresh needed)
- ✅ URL includes timestamp: `/uploads/...png?t=1762XXXXXXX`
- ✅ Timestamp matches `tenant.updatedAt` from database

---

### Test 2: Upload New Menu Item Image

**Steps:**
1. Go to admin panel: `http://lapoblanitamexicanfood.com:4000/admin`
2. Go to **Menu Management**
3. Find any menu item
4. Click **Edit** button
5. Find **Image** section
6. Click **Upload Image** or drag-and-drop a new image
7. Click **Save**
8. Open a new tab: `http://lapoblanitamexicanfood.com:4000/order`
9. Find the menu item you just updated
10. Right-click the image → **Inspect Element**
11. Check the `src` attribute of the `<img>` tag
12. The URL should have `?t={timestamp}` parameter

**Expected Result:**
- ✅ New image appears immediately
- ✅ URL includes timestamp: `/uploads/...jpeg?t=1762XXXXXXX`
- ✅ Timestamp matches `menuItem.updatedAt` from database

---

### Test 3: Verify Cache-Busting in HTML

**Steps:**
1. Visit: `http://lapoblanitamexicanfood.com:4000/order`
2. Open DevTools (F12) → **Elements** tab
3. Press `Ctrl+F` (or `Cmd+F` on Mac) to search
4. Search for: `?t=`
5. You should see multiple image URLs with timestamp parameters

**Expected Result:**
- ✅ All tenant images have `?t={timestamp}` parameter
- ✅ All menu item images have `?t={timestamp}` parameter
- ✅ Timestamps are consistent with database values

---

## 🔍 Verification Commands

### Check Current Database Timestamps

```bash
ssh root@77.243.85.8 "cd /var/www/alessa-ordering && node -e \"
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  // Check tenant timestamp
  const tenant = await prisma.tenant.findFirst({
    where: { slug: 'lapoblanita' },
    select: { name: true, logoUrl: true, updatedAt: true }
  });
  
  console.log('📊 Tenant Cache-Busting:');
  console.log('  Tenant:', tenant.name);
  console.log('  Logo:', tenant.logoUrl);
  console.log('  Updated At:', tenant.updatedAt);
  console.log('  Timestamp:', new Date(tenant.updatedAt).getTime());
  console.log('  Cache-Buster:', '?t=' + new Date(tenant.updatedAt).getTime());
  
  // Check menu item timestamp
  const menuItem = await prisma.menuItem.findFirst({
    where: { image: { startsWith: '/uploads/' } },
    orderBy: { updatedAt: 'desc' },
    select: { name: true, image: true, updatedAt: true }
  });
  
  console.log('\\n📊 Menu Item Cache-Busting:');
  console.log('  Item:', menuItem.name);
  console.log('  Image:', menuItem.image);
  console.log('  Updated At:', menuItem.updatedAt);
  console.log('  Timestamp:', new Date(menuItem.updatedAt).getTime());
  console.log('  Cache-Buster:', '?t=' + new Date(menuItem.updatedAt).getTime());
  
  await prisma.\\\$disconnect();
})();
\""
```

### Check Cache-Busting in Live HTML

```bash
curl -s http://lapoblanitamexicanfood.com:4000/order | grep -o "?t=[0-9]\{13\}" | head -5
```

**Expected Output:**
```
?t=1762551064110
?t=1762647536660
?t=1762647536660
...
```

---

## ✅ Success Criteria

All of these should be **TRUE**:

- [ ] Tenant logo URL includes `?t={timestamp}` parameter
- [ ] Menu item images include `?t={timestamp}` parameter
- [ ] Upload triggers path revalidation
- [ ] New images appear without hard refresh (Ctrl+Shift+R)
- [ ] Timestamps change when images are updated
- [ ] No browser cache issues
- [ ] Works on first try (no delay)

---

## 🐛 Troubleshooting

### Images Still Cached?

**Check 1: PM2 Status**
```bash
ssh root@77.243.85.8 "pm2 list | grep alessa-ordering"
```
Should show: `online` status

**Check 2: Verify Build Includes Changes**
```bash
ssh root@77.243.85.8 "cd /var/www/alessa-ordering && grep 'tenantTimestamp' app/layout.tsx"
```
Should show: `const tenantTimestamp = new Date(tenant.updatedAt).getTime();`

**Check 3: Restart PM2**
```bash
ssh root@77.243.85.8 "pm2 restart alessa-ordering"
```

**Check 4: Clear Browser Cache**
- Open DevTools (F12)
- Right-click refresh button → **Empty Cache and Hard Reload**
- Or: `Ctrl+Shift+Delete` → Clear cache

### Timestamp Not Changing?

**Check Database:**
```bash
# Run the verification command above to check tenant.updatedAt
# The timestamp should update when you save settings
```

**Check Path Revalidation:**
```bash
ssh root@77.243.85.8 "cd /var/www/alessa-ordering && grep -A 2 'revalidatePath' app/api/admin/tenant-settings/route.ts"
```
Should show: `revalidatePath('/')` and `revalidatePath('/order')`

---

## 📊 Current Known Timestamps

**Last Verified:** 2025-11-09 01:00 UTC

- **Tenant Logo:** `?t=1762551064110`
- **Pastor Taco Image:** `?t=1762647536660`

When you upload a new image, these timestamps should **increase** (higher number = newer timestamp).

---

## 🎯 Quick Test Checklist

- [ ] Upload new tenant logo via admin panel
- [ ] Check frontend shows new logo immediately
- [ ] Verify logo URL has new timestamp
- [ ] Upload new menu item image via admin panel
- [ ] Check frontend shows new image immediately
- [ ] Verify image URL has new timestamp
- [ ] Check HTML source for `?t=` parameters
- [ ] Verify no browser cache issues

---

## 📞 Support

If you encounter issues:
1. Check PM2 logs: `ssh root@77.243.85.8 "pm2 logs alessa-ordering --lines 50"`
2. Check database connection: Run verification command above
3. Check build status: `ssh root@77.243.85.8 "cd /var/www/alessa-ordering && ls -la .next/BUILD_ID"`
4. Restart PM2: `ssh root@77.243.85.8 "pm2 restart alessa-ordering"`

