# ADMIN UI FIXES - CURSOR INSTRUCTIONS
**Priority-Ordered List for Codex**
**Total Time:** 60 minutes (optional polish)

---

## Priority 1: Logo in Admin Header (5 min) ⭐

**File:** `components/admin/AdminDashboardClient.tsx`
**Line:** 56
**Issue:** Hardcoded "Restaurant Dashboard" text instead of tenant logo/name

**Current:**
```tsx
<h1 className="text-xl font-bold text-gray-800">Restaurant Dashboard</h1>
```

**Replace with:**
```tsx
// 1. Add imports at top
import { useState, useEffect } from 'react';

// 2. Add state in component
const [tenant, setTenant] = useState<{ name: string; logoUrl?: string | null } | null>(null);

useEffect(() => {
  fetch('/api/admin/tenant-settings')
    .then(res => res.json())
    .then(data => setTenant(data))
    .catch(err => console.error('Failed to load tenant', err));
}, []);

// 3. Replace line 56
<div className="flex-shrink-0 flex items-center gap-3">
  {tenant?.logoUrl && (
    <img
      src={tenant.logoUrl}
      alt={tenant.name}
      className="h-8 w-auto object-contain"
    />
  )}
  <h1 className="text-xl font-bold text-gray-800">
    {tenant?.name || 'Restaurant Dashboard'}
  </h1>
</div>
```

**Result:** Admin header shows Las Reinas logo and name dynamically

---

## Priority 2: Add Notification Settings Section (15 min) ⭐⭐

**File:** `components/admin/Settings.tsx`
**Location:** After line 1951 (after Accessibility Defaults section)
**Issue:** No UI to configure notification preferences

**Step 1 - Add Interface (line ~42):**
```tsx
interface NotificationSettingsForm {
  emailOnNewOrder: boolean;
  smsOnNewOrder: boolean;
  webhookUrl: string;
}
```

**Step 2 - Add Default (line ~192):**
```tsx
const defaultNotificationSettings: NotificationSettingsForm = {
  emailOnNewOrder: true,
  smsOnNewOrder: false,
  webhookUrl: '',
};
```

**Step 3 - Add State (line ~268):**
```tsx
const [notificationSettings, setNotificationSettings] =
  useState<NotificationSettingsForm>(defaultNotificationSettings);
```

**Step 4 - Load from Settings (line ~520, in useEffect):**
```tsx
if (settings.notificationSettings && typeof settings.notificationSettings === 'object') {
  setNotificationSettings({
    emailOnNewOrder: Boolean(settings.notificationSettings.emailOnNewOrder),
    smsOnNewOrder: Boolean(settings.notificationSettings.smsOnNewOrder),
    webhookUrl: settings.notificationSettings.webhookUrl || '',
  });
} else {
  setNotificationSettings(defaultNotificationSettings);
}
```

**Step 5 - Save to Payload (line ~683):**
```tsx
payload.notificationSettings = {
  emailOnNewOrder: Boolean(notificationSettings.emailOnNewOrder),
  smsOnNewOrder: Boolean(notificationSettings.smsOnNewOrder),
  webhookUrl: notificationSettings.webhookUrl || '',
};
```

