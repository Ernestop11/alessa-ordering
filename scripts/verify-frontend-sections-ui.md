# Quick Verification: Frontend Sections UI

## What You Should See

When you click the **"Frontend Sections"** tab in Menu Editor:

### Visual Checklist:

```
┌─────────────────────────────────────────────────────────┐
│ Frontend Sections                                        │
│ Reorder sections with arrows • Changes sync instantly   │
│                                          [Ready] ← Sync  │
├─────────────────────────────────────────────────────────┤
│  ↑  [1] 🖼️  Hero Section                    [Toggle] ✏️ 🗑️ │
│  ↓      hero                                            │
├─────────────────────────────────────────────────────────┤
│  ↑  [2] 📍  Quick Info Bar                  [Toggle] ✏️ 🗑️ │
│  ↓      quickInfo                                       │
├─────────────────────────────────────────────────────────┤
│  ↑  [3] ⭐  Featured Carousel                [Toggle] ✏️ 🗑️ │
│  ↓      featuredCarousel                                │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              [+ Add New Section]                        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 5 of 10 sections enabled          Order page: /order    │
└─────────────────────────────────────────────────────────┘
```

## Quick Fixes

### 1. Hard Refresh (Most Common Fix)
- **Windows/Linux**: `Ctrl + Shift + R`
- **Mac**: `Cmd + Shift + R`
- **Or**: Open DevTools → Right-click refresh button → "Empty Cache and Hard Reload"

### 2. Restart Dev Server
```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

### 3. Clear Browser Cache
1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **Clear Storage**
4. Check "Cache storage" and "Local storage"
5. Click **Clear site data**

### 4. Check Console for Errors
1. Open DevTools (F12)
2. Go to **Console** tab
3. Look for red errors
4. Share any errors you see

## Test the Tab

1. Navigate to: `/admin?tenant=YOUR_TENANT_SLUG`
2. Click **Menu Editor** in sidebar
3. Click **Frontend Sections** tab (4th tab)
4. You should see the new UI immediately

## If Still Not Working

Check these files exist:
- ✅ `components/admin/MenuEditorPage.tsx` (line 1744 has the UI)
- ✅ `app/api/admin/frontend-ui-sections/route.ts`
- ✅ `app/api/admin/frontend-ui-sections/reorder/route.ts`

Run this to verify:
```bash
grep -n "activeTab === 'frontend'" components/admin/MenuEditorPage.tsx
# Should show line 1744
```

