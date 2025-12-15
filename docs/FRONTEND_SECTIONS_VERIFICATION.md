# Frontend Sections Management - Verification Guide

## ✅ What Should Be Visible

When you navigate to **Menu Editor → Frontend Sections** tab, you should see:

### 1. Header Section
- **Title**: "Frontend Sections"
- **Subtitle**: "Reorder sections with arrows • Changes sync instantly"
- **Sync Status Indicator** (top right):
  - Gray "Ready" (when idle)
  - Yellow "Syncing..." (when updating)
  - Green "Synced!" (after successful update)

### 2. Sections List
Each section should display:
- **Up/Down arrows** (left side) - for reordering
- **Position badge** (number 1, 2, 3, etc.)
- **Section icon** (emoji based on type)
- **Section name and type**
- **Toggle switch** (enable/disable)
- **Edit button** (pencil icon)
- **Delete button** (trash icon)

### 3. Footer
- **Add New Section** button (dashed border)
- **Stats**: "X of Y sections enabled" and "Order page: /order"

## 🔍 How to Verify It's Working

### Step 1: Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Navigate to Menu Editor → Frontend tab
4. Look for:
   - ✅ No errors
   - ✅ `fetchFrontendUISections` called
   - ✅ API response logged (if you added console.log)

### Step 2: Test Functionality

#### Test Reordering:
1. Click **Up arrow** on any section (except first)
2. Should see:
   - Yellow "Syncing..." indicator
   - Section moves up in list
   - Green "Synced!" after 2 seconds
   - Frontend `/order` page updates immediately

#### Test Toggle:
1. Click the **toggle switch** on any section
2. Should see:
   - Section opacity changes (disabled = 50% opacity)
   - Sync status updates
   - Frontend reflects change

#### Test Delete:
1. Click **Delete button** (trash icon)
2. Should see:
   - Confirmation dialog
   - Section removed after confirm
   - Positions re-indexed

### Step 3: Check API Endpoints

Open Network tab in DevTools and verify these endpoints exist:

```
GET    /api/admin/frontend-ui-sections
POST   /api/admin/frontend-ui-sections/reorder
PUT    /api/admin/frontend-ui-sections
DELETE /api/admin/frontend-ui-sections?id=...
```

## 🐛 Troubleshooting

### If you don't see the new UI:

1. **Hard refresh the page**:
   - Chrome/Edge: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Firefox: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
   - Safari: `Cmd+Option+R`

2. **Clear browser cache**:
   - Open DevTools → Application → Clear Storage → Clear site data

3. **Check if dev server is running**:
   ```bash
   npm run dev
   ```

4. **Rebuild the project**:
   ```bash
   npm run build
   ```

5. **Check browser console for errors**:
   - Look for React errors
   - Look for API fetch errors
   - Look for TypeScript errors

### If sections don't load:

1. **Check API response**:
   - Open Network tab
   - Find `/api/admin/frontend-ui-sections` request
   - Check response status (should be 200)
   - Check response body (should be array of sections)

2. **Check authentication**:
   - Make sure you're logged in as admin
   - Check if session is valid

3. **Check database**:
   - Verify `TenantSettings.frontendConfig.frontendUISections` exists
   - Check if sections are stored correctly

## 📋 Code Locations

### Component:
- `components/admin/MenuEditorPage.tsx`
  - Line ~119: State declarations
  - Line ~695: `fetchFrontendUISections` function
  - Line ~770: `handleMoveSection` function
  - Line ~802: `handleToggleSection` function
  - Line ~750: `handleDeleteFrontendSection` function
  - Line ~1744: Frontend tab UI

### API Routes:
- `app/api/admin/frontend-ui-sections/route.ts` (GET, POST, PUT, DELETE)
- `app/api/admin/frontend-ui-sections/reorder/route.ts` (POST)
- `app/api/admin/frontend-ui-sections/[id]/route.ts` (PUT, DELETE)

## ✅ Expected Behavior

1. **On tab switch**: Sections load automatically
2. **On reorder**: Instant visual feedback + sync indicator
3. **On toggle**: Section opacity changes + sync indicator
4. **On delete**: Section removed + positions re-indexed
5. **All changes**: Sync to `/order` page immediately via `revalidatePath`

## 🎯 Quick Test Checklist

- [ ] Frontend tab is visible in Menu Editor
- [ ] Sync status indicator appears (top right)
- [ ] Sections list displays with all controls
- [ ] Up/Down arrows work
- [ ] Toggle switch works
- [ ] Edit button opens modal
- [ ] Delete button shows confirmation
- [ ] Changes sync to frontend immediately
- [ ] No console errors

