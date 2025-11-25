# Las Reinas Colusa - Tenant Assets

## 📁 Folder Structure

```
lasreinas/
├── README.md              ← You are here
├── theme.css              ✅ Red/gold theme overrides
├── images/
│   ├── logo.png           ⚠️ REQUIRED - Upload needed
│   ├── logo-white.png     ⚠️ REQUIRED - Upload needed
│   ├── hero-quesabirria-action.jpg  ⚠️ REQUIRED - Upload needed
│   ├── hero-quesabirria-mobile.jpg  (Optional)
│   ├── og-image.jpg       (Optional - Social sharing)
│   └── menu-items/        (69 items - Optional)
├── videos/
│   └── quesabirria-loop.mp4  (Optional)
└── icons/
    ├── favicon.ico        ⚠️ REQUIRED - Upload needed
    ├── favicon-16x16.png
    ├── favicon-32x32.png
    ├── favicon-192x192.png
    ├── favicon-512x512.png
    └── apple-touch-icon.png
```

---

## 🚨 REQUIRED FILES TO UPLOAD

Before going live, you MUST upload these 3 files:

### 1. Logo (logo.png)
- **Dimensions:** 512x512 pixels (square)
- **Format:** PNG with transparency
- **Max Size:** 100KB
- **Background:** Transparent
- **Usage:** Header, footer, social media

### 2. Hero Image (hero-quesabirria-action.jpg)
- **Dimensions:** 1920x1080 pixels (landscape)
- **Format:** JPEG optimized
- **Max Size:** 300KB
- **Subject:** Quesabirria taco being dipped in consommé
- **Usage:** Homepage hero banner

### 3. Favicon (favicon.ico)
- **Dimensions:** 16x16, 32x32 (multi-size ICO)
- **Format:** ICO or PNG
- **Background:** Red or white
- **Usage:** Browser tab icon

---

## 📸 RECOMMENDED ASSETS (Optional but Highly Recommended)

### Logo White Version
- Path: `images/logo-white.png`
- Same specs as logo.png but white color
- Usage: Dark backgrounds, hero overlays

### Mobile Hero
- Path: `images/hero-quesabirria-mobile.jpg`
- Dimensions: 1080x1920 pixels (portrait)
- Format: JPEG, <200KB
- Usage: Mobile hero banner

### Menu Item Photos
- Path: `images/menu-items/{item-name}.jpg`
- Dimensions: 800x800 pixels (square)
- Format: JPEG, <100KB each
- Count: 69 items total
- Priority: Start with 7 featured items

---

## 🎨 BRAND COLORS

```css
Primary Red:     #DC2626
Dark Red:        #991B1B
Accent Gold:     #FBBF24
```

---

## 📥 HOW TO UPLOAD ASSETS

### Option 1: Via Git (Recommended)

```bash
# 1. Add your files to this folder locally
cp ~/Downloads/logo.png public/tenant/lasreinas/images/
cp ~/Downloads/hero.jpg public/tenant/lasreinas/images/hero-quesabirria-action.jpg

# 2. Commit and push
git add public/tenant/lasreinas/images/
git commit -m "feat(lasreinas): add logo and hero image"
git push origin main

# 3. Deploy to VPS
ssh root@77.243.85.8 "cd /var/www/alessa-ordering && git pull"
```

### Option 2: Via SCP (Direct Upload)

```bash
# Upload single file
scp logo.png root@77.243.85.8:/var/www/alessa-ordering/public/tenant/lasreinas/images/

# Upload entire folder
scp -r images/ root@77.243.85.8:/var/www/alessa-ordering/public/tenant/lasreinas/
```

### Option 3: Via SFTP (GUI)

Use FileZilla, Cyberduck, or similar:
- Host: 77.243.85.8
- User: root
- Remote path: `/var/www/alessa-ordering/public/tenant/lasreinas/`

---

## ✅ VERIFY ASSETS

After uploading, verify files are accessible:

```bash
# Local testing
open http://localhost:3000/tenant/lasreinas/images/logo.png

# Production testing
curl -I https://lasreinas.order.alessacloud.com/tenant/lasreinas/images/logo.png
# Should return: HTTP 200 OK
```

