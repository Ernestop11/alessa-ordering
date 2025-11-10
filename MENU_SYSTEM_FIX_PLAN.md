# Menu System Fix Plan

**Date:** November 10, 2024
**Priority:** CRITICAL - Menu system is broken

---

## Problems Identified

### 1. Frontend Display Issue
**Problem:** Only items assigned to sections appear on frontend
**Evidence:**
- [app/order/page.tsx:11-20](app/order/page.tsx#L11-L20) queries `menuSection.menuItems`
- Items with `menuSectionId: null` (like "Guac") never appear
- Menu editor shows ALL items, but frontend only shows items in sections

**Impact:** Customers can't see or order items that aren't in sections

### 2. Image Update Issue
**Problem:** Changed images don't reflect on frontend
**Testing Results:**
- User changed Menudo picture in admin
- Image updated in preview
- Image disappeared from frontend (item removed from section?)
- New image never appeared

**Root Cause:** Likely item was unassigned from section when edited

### 3. No True Menu Manager
**Problem:** Admin can't control what appears on frontend
**Current State:**
- MenuEditor shows all database items
- No way to see what's actually on frontend
- No clear section assignment UI
- No drag-drop to organize

---

## Solution: Complete Menu System Rebuild

### Phase 1: Fix Frontend Display (30 mins)

**Goal:** Show ALL available menu items on frontend, grouped logically

**Changes to [app/order/page.tsx](app/order/page.tsx):**

```typescript
async function getMenuSections(tenantId: string): Promise<OrderMenuSection[]> {
  // Get sections WITH items
  const sectionsWithItems = await prisma.menuSection.findMany({
    where: { tenantId },
    orderBy: { position: 'asc' },
    include: {
      menuItems: {
        where: { available: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  // Get items WITHOUT sections (orphaned items)
  const orphanedItems = await prisma.menuItem.findMany({
    where: {
      tenantId,
      available: true,
      menuSectionId: null,
    },
    orderBy: { category: 'asc' },
  });

  // Create sections array
  const sections = sectionsWithItems.map(section => ({...}));

  // If orphaned items exist, create "Other Items" section
  if (orphanedItems.length > 0) {
    sections.push({
      id: 'orphaned',
      name: 'More Items',
      description: null,
      type: 'OTHER',
      items: orphanedItems.map(item => ({...})),
    });
  }

  return sections;
}
```

**Result:** ALL available items appear on frontend

### Phase 2: Professional Menu Builder (2-3 hours)

**Goal:** True menu management like Wix Restaurants, Toast, Square

**Features:**
1. **Live Preview** - See exactly what customers see
2. **Drag & Drop** - Organize sections and items visually
3. **Section Management** - Create, edit, delete, reorder sections
4. **Item Assignment** - Drag items between sections
5. **Bulk Actions** - Hide/show multiple items
6. **Image Management** - Upload, crop, preview images
7. **Mobile Optimized** - Works on phones/tablets

**New Component:** `/components/admin/MenuBuilder.tsx`

**UI Structure:**
```
┌────────────────────────────────────────┐
│ Menu Builder                    [Save] │
├────────────────┬───────────────────────┤
│ Sections       │ Live Preview          │
│                │                       │
│ ▼ Tacos (5)    │ Customer View:        │
│   - Carne      │ ┌───────────────────┐ │
│   - Pollo      │ │ 🌮 Tacos          │ │
│   - Carnitas   │ │ ├─ Carne  $3.50   │ │
│   + Add Item   │ │ ├─ Pollo  $3.25   │ │
│                │ │ └─ Carnitas $3.75 │ │
│ ▼ Sides (3)    │ └───────────────────┘ │
│   - Guac       │                       │
│   - Rice       │                       │
│                │                       │
│ + New Section  │                       │
└────────────────┴───────────────────────┘
```

### Phase 3: Image Upload Fix (30 mins)

**Problem:** Images upload but don't persist correctly

**Fix:**
1. Ensure uploaded images save to database
2. Add immediate cache invalidation
3. Show success/error feedback
4. Preview new image in menu builder

---

## Database Verification

**Confirmed:** System uses PostgreSQL + Prisma exclusively
**No MongoDB/Mongoose found:**
- ✅ package.json - only @prisma/client
- ✅ No mongoose imports anywhere
- ✅ All queries use prisma client

---

## Implementation Priority

### IMMEDIATE (Today):
1. Fix frontend to show ALL items (Phase 1)
2. Deploy and test with Menudo/Guac

### THIS WEEK:
3. Build professional menu builder (Phase 2)
4. Mobile optimization
5. Image upload improvements

---

## Success Criteria

**After Phase 1:**
- [ ] Visit frontend, see ALL menu items
- [ ] Items without sections appear in "More Items"
- [ ] Guac appears on frontend
- [ ] Menudo appears with correct image

**After Phase 2:**
- [ ] Drag items between sections
- [ ] Preview changes before saving
- [ ] Mobile-friendly menu builder
- [ ] Clear visual feedback

---

## Next Steps

1. Implement Phase 1 fix to [app/order/page.tsx](app/order/page.tsx)
2. Deploy and test immediately
3. Start building MenuBuilder component
4. Optimize for mobile use

This will give you a TRUE menu management system, not a "kinda working" one.
