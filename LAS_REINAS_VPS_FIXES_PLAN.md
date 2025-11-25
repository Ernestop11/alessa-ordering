# Las Reinas VPS - Cart & Admin Fixes Plan

**Site**: https://lasreinas.alessacloud.com
**Date**: November 25, 2025
**Status**: Ready to implement

---

## 🎯 Tasks

### 1. **Cart Drawer UI Consistency** ✅ READY TO FIX
**Issue**: Cart drawer doesn't match Las Reinas red/gold theme
**Current**: Generic dark theme with amber accents
**Needed**: Red (#DC2626) and Gold (#FBBF24) theme consistency

#### Cart Drawer Improvements:
- [ ] Update header background to use red gradient
- [ ] Change accent colors from amber to Las Reinas gold
- [ ] Add red border highlighting on hover states
- [ ] Update button styling to match main UI
- [ ] Add themed shadows and glows
- [ ] Improve quantity controls with red/gold theme

**File**: `/components/order/CartDrawer.tsx`

---

### 2. **Checkout Flow Updates** ⚠️ NEEDS INVESTIGATION
**Current State**: Basic checkout button exists but flow unclear
**Needed**:
- Functional checkout page
- Payment integration (Stripe?)
- Delivery/pickup selection
- Customer info collection
- Order confirmation

#### Required Components:
- [ ] Checkout page route (`/checkout` or `/order/checkout`)
- [ ] StripeCheckout component verification
- [ ] Customer form (name, phone, address)
- [ ] Delivery vs Pickup selection
- [ ] Order summary with upsells
- [ ] Confirmation page

**Files to Check**:
- `/components/StripeCheckout.tsx`
- `/app/checkout/page.tsx` (if exists)
- `/app/api/stripe/` routes

---

### 3. **Admin Panel - Functional Menu Editor** 🔧 SHELL EXISTS
**Current**: MenuEditorPage component exists but may need enhancements
**Needed**: Make it a real, production-ready UI editing tool

#### Menu Editor Requirements:
- [x] Basic structure exists
- [ ] Image upload functionality
- [ ] Drag-and-drop reordering
- [ ] Real-time preview
- [ ] Bulk operations (enable/disable, duplicate)
- [ ] Category management
- [ ] Price editing
- [ ] Description rich text editor
- [ ] Item availability toggle

**File**: `/components/admin/MenuEditorPage.tsx`

---

## 📋 Implementation Priority

### Phase 1: Cart Visual Fix (30 min)
1. Update CartDrawer component colors
2. Test on VPS
3. Verify theme consistency

### Phase 2: Checkout Flow (2-3 hours)
1. Examine existing checkout components
2. Build/fix checkout page
3. Integrate Stripe
4. Test full order flow

### Phase 3: Admin Editor Enhancement (3-4 hours)
1. Add image upload to menu items
2. Implement drag-and-drop
3. Add real-time preview panel
4. Test CRUD operations
5. Polish UI/UX

---

## 🎨 Las Reinas Theme Reference

```css
/* Primary Colors */
Primary Red: #DC2626
Gold Accent: #FBBF24
Dark Red: #991B1B

/* Gradients */
Button Gradient: linear-gradient(to right, #DC2626, #FBBF24)
Hero Gradient: linear-gradient(to br, #DC2626, #991B1B)

/* Shadows */
Primary Shadow: 0 10px 15px -3px #DC262666
Glow Effect: 0 0 20px rgba(220, 38, 38, 0.5)
```

---

## 🔍 Current VPS State Analysis

### Order Page (https://lasreinas.alessacloud.com/order)
- ✅ Menu items loading correctly
- ✅ Category navigation works
- ✅ Add to cart functionality present
- ⚠️ Cart drawer needs theme update
- ⚠️ Checkout flow unclear

### Admin Panel (https://lasreinas.alessacloud.com/admin)
- ✅ Login page exists
- ❓ Post-login dashboard status unknown
- ✅ Menu editor component exists in codebase
- ❓ Image upload capability unknown
- ❓ Real-time preview missing

---

## 📝 Detailed Fix: Cart Drawer

### Current CartDrawer.tsx Issues:
```tsx
// Line 62: Generic amber color
text-amber-300

// Line 74: Generic amber color
text-amber-300

// Lines 78-79: Using theme colors but may need enhancement
background: linear-gradient(to right, ${tenant.primaryColor}, ${tenant.secondaryColor})
```

### Updated CartDrawer.tsx:
```tsx
// Use Las Reinas gold
text-[#FBBF24]

// Add red accents
border-[#DC2626]/30

// Enhanced button with shadow
style={{
  background: `linear-gradient(135deg, #DC2626 0%, #FBBF24 50%, #DC2626 100%)`,
  boxShadow: `0 10px 20px rgba(220, 38, 38, 0.4), 0 0 30px rgba(251, 191, 36, 0.2)`,
}}
```

---

## 📝 Detailed Fix: Checkout Flow

### Required checkout/page.tsx Structure:
```tsx
'use client';