---

## 🎯 PLACEHOLDER IMAGES

If you don't have assets yet, use these placeholders:

### Logo Placeholder
```bash
# Download placeholder logo (red circle)
curl -L "https://ui-avatars.com/api/?name=LR&size=512&background=DC2626&color=fff&bold=true" \
  -o images/logo.png
```

### Hero Placeholder
```bash
# Download quesabirria stock photo
curl -L "https://source.unsplash.com/1920x1080/?quesabirria,mexican-food,tacos" \
  -o images/hero-quesabirria-action.jpg
```

### Favicon Generator
Visit: https://realfavicongenerator.net/
- Upload logo.png
- Download generated favicon set
- Extract to `icons/` folder

---

## 📊 FILE SIZE GUIDELINES

| File Type | Max Size | Recommended |
|-----------|----------|-------------|
| Logo PNG | 100KB | 50-80KB |
| Hero JPG | 300KB | 200-250KB |
| Menu Item | 100KB | 60-80KB |
| Favicon ICO | 50KB | 10-20KB |
| OG Image | 200KB | 150KB |

**Optimization Tools:**
- TinyPNG: https://tinypng.com
- Squoosh: https://squoosh.app
- ImageOptim (Mac): Free app

---

## 🔍 TROUBLESHOOTING

### Images Not Loading (404 Error)

**Check 1: File exists**
```bash
ls -la public/tenant/lasreinas/images/logo.png
```

**Check 2: File permissions**
```bash
chmod 644 public/tenant/lasreinas/images/*.{png,jpg}
```

**Check 3: Next.js serving static files**
```bash
# Restart dev server
npm run dev
```

**Check 4: Correct path in code**
```typescript
// Correct:
/tenant/lasreinas/images/logo.png

// Wrong:
/public/tenant/lasreinas/images/logo.png
```

---

### Images Too Large / Slow Loading

**Compress with TinyPNG:**
```bash
# Visit https://tinypng.com
# Upload image
# Download optimized version
# Should reduce size by 40-70%
```

**Compress with ImageMagick:**
```bash
# Install: brew install imagemagick

# Compress JPEG
convert hero.jpg -quality 85 -resize 1920x1080 hero-optimized.jpg

# Compress PNG
convert logo.png -quality 85 -resize 512x512 logo-optimized.png
```

---

### Wrong Colors / Dark Logo on Dark Background

**Issue:** Logo is dark, can't see on dark backgrounds

**Solution:** Upload white version
```bash
# Create white version in Photoshop/GIMP
# Or use ImageMagick:
convert logo.png -negate logo-white.png
```

---

## 📞 SUPPORT

For questions about assets or deployment:

**Technical Issues:**
- Check: `/docs/LAS_REINAS_DEPLOYMENT_GUIDE.md`
- See: `/docs/LAS_REINAS_ASSET_SPECS.md`

**Design Questions:**
- Review: `/docs/LAS_REINAS_VISUAL_SUMMARY.md`
- Contact: Design team

**Quick Reference:**
- See: `/docs/LAS_REINAS_QUICK_REFERENCE.md`

---

## 📋 ASSET CHECKLIST

Before going live:

**Required (Can't launch without):**
- [ ] Logo PNG uploaded (512x512)
- [ ] Hero image uploaded (1920x1080)
- [ ] Favicon generated and uploaded

**Highly Recommended (Better UX):**
- [ ] Logo white version uploaded
- [ ] Mobile hero uploaded (1080x1920)
- [ ] OG social image uploaded (1200x630)

**Nice to Have (Improves quality):**
- [ ] 7 featured item photos uploaded
- [ ] All 69 menu item photos uploaded
- [ ] Hero video loop uploaded (optional)
- [ ] Category header images uploaded

---

**Tenant:** Las Reinas Colusa
**Slug:** lasreinas
**Theme:** Red (#DC2626) + Gold (#FBBF24)
**Specialty:** Quesabirrias
**Status:** ⚠️ Assets pending upload
**Last Updated:** November 10, 2025
