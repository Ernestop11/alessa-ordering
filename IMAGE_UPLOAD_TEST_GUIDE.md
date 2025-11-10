# 🖼️ Image Upload System - Complete Testing Guide

## Overview
This guide will help you verify that ALL image upload functionality works correctly in the admin dashboard. The system already has a robust upload API and UI - we just need to verify it all works.

---

## 🔧 Setup

### 1. Ensure Dev Server is Running
```bash
# Should already be running on port 3001
# If not, run:
PORT=3001 npm run dev
```

### 2. Access Admin Dashboard
- URL: `http://localhost:3001/admin`
- Login credentials should be your admin account

---

## ✅ TEST CHECKLIST

### TEST 1: Logo Upload (Settings Tab)

**Location:** Admin Dashboard → Settings Tab → Logo Section

**Steps:**
1. Click on "Settings" tab in admin dashboard
2. Find the "Logo" upload section
3. Click "Choose File" or upload button
4. Select an image file (PNG, JPG, WebP recommended)
5. Click "Save" or "Upload"

**Expected Results:**
- ✅ Upload progress indicator appears
- ✅ Image uploads successfully
- ✅ Preview of logo appears in admin
- ✅ Go to `http://localhost:3001` - logo should appear in header
- ✅ Check database: `Tenant.logoUrl` should contain `/uploads/[timestamp]-[uuid].ext`

**Upload API Used:** `POST /api/admin/assets/upload`
**Database Field:** `Tenant.logoUrl`

---

### TEST 2: Hero Image Upload (Settings Tab)

**Location:** Admin Dashboard → Settings Tab → Hero Image Section

**Steps:**
1. In Settings tab, find "Hero Image" section
2. Upload a wide banner image (recommended: 1920x600px or similar)
3. Save changes

**Expected Results:**
- ✅ Image uploads successfully
- ✅ Go to `http://localhost:3001` - hero image should appear at top of page
- ✅ Image should be responsive (looks good on mobile)
- ✅ Check database: `Tenant.heroImageUrl` should be populated

**Upload API Used:** `POST /api/admin/assets/upload`
**Database Field:** `Tenant.heroImageUrl`

---

### TEST 3: Menu Item Image Upload (Menu Tab)

**Location:** Admin Dashboard → Menu Tab → Edit Menu Item

**Steps:**
1. Click "Menu" tab
2. Click on any existing menu item to edit
3. Find the "Main Image" upload field
4. Upload a food image
5. Save the menu item

**Expected Results:**
- ✅ Image uploads successfully
- ✅ Preview appears in menu editor
- ✅ Go to `http://localhost:3001` - menu item should show new image
- ✅ Image appears in menu cards on order page
- ✅ Check database: `MenuItem.image` should contain upload URL

**Upload API Used:** `POST /api/admin/assets/upload`
**Database Field:** `MenuItem.image`

---

### TEST 4: Menu Item Gallery Upload (Menu Tab)

**Location:** Admin Dashboard → Menu Tab → Edit Menu Item → Gallery

**Steps:**
1. Edit a menu item
2. Find "Gallery" or "Additional Images" section
3. Upload multiple images (2-3 images recommended)
4. Save the menu item

**Expected Results:**
- ✅ All images upload successfully
- ✅ Gallery preview shows all images in admin
- ✅ On order page, menu item should have image carousel/gallery
- ✅ Users can swipe through images when viewing item details
- ✅ Check database: `MenuItem.gallery` should be JSON array of URLs

**Upload API Used:** `POST /api/admin/assets/upload`
**Database Field:** `MenuItem.gallery` (JSON array)

---

### TEST 5: Section Hero Image Upload (Customize Tab)

**Location:** Admin Dashboard → Customize Tab → Menu Sections

**Steps:**
1. Click "Customize" tab
2. Select a menu section (e.g., "Tacos Tradicionales")
3. Find section image/hero upload
4. Upload section banner image
5. Save changes

**Expected Results:**
- ✅ Section image uploads successfully
- ✅ Image appears as section header/banner on order page
- ✅ Check database: `MenuSection.imageUrl` should be populated

**Upload API Used:** `POST /api/admin/assets/upload`
**Database Field:** `MenuSection.imageUrl`

---

### TEST 6: Color Customization (Settings Tab)

**Location:** Admin Dashboard → Settings Tab → Branding

