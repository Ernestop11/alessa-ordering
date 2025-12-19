# La Poblanita Setup Guide

## Overview

La Poblanita is the first template-driven tenant using the new Template Builder system. This document outlines the setup process and configuration.

## Setup Status

✅ **Completed:**
- Tenant created in database
- Template created and configured
- Design Studio settings applied
- Initial blocks created
- Asset directories created

## Tenant Configuration

- **Name:** La Poblanita
- **Slug:** `lapoblanita`
- **Status:** APPROVED
- **Primary Color:** `#1e3a5f` (Puebla Blue)
- **Secondary Color:** `#c9a227` (Gold)
- **Type:** RESTAURANT

## Template Configuration

### Design Studio Settings

- **Background Gradient:** Puebla Blue (`linear-gradient(180deg, #1e3a5f 0%, #2d4a6f 50%, #1e3a5f 100%)`)
- **Pattern:** Gold Filigree (15% opacity)
- **Card Style:** Puebla Blue (custom preset with gold accents)
- **Animation:** Pulse Glow
- **Glow Effect:** Enabled
- **Typography:**
  - Heading Font: Bebas Neue
  - Body Font: Inter

### Template Blocks

1. **HERO** (Position 0)
   - Title: "La Poblanita"
   - Subtitle: "Authentic Mexican Cuisine"
   - Badge: "FRESH DAILY"
   - CTA: "Order Now"

2. **FEATURED_ITEMS** (Position 1)
   - Title: "Featured Specials"
   - Subtitle: "Chef's favorites"

3. **MENU_SECTION** (Position 2)
   - Title: "Menu"
   - Subtitle: "Explore our menu"

4. **HOURS_LOCATION** (Position 3)
   - Title: "Hours & Location"
   - Subtitle: "Visit us or order online"

5. **DELIVERY_PARTNERS** (Position 4)
   - Title: "Delivery Options"
   - Subtitle: "Order from your favorite platform"

## Asset Directories

Assets are stored in:
```
public/tenant/lapoblanita/
├── images/
│   ├── logo.png (required)
│   ├── hero.jpg (required)
│   └── menu-items/
│       └── *.jpg (menu item photos)
└── README.md
```

### Required Images

1. **Logo** (`images/logo.png`)
   - Recommended: 200x200px, transparent PNG
   - Served at: `/tenant/lapoblanita/images/logo.png`

2. **Hero Image** (`images/hero.jpg`)
   - Recommended: 1920x600px, JPG
   - Served at: `/tenant/lapoblanita/images/hero.jpg`

3. **Menu Item Photos** (`images/menu-items/*.jpg`)
   - Recommended: 800x600px, JPG
   - Served at: `/tenant/lapoblanita/images/menu-items/{filename}.jpg`

## Setup Scripts

### Initial Setup
```bash
npx tsx scripts/setup-lapoblanita.ts
```

This script:
- Creates the tenant (if it doesn't exist)
- Creates the template
- Adds initial blocks
- Creates asset directories

### Update Template Settings
```bash
npx tsx scripts/update-lapoblanita-template.ts
```

This script updates the Design Studio settings with the correct configuration.

## Next Steps

1. **Add Assets**
   - Upload logo to `public/tenant/lapoblanita/images/logo.png`
   - Upload hero image to `public/tenant/lapoblanita/images/hero.jpg`
   - Add menu item photos as needed

2. **Configure Template Blocks**
   - Visit `/super-admin/template-builder/{tenantId}/{templateId}`
   - Customize block content and styling
   - Add menu items to blocks

3. **Add Menu Items**
   - Use the admin dashboard to add menu sections and items
   - Assign items to template blocks

4. **Configure Integrations**
   - Set up Stripe Connect account
   - Configure Apple Pay domain verification
   - Set up delivery partner integrations (if needed)

5. **Nginx Configuration**
   - Configure subdomain: `lapoblanita.alessacloud.com`
   - Point to the application

## Access URLs

- **Admin Dashboard:** `/admin` (login required)
- **Template Builder:** `/super-admin/template-builder/{tenantId}/{templateId}`
- **Public Order Page:** `/lapoblanita/order`
- **Preview Mode:** `/lapoblanita/order?preview=true`

## Custom Card Style

A custom "Puebla Blue" card style has been added to the presets:
- **Card Background:** `linear-gradient(180deg, #1e3a5f 0%, #2d4a6f 100%)`
- **Image Background:** `linear-gradient(180deg, #152a47 0%, #1e3a5f 100%)`
- **Border Color:** `#c9a227` (Gold)
- **Accent Color:** `#c9a227` (Gold)
- **Glow Color:** `#fbbf24` (Bright Gold)

## Template Builder Features

La Poblanita uses the full Template Builder system:
- ✅ Live preview with real-time updates
- ✅ Design Studio for visual customization
- ✅ Block management (add, edit, reorder, delete)
- ✅ Menu item assignment to blocks
- ✅ Template settings persistence

## Support

For issues or questions:
1. Check the Template Builder documentation
2. Review the Design Studio presets
3. Test in preview mode before publishing

