# 📸 Guide: Download Images from Wix Site (Las Reinas Colusa)

This guide will help you download product images from `www.lasreinascolusa.com` and add them to your Las Reinas tenant.

---

## 🎯 Quick Start (Recommended Method)

### Step 1: Extract Image URLs from Wix Site

1. **Open the Wix site** in your browser:
   ```
   https://www.lasreinascolusa.com
   ```

2. **Open Browser Console**:
   - **Chrome/Edge**: Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
   - **Firefox**: Press `F12` or `Cmd+Option+K` (Mac) / `Ctrl+Shift+K` (Windows)
   - **Safari**: Enable Developer menu first, then `Cmd+Option+C`

3. **Paste the browser script**:
   - Open: `scripts/extract-wix-images-browser.js`
   - Copy the entire script
   - Paste into browser console
   - Press Enter

4. **Copy the JSON output**:
   - The script will display all product images
   - Copy the JSON output at the bottom

### Step 2: Download Images

1. **Update the download script**:
   - Open: `scripts/download-images-from-urls.js`
   - Find the `IMAGE_URLS` array (around line 12)
   - Paste your JSON output there

2. **Run the download script**:
   ```bash
   node scripts/download-images-from-urls.js
   ```

   Images will be saved to:
   ```
   public/tenant/lasreinas/images/menu-items/
   ```

### Step 3: Map Images to Menu Items

1. **Review downloaded images**:
   ```bash
   ls public/tenant/lasreinas/images/menu-items/
   ```

2. **Update the mapping**:
   - Open: `scripts/map-images-to-menu-items.js`
   - Update the `IMAGE_MAPPING` object with your image file names:
   ```javascript
   const IMAGE_MAPPING = {
     'Carnitas Plate': 'carnitas-plate.jpg',
     'Birria Tacos': 'birria-tacos.jpg',
     // Add more mappings...
   };
   ```

3. **Run the mapping script**:
   ```bash
   node scripts/map-images-to-menu-items.js
   ```

### Step 4: Verify

1. **Check the ordering page**:
   ```
   http://localhost:3001/order?tenant=lasreinas
   ```

2. **Images should now appear** for each menu item!

---

## 🔄 Alternative Method: Manual Download

If the automated method doesn't work, you can download images manually:

### Step 1: Download Images Manually

1. Visit `www.lasreinascolusa.com` in your browser
2. Right-click each product image → "Save image as..."
3. Save to: `public/tenant/lasreinas/images/menu-items/`
4. Name them descriptively:
   - `carnitas-plate.jpg`
   - `birria-tacos.jpg`
   - `carne-asada-1-lb.jpg`
   - `homemade-salsa-roja-16oz.jpg`

### Step 2: Map Images (Same as above)

Follow Step 3 from the Quick Start method.

---

## 📋 Current Menu Items

Based on the seed file, Las Reinas has these menu items:

1. **Carnitas Plate** - $15.99
2. **Birria Tacos** - $16.49
3. **Carne Asada (1 lb)** - $11.99
4. **Homemade Salsa Roja (16oz)** - $6.50

---

## 🛠️ Troubleshooting

### Images not showing on the site?

1. **Check file paths**:
   - Images should be in: `public/tenant/lasreinas/images/menu-items/`
   - Paths in database should be: `/tenant/lasreinas/images/menu-items/[filename].jpg`

2. **Check file permissions**:
   ```bash
   chmod 644 public/tenant/lasreinas/images/menu-items/*.jpg
   ```

3. **Restart dev server**:
   ```bash
   npm run dev
   ```

### Browser script not working?

- Make sure you're on the actual Wix site
- Try scrolling down the page to load more content
- Check browser console for errors

### Images are the wrong size?

- Recommended size: 800x800px (square)
- Max file size: 100KB per image
- Optimize with: https://tinypng.com

---

## 📁 File Structure

```
public/tenant/lasreinas/images/
├── menu-items/
│   ├── carnitas-plate.jpg
│   ├── birria-tacos.jpg
│   ├── carne-asada-1-lb.jpg
│   ├── homemade-salsa-roja-16oz.jpg
│   └── download-results.json (auto-generated)
└── ...
```

---

## ✅ Success Checklist

- [ ] Extracted image URLs from Wix site
- [ ] Downloaded all images to `menu-items/` folder
- [ ] Updated `IMAGE_MAPPING` in mapping script
- [ ] Ran mapping script successfully
- [ ] Verified images appear on ordering page
- [ ] Images are properly sized and optimized

---

**Need help?** Check the scripts in `scripts/` folder or review this guide again.

