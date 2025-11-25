# LAS REINAS COMPONENT PATCHES - EXACT LA POBLANITA MATCH

## Overview
These patches create Las Reinas components that match La Poblanita's layout **pixel-for-pixel** but with red (#DC2626) theme instead of rose (#FB7185).

**Strategy:** CSS-only color swaps in the existing OrderPageClient.tsx - NO new component files needed.

---

## COLOR REPLACEMENT MAP

Replace these Tailwind classes throughout OrderPageClient.tsx:

```
ROSE → RED MAPPINGS:
from-rose-500     → from-red-600
via-rose-500      → via-red-600
to-rose-500       → to-red-600
bg-rose-500       → bg-red-600
text-rose-500     → text-red-600
border-rose-500   → border-red-600
ring-rose-500     → ring-red-600
shadow-rose-500   → shadow-red-600

AMBER STAYS THE SAME (shared accent):
from-amber-500    → from-amber-400
via-amber-500     → via-amber-400
to-amber-500      → to-amber-400
```

---

## PATCH 1: Hero Section (Lines 1087-1215)

### Current (La Poblanita):
```tsx
<section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden text-white">
  {/* ... background ... */}
  <div className={`absolute inset-0 z-20 bg-gradient-to-br transition-opacity duration-700 ${
    activeSection?.type === 'BAKERY'
      ? 'from-rose-500/80 via-amber-400/50 to-black/40'
      : 'from-black/75 via-black/50 to-black/30'
  }`} />

  {/* ... content ... */}

  <a href="#menu" className="group relative overflow-hidden rounded-full bg-gradient-to-r from-rose-500 via-amber-500 to-yellow-400 px-10 py-5 text-lg font-bold text-black shadow-2xl shadow-amber-400/40 transition-all hover:scale-105 hover:shadow-amber-400/60">
    <span className="relative z-10">Explore Menu ✨</span>
    <span className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-amber-500 to-rose-500 opacity-0 transition-opacity group-hover:opacity-100"></span>
  </a>
</section>
```

### Las Reinas Replacement:
```tsx
<section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden text-white">
  {/* ... background ... */}
  <div className={`absolute inset-0 z-20 bg-gradient-to-br transition-opacity duration-700 ${
    activeSection?.type === 'BAKERY'
      ? 'from-red-600/80 via-amber-400/50 to-black/40'
      : 'from-black/75 via-black/50 to-black/30'
  }`} />

  {/* ... content ... */}

  <a href="#menu" className="group relative overflow-hidden rounded-full bg-gradient-to-r from-red-600 via-amber-400 to-yellow-400 px-10 py-5 text-lg font-bold text-black shadow-2xl shadow-amber-400/40 transition-all hover:scale-105 hover:shadow-amber-400/60">
    <span className="relative z-10">Explore Menu ✨</span>
    <span className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-amber-400 to-red-600 opacity-0 transition-opacity group-hover:opacity-100"></span>
  </a>
</section>
```

**Changes:**
- `from-rose-500` → `from-red-600`
- `to-rose-500` → `to-red-600`
- `via-amber-500` → `via-amber-400`
- All dimensions, spacing, fonts: **IDENTICAL**

---

## PATCH 2: Add to Cart Buttons (Multiple locations)

### Pattern to Find:
```tsx
className="flex-1 rounded-lg bg-gradient-to-r from-rose-500 via-amber-500 to-yellow-400 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-rose-500/20 transition-all hover:scale-[1.02] hover:shadow-rose-500/40"
```

### Replace With:
```tsx
className="flex-1 rounded-lg bg-gradient-to-r from-red-600 via-amber-400 to-yellow-400 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-red-600/20 transition-all hover:scale-[1.02] hover:shadow-red-600/40"
```