import { useState } from 'react';
import { useCart } from '@/lib/store/cart';
import StripeCheckout from '@/components/StripeCheckout';

export default function CheckoutPage() {
  const { items, total } = useCart();
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050A1C] to-[#0A1C2F] text-white">
      <div className="mx-auto max-w-4xl px-4 py-12">
        {/* Order Summary */}
        {/* Customer Info Form */}
        {/* Delivery/Pickup Selection */}
        {/* Stripe Payment */}
        {/* Place Order Button */}
      </div>
    </div>
  );
}
```

---

## 📝 Detailed Fix: Admin Menu Editor

### Required Enhancements:

#### 1. Image Upload
```tsx
const handleImageUpload = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/admin/assets/upload', {
    method: 'POST',
    body: formData,
  });

  const { url } = await res.json();
  return url;
};
```

#### 2. Drag-and-Drop Reordering
```tsx
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

// Implement drag handlers
const handleDragEnd = (event) => {
  const { active, over } = event;
  if (active.id !== over.id) {
    setItems((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  }
};
```

#### 3. Real-Time Preview Panel
```tsx
<div className="grid grid-cols-2 gap-6">
  {/* Left: Editor */}
  <div className="space-y-4">
    <input value={editingItem.name} onChange={...} />
    <textarea value={editingItem.description} onChange={...} />
    <input type="number" value={editingItem.price} onChange={...} />
  </div>

  {/* Right: Live Preview */}
  <div className="sticky top-4">
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h3 className="text-xl font-bold">{editingItem.name}</h3>
      <p className="text-white/70">{editingItem.description}</p>
      <p className="text-2xl font-black text-[#FBBF24]">${editingItem.price}</p>
    </div>
  </div>
</div>
```

---

## 🧪 Testing Checklist

### Cart Drawer:
- [ ] Open cart from header
- [ ] Add multiple items
- [ ] Update quantities (+/-)
- [ ] Remove items
- [ ] Verify colors match theme
- [ ] Check mobile responsiveness
- [ ] Test checkout button click

### Checkout Flow:
- [ ] Navigate to checkout
- [ ] Fill customer info
- [ ] Select delivery/pickup
- [ ] Enter payment details
- [ ] Complete test order
- [ ] Verify order confirmation
- [ ] Check order appears in admin

### Admin Menu Editor:
- [ ] Login to admin
- [ ] Navigate to menu editor
- [ ] Create new menu item
- [ ] Upload item image
- [ ] Edit existing item
- [ ] Reorder items via drag-drop
- [ ] Toggle item availability
- [ ] Delete item
- [ ] Verify changes reflect on frontend

---

## 🚀 Deployment Steps

### 1. Local Development:
```bash
# Test changes locally
npm run dev

# Visit http://127.0.0.1:3001/order?tenant=lasreinas
# Test cart, checkout, admin
```

### 2. Build for Production:
```bash
# Build Next.js app
npm run build

# Test production build locally
npm start
```

### 3. Deploy to VPS:
```bash
# SSH into VPS
ssh root@77.243.85.8

# Navigate to project
cd /var/www/alessa-ordering

# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Build
npm run build

# Restart PM2
pm2 restart alessa-ordering

# Check logs
pm2 logs alessa-ordering
```

### 4. Verify on VPS:
```
https://lasreinas.alessacloud.com/order
https://lasreinas.alessacloud.com/admin
```

---

## 📞 Next Steps

1. **Immediate**: Fix cart drawer styling (30 min)
2. **Short-term**: Verify/fix checkout flow (2-3 hours)
3. **Medium-term**: Enhance admin editor (3-4 hours)

**Ready to start?** Let me know which task to tackle first!

---

**Status**: ⏳ Awaiting confirmation to begin implementation
