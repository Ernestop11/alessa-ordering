# LAS REINAS - QUICK REFERENCE CARD

## 🚀 ONE-LINE DEPLOY

```bash
node scripts/seed-lasreinas.mjs && echo "✅ Database seeded. Upload assets next."
```

---

## 📦 REQUIRED FILES CHECKLIST

### Database
- [x] `scripts/seed-data/las-reinas-menu.json` (70 items, 10 sections)
- [x] `scripts/seed-lasreinas.mjs` (seeder script)

### Assets (MANUAL - Need to create/upload)
- [ ] `/public/tenant/lasreinas/images/logo.png` (512x512px)
- [ ] `/public/tenant/lasreinas/images/logo-white.png` (512x512px)
- [ ] `/public/tenant/lasreinas/images/hero-quesabirria-action.jpg` (1920x1080px)
- [ ] `/public/tenant/lasreinas/images/favicon.ico`
- [ ] `/public/tenant/lasreinas/theme.css` (DONE ✅)

### Optional Assets
- [ ] `/public/tenant/lasreinas/videos/quesabirria-loop.mp4` (<5MB)
- [ ] `/public/tenant/lasreinas/images/og-image.jpg` (1200x630px)

---

## 🎨 BRAND QUICK REFERENCE

| Element | Value |
|---------|-------|
| Primary Color | `#DC2626` (Red 600) |
| Secondary Color | `#991B1B` (Red 800) |
| Accent Color | `#FBBF24` (Amber 400) |
| Font Heading | Bebas Neue |
| Font Body | Inter |
| Specialty | Quesabirrias |

---

## 🔧 TENANT SETTINGS (Admin Dashboard)

```javascript
{
  "primaryColor": "#DC2626",
  "secondaryColor": "#991B1B",
  "accentColor": "#FBBF24",
  "deliveryEnabled": true,
  "pickupEnabled": true,
  "deliveryRadius": 10,
  "minimumOrder": 15,
  "taxRate": 0.0775
}
```

---

## 📋 MENU BREAKDOWN

| Section | Items | Featured |
|---------|-------|----------|
| Desayunos (Breakfast) | 8 | 1 |
| Especialidades | 3 | 2 |
| Quesabirrias | 4 | 2 |
| Tacos | 9 | 0 |
| Burritos | 6 | 1 |
| Platillos | 13 | 0 |
| Tortas | 5 | 1 |
| Nachos y Quesadillas | 5 | 0 |
| A La Carta | 10 | 0 |
| Bebidas | 6 | 0 |
| **TOTAL** | **69** | **7** |

---

## 🎯 FEATURED ITEMS (Auto-marked in JSON)

1. **Chilaquiles Verdes** ($11.99) - Breakfast
2. **Molcajete Las Reinas** ($34.99) - Signature
3. **Parrillada Las Reinas** ($29.99) - Signature
4. **Quesabirrias (3)** ($13.99) - Specialty
5. **Quesabirria Plate** ($14.99) - Specialty
6. **California Burrito** ($12.99) - Popular
7. **Torta Cubana** ($12.99) - Ultimate sandwich

---

## 🖼️ IMAGE PRIORITY LIST

### CRITICAL (Need First)
1. **Logo** - Transparent PNG, 512x512px
2. **Hero Image** - Quesabirrias, 1920x1080px, <300KB
3. **Favicon** - 32x32px minimum

### IMPORTANT (Week 1)
4. **Logo White** - For dark backgrounds
5. **Hero Mobile** - Vertical crop, 1080x1920px

### NICE TO HAVE (Week 2+)
6. Menu item photos (69 total - start with featured items)
7. Category header images
8. Social sharing image (OG)

---

## 🔄 COMPONENT CHANGES FROM LA POBLANITA

### Color Swaps Only (No Code Changes)
- `from-rose-500` → `from-red-600`
- `to-amber-500` → `to-amber-400`
- `border-rose-500` → `border-red-600`
- `text-rose-500` → `text-red-600`
- `bg-rose-500` → `bg-red-600`

### Full Overrides Needed
- `HeroSection.tsx` - Custom quesabirria hero
- `theme.css` - Red color scheme (DONE ✅)

Everything else: **Use La Poblanita components as-is**

---

## ⚡ DEPLOYMENT STEPS (5 Minutes)

```bash
# 1. Seed database
node scripts/seed-lasreinas.mjs

# 2. Create asset folders
mkdir -p public/tenant/lasreinas/images
mkdir -p public/tenant/lasreinas/videos
mkdir -p public/tenant/lasreinas/icons

# 3. Upload logo (placeholder)
# Manually copy logo.png to public/tenant/lasreinas/images/

# 4. Test locally
npm run dev
# Visit: http://localhost:3000?tenant=lasreinas

# 5. Deploy to VPS
git add -A
git commit -m "feat: add Las Reinas tenant"
git push origin main
ssh root@77.243.85.8 "cd /var/www/alessa-ordering && git pull && npm run build && pm2 restart alessa-ordering"
```

---

## 🧪 TESTING CHECKLIST

- [ ] Menu loads (10 sections visible)
- [ ] Featured items show in carousel (7 items)
- [ ] Red theme applied (buttons, links, badges)
- [ ] Add to cart works
- [ ] Checkout flow works
- [ ] Order submission works
- [ ] Mobile responsive
- [ ] Images load (once uploaded)

---

## 🆘 TROUBLESHOOTING

**Menu not showing?**
```bash
# Check if tenant exists
npx prisma studio
# Look for slug: 'lasreinas'
```

**Red theme not applied?**
```bash
# Make sure theme.css is loaded
curl http://localhost:3000/tenant/lasreinas/theme.css
```

**Seeder fails?**
```bash
# Make sure JSON file exists
ls -la scripts/seed-data/las-reinas-menu.json

# Check database connection
npx prisma db pull
```

---

## 📞 CONTACT INFO (Client)

**Las Reinas Colusa**
- Address: 751 Fremont St, Colusa, CA 95932
- Phone: (530) 458-7775
- Website: https://lasreinascolusa.com
- Hours: Mon-Sat 8AM-8PM, Sun 8AM-6PM

---

## 🎨 DESIGN NOTES

**Hero Concept (Recommended):**
"Quesabirria Showcase" - Product-focused hero with:
- Looping video of quesabirria dip
- Centered content card with glassmorphism
- Red radial gradient overlay
- Sticky CTA button
- Instagram-worthy aesthetic

**Tagline Options:**
- "Crispy. Cheesy. Perfection."
- "Comida Auténtica • Carne Fresca"
- "Where Tradition Meets Flavor"
- "Your Neighborhood Taqueria"

---

## 📊 ANALYTICS TO TRACK

- Most ordered items (expect: Quesabirrias)
- Peak hours (likely: 12pm-2pm, 6pm-8pm)
- Average order value (target: $25-30)
- Delivery vs pickup ratio
- Cart abandonment rate

---

**Quick Ref Version:** 1.0
**Last Updated:** November 10, 2025
**Full Guide:** See `LAS_REINAS_DEPLOYMENT_GUIDE.md`
