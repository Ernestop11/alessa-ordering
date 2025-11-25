# LAS REINAS TENANT - COMPLETE DEPLOYMENT GUIDE

## Overview
Las Reinas Colusa is a Mexican Taqueria & Carniceria in Colusa, CA. This guide provides everything needed to deploy their tenant with custom branding, menu, and UI components.

---

## 1. TENANT INFORMATION

**Business Details:**
- **Name:** Las Reinas Colusa
- **Type:** Carniceria y Taqueria (Butcher Shop & Taco Restaurant)
- **Location:** 751 Fremont St, Colusa, CA 95932
- **Phone:** (530) 458-7775
- **Hours:**
  - Monday-Saturday: 8:00 AM - 8:00 PM
  - Sunday: 8:00 AM - 6:00 PM
- **Specialty:** Quesabirrias (signature dish), Street Tacos, Breakfast

**Website:** https://lasreinascolusa.com

---

## 2. THEME CONFIGURATION

### Brand Colors

```typescript
const lasReinasTheme = {
  // Primary red (main brand color)
  primary: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',  // Base
    600: '#DC2626',  // Primary brand red
    700: '#B91C1C',
    800: '#991B1B',  // Dark red
    900: '#7F1D1D',
  },

  // Secondary/Accent gold
  accent: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FBBF24',  // Gold accent
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
  },

  // Neutrals (keep consistent)
  neutral: {
    dark: '#1A1A1A',
    darkGray: '#2D2D2D',
    mediumGray: '#6B7280',
    lightGray: '#D1D5DB',
    offWhite: '#F9FAFB',
  }
}
```

### Tailwind Config Override