**Step 6 - Add UI Section (after line 1951):**
```tsx
<section>
  <h3 className="text-base font-semibold text-gray-900 mb-4">
    Notification Preferences
  </h3>
  <p className="text-sm text-gray-500 mb-4">
    Choose how you want to be notified about orders and events.
  </p>
  <div className="space-y-4">
    <label className="flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-3">
      <input
        type="checkbox"
        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        checked={notificationSettings.emailOnNewOrder}
        onChange={(e) =>
          setNotificationSettings((prev) => ({ ...prev, emailOnNewOrder: e.target.checked }))
        }
      />
      <span className="text-sm text-gray-700">Email me when new orders arrive</span>
    </label>

    <label className="flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-3">
      <input
        type="checkbox"
        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        checked={notificationSettings.smsOnNewOrder}
        onChange={(e) =>
          setNotificationSettings((prev) => ({ ...prev, smsOnNewOrder: e.target.checked }))
        }
      />
      <span className="text-sm text-gray-700">Send SMS for urgent orders (coming soon)</span>
    </label>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Webhook URL (optional)
      </label>
      <input
        type="url"
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
        value={notificationSettings.webhookUrl}
        onChange={(e) =>
          setNotificationSettings((prev) => ({ ...prev, webhookUrl: e.target.value }))
        }
        placeholder="https://your-app.com/webhook"
      />
      <p className="mt-1 text-xs text-gray-500">
        Receive POST requests for order events (optional integration)
      </p>
    </div>
  </div>
</section>
```

**Result:** Settings tab now has Notification Preferences with 2 toggles + webhook

---

## Priority 3: Menu Item Reordering (30 min) ⭐⭐⭐

**File:** `components/admin/MenuManager.tsx`
**Issue:** Can reorder sections but NOT individual menu items

**Step 1 - Add Position to Interface (line ~6):**
```tsx
interface MenuItem {
  id: string
  name: string
  available: boolean
  hasSection: boolean
  sectionName: string
  image: string | null
  willShowOnFrontend: boolean
  status: 'HIDDEN' | 'IN_SECTION' | 'ORPHANED'
  position: number // ADD THIS
}
```

