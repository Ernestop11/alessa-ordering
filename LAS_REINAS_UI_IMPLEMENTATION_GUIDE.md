# LAS REINAS UI/UX IMPLEMENTATION GUIDE FOR CURSOR

## 🎯 Objective
Apply Las Reinas red theme (#DC2626) to OrderPageClient.tsx while maintaining **pixel-perfect** layout match with La Poblanita.

---

## 📋 STEP-BY-STEP FILE UPDATE SEQUENCE

### Step 1: Backup Original Component

```bash
cd /Users/ernestoponce/alessa-ordering
cp components/order/OrderPageClient.tsx components/order/OrderPageClient.tsx.lapoblanita.backup
echo "✅ Backup created"
```

---

### Step 2: Apply Color Theme Replacements

Run these `sed` commands sequentially:

```bash
# Primary rose → red replacements
sed -i '' 's/from-rose-500/from-red-600/g' components/order/OrderPageClient.tsx
sed -i '' 's/via-rose-500/via-red-600/g' components/order/OrderPageClient.tsx
sed -i '' 's/to-rose-500/to-red-600/g' components/order/OrderPageClient.tsx
sed -i '' 's/bg-rose-500/bg-red-600/g' components/order/OrderPageClient.tsx
sed -i '' 's/text-rose-500/text-red-600/g' components/order/OrderPageClient.tsx
sed -i '' 's/border-rose-500/border-red-600/g' components/order/OrderPageClient.tsx
sed -i '' 's/ring-rose-500/ring-red-600/g' components/order/OrderPageClient.tsx
sed -i '' 's/shadow-rose-500/shadow-red-600/g' components/order/OrderPageClient.tsx

# Secondary rose shades → red shades
sed -i '' 's/from-rose-600/from-red-700/g' components/order/OrderPageClient.tsx
sed -i '' 's/bg-rose-600/bg-red-700/g' components/order/OrderPageClient.tsx

# Amber adjustments for better red pairing
sed -i '' 's/via-amber-500/via-amber-400/g' components/order/OrderPageClient.tsx
sed -i '' 's/to-amber-500/to-amber-400/g' components/order/OrderPageClient.tsx

echo "✅ Color replacements applied"
```

**Expected Changes:** ~30-50 occurrences replaced

---

### Step 3: Verify Replacements

```bash
# Count red-600 occurrences (should be >20)
grep -o "red-600" components/order/OrderPageClient.tsx | wc -l

# Verify no rose-500 remains (should be 0)
grep -o "rose-500" components/order/OrderPageClient.tsx | wc -l

# Show sample of changes
grep -n "red-600" components/order/OrderPageClient.tsx | head -5
```

**Expected Output:**
```
30+ (red-600 count)
0 (rose-500 count - all replaced)
```

---

### Step 4: Test Las Reinas Theme Locally

```bash
# Start dev server
npm run dev

# Open Las Reinas tenant in browser
# Mac:
open "http://localhost:3000?tenant=lasreinas"

# Or visit manually:
# http://localhost:3000?tenant=lasreinas
```

---

### Step 5: Visual QA Checklist

Open browser and verify:

#### Hero Section (85vh height)
- [ ] Background gradient visible
- [ ] Hero title: Large, bold, centered
- [ ] CTA button: Red gradient (red → amber → yellow)
- [ ] CTA button hover: Scale 1.05, shadow increase
- [ ] Stats grid: 4 columns on desktop, 2 on mobile
- [ ] Red accent color throughout

#### Menu Cards
- [ ] "Add to Cart" buttons: Red gradient
- [ ] Button shadow: Red glow (#DC2626)
- [ ] Hover effect: Scale 1.02
- [ ] Featured badges: Red background
- [ ] Border colors: Red with opacity

#### Featured Carousel (if visible)
- [ ] Red-themed cards
- [ ] Navigation dots visible
- [ ] Smooth horizontal scroll
- [ ] Red accents on active items

#### Layout Verification
- [ ] Spacing identical to La Poblanita
- [ ] Font sizes match exactly
- [ ] Border radius same (rounded-2xl, rounded-lg, rounded-full)
- [ ] Padding same (p-4, p-6, px-10 py-5)
- [ ] Shadows same intensity (shadow-lg, shadow-2xl)

#### Mobile Responsive
- [ ] Test at 375px width (iPhone)
- [ ] Hero height: 85vh on mobile
- [ ] Buttons stack vertically
- [ ] Stats grid: 2 columns on small screens
- [ ] Horizontal scroll on featured items

---

### Step 6: Side-by-Side Comparison

Open both tenants in separate tabs:

```bash
# La Poblanita (original rose theme)
open "http://localhost:3000?tenant=lapoblanita"

# Las Reinas (new red theme)
open "http://localhost:3000?tenant=lasreinas"
```

**Compare:**
1. Hero section height (should be identical)
2. Button sizes (should be identical)
3. Card spacing (should be identical)
4. Font hierarchy (should be identical)
5. Mobile breakpoints (should be identical)

**Only difference:** Colors (rose → red)

---

### Step 7: Fix Any Issues

If you find issues, use these manual patches:

#### Issue: Gradient not showing correctly
```tsx
// Find this pattern and ensure it matches:
className="bg-gradient-to-r from-red-600 via-amber-400 to-yellow-400"

// NOT this:
className="bg-gradient-to-r from-red-600 via-amber-500 to-yellow-400"
```

#### Issue: Shadow color wrong
```tsx
// Correct:
shadow-red-600/20 hover:shadow-red-600/40

// Wrong:
shadow-rose-500/20 hover:shadow-rose-500/40
```

#### Issue: Button not scaling on hover
```tsx
// Must have:
transition-all hover:scale-[1.02]
```

---

### Step 8: Update Theme CSS (Already Done)

Verify `/public/tenant/lasreinas/theme.css` loads correctly:

```bash
curl http://localhost:3000/tenant/lasreinas/theme.css | head -20
```

**Expected:** CSS file with red color variables

---

### Step 9: Commit Changes

```bash
git add components/order/OrderPageClient.tsx
git status

# Verify only OrderPageClient.tsx changed
git diff components/order/OrderPageClient.tsx | grep "^+" | head -10

# Commit
git commit -m "feat(lasreinas): apply red theme to OrderPageClient

- Replace all rose-500 with red-600
- Replace amber-500 with amber-400 for better pairing
- Maintain exact La Poblanita layout and spacing
- Gradient buttons: red → amber → yellow
- Shadow colors: red-600 with opacity
- All dimensions unchanged (85vh hero, px-10 py-5 buttons, etc.)

LAYOUT: 100% match with La Poblanita
COLORS: Red (#DC2626) + Gold (#FBBF24)
TESTED: Mobile + Desktop responsive"
```

---

### Step 10: Deploy to VPS

```bash
# Push to GitHub
git push origin main

# SSH to VPS and deploy
ssh root@77.243.85.8 << 'ENDSSH'
cd /var/www/alessa-ordering
git pull origin main
npm run build
pm2 restart alessa-ordering
pm2 logs alessa-ordering --lines 30
ENDSSH
```

**Watch for:**
- ✓ Compiled successfully
- [PM2] Restarting alessa-ordering
- ✓ Ready in ~400ms

---

### Step 11: Test Production

```bash
# Open production URL
open "https://lasreinas.order.alessacloud.com"

# Or if custom domain:
open "https://lasreinascolusa.com"
```

**Verify:**
- [ ] Red theme applied
- [ ] Menu loads (69 items)
- [ ] Featured carousel shows (7 items)
- [ ] Add to cart works
- [ ] Mobile responsive
- [ ] No console errors

---

### Step 12: Performance Check

```bash
# Run Lighthouse audit
npx lighthouse https://lasreinas.order.alessacloud.com \
  --only-categories=performance \
  --output=html \
  --output-path=./lighthouse-lasreinas.html

open lighthouse-lasreinas.html
```

**Target Scores:**
- Performance: 90+
- LCP: <2.5s
- CLS: <0.1

---

## 🔍 TROUBLESHOOTING

### Issue: Colors didn't change

**Check:**
```bash
# Verify sed commands ran
grep -c "red-600" components/order/OrderPageClient.tsx
# Should be >20
```

**Fix:**
```bash
# Re-run sed commands from Step 2
```

---

### Issue: Layout broken

**Check:**
```bash
# Compare line count (should be identical)
wc -l components/order/OrderPageClient.tsx.lapoblanita.backup
wc -l components/order/OrderPageClient.tsx
```

**Fix:**
```bash
# Restore backup and try again
cp components/order/OrderPageClient.tsx.lapoblanita.backup components/order/OrderPageClient.tsx
# Re-run Step 2
```

---

### Issue: TypeScript errors

**Check:**
```bash
npm run test:types
```

**Fix:**
```bash
# If errors, restore backup
cp components/order/OrderPageClient.tsx.lapoblanita.backup components/order/OrderPageClient.tsx
```

---

### Issue: Build fails

**Error:** `Module not found` or similar

**Fix:**
```bash
rm -rf .next
npm run build
```

---

### Issue: Red theme not showing in browser

**Check:**
1. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
2. Clear browser cache
3. Check tenant slug: Must be exactly `lasreinas`

---

## 📊 VALIDATION CHECKLIST

Before deploying to production:

### Code Quality
- [ ] No TypeScript errors: `npm run test:types`
- [ ] No ESLint errors: `npm run lint`
- [ ] Build succeeds: `npm run build`

### Visual Quality
- [ ] Hero section: Red theme, 85vh height
- [ ] Buttons: Red gradient, correct padding
- [ ] Cards: Red borders, correct spacing
- [ ] Mobile: Responsive at 375px
- [ ] Desktop: Responsive at 1920px

### Functional Quality
- [ ] Menu loads (69 items)
- [ ] Featured items show (7 items)
- [ ] Add to cart works
- [ ] Cart drawer opens
- [ ] Checkout flow works
- [ ] Images load (if uploaded)

### Performance
- [ ] Lighthouse score: 90+
- [ ] No console errors
- [ ] Fast load time (<3s)

---

## 📁 FILES MODIFIED

Only 1 file changes in this implementation:

```
components/order/OrderPageClient.tsx (30-50 lines modified)
```

All other Las Reinas files already created:
- ✅ scripts/seed-data/las-reinas-menu.json
- ✅ scripts/seed-lasreinas.mjs
- ✅ public/tenant/lasreinas/theme.css
- ✅ docs/LAS_REINAS_*.md

---

## 🎯 EXPECTED RESULTS

### Before Changes (La Poblanita colors on Las Reinas)
```tsx
className="bg-gradient-to-r from-rose-500 via-amber-500 to-yellow-400"
// Renders: Pink → Orange → Yellow gradient
```

### After Changes (Las Reinas red theme)
```tsx
className="bg-gradient-to-r from-red-600 via-amber-400 to-yellow-400"
// Renders: Red → Orange → Yellow gradient
```

### Layout (NO CHANGES)
```tsx
// These stay IDENTICAL:
min-h-[85vh]           // Hero height
px-10 py-5             // Button padding
text-6xl ... lg:text-9xl  // Heading sizes
max-w-5xl              // Content width
gap-6                  // Grid gap
rounded-2xl            // Border radius
```

---

## 🚀 QUICK REFERENCE

### One-Line Deploy
```bash
cd /Users/ernestoponce/alessa-ordering && \
cp components/order/OrderPageClient.tsx components/order/OrderPageClient.tsx.backup && \
sed -i '' -e 's/from-rose-500/from-red-600/g' -e 's/via-rose-500/via-red-600/g' -e 's/to-rose-500/to-red-600/g' -e 's/bg-rose-500/bg-red-600/g' -e 's/text-rose-500/text-red-600/g' -e 's/border-rose-500/border-red-600/g' -e 's/shadow-rose-500/shadow-red-600/g' -e 's/via-amber-500/via-amber-400/g' components/order/OrderPageClient.tsx && \
npm run build && \
echo "✅ Las Reinas theme applied. Test at http://localhost:3000?tenant=lasreinas"
```

---

## 📞 SUPPORT

**Questions?**
- Review: `LAS_REINAS_COMPONENT_PATCHES.md`
- Check: `docs/LAS_REINAS_VISUAL_SUMMARY.md`
- Reference: `docs/LAS_REINAS_DEPLOYMENT_GUIDE.md`

**Issues?**
- Restore backup: `cp components/order/OrderPageClient.tsx.backup components/order/OrderPageClient.tsx`
- Re-run steps 2-5

---

**Implementation Guide Version:** 1.0
**Target Component:** OrderPageClient.tsx
**Changes:** Color theme only (rose → red)
**Layout:** 100% match with La Poblanita
**Status:** Ready for Cursor execution