**Steps:**
1. In Settings tab, find color pickers
2. Change "Primary Color" (e.g., to #FF0000 - red)
3. Change "Secondary Color" (e.g., to #00FF00 - green)
4. Save changes

**Expected Results:**
- ✅ Colors save successfully
- ✅ Go to `http://localhost:3001` - UI should use new colors
- ✅ Buttons, headers, accents should reflect new primary color
- ✅ Check database: `Tenant.primaryColor` and `Tenant.secondaryColor` updated

**Database Fields:**
- `Tenant.primaryColor` (default: #dc2626)
- `Tenant.secondaryColor` (default: #f59e0b)

---

## 🔍 VERIFICATION CHECKLIST

After completing all tests, verify the following:

### Frontend Verification
- [ ] Visit `http://localhost:3001`
- [ ] Logo appears in header/navbar
- [ ] Hero image displays on homepage
- [ ] All menu items show their uploaded images
- [ ] Gallery images are viewable in item details
- [ ] Color scheme matches what you set in admin
- [ ] All images load quickly (no broken image icons)
- [ ] Images are appropriately sized and don't distort

### Database Verification
Run these queries in your database tool or Prisma Studio:

```sql
-- Check logo and hero image
SELECT name, logoUrl, heroImageUrl, primaryColor, secondaryColor
FROM "Tenant"
WHERE slug = 'lapoblanita';

-- Check menu item images
SELECT id, name, image, gallery
FROM "MenuItem"
LIMIT 5;

-- Check section images
SELECT id, name, imageUrl
FROM "MenuSection";
```

### File System Verification
- [ ] Check `/public/uploads/` directory
- [ ] All uploaded images should be there
- [ ] Filenames should follow pattern: `[timestamp]-[uuid].[ext]`
- [ ] No duplicate or orphaned files

---

## 🐛 TROUBLESHOOTING

### Issue: Upload fails with "Unauthorized"
**Solution:**
- Make sure you're logged in as admin
- Check session is valid
- Try logging out and back in

### Issue: Image uploads but doesn't appear on frontend
**Possible Causes:**
1. Cache issue - try hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)
2. Path mismatch - check console for 404 errors
3. Database not updated - verify field was saved

**Solution:**
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

### Issue: Image is too large / slow to load
**Solution:**
- Recommended max size: 2MB per image
- Use image optimization tools before upload
- Consider implementing server-side image compression (future enhancement)

### Issue: Gallery images don't show carousel
**Check:**
- Are multiple images actually saved in `MenuItem.gallery`?
- Open browser console - any JavaScript errors?
- Check if gallery component is rendering correctly

---

## 📊 UPLOAD API TECHNICAL DETAILS

### Endpoint: `POST /api/admin/assets/upload`

**Request:**
- Content-Type: `multipart/form-data`
- Body: `{ file: File }`

**Response:**
```json
{
  "url": "/uploads/1699564823456-abc123.jpg"
}
```

**Storage Location:** `/public/uploads/`

**Security:**
- Admin/Super Admin authentication required
- Only image files allowed (MIME type check)
- Random UUID prevents filename conflicts
- Files are NOT publicly writable (upload endpoint required)

**File Naming Convention:**
```
[timestamp]-[uuid].[extension]
Example: 1699564823456-a1b2c3d4-e5f6.jpg
```

---

## 🎯 SUCCESS CRITERIA

You can consider the image upload system **FULLY FUNCTIONAL** if:

✅ All 6 tests pass without errors
✅ Images appear correctly on frontend
✅ Database fields are properly populated
✅ No console errors when viewing uploaded images
✅ Images persist after page refresh
✅ Multiple uploads work in sequence
✅ File system contains all uploaded files

---

## 🚀 NEXT STEPS

Once image uploads are verified:
1. Test the printer/notification system for new orders
2. Create restaurant onboarding documentation
3. Test complete order flow end-to-end

---

## 📝 NOTES

### Image Recommendations
- **Logo:** 200x200px, transparent PNG
- **Hero Image:** 1920x600px, JPG/WebP
- **Menu Items:** 800x600px, JPG (food photography)
- **Gallery:** 1200x900px, high quality JPG
- **Section Banners:** 1600x400px, JPG/WebP

### Browser Compatibility
- Tested on: Chrome, Firefox, Safari, Edge
- Mobile responsive: Yes
- File size limit: Configurable (currently unlimited, recommend adding 5MB limit)

---

**Last Updated:** November 9, 2024
**System Version:** MVP 1.0
**Database:** PostgreSQL + Prisma
