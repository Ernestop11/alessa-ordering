# 🚀 QUICK IMAGE UPLOAD TEST - 5 Minute Checklist

## Prerequisites
- [ ] Dev server running: `http://localhost:3001`
- [ ] Admin login working
- [ ] Have 3-4 test images ready (logo, banner, food pics)

---

## ⚡ 6 QUICK TESTS

### 1️⃣ Logo Upload (2 min)
**Admin → Settings Tab**
- [ ] Upload logo image
- [ ] Save
- [ ] Check frontend header shows logo

### 2️⃣ Hero Image Upload (2 min)
**Admin → Settings Tab**
- [ ] Upload hero/banner image
- [ ] Save
- [ ] Check frontend homepage shows banner

### 3️⃣ Colors (1 min)
**Admin → Settings Tab**
- [ ] Change Primary Color (try red #FF0000)
- [ ] Change Secondary Color (try blue #0000FF)
- [ ] Save
- [ ] Check frontend buttons/accents use new colors

### 4️⃣ Menu Item Image (2 min)
**Admin → Menu Tab**
- [ ] Click any menu item to edit
- [ ] Upload main image
- [ ] Save
- [ ] Check frontend menu shows new image

### 5️⃣ Gallery Images (2 min)
**Admin → Menu Tab**
- [ ] Edit same menu item
- [ ] Upload 2-3 gallery images
- [ ] Save
- [ ] Check frontend item has image carousel

### 6️⃣ Section Banner (2 min)
**Admin → Customize Tab**
- [ ] Select a menu section
- [ ] Upload section image
- [ ] Save
- [ ] Check frontend section has banner

---

## ✅ SUCCESS CRITERIA

ALL MUST BE TRUE:
- [ ] All uploads completed without errors
- [ ] All images visible on frontend
- [ ] No broken image icons
- [ ] Colors changed and visible
- [ ] Images persist after refresh
- [ ] `/public/uploads/` folder has files

---

## 🐛 If Something Fails

**Quick Fixes:**
1. Hard refresh browser: `Cmd+Shift+R` / `Ctrl+F5`
2. Check browser console for errors
3. Verify you're logged in as admin
4. Check `/public/uploads/` folder exists

**Still broken?** See full guide: `IMAGE_UPLOAD_TEST_GUIDE.md`

---

## 📸 Recommended Test Images

Download these or use your own:
- **Logo:** 200x200px square, transparent background
- **Hero:** 1920x600px wide banner
- **Menu Items:** 800x600px food photos
- **Gallery:** 1200x900px high-res food photos

---

## ⏱️ Total Time: ~10-12 minutes

Once complete, you're ready for:
- ✅ Printer/notification testing
- ✅ Onboarding documentation
- ✅ MVP launch!