Create `/tailwind.config.lasreinas.js`:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        // Override primary to red
        primary: {
          DEFAULT: '#DC2626',
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
        },
        // Accent gold
        accent: {
          DEFAULT: '#FBBF24',
          light: '#FCD34D',
          dark: '#D97706',
        },
      },
      backgroundImage: {
        // Red gradients for Las Reinas
        'gradient-primary': 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
        'gradient-accent': 'linear-gradient(135deg, #DC2626 0%, #FBBF24 50%, #DC2626 100%)',
        'gradient-hero': 'linear-gradient(to bottom, rgba(220, 38, 38, 0.9), rgba(153, 27, 27, 0.95))',
      },
    },
  },
}
```

### CSS Variables

Add to tenant-specific CSS:

```css
/* /public/tenant/lasreinas/theme.css */
:root[data-tenant="lasreinas"] {
  /* Brand Colors */
  --color-primary: #DC2626;
  --color-primary-dark: #991B1B;
  --color-primary-light: #EF4444;
  --color-accent: #FBBF24;
  --color-accent-dark: #D97706;

  /* Gradient Overlays */
  --gradient-hero: linear-gradient(to bottom, rgba(220, 38, 38, 0.9), rgba(153, 27, 27, 0.95));
  --gradient-card: linear-gradient(135deg, #DC2626 0%, #991B1B 100%);
  --gradient-button: linear-gradient(135deg, #DC2626 0%, #FBBF24 50%, #DC2626 100%);

  /* Shadows */
  --shadow-primary: 0 10px 40px rgba(220, 38, 38, 0.3);
  --shadow-accent: 0 10px 20px rgba(251, 191, 36, 0.2);

  /* Typography */
  --font-heading: 'Bebas Neue', 'Impact', sans-serif;
  --font-body: 'Inter', -apple-system, sans-serif;
}
```

---

## 3. HERO BANNER DESIGNS

### Hero Option 1: "Bold & Fiery"
**Concept:** Large, dramatic image with red overlay and bold typography

```typescript
const hero1 = {
  title: "Bienvenidos a Las Reinas",
  subtitle: "Authentic Mexican Flavors Since Day One",
  backgroundImage: "/tenant/lasreinas/hero-quesabirrias.jpg",
  overlay: "gradient-to-b from-red-600/90 via-red-700/90 to-red-900/95",
  cta: {
    primary: "Order Our Famous Quesabirrias",
    secondary: "View Full Menu"
  },
  features: [
    { icon: "🔥", text: "Signature Quesabirrias" },
    { icon: "🌮", text: "Street Tacos" },
    { icon: "🥩", text: "Fresh Meats Daily" }
  ]
}
```

**Design Notes:**
- Full-width hero (100vh on mobile, 70vh on desktop)
- High-contrast white text on red overlay
- Animated CTA buttons with gold accent hover
- Floating feature badges at bottom
- Parallax scroll effect on background image

**Image Requirements:**
- Primary: Sizzling quesabirrias on griddle (1920x1080px)
- Mobile: Close-up of birria taco dipped in consommé (1080x1920px)

---

### Hero Option 2: "Authentic Market Vibes"
**Concept:** Split-screen showcasing taqueria + carniceria

```typescript
const hero2 = {
  layout: "split-screen",
  left: {
    image: "/tenant/lasreinas/hero-taqueria.jpg",
    label: "Taqueria",
    overlay: "from-red-600/80 to-transparent"
  },
  right: {
    image: "/tenant/lasreinas/hero-carniceria.jpg",
    label: "Carniceria",
    overlay: "from-amber-500/80 to-transparent"
  },
  center: {
    logo: "/tenant/lasreinas/logo.png",
    tagline: "Comida Auténtica • Carne Fresca",
    cta: "Start Your Order"
  }
}
```

**Design Notes:**
- Desktop: 50/50 split with centered overlay
- Mobile: Vertical stack with logo between
- Hover effects reveal more of each image
- Diagonal divider line with logo in center

---

### Hero Option 3: "Quesabirria Showcase" (RECOMMENDED)
**Concept:** Product-focused hero highlighting signature dish

```typescript
const hero3 = {
  background: {
    type: "video-loop",
    src: "/tenant/lasreinas/quesabirria-loop.mp4",
    fallback: "/tenant/lasreinas/hero-quesabirria-action.jpg",
    overlay: "radial-gradient(circle at center, transparent 0%, rgba(220, 38, 38, 0.7) 100%)"
  },
  content: {
    badge: "🔥 SIGNATURE DISH",
    heading: "Quesabirrias",
    subheading: "Crispy, Cheesy, Perfection",
    description: "Tender birria beef + melted cheese in a crispy tortilla. Dipped in rich consommé.",
    price: "Starting at $4.99",
    cta: {
      primary: "Order Quesabirrias Now",
      secondary: "See Full Menu"
    }
  },
  animation: {
    type: "fade-up-stagger",
    duration: 800
  }
}
```

**Design Notes:**
- 5-second looping video of quesabirria being dipped
- Centered content with glassmorphism card
- Animated price badge with pulse effect
- Sticky CTA button that follows scroll
- Instagram-worthy aesthetic

**Video/Image Requirements:**
- Video: 10-15 sec loop, 1080p, <5MB
- Image fallback: Ultra high-res quesabirria beauty shot
- Mobile optimized version (vertical crop)

---

## 4. COMPONENT OVERRIDES

To match La Poblanita's layout 1:1 but with Las Reinas theme:

### Files to Create/Override

```
/components/tenant/lasreinas/
├── OrderPageClient.tsx          # Red theme, same layout
├── MenuSection.tsx               # Red gradient backgrounds
├── CartDrawer.tsx                # Red accent colors
├── CheckoutFlow.tsx              # Red progress indicators
├── HeroSection.tsx               # Custom hero (Option 3)
└── FeaturedCarousel.tsx          # Red navigation dots
```

### Key Style Overrides

**1. Button Styles:**
```typescript
// Replace rose/amber gradients with red/gold
const buttonStyles = {
  primary: "bg-gradient-to-r from-red-600 via-amber-400 to-red-600",
  hover: "hover:shadow-red-500/40",
  ring: "focus:ring-red-500"
}
```

**2. Card Backgrounds:**
```typescript
// Dark cards with red accents
const cardStyles = {
  background: "bg-gradient-to-br from-[#1a1a1a] via-[#2d2d2d] to-[#1a1a1a]",
  border: "border border-red-500/20",
  hover: "hover:border-red-500/40 hover:shadow-red-500/20"
}
```

**3. Section Headers:**
```typescript
// Red section dividers
const sectionStyles = {
  title: "text-4xl font-bold bg-gradient-to-r from-red-500 to-amber-400 bg-clip-text text-transparent",
  divider: "border-t-2 border-red-600"
}
```

**4. Featured Badge:**
```typescript
// Replace rose with red
const badgeStyles = {
  background: "bg-red-600",
  text: "text-white",
  glow: "shadow-lg shadow-red-500/50"
}
```

**5. Menu Item Cards:**
```typescript
// Keep same structure, just swap colors
const menuItemCard = {
  wrapper: "group relative overflow-hidden rounded-2xl border border-white/10",
  hoverOverlay: "group-hover:border-red-500/30",
  priceTag: "bg-gradient-to-r from-red-600 to-amber-400",
  addButton: "bg-gradient-to-r from-red-600 via-amber-400 to-red-600"
}
```

### Component Mapping

| La Poblanita Component | Las Reinas Override | Change Type |
|------------------------|---------------------|-------------|
| HeroSection | ✅ Full override | Custom quesabirria hero |
| MenuSection | 🎨 Style only | Red gradients |
| FeaturedCarousel | 🎨 Style only | Red nav dots |
| CartDrawer | 🎨 Style only | Red accents |
| CheckoutFlow | 🎨 Style only | Red progress bar |
| OrderConfirmation | 🎨 Style only | Red success icon |
| FooterSection | 📝 Content + Style | Red links, new content |

**Legend:**
- ✅ Full Override: New component file
- 🎨 Style Only: Same JSX, different classes
- 📝 Content + Style: New content + red theme

---

## 5. ASSET FOLDER STRUCTURE

### Required Assets Directory

```
/public/tenant/lasreinas/
├── images/
│   ├── logo.png                    # Main logo (512x512px, transparent)
│   ├── logo-white.png              # White version for dark backgrounds
│   ├── logo-horizontal.png         # Horizontal lockup (1200x400px)
│   ├── favicon.ico                 # Browser favicon
│   ├── hero-quesabirria-action.jpg # Main hero image (1920x1080px)
│   ├── hero-quesabirria-mobile.jpg # Mobile hero (1080x1920px)
│   ├── hero-taqueria.jpg           # Taqueria split-screen
│   ├── hero-carniceria.jpg         # Carniceria split-screen
│   ├── menu-breakfast.jpg          # Category headers
│   ├── menu-tacos.jpg
│   ├── menu-quesabirrias.jpg
│   ├── menu-burritos.jpg
│   ├── menu-plates.jpg
│   ├── og-image.jpg                # Social sharing (1200x630px)
│   └── fallback-item.jpg           # Default menu item image
│
├── videos/
│   ├── quesabirria-loop.mp4        # Hero video loop (5-10s, <5MB)
│   └── quesabirria-loop.webm       # WebM version for compatibility
│
├── icons/
│   ├── apple-touch-icon.png        # iOS home screen (180x180px)
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   └── favicon-192x192.png
│
└── theme.css                        # Tenant-specific CSS overrides
```

### Source Asset Structure

```
/assets/tenant/lasreinas/
├── raw/                             # Original high-res files
│   ├── logo.ai                      # Vector logo (Adobe Illustrator)
│   ├── logo.svg                     # SVG export
│   ├── photos/                      # Original photography
│   │   ├── quesabirria-hero.CR2     # RAW camera files
│   │   ├── tacos-action.CR2
│   │   └── restaurant-exterior.CR2
│   └── videos/
│       └── quesabirria-raw.mov      # Uncompressed video
│
├── optimized/                       # Web-ready exports
│   ├── hero/
│   │   ├── quesabirria-1920.jpg     # Desktop hero
│   │   ├── quesabirria-1080.jpg     # Mobile hero
│   │   └── quesabirria-2x.jpg       # Retina display
│   ├── menu-items/
│   │   ├── quesabirria-single.jpg   # Product shots (800x800px)
│   │   ├── tacos-asada.jpg
│   │   └── [item-name].jpg
│   └── thumbnails/
│       └── [item-name]-thumb.jpg    # Thumbnails (400x400px)
│
└── brand-guidelines.pdf             # Logo usage, colors, fonts
```

---

## 6. IMAGE SPECIFICATIONS

### Logo Requirements

**Primary Logo:**
- Format: PNG with transparency
- Dimensions: 512x512px (square)
- Color: Full color on transparent background
- Usage: Header, mobile menu, social media

**Horizontal Logo:**
- Format: PNG with transparency
- Dimensions: 1200x400px (3:1 ratio)
- Usage: Email headers, print materials

**White Logo:**
- Format: PNG with transparency
- Same dimensions as primary
- Usage: Dark backgrounds, hero overlays

**Favicon:**
- Format: ICO, PNG
- Dimensions: 16x16, 32x32, 192x192, 512x512
- Background: Transparent or white
- Usage: Browser tab, bookmarks

---

### Hero Images

**Desktop Hero:**
- Dimensions: 1920x1080px minimum
- Format: JPG (optimized, <300KB)
- Subject: Quesabirrias being dipped in consommé
- Lighting: Warm, appetizing
- Composition: Rule of thirds, food in focus

**Mobile Hero:**
- Dimensions: 1080x1920px (vertical)
- Format: JPG (optimized, <200KB)
- Subject: Close-up of crispy quesabirria
- Crop: Portrait orientation, food-focused

**Hero Video (Optional):**
- Format: MP4 (H.264) + WebM fallback
- Duration: 5-10 seconds looped
- Dimensions: 1920x1080px @ 30fps
- File size: <5MB total
- Content: Quesabirria dip in slow motion

---

### Menu Item Images

**Product Shots:**
- Dimensions: 800x800px (1:1 ratio)
- Format: JPG (optimized, <100KB each)
- Background: Neutral or rustic (wood, slate)
- Lighting: Natural, soft shadows
- Styling: Garnished, props minimal

**Thumbnails:**
- Dimensions: 400x400px
- Format: JPG (optimized, <50KB)
- Auto-generated from product shots

**Gallery Images:**
- Dimensions: 1200x800px (3:2 ratio)
- Format: JPG (<150KB)
- Usage: Item detail modal

---

### Social Sharing

**Open Graph Image:**
- Dimensions: 1200x630px
- Format: JPG
- Content: Logo + hero food shot + tagline
- Usage: Facebook, LinkedIn, Slack previews

**Twitter Card:**
- Dimensions: 1200x600px (2:1 ratio)
- Format: JPG
- Similar to OG but different crop

---

## 7. TYPOGRAPHY

### Font Stack

**Headings:**
```css
font-family: 'Bebas Neue', 'Impact', 'Arial Black', sans-serif;
font-weight: 700;
letter-spacing: 0.05em;
text-transform: uppercase;
```

**Body:**
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
font-weight: 400;
line-height: 1.6;
```

**Accent (Menu Items):**
```css
font-family: 'Montserrat', 'Helvetica Neue', sans-serif;
font-weight: 600;
```

### Font Loading

Add to `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&family=Montserrat:wght@600;700&display=swap" rel="stylesheet">
```

---

## 8. LAYOUT COMPARISON: LA POBLANITA → LAS REINAS

### Identical Layout Elements (Keep As-Is)

✅ **Navigation:**
- Fixed header with logo left, menu right
- Mobile: Hamburger menu
- Cart icon with badge count
- Same structure, just red accents

✅ **Hero Section:**
- Full-width banner
- Overlay gradient (red instead of rose)
- CTA buttons (same layout, red colors)
- Same responsive breakpoints

✅ **Menu Grid:**
- 3-column grid on desktop
- 2-column on tablet
- 1-column on mobile
- Same card structure
- Same hover effects (red glow instead of rose)

✅ **Featured Carousel:**
- Horizontal scroll
- Snap points
- Same card design
- Red navigation dots

✅ **Cart Drawer:**
- Slide-in from right
- Item list with +/- buttons
- Subtotal breakdown
- Checkout button (red)

✅ **Checkout Flow:**
- 2-step process
- Progress indicator (red)
- Same form fields
- Same validation

✅ **Footer:**
- 3-column layout (desktop)
- Stacked on mobile
- Social icons
- Copyright text

### Elements to Customize

🎨 **Colors Only:**
- Primary buttons: Rose → Red
- Gradients: Rose/Amber → Red/Gold
- Hover states: Rose glow → Red glow
- Links: Rose → Red
- Badge backgrounds: Rose → Red

📝 **Content + Colors:**
- Hero headline/copy
- Featured item descriptions
- Footer links & text
- About section copy

✅ **Full Override:**
- Hero background image/video
- Logo in header
- Favicon
- Social sharing images

---

## 9. DEPLOYMENT CHECKLIST

### Pre-Deployment

- [ ] Create tenant in super admin dashboard
- [ ] Set slug: `lasreinas`
- [ ] Set custom domain: `lasreinas.order.alessacloud.com`
- [ ] Upload logo to `/public/tenant/lasreinas/images/logo.png`
- [ ] Upload hero image
- [ ] Set primary color in settings: `#DC2626`
- [ ] Set accent color: `#FBBF24`

### Database Seeding

- [ ] Run seeder script: `npm run seed:lasreinas`
- [ ] Verify 10 menu sections created
- [ ] Verify 70+ menu items created
- [ ] Check featured items marked correctly
- [ ] Verify pricing matches JSON

### Asset Upload

- [ ] Logo (512x512)
- [ ] Logo white version
- [ ] Favicon set (16, 32, 192, 512)
- [ ] Hero image desktop (1920x1080)
- [ ] Hero image mobile (1080x1920)
- [ ] OG social image (1200x630)
- [ ] Menu category headers (optional)

### Theme Configuration

- [ ] Update CSS variables in `theme.css`
- [ ] Test red color scheme across all pages
- [ ] Verify button gradients render correctly
- [ ] Check mobile responsiveness
- [ ] Test dark mode (if applicable)

### Content Review

- [ ] Verify all menu items display
- [ ] Check pricing accuracy
- [ ] Verify item descriptions
- [ ] Test search functionality
- [ ] Verify featured items show correctly

### Functionality Testing

- [ ] Test add to cart (all item types)
- [ ] Test cart drawer open/close
- [ ] Test checkout flow (2 steps)
- [ ] Test order submission
- [ ] Verify order confirmation page
- [ ] Test customer login (OTP)
- [ ] Test order history

### Performance

- [ ] Run Lighthouse audit (target: 90+ performance)
- [ ] Optimize hero images (<300KB)
- [ ] Lazy load menu item images
- [ ] Test on slow 3G connection
- [ ] Verify cache-busting on assets

### SEO & Social

- [ ] Set page title: "Las Reinas Colusa - Order Online"
- [ ] Set meta description
- [ ] Verify OG image displays in Facebook debugger
- [ ] Test Twitter card preview
- [ ] Submit sitemap to Google

### Post-Deployment

- [ ] Send test order
- [ ] Verify admin receives order notification
- [ ] Test order status updates
- [ ] Verify email confirmations (if enabled)
- [ ] Train restaurant staff on admin dashboard

---

## 10. SEEDER SCRIPT

Create `/scripts/seed-lasreinas.mjs`:

```javascript
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('🌮 Seeding Las Reinas Colusa...')

  // Load menu data
  const menuData = JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), 'scripts/seed-data/las-reinas-menu.json'),
      'utf-8'
    )
  )

  // Find or create tenant
  let tenant = await prisma.tenant.findFirst({
    where: { slug: 'lasreinas' }
  })

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: menuData.tenant.name,
        slug: menuData.tenant.slug,
        domain: menuData.tenant.domain,
        description: menuData.tenant.description,
        settings: menuData.tenant.settings,
      }
    })
    console.log(`✅ Created tenant: ${tenant.name}`)
  }

  // Create menu sections
  const sectionMap = {}
  for (const sectionData of menuData.sections) {
    const section = await prisma.menuSection.create({
      data: {
        ...sectionData,
        tenantId: tenant.id
      }
    })
    sectionMap[section.name] = section.id
    console.log(`  📁 Created section: ${section.name}`)
  }

  // Create menu items
  let itemCount = 0
  for (const itemData of menuData.items) {
    const sectionId = sectionMap[itemData.section]
    if (!sectionId) {
      console.warn(`  ⚠️  Section not found: ${itemData.section}`)
      continue
    }

    await prisma.menuItem.create({
      data: {
        name: itemData.name,
        description: itemData.description,
        price: itemData.price,
        category: itemData.category,
        available: itemData.available,
        isFeatured: itemData.isFeatured,
        tags: itemData.tags,
        menuSectionId: sectionId,
        tenantId: tenant.id,
      }
    })
    itemCount++
  }

  console.log(`✅ Created ${itemCount} menu items`)
  console.log('🎉 Las Reinas seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

**Usage:**
```bash
node scripts/seed-lasreinas.mjs
```

---

## 11. COMPONENT OVERRIDE EXAMPLES

### Example 1: Red-Themed Hero

```typescript
// /components/tenant/lasreinas/HeroSection.tsx
'use client'

export function HeroSection() {
  return (
    <section className="relative h-[70vh] min-h-[600px] w-full overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="/tenant/lasreinas/images/hero-quesabirria-action.jpg"
          alt="Las Reinas Quesabirrias"
          className="h-full w-full object-cover"
        />
        {/* Red Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-red-600/90 via-red-700/90 to-red-900/95" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full items-center justify-center px-4">
        <div className="max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-amber-400 px-4 py-2 text-sm font-bold text-red-900">
            <span>🔥</span>
            <span>SIGNATURE DISH</span>
          </div>

          {/* Headline */}
          <h1 className="mb-4 font-heading text-6xl font-bold uppercase tracking-wider text-white sm:text-7xl md:text-8xl">
            Quesabirrias
          </h1>

          {/* Subheadline */}
          <p className="mb-6 text-2xl font-medium text-amber-200 sm:text-3xl">
            Crispy. Cheesy. Perfection.
          </p>

          {/* Description */}
          <p className="mb-8 text-lg text-white/90 sm:text-xl">
            Tender birria beef + melted cheese in a crispy tortilla.<br />
            Dipped in rich consommé.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <button className="rounded-full bg-gradient-to-r from-red-600 via-amber-400 to-red-600 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-red-500/50 transition hover:scale-105 hover:shadow-red-500/70">
              Order Quesabirrias Now
            </button>
            <button className="rounded-full border-2 border-white/30 bg-white/10 px-8 py-4 text-lg font-bold text-white backdrop-blur-sm transition hover:border-white/50 hover:bg-white/20">
              View Full Menu
            </button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="flex h-12 w-8 items-center justify-center rounded-full border-2 border-white/50">
          <div className="h-2 w-2 rounded-full bg-white" />
        </div>
      </div>
    </section>
  )
}
```

### Example 2: Red Add to Cart Button

```typescript
// Just replace gradient classes in existing button
<button
  className="flex-1 rounded-lg bg-gradient-to-r from-red-600 via-amber-400 to-red-600 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-red-500/20 transition-all hover:scale-[1.02] hover:shadow-red-500/40"
  onClick={() => openCustomization(item, section.type)}
>
  <span className="flex items-center justify-center gap-1.5">
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
    Add to Cart
  </span>
</button>
```

---

## 12. FINAL DELIVERABLES

### For Development Team

1. ✅ **Menu Data:** `las-reinas-menu.json` (70+ items, 10 sections)
2. ✅ **Seeder Script:** `seed-lasreinas.mjs`
3. ✅ **Theme Config:** Tailwind overrides, CSS variables
4. ✅ **Component Guides:** Hero, buttons, cards styling
5. ✅ **Asset Specs:** Image dimensions, formats, compression
6. ✅ **Deployment Checklist:** Step-by-step deployment guide

### For Design Team

1. 🎨 **Brand Colors:** Red (#DC2626), Gold (#FBBF24)
2. 🎨 **Hero Concepts:** 3 options (Quesabirria Showcase recommended)
3. 🎨 **Typography:** Bebas Neue + Inter + Montserrat
4. 🎨 **Asset List:** 20+ images/videos needed

### For Client (Las Reinas)

1. 📋 **Menu Review:** Verify all items, prices, descriptions
2. 📸 **Photo Shoot:** Priority shots (quesabirria hero, tacos, plates)
3. 📝 **Content Approval:** Headlines, descriptions, taglines
4. ✅ **Final Sign-Off:** Before going live

---

## 13. NEXT STEPS

### Immediate (Week 1)

1. Run seeder script to populate database
2. Upload placeholder logo and hero image
3. Test ordering flow with red theme
4. Gather client feedback on menu accuracy

### Short-Term (Week 2-3)

1. Schedule professional food photography
2. Optimize and upload hero images
3. Finalize theme color tweaks
4. Train restaurant staff on admin dashboard

### Long-Term (Month 1+)

1. Collect real menu item photos
2. Add seasonal specials
3. Enable loyalty program
4. Launch marketing campaign

---

## 14. SUPPORT & MAINTENANCE

**Theme Updates:**
- Color tweaks: Update CSS variables only
- Layout changes: Override specific components
- New features: Extend existing components

**Menu Updates:**
- Self-service via admin dashboard
- No developer needed for price/availability changes
- Seasonal items can be toggled on/off

**Performance Monitoring:**
- Monthly Lighthouse audits
- Image optimization as needed
- Cache invalidation on major updates

---

## CONCLUSION

This deployment guide provides everything needed to launch Las Reinas on the Alessa Ordering platform with a professional, on-brand experience that matches La Poblanita's layout quality while showcasing their unique red brand identity and quesabirria specialty.

**Key Differentiators:**
- ✅ Red/gold color scheme (vs La Poblanita's rose/amber)
- ✅ Quesabirria-focused hero (vs general Mexican food)
- ✅ Carniceria + taqueria branding (vs pure restaurant)
- ✅ Same professional layout and UX quality

**Deployment Time Estimate:**
- With assets ready: 2-4 hours
- With photo shoot: 1-2 weeks
- Full optimization: 2-3 weeks

---

**Document Version:** 1.0
**Last Updated:** November 10, 2025
**Created By:** Claude Code (UI/UX Specialist)
