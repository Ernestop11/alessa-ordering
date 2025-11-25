# LAS REINAS - ASSET SPECIFICATIONS & FOLDER STRUCTURE

## 📁 COMPLETE FOLDER STRUCTURE

```
alessa-ordering/
│
├── public/tenant/lasreinas/          ← PUBLIC WEB ASSETS
│   ├── images/
│   │   ├── logo.png                  [512x512, PNG, <100KB] ⭐ REQUIRED
│   │   ├── logo-white.png            [512x512, PNG, <100KB] ⭐ REQUIRED
│   │   ├── logo-horizontal.png       [1200x400, PNG, <150KB]
│   │   ├── hero-quesabirria-action.jpg [1920x1080, JPG, <300KB] ⭐ REQUIRED
│   │   ├── hero-quesabirria-mobile.jpg [1080x1920, JPG, <200KB]
│   │   ├── hero-taqueria.jpg         [1920x1080, JPG, <300KB]
│   │   ├── hero-carniceria.jpg       [1920x1080, JPG, <300KB]
│   │   ├── og-image.jpg              [1200x630, JPG, <200KB]
│   │   ├── fallback-item.jpg         [800x800, JPG, <80KB]
│   │   └── menu-items/
│   │       ├── quesabirria-single.jpg
│   │       ├── tacos-asada.jpg
│   │       ├── chilaquiles.jpg
│   │       └── ... (69 items total)
│   │
│   ├── videos/
│   │   ├── quesabirria-loop.mp4      [1920x1080, 5-10s, <5MB]
│   │   └── quesabirria-loop.webm     [fallback format]
│   │
│   ├── icons/
│   │   ├── favicon.ico               [Multi-size ICO] ⭐ REQUIRED
│   │   ├── favicon-16x16.png
│   │   ├── favicon-32x32.png
│   │   ├── favicon-192x192.png
│   │   ├── favicon-512x512.png
│   │   └── apple-touch-icon.png      [180x180, PNG]
│   │
│   └── theme.css                     ✅ ALREADY CREATED
│
├── assets/tenant/lasreinas/          ← SOURCE FILES (NOT PUBLIC)
│   ├── raw/
│   │   ├── logo.ai                   [Adobe Illustrator source]
│   │   ├── logo.svg                  [Vector export]
│   │   ├── brand-guidelines.pdf      [Logo usage, colors, spacing]
│   │   ├── photos/
│   │   │   ├── quesabirria-hero.CR2  [RAW camera file]
│   │   │   ├── tacos-action.CR2
│   │   │   ├── restaurant-exterior.CR2
│   │   │   └── food-spread.CR2
│   │   └── videos/
│   │       └── quesabirria-raw.mov   [Uncompressed 4K]
│   │
│   ├── optimized/
│   │   ├── hero/
│   │   │   ├── quesabirria-1920.jpg
│   │   │   ├── quesabirria-1080.jpg
│   │   │   └── quesabirria-2x.jpg    [3840x2160, retina]
│   │   ├── menu-items/
│   │   │   └── [69 optimized images]
│   │   └── thumbnails/
│   │       └── [auto-generated 400x400]
│   │
│   └── psd/
│       ├── hero-template.psd
│       ├── social-template.psd
│       └── menu-item-template.psd
│
├── scripts/
│   ├── seed-data/
│   │   └── las-reinas-menu.json      ✅ CREATED (69 items)
│   └── seed-lasreinas.mjs            ✅ CREATED
│
└── docs/
    ├── LAS_REINAS_DEPLOYMENT_GUIDE.md    ✅ CREATED (14 sections)
    ├── LAS_REINAS_QUICK_REFERENCE.md     ✅ CREATED
    └── LAS_REINAS_ASSET_SPECS.md         ← THIS FILE
```

---

## 🎨 DETAILED ASSET SPECIFICATIONS

### 1. LOGO ASSETS

#### Primary Logo (logo.png)
```yaml
Filename: logo.png
Dimensions: 512x512 pixels (1:1 square)
Format: PNG with transparency
Color Mode: RGB
Bit Depth: 24-bit + 8-bit alpha
Max File Size: 100KB
Background: Transparent
Usage: Header, footer, mobile menu, social media
Optimization: TinyPNG or ImageOptim
```