**Step 2 - Add Reorder Function (after line ~100):**
```tsx
const reorderItem = async (itemId: string, direction: 'up' | 'down') => {
  if (!data) return;

  const currentIndex = data.items.all.findIndex(i => i.id === itemId);
  if (currentIndex === -1) return;

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= data.items.all.length) return;

  try {
    setActionLoading(itemId);

    const items = [...data.items.all];
    const currentItem = items[currentIndex];
    const targetItem = items[targetIndex];

    // Swap positions in database
    await fetch(`/api/menu/${currentItem.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ position: targetItem.position }),
    });

    await fetch(`/api/menu/${targetItem.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ position: currentItem.position }),
    });

    await fetchData(); // Refresh list
  } catch (error) {
    console.error('Error reordering items:', error);
    alert('Failed to reorder items');
  } finally {
    setActionLoading(null);
  }
};
```

**Step 3 - Sort Items by Position (add new useMemo around line ~110):**
```tsx
const sortedItems = useMemo(() => {
  if (!data) return [];
  return [...data.items.all].sort((a, b) => (a.position || 0) - (b.position || 0));
}, [data]);
```

**Step 4 - Update Filtering to Use sortedItems:**
Find where `data.items.all` is filtered and replace with `sortedItems`

**Step 5 - Add Reorder Buttons to Table:**
Find the table row rendering (around line 300) and add a new column:
```tsx
<td className="px-4 py-3">
  <div className="flex items-center gap-1">
    <button
      onClick={() => reorderItem(item.id, 'up')}
      disabled={index === 0 || actionLoading === item.id}
      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
      title="Move up"
    >
      ↑
    </button>
    <button
      onClick={() => reorderItem(item.id, 'down')}
      disabled={index === filteredItems.length - 1 || actionLoading === item.id}
      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
      title="Move down"
    >
      ↓
    </button>
  </div>
</td>
```

**Step 6 - Add Table Header for Reorder Column:**
```tsx
<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
```

**Result:** Menu items can be reordered with up/down arrows, positions saved to DB

---

## Priority 4: Tab State Persistence (10 min) ⭐

**File:** `components/admin/AdminDashboardClient.tsx`
**Line:** 21
**Issue:** Tab always defaults to "orders" even if URL has `?tab=settings`

**Step 1 - Add Imports:**
```tsx
import { useRouter, useSearchParams } from 'next/navigation';
```

**Step 2 - Replace Line 21:**
```tsx
const router = useRouter();
const searchParams = useSearchParams();
const tabFromUrl = searchParams.get('tab') as Tab | null;

const validTabs: Tab[] = ['orders', 'customers', 'logs', 'sections', 'menu', 'menu-manager', 'customize', 'catering', 'settings'];

const [activeTab, setActiveTab] = useState<Tab>(
  (tabFromUrl && validTabs.includes(tabFromUrl as Tab))
    ? (tabFromUrl as Tab)
    : 'orders'
);
```

**Step 3 - Update Tab Click Handlers (around line 71):**
```tsx
onClick={() => {
  const newTab = tab.key as Tab;
  setActiveTab(newTab);
  router.push(`/admin?tab=${newTab}`, { shallow: true });
}}
```

**Result:** URL updates on tab change, refreshing preserves selected tab

---

## VERIFICATION CHECKLIST

After applying fixes:

**Fix 1 - Logo:**
- [ ] Admin header shows Las Reinas logo
- [ ] Shows "Las Reinas Colusa" name
- [ ] Falls back gracefully if logo missing

**Fix 2 - Notifications:**
- [ ] Settings has new "Notification Preferences" section
- [ ] Email toggle works
- [ ] SMS toggle works (marked "coming soon")
- [ ] Webhook URL field accepts input
- [ ] Saves correctly to tenant settings

**Fix 3 - Reordering:**
- [ ] Menu Manager shows up/down arrows
- [ ] First item: up arrow disabled
- [ ] Last item: down arrow disabled
- [ ] Clicking up/down swaps positions
- [ ] Order persists after page refresh

**Fix 4 - Tab Persistence:**
- [ ] URL shows `?tab=settings` when on Settings
- [ ] Refreshing page keeps you on same tab
- [ ] Stripe redirect to `?tab=settings` works correctly

---

## TESTING COMMANDS

```bash
# Start dev server
npm run dev

# Login to admin
http://localhost:3001/admin/login
Email: admin@lasreinas.com
Password: demo123

# Test each fix:
# Fix 1: Check header shows logo
# Fix 2: Go to Settings, scroll to Notifications
# Fix 3: Go to Menu Manager, try up/down arrows
# Fix 4: Switch tabs, refresh, check URL persists
```

---

## ROLLBACK PLAN

If any fix breaks:

**Git Restore:**
```bash
# Restore specific file
git checkout HEAD -- components/admin/AdminDashboardClient.tsx
git checkout HEAD -- components/admin/Settings.tsx
git checkout HEAD -- components/admin/MenuManager.tsx

# Or restore all admin components
git checkout HEAD -- components/admin/
```

**Manual Backup:**
Before editing, create backups:
```bash
cp components/admin/AdminDashboardClient.tsx components/admin/AdminDashboardClient.tsx.backup
cp components/admin/Settings.tsx components/admin/Settings.tsx.backup
cp components/admin/MenuManager.tsx components/admin/MenuManager.tsx.backup
```

---

## NOTES FOR CURSOR

**Safe to Edit:**
- All 4 files are client components ('use client')
- No server-side rendering issues
- No breaking changes to API contracts
- All fixes are additive (no deletions)

**Test After Each Fix:**
- Run `npm run build` to check for TypeScript errors
- Verify page loads without errors
- Test basic functionality before moving to next fix

**Estimated Time:**
- Fix 1: 5 minutes
- Fix 2: 15 minutes
- Fix 3: 30 minutes
- Fix 4: 10 minutes
- **Total: 60 minutes**

**Priority if Short on Time:**
- Fix 1 (Logo): ⭐ High impact, fast
- Fix 4 (Tab): ⭐ Fixes Stripe redirect UX
- Fix 2 (Notifications): Medium impact
- Fix 3 (Reordering): Nice-to-have, longer task

---

**END OF FIXES**
**Status:** All fixes are optional polish (demo works without them)
**Impact:** Improves UX and visual polish by ~10%
**Risk:** Low (all changes isolated to specific components)