**Locations (approximate line numbers):**
- Line 820 (Grid layout button)
- Line 976 (Default grid button)
- Line 1327 (Bundles/Upsells button)
- Line 1403 (Popular/Featured button)
- Line 1459 (Chef Specials button)
- Line 1515 (Desserts button)

---

## PATCH 3: Catering Button (Line ~1256)

### Current:
```tsx
className="group flex min-w-[120px] items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 via-orange-500 to-amber-600 px-3.5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-rose-500/20 backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-rose-500/30"
```

### Replace With:
```tsx
className="group flex min-w-[120px] items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 via-orange-500 to-amber-600 px-3.5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-red-600/20 backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-red-600/30"
```

---

## PATCH 4: Featured Badge (Search for "bg-rose-500")

### Pattern:
```tsx
className="absolute right-2 top-2 rounded-full bg-rose-500 px-3 py-1 text-xs font-bold text-white shadow-lg"
```

### Replace:
```tsx
className="absolute right-2 top-2 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white shadow-lg"
```

---

## PATCH 5: Section Borders/Accents

### Pattern:
```tsx
border-rose-500/20
```

### Replace:
```tsx
border-red-600/20
```

---

## AUTOMATED FIND & REPLACE SCRIPT

Use this command to do all replacements at once:

```bash
cd /Users/ernestoponce/alessa-ordering

# Backup original
cp components/order/OrderPageClient.tsx components/order/OrderPageClient.tsx.backup

# Perform replacements
sed -i '' 's/from-rose-500/from-red-600/g' components/order/OrderPageClient.tsx
sed -i '' 's/via-rose-500/via-red-600/g' components/order/OrderPageClient.tsx
sed -i '' 's/to-rose-500/to-red-600/g' components/order/OrderPageClient.tsx
sed -i '' 's/bg-rose-500/bg-red-600/g' components/order/OrderPageClient.tsx
sed -i '' 's/text-rose-500/text-red-600/g' components/order/OrderPageClient.tsx
sed -i '' 's/border-rose-500/border-red-600/g' components/order/OrderPageClient.tsx
sed -i '' 's/ring-rose-500/ring-red-600/g' components/order/OrderPageClient.tsx
sed -i '' 's/shadow-rose-500/shadow-red-600/g' components/order/OrderPageClient.tsx

# Adjust amber for better red pairing
sed -i '' 's/via-amber-500/via-amber-400/g' components/order/OrderPageClient.tsx
sed -i '' 's/to-amber-500/to-amber-400/g' components/order/OrderPageClient.tsx

echo "✅ Replacements complete. Review components/order/OrderPageClient.tsx"
```

---

## VERIFICATION CHECKLIST

After applying patches, verify:

### Hero Section
- [ ] Min height: 85vh (same as Poblanita)
- [ ] Text sizes: 6xl → 9xl responsive (same)
- [ ] Button padding: px-10 py-5 (same)
- [ ] Button gradient: red → amber → yellow (updated)
- [ ] Stats grid: 4 columns on desktop (same)
- [ ] Stats padding: p-4 (same)

### Menu Cards
- [ ] Border radius: rounded-2xl (same)
- [ ] Padding: p-6 (same)
- [ ] Image aspect: square or 4:3 (same)
- [ ] Button size: text-xs, px-3 py-2 (same)
- [ ] Hover scale: scale-[1.02] (same)
- [ ] Shadow: shadow-lg (same)

### Featured Carousel
- [ ] Card width: ~300px (same)
- [ ] Gap: gap-4 (same)
- [ ] Scroll snap: snap-x (same)
- [ ] Navigation dots: bottom-8 (same)

### Layout Toggles
- [ ] Button border-radius: rounded-full (same)
- [ ] Padding: px-4 py-2 (same)
- [ ] Active state: bg-white/20 (same)

### Sticky Elements
- [ ] Cart button: fixed bottom-6 (same)
- [ ] Header: sticky top-0 (same)
- [ ] Z-index: z-40/z-50 (same)

---