**Quality Checklist:**
- [ ] Logo is centered in 512x512 canvas
- [ ] Minimum 50px padding on all sides
- [ ] Clean edges (no pixelation)
- [ ] Works on both light and dark backgrounds
- [ ] File size under 100KB

#### White Logo (logo-white.png)
```yaml
Same specs as primary, but:
Color: Pure white (#FFFFFF) or off-white (#F9FAFB)
Usage: Hero overlays, dark card backgrounds, footer
```

#### Horizontal Logo (logo-horizontal.png)
```yaml
Dimensions: 1200x400 pixels (3:1 ratio)
Format: PNG with transparency
Max File Size: 150KB
Usage: Email headers, print materials, wide layouts
```

---

### 2. HERO IMAGES

#### Desktop Hero (hero-quesabirria-action.jpg)
```yaml
Filename: hero-quesabirria-action.jpg
Dimensions: 1920x1080 pixels (16:9 ratio)
Format: JPEG (progressive)
Quality: 85%
Max File Size: 300KB
Color Space: sRGB
Subject: Quesabirria taco being dipped in consommé
Composition: Rule of thirds, food left/center, consommé right
Lighting: Warm (2700-3200K), directional with soft shadows
Focus: Shallow depth of field, taco in sharp focus
Props: Rustic wooden board, red napkin, cilantro garnish
Mood: Appetizing, inviting, authentic
Optimization: JPEGmini or Squoosh
```

**Photography Guidelines:**
- [ ] Shot from 45° angle (not top-down)
- [ ] Steam or splash visible (action shot)
- [ ] Cheese pull visible
- [ ] Warm color grading (slightly orange/red tint)
- [ ] No distracting backgrounds
- [ ] High contrast for text overlay

#### Mobile Hero (hero-quesabirria-mobile.jpg)
```yaml
Dimensions: 1080x1920 pixels (9:16 vertical)
Same quality specs as desktop
Composition: Vertical crop, focus on single quesabirria
Max File Size: 200KB
```

**Mobile Cropping Notes:**
- Center the main subject (quesabirria)
- Leave 30% headroom at top for text overlay
- Ensure critical elements visible in safe zone (center 70%)

---

### 3. FAVICON SET

#### Multi-Size ICO (favicon.ico)
```yaml
Filename: favicon.ico
Formats: ICO container with multiple sizes
Sizes Included: 16x16, 32x32, 48x48 (all in one file)
Background: Red (#DC2626) or white
Design: Simplified logo mark or "LR" monogram
Tool: Real Favicon Generator (realfavicongenerator.net)
```

#### Individual PNG Favicons
```yaml
favicon-16x16.png   → Browser tab
favicon-32x32.png   → Browser bookmark bar
favicon-192x192.png → Android home screen
favicon-512x512.png → Android splash screen
apple-touch-icon.png → iOS home screen (180x180)
```

**Favicon Design Tips:**
- Use bold, simple shapes (intricate details lost at small sizes)
- High contrast colors
- Avoid text under 48px size
- Test at actual size before exporting

---

### 4. MENU ITEM PHOTOGRAPHY

#### Standard Menu Item Photo
```yaml
Dimensions: 800x800 pixels (1:1 square)
Format: JPEG
Quality: 80-85%
Max File Size: 100KB per image
Color Space: sRGB
Background: Neutral (wood, slate, white) or blurred
Lighting: Even, soft, natural-looking
Angle: 45° or overhead
Styling: Minimal props, garnished appropriately
```

**Naming Convention:**
```
{section}-{item-name}.jpg

Examples:
quesabirrias-single.jpg
tacos-asada.jpg
breakfast-chilaquiles.jpg
burritos-california.jpg
platillos-carne-asada.jpg
```

**Priority Shoot List (Featured Items First):**
1. ⭐ Quesabirria (3) - signature dish
2. ⭐ Quesabirria Plate
3. ⭐ Molcajete Las Reinas
4. ⭐ Chilaquiles Verdes
5. ⭐ California Burrito
6. Tacos de Asada
7. Carne Asada Plate
8. Breakfast Burrito
... (Full list: 69 items)

---

### 5. VIDEO ASSETS

#### Hero Video Loop (quesabirria-loop.mp4)
```yaml
Filename: quesabirria-loop.mp4
Codec: H.264 (MP4)
Resolution: 1920x1080 @ 30fps
Duration: 5-10 seconds (seamless loop)
Max File Size: 5MB
Bitrate: ~4000 kbps (variable)
Audio: None (muted)
Optimization: HandBrake or FFmpeg

Content: Slow-motion quesabirria dip
- 0-2s: Taco hovering over consommé
- 2-4s: Slow dip into broth
- 4-6s: Cheese pull as taco lifts
- 6-8s: Return to hover (loop point)
```

**WebM Fallback:**
```yaml
Filename: quesabirria-loop.webm
Same specs but VP9 codec
Max File Size: 4MB
```

**Shooting Tips:**
- Shoot at 60-120fps for smooth slow-mo
- Use macro lens for close-up detail
- Warm lighting (tungsten or daylight balanced)
- Multiple takes for perfect cheese pull

**FFmpeg Optimization Command:**
```bash
ffmpeg -i input.mov \
  -vcodec libx264 \
  -crf 23 \
  -preset slow \
  -vf scale=1920:1080 \
  -an \
  quesabirria-loop.mp4
```

---

### 6. SOCIAL SHARING IMAGES

#### Open Graph Image (og-image.jpg)
```yaml
Filename: og-image.jpg
Dimensions: 1200x630 pixels (1.91:1 ratio)
Format: JPEG
Quality: 85%
Max File Size: 200KB
Usage: Facebook, LinkedIn, Slack, WhatsApp previews

Content:
- Background: Hero food photo (slightly darkened)
- Logo: Top-left or center (200px width max)
- Headline: "Las Reinas Colusa" (48-60pt bold)
- Tagline: "Authentic Mexican Taqueria" (24-32pt)
- CTA: "Order Online Now" (optional)
- Border: 2-3px red border (#DC2626)
```

**Safe Zones:**
- 40px margin from all edges
- Logo/text centered in middle 70%
- Test preview at: https://www.opengraph.xyz/

#### Twitter Card
```yaml
Filename: twitter-card.jpg
Dimensions: 1200x600 pixels (2:1 ratio)
Same quality as OG image
Similar design, adjusted crop
```

---

## 🛠️ IMAGE OPTIMIZATION WORKFLOW

### Step 1: Export from Source
```bash
# From Photoshop/Lightroom
- Export as JPEG, Quality 90%, sRGB
- Embed color profile
- Resize to exact dimensions
- Sharpen for screen (amount: 0.3, radius: 0.5)
```

### Step 2: Compress
```bash
# Using ImageOptim (Mac)
1. Drag images to ImageOptim app
2. Lossy compression enabled
3. Strip metadata (except copyright)
4. Target: 70-85% quality

# Using TinyPNG (Web)
1. Upload to tinypng.com
2. Download optimized version
3. Verify file size reduced 40-60%

# Using Squoosh (Web)
1. Upload to squoosh.app
2. MozJPEG codec
3. Quality: 80-85
4. Compare side-by-side before download
```

### Step 3: Verify
```bash
# Check dimensions
file hero-quesabirria-action.jpg

# Check file size
ls -lh hero-quesabirria-action.jpg

# Check quality (visual)
open hero-quesabirria-action.jpg
# Zoom to 100%, check for artifacts
```

### Step 4: Generate WebP Versions (Optional)
```bash
# Using cwebp
cwebp -q 85 hero-quesabirria-action.jpg -o hero-quesabirria-action.webp

# Batch convert
for file in *.jpg; do
  cwebp -q 85 "$file" -o "${file%.jpg}.webp"
done
```

---

## 📸 RECOMMENDED PHOTOGRAPHY EQUIPMENT

### Camera Setup
- **Camera:** DSLR or mirrorless (Canon/Sony/Nikon)
- **Lens:** 50mm f/1.8 or 100mm macro
- **Tripod:** Stable overhead or 45° angle
- **Remote:** Cable release or self-timer

### Lighting
- **Natural:** Shoot near large window, diffused light
- **Artificial:** 2-3 continuous LED panels (5500K daylight)
- **Reflectors:** White foam board for fill light
- **Diffusion:** White shower curtain or softbox