## TENANT-SPECIFIC OVERRIDE (Alternative Approach)

If you want to avoid modifying OrderPageClient.tsx, create a tenant wrapper:

### File: `/components/order/TenantOrderPage.tsx`

```tsx
'use client'

import { useMemo } from 'react'
import OrderPageClient, { OrderPageClientProps } from './OrderPageClient'

export default function TenantOrderPage(props: OrderPageClientProps) {
  const { tenantSlug } = props

  // Apply Las Reinas theme overrides via CSS classes
  if (tenantSlug === 'lasreinas') {
    return (
      <div className="las-reinas-theme">
        <style jsx global>{`
          .las-reinas-theme .from-rose-500 { --tw-gradient-from: #DC2626 !important; }
          .las-reinas-theme .via-rose-500 { --tw-gradient-via: #DC2626 !important; }
          .las-reinas-theme .to-rose-500 { --tw-gradient-to: #DC2626 !important; }
          .las-reinas-theme .bg-rose-500 { background-color: #DC2626 !important; }
          .las-reinas-theme .text-rose-500 { color: #DC2626 !important; }
          .las-reinas-theme .border-rose-500 { border-color: #DC2626 !important; }
          .las-reinas-theme .shadow-rose-500 { --tw-shadow-color: #DC2626 !important; }
        `}</style>
        <OrderPageClient {...props} />
      </div>
    )
  }

  return <OrderPageClient {...props} />
}
```

**Pros:** No modifications to original component
**Cons:** CSS !important overrides (not ideal)
**Recommendation:** Use find & replace approach above

---

## FINAL DEPLOYMENT STEPS

1. **Apply Patches:**
   ```bash
   cd /Users/ernestoponce/alessa-ordering
   bash -c "$(cat LAS_REINAS_COMPONENT_PATCHES.md | grep -A 100 'AUTOMATED FIND')"
   ```

2. **Test Locally:**
   ```bash
   npm run dev
   open "http://localhost:3000?tenant=lasreinas"
   ```

3. **Visual QA:**
   - Compare side-by-side: La Poblanita vs Las Reinas
   - Verify identical spacing, fonts, shadows
   - Confirm red theme throughout
   - Test mobile responsive breakpoints

4. **Commit & Deploy:**
   ```bash
   git add components/order/OrderPageClient.tsx
   git commit -m "feat(ui): apply Las Reinas red theme to OrderPageClient"
   git push origin main
   ```

---

## REFERENCE: EXACT DIMENSIONS FROM LA POBLANITA

### Hero Section
- Height: `min-h-[85vh]`
- Content max-width: `max-w-5xl`
- Padding: `px-6 py-12`
- Heading: `text-6xl sm:text-7xl md:text-8xl lg:text-9xl`
- Subtitle: `text-2xl md:text-3xl`
- Button: `px-10 py-5 text-lg`
- Stats grid: `grid-cols-2 md:grid-cols-4`
- Stats padding: `p-4`

### Menu Cards (Grid View)
- Container: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
- Card: `rounded-2xl border border-white/10 p-6`
- Image: `aspect-square rounded-xl`
- Title: `text-xl font-semibold`
- Description: `text-sm text-white/60`
- Price: `text-2xl font-bold`
- Button: `px-3 py-2 text-xs rounded-lg`

### Featured Carousel
- Container: `flex gap-4 overflow-x-auto snap-x`
- Card width: `min-w-[280px] md:min-w-[320px]`
- Card height: `h-[400px]`
- Image height: `h-48`
- Content padding: `p-4`

### Sticky Cart (If exists)
- Position: `fixed bottom-6 right-6`
- Padding: `px-6 py-4`
- Border radius: `rounded-2xl`
- Z-index: `z-50`

---

**All dimensions, spacing, and layout properties remain IDENTICAL to La Poblanita.**
**ONLY colors change: Rose → Red, Amber 500 → Amber 400**