### Props & Styling
- Rustic wooden boards (dark walnut or oak)
- Slate tiles (black or gray)
- Red cloth napkins (brand color)
- Cilantro, lime, radish for garnish
- Small bowls for salsa/consommé
- Aged metal utensils

---

## 🎨 COLOR CALIBRATION

### Monitor Settings
- Brightness: 120 cd/m² (medium-bright room)
- Contrast: Native/100%
- Color Temperature: 6500K (D65)
- Gamma: 2.2
- Color Space: sRGB

### Editing Guidelines
- Slight warm bias (+5 temperature)
- +10-15 saturation on reds/oranges
- +5-10 vibrance overall
- Sharpen: Amount 50, Radius 1.0, Detail 25
- Export Color Space: sRGB IEC61966-2.1

---

## 📋 ASSET DELIVERY CHECKLIST

### Must-Have (Week 1)
- [ ] Logo PNG (512x512)
- [ ] Logo White PNG (512x512)
- [ ] Hero Desktop JPG (1920x1080, <300KB)
- [ ] Favicon ICO (multi-size)

### Important (Week 2)
- [ ] Hero Mobile JPG (1080x1920, <200KB)
- [ ] OG Social Image JPG (1200x630)
- [ ] 7 Featured Menu Item Photos (800x800 each)

### Nice-to-Have (Week 3+)
- [ ] Hero Video MP4 + WebM (<5MB)
- [ ] All 69 Menu Item Photos
- [ ] Category Header Images
- [ ] Horizontal Logo PNG (1200x400)

---

## 🚀 QUICK UPLOAD COMMANDS

### Via SFTP (FileZilla, Cyberduck)
```
Local:  /Users/you/las-reinas-assets/
Remote: /var/www/alessa-ordering/public/tenant/lasreinas/
```

### Via SCP (Terminal)
```bash
# Upload logo
scp logo.png root@77.243.85.8:/var/www/alessa-ordering/public/tenant/lasreinas/images/

# Upload entire folder
scp -r images/ root@77.243.85.8:/var/www/alessa-ordering/public/tenant/lasreinas/
```

### Via Git (Recommended)
```bash
# Add assets to repo
git add public/tenant/lasreinas/images/logo.png
git add public/tenant/lasreinas/images/hero-quesabirria-action.jpg

git commit -m "feat(lasreinas): add logo and hero image"
git push origin main

# Deploy
ssh root@77.243.85.8 "cd /var/www/alessa-ordering && git pull"
```

---

## 🧪 TESTING ASSETS

### Local Testing
```bash
# Start dev server
npm run dev

# Visit tenant URL
open http://localhost:3000?tenant=lasreinas

# Check browser console for 404s
# Check Network tab for asset load times
```

### Production Testing
```bash
# Check image loads
curl -I https://lasreinas.order.alessacloud.com/tenant/lasreinas/images/logo.png

# Should return: HTTP 200 OK

# Check file size
curl https://lasreinas.order.alessacloud.com/tenant/lasreinas/images/hero-quesabirria-action.jpg \
  -o /tmp/hero.jpg && ls -lh /tmp/hero.jpg
```

### Performance Audit
```bash
# Run Lighthouse
npx lighthouse https://lasreinas.order.alessacloud.com \
  --only-categories=performance \
  --output=html \
  --output-path=./lighthouse-report.html

# Target Scores:
# Performance: 90+
# Largest Contentful Paint: <2.5s
# Cumulative Layout Shift: <0.1
```

---

## 📞 ASSET CREATION SERVICES (If Needed)

### Professional Photography
- **Local Photographers:** Search "food photographer Colusa CA"
- **Fiverr:** $50-200 for full menu shoot
- **99designs:** Contest for custom food photos

### Logo Design
- **Existing Logo:** Request vector file from Las Reinas
- **New Logo:** Fiverr, 99designs, Looka (AI generator)

### Video Production
- **DIY:** iPhone 13+ in Cinematic mode
- **Pro:** Local videographer, 4-8 hours shoot

---

**Asset Specs Version:** 1.0
**Last Updated:** November 10, 2025
**For Questions:** See main deployment guide
