# ADMIN UX POLISH - FOR CURSOR TO APPLY
**Priority-Ordered Improvements for Las Reinas Admin**
**Total Estimated Time:** 90 minutes
**Last Updated:** November 18, 2025

---

## 🎯 OVERVIEW

These are **optional polish improvements** for the admin dashboard. All core functionality works without these fixes. Apply these to create a more polished, professional experience for the demo and production launch.

**Current Status:** Admin is 95% complete and fully functional

**After These Fixes:** Admin will be 100% polished and production-ready

---

## PRIORITY 1: TENANT LOGO IN ADMIN HEADER (5 min) ⭐⭐⭐

### Issue:
Admin header shows hardcoded "Restaurant Dashboard" instead of tenant logo and name.

### Impact:
- **User Experience:** Poor branding, doesn't feel personalized
- **Demo Impact:** High - first thing presenter sees
- **Difficulty:** Easy

### Files to Edit:
- `components/admin/AdminDashboardClient.tsx`

### Step-by-Step Fix:

**Step 1: Add imports (top of file)**
```tsx
import { useState, useEffect } from 'react';
```

**Step 2: Add state in component (around line 20)**
```tsx
const [tenant, setTenant] = useState<{
  name: string;
  logoUrl?: string | null;
  slug?: string;
} | null>(null);

const [loadingTenant, setLoadingTenant] = useState(true);

useEffect(() => {
  const fetchTenant = async () => {
    try {
      const res = await fetch('/api/admin/tenant-settings');
      if (!res.ok) throw new Error('Failed to fetch tenant');
      const data = await res.json();
      setTenant(data);
    } catch (err) {
      console.error('Failed to load tenant', err);
      // Fallback to default
      setTenant({ name: 'Restaurant Dashboard', logoUrl: null });
    } finally {
      setLoadingTenant(false);
    }
  };
  fetchTenant();
}, []);
```

**Step 3: Replace header content (around line 56)**

Find:
```tsx
<h1 className="text-xl font-bold text-gray-800">Restaurant Dashboard</h1>
```

Replace with:
```tsx
<div className="flex-shrink-0 flex items-center gap-3">
  {tenant?.logoUrl && (
    <img
      src={tenant.logoUrl}
      alt={tenant.name}
      className="h-10 w-auto object-contain max-w-[120px]"
      onError={(e) => {
        // Hide image if it fails to load
        e.currentTarget.style.display = 'none';
      }}
    />
  )}
  <h1 className="text-xl font-bold text-gray-800">
    {loadingTenant ? 'Loading...' : (tenant?.name || 'Restaurant Dashboard')}
  </h1>
</div>
```

### Expected Result:
- Admin header shows Las Reinas logo (red/gold branding)
- Shows "Las Reinas Colusa" next to logo
- Falls back gracefully if logo missing or fails to load
- Loading state shows "Loading..." briefly

### Testing:
1. Navigate to `/admin`
2. Verify logo appears in header
3. Verify restaurant name appears
4. Test with missing logo (should hide image, show name only)

---

## PRIORITY 2: NOTIFICATION SETTINGS UI (15 min) ⭐⭐

### Issue:
No UI to configure notification preferences (email, SMS, webhooks). Backend supports it, but settings page doesn't expose it.

### Impact:
- **User Experience:** Can't configure how they receive order notifications
- **Demo Impact:** Medium - nice to show during Settings walkthrough
- **Difficulty:** Medium

### Files to Edit:
- `components/admin/Settings.tsx`

### Step-by-Step Fix:

**Step 1: Add interface (around line 42)**
```tsx
interface NotificationSettingsForm {
  emailOnNewOrder: boolean;
  smsOnNewOrder: boolean;
  webhookUrl: string;
}
```

**Step 2: Add default (around line 192)**
```tsx
const defaultNotificationSettings: NotificationSettingsForm = {
  emailOnNewOrder: true,
  smsOnNewOrder: false,
  webhookUrl: '',
};
```

**Step 3: Add state (around line 268)**
```tsx
const [notificationSettings, setNotificationSettings] =
  useState<NotificationSettingsForm>(defaultNotificationSettings);
```

**Step 4: Load from settings (in useEffect around line 520)**

Find the useEffect that loads settings, add:
```tsx
// Load notification settings
if (settings.notificationSettings && typeof settings.notificationSettings === 'object') {
  setNotificationSettings({
    emailOnNewOrder: Boolean(settings.notificationSettings.emailOnNewOrder),
    smsOnNewOrder: Boolean(settings.notificationSettings.smsOnNewOrder),
    webhookUrl: String(settings.notificationSettings.webhookUrl || ''),
  });
} else {
  setNotificationSettings(defaultNotificationSettings);
}
```

**Step 5: Save to payload (in handleSave around line 683)**

Find where payload is built, add:
```tsx
payload.notificationSettings = {
  emailOnNewOrder: Boolean(notificationSettings.emailOnNewOrder),
  smsOnNewOrder: Boolean(notificationSettings.smsOnNewOrder),
  webhookUrl: notificationSettings.webhookUrl.trim() || '',
};
```

**Step 6: Add UI section (after Accessibility Defaults section, around line 1951)**

```tsx
{/* Notification Preferences */}
<section className="rounded-lg border border-gray-200 bg-white p-6">
  <h3 className="text-base font-semibold text-gray-900 mb-2">
    Notification Preferences
  </h3>
  <p className="text-sm text-gray-500 mb-4">
    Choose how you want to be notified about orders and events.
  </p>
  <div className="space-y-4">
    {/* Email Notifications */}
    <label className="flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 px-4 py-3 hover:bg-gray-100 transition-colors cursor-pointer">
      <input
        type="checkbox"
        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
        checked={notificationSettings.emailOnNewOrder}
        onChange={(e) =>
          setNotificationSettings((prev) => ({
            ...prev,
            emailOnNewOrder: e.target.checked
          }))
        }
      />
      <div className="flex-1">
        <span className="block text-sm font-medium text-gray-700">
          Email me when new orders arrive
        </span>
        <span className="block text-xs text-gray-500 mt-1">
          Receive order notifications at your admin email address
        </span>
      </div>
    </label>

    {/* SMS Notifications */}
    <label className="flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 px-4 py-3 hover:bg-gray-100 transition-colors cursor-pointer">
      <input
        type="checkbox"
        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
        checked={notificationSettings.smsOnNewOrder}
        onChange={(e) =>
          setNotificationSettings((prev) => ({
            ...prev,
            smsOnNewOrder: e.target.checked
          }))
        }
        disabled
      />
      <div className="flex-1">
        <span className="block text-sm font-medium text-gray-700">
          Send SMS for urgent orders
        </span>
        <span className="block text-xs text-gray-500 mt-1">
          Coming soon - SMS notifications via Twilio
        </span>
      </div>
      <span className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-200 rounded">
        Coming Soon
      </span>
    </label>

    {/* Webhook URL */}
    <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Webhook URL (optional)
      </label>
      <input
        type="url"
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 bg-white"
        value={notificationSettings.webhookUrl}
        onChange={(e) =>
          setNotificationSettings((prev) => ({
            ...prev,
            webhookUrl: e.target.value
          }))
        }
        placeholder="https://your-app.com/webhook"
      />
      <p className="mt-2 text-xs text-gray-500">
        Receive POST requests for order events. Useful for integrating with external systems like Slack, Discord, or custom dashboards.
      </p>
      <details className="mt-2">
        <summary className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer">
          View webhook payload example
        </summary>
        <pre className="mt-2 p-2 bg-gray-800 text-gray-100 text-xs rounded overflow-x-auto">
{`{
  "event": "order.created",
  "timestamp": "2025-11-18T10:30:00Z",
  "order": {
    "id": "1047",
    "total": 19.60,
    "customer": "John Doe",
    "items": [...]
  }
}`}
        </pre>
      </details>
    </div>
  </div>
</section>
```

### Expected Result:
- Settings page shows "Notification Preferences" section
- Email toggle works and saves to database
- SMS toggle shows "Coming Soon" badge and is disabled
- Webhook URL field accepts input and saves
- Collapsible example shows webhook payload format

### Testing:
1. Navigate to `/admin?tab=settings`
2. Scroll to Notification Preferences section
3. Toggle email notifications on/off
4. Enter webhook URL
5. Click "Save Settings"
6. Refresh page - verify settings persisted

---

## PRIORITY 3: MENU ITEM REORDERING (30 min) ⭐⭐

### Issue:
Menu sections can be reordered, but individual menu items cannot. Items appear in database insertion order, not logical order.

### Impact:
- **User Experience:** Can't control item order (e.g., can't put featured items first)
- **Demo Impact:** Medium - would be nice to show during Menu Manager demo
- **Difficulty:** Medium-High (requires backend + frontend changes)

### Files to Edit:
1. `components/admin/MenuManager.tsx`
2. `app/api/menu/[id]/route.ts` (backend - to accept position updates)
3. `prisma/schema.prisma` (check if position field exists)

### Step-by-Step Fix:

**Step 1: Verify position field exists in schema**

Check `prisma/schema.prisma`:
```prisma
model MenuItem {
  id          String   @id @default(cuid())
  name        String
  price       Decimal
  position    Int      @default(0)  // ← Should exist
  // ... other fields
}
```

If `position` field doesn't exist, add it and run migration:
```bash
npx prisma migrate dev --name add_menu_item_position
```

**Step 2: Update MenuItem interface (MenuManager.tsx, around line 6)**

```tsx
interface MenuItem {
  id: string;
  name: string;
  available: boolean;
  hasSection: boolean;
  sectionName: string;
  image: string | null;
  willShowOnFrontend: boolean;
  status: 'HIDDEN' | 'IN_SECTION' | 'ORPHANED';
  position: number; // ADD THIS
}
```

**Step 3: Add reorder function (MenuManager.tsx, after line 100)**

```tsx
const reorderItem = async (itemId: string, direction: 'up' | 'down') => {
  if (!data) return;

  const currentIndex = filteredItems.findIndex(i => i.id === itemId);
  if (currentIndex === -1) return;

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= filteredItems.length) return;

  try {
    setActionLoading(itemId);

    const currentItem = filteredItems[currentIndex];
    const targetItem = filteredItems[targetIndex];

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
    alert('Failed to reorder items. Please try again.');
  } finally {
    setActionLoading(null);
  }
};
```

**Step 4: Sort items by position (MenuManager.tsx, add useMemo around line 110)**

```tsx
const sortedItems = useMemo(() => {
  if (!data) return [];
  return [...data.items.all].sort((a, b) => (a.position || 0) - (b.position || 0));
}, [data]);
```

**Step 5: Update filtering to use sortedItems**

Find where `data.items.all` is filtered (around line 120) and replace with `sortedItems`:

```tsx
const filteredItems = useMemo(() => {
  if (!sortedItems) return []; // Changed from data.items.all

  let items = sortedItems; // Changed from data.items.all

  // ... rest of filtering logic
}, [sortedItems, filterTab, searchQuery]);
```

**Step 6: Add reorder buttons to table**

Find the table row rendering (around line 300), add a new column BEFORE the Actions column:

```tsx
{/* Reorder Column */}
<td className="px-4 py-3">
  <div className="flex items-center gap-1">
    <button
      onClick={() => reorderItem(item.id, 'up')}
      disabled={index === 0 || actionLoading === item.id}
      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      title="Move up"
      aria-label="Move item up"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    </button>
    <button
      onClick={() => reorderItem(item.id, 'down')}
      disabled={index === filteredItems.length - 1 || actionLoading === item.id}
      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      title="Move down"
      aria-label="Move item down"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  </div>
</td>
```

**Step 7: Add table header for reorder column**

Find the table header row (around line 250), add:

```tsx
<th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Order
</th>
```

**Step 8: Update backend API (app/api/menu/[id]/route.ts)**

Find the PATCH handler, add position field handling:

```tsx
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  // ... existing code

  const body = await request.json();

  const updateData: any = {};

  if ('available' in body) updateData.available = Boolean(body.available);
  if ('name' in body) updateData.name = String(body.name);
  if ('price' in body) updateData.price = Number(body.price);
  if ('position' in body) updateData.position = Number(body.position); // ADD THIS
  // ... other fields

  const updated = await prisma.menuItem.update({
    where: { id: params.id },
    data: updateData,
  });

  return NextResponse.json(updated);
}
```

### Expected Result:
- Menu Manager shows up/down arrow buttons next to each item
- First item: up arrow is disabled (grayed out)
- Last item: down arrow is disabled
- Clicking up/down swaps positions immediately
- Order persists after page refresh
- Items appear in custom order on customer-facing site

### Testing:
1. Navigate to `/admin?tab=menu-manager`
2. Find "Quesabirrias" item
3. Click down arrow - item moves down one position
4. Click up arrow - item moves back up
5. Refresh page - verify order persists
6. Open customer site - verify order matches

---

## PRIORITY 4: TAB STATE PERSISTENCE (10 min) ⭐

### Issue:
Active tab always defaults to "orders" even if URL contains `?tab=settings`. After Stripe redirect, user lands on orders instead of settings.

### Impact:
- **User Experience:** Annoying - must re-select tab after page refresh
- **Demo Impact:** Medium - Stripe redirect should return to Settings tab
- **Difficulty:** Easy

### Files to Edit:
- `components/admin/AdminDashboardClient.tsx`

### Step-by-Step Fix:

**Step 1: Add imports (top of file)**
```tsx
import { useRouter, useSearchParams } from 'next/navigation';
```

**Step 2: Initialize with URL parameter (around line 21)**

Find:
```tsx
const [activeTab, setActiveTab] = useState<Tab>('orders');
```

Replace with:
```tsx
const router = useRouter();
const searchParams = useSearchParams();

const validTabs: Tab[] = [
  'orders',
  'customers',
  'logs',
  'sections',
  'menu',
  'menu-manager',
  'customize',
  'catering',
  'settings'
];

const tabFromUrl = searchParams.get('tab') as Tab | null;

const [activeTab, setActiveTab] = useState<Tab>(() => {
  if (tabFromUrl && validTabs.includes(tabFromUrl as Tab)) {
    return tabFromUrl as Tab;
  }
  return 'orders';
});
```

**Step 3: Update tab click handlers (around line 71)**

Find where tab buttons are clicked:
```tsx
onClick={() => setActiveTab(tab.key as Tab)}
```

Replace with:
```tsx
onClick={() => {
  const newTab = tab.key as Tab;
  setActiveTab(newTab);

  // Update URL without page reload
  const newUrl = new URL(window.location.href);
  newUrl.searchParams.set('tab', newTab);
  router.push(newUrl.pathname + newUrl.search, { scroll: false });
}}
```

**Alternative simpler version (if router.push causes issues):**
```tsx
onClick={() => {
  const newTab = tab.key as Tab;
  setActiveTab(newTab);

  // Update URL using window.history
  const newUrl = new URL(window.location.href);
  newUrl.searchParams.set('tab', newTab);
  window.history.replaceState({}, '', newUrl.toString());
}}
```

### Expected Result:
- URL updates when switching tabs: `/admin?tab=settings`
- Refreshing page keeps you on same tab
- Stripe redirect to `?tab=settings` works correctly
- Browser back/forward buttons work (bonus)

### Testing:
1. Navigate to `/admin`
2. Click Settings tab
3. Verify URL shows `?tab=settings`
4. Refresh page (Cmd+R or F5)
5. Verify Settings tab is still active
6. Test Stripe redirect flow - should land on Settings tab

---

## PRIORITY 5: LOADING STATES FOR MENU MANAGER (10 min) ⭐

### Issue:
Menu Manager shows empty state immediately while loading data. No loading spinner or skeleton.

### Impact:
- **User Experience:** Confusing - users think menu is empty
- **Demo Impact:** Low - loads fast locally
- **Difficulty:** Easy

### Files to Edit:
- `components/admin/MenuManager.tsx`

### Step-by-Step Fix:

**Step 1: Add loading state (around line 25)**

```tsx
const [loading, setLoading] = useState(true);
```

**Step 2: Update fetchData function (around line 40)**

```tsx
const fetchData = async () => {
  setLoading(true);
  try {
    const res = await fetch('/api/admin/menu-manager');
    if (!res.ok) throw new Error('Failed to fetch');
    const json = await res.json();
    setData(json);
  } catch (err) {
    console.error('Error fetching menu data:', err);
    setError('Failed to load menu items');
  } finally {
    setLoading(false);
  }
};
```

**Step 3: Add loading UI (around line 200, before the main content)**

```tsx
{loading && (
  <div className="flex items-center justify-center py-12">
    <div className="text-center">
      <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
      <p className="text-sm text-gray-600">Loading menu items...</p>
    </div>
  </div>
)}

{!loading && data && (
  // ... existing menu manager content
)}
```

### Expected Result:
- Shows loading spinner while fetching data
- Spinner disappears when data loads
- No flash of empty state

### Testing:
1. Navigate to `/admin?tab=menu-manager`
2. Should see spinner briefly
3. Data appears after loading

---

## PRIORITY 6: BETTER ERROR MESSAGES (15 min) ⭐

### Issue:
Generic error messages like "Failed to save" don't tell users what went wrong or how to fix it.

### Impact:
- **User Experience:** Frustrating when errors occur
- **Demo Impact:** Low - shouldn't see errors in demo
- **Difficulty:** Medium

### Files to Edit:
- `components/admin/Settings.tsx`
- `components/admin/MenuManager.tsx`
- `components/admin/CateringManager.tsx`

### Step-by-Step Fix:

**Create error utility (lib/error-messages.ts):**

```tsx
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'An unexpected error occurred. Please try again.';
}

export function getApiErrorMessage(response: Response): Promise<string> {
  return response.json()
    .then(data => data.error || data.message || `Error: ${response.statusText}`)
    .catch(() => `Error: ${response.statusText}`);
}
```

**Update Settings.tsx error handling (around line 650):**

```tsx
import { getErrorMessage, getApiErrorMessage } from '@/lib/error-messages';

const handleSave = async () => {
  try {
    setSaving(true);
    setError(null);

    const res = await fetch('/api/admin/tenant-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorMsg = await getApiErrorMessage(res);
      throw new Error(errorMsg);
    }

    setSuccess('Settings saved successfully!');

    // Clear success message after 3 seconds
    setTimeout(() => setSuccess(null), 3000);

  } catch (err) {
    const errorMsg = getErrorMessage(err);
    setError(errorMsg);
    console.error('Save error:', err);
  } finally {
    setSaving(false);
  }
};
```

**Update MenuManager.tsx error handling (around line 120):**

```tsx
const toggleVisibility = async (item: MenuItem) => {
  try {
    setActionLoading(item.id);

    const res = await fetch(`/api/menu/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ available: !item.available }),
    });

    if (!res.ok) {
      const errorMsg = await getApiErrorMessage(res);
      throw new Error(errorMsg);
    }

    await fetchData();
  } catch (err) {
    const errorMsg = getErrorMessage(err);
    alert(`Failed to update item visibility: ${errorMsg}`);
    console.error('Toggle visibility error:', err);
  } finally {
    setActionLoading(null);
  }
};
```

### Expected Result:
- Specific error messages instead of generic ones
- Users see helpful context (e.g., "Missing required field: price")
- Errors are logged to console for debugging

---

## PRIORITY 7: RESPONSIVE MOBILE LAYOUT FOR ADMIN (20 min) ⭐

### Issue:
Admin dashboard is designed for desktop. On mobile, tabs overflow, tables are hard to navigate.

### Impact:
- **User Experience:** Can't manage restaurant from phone
- **Demo Impact:** Low - demo is on desktop
- **Difficulty:** Medium

### Files to Edit:
- `components/admin/AdminDashboardClient.tsx`
- `components/admin/MenuManager.tsx`
- `components/admin/Settings.tsx`

### Quick Wins:

**AdminDashboardClient.tsx - Mobile tab navigation:**

```tsx
{/* Desktop tabs - hidden on mobile */}
<nav className="hidden md:flex space-x-1 border-b border-gray-200">
  {tabs.map((tab) => (
    <button key={tab.key} /* ... */ >
      {tab.label}
    </button>
  ))}
</nav>

{/* Mobile tabs - dropdown */}
<div className="md:hidden">
  <select
    value={activeTab}
    onChange={(e) => {
      const newTab = e.target.value as Tab;
      setActiveTab(newTab);
      // Update URL
    }}
    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
  >
    {tabs.map((tab) => (
      <option key={tab.key} value={tab.key}>
        {tab.label}
      </option>
    ))}
  </select>
</div>
```

**MenuManager.tsx - Responsive table:**

Wrap table in:
```tsx
<div className="overflow-x-auto -mx-4 sm:mx-0">
  <div className="inline-block min-w-full align-middle">
    <table className="min-w-full divide-y divide-gray-300">
      {/* ... existing table */}
    </table>
  </div>
</div>
```

Or convert to card layout on mobile (more complex).

### Expected Result:
- Admin dashboard usable on mobile devices
- Tabs become dropdown on mobile
- Tables scroll horizontally on small screens

---

## TESTING CHECKLIST

After applying fixes, verify:

**Fix 1 - Logo:**
- [ ] Admin header shows Las Reinas logo
- [ ] Shows "Las Reinas Colusa" name
- [ ] Falls back gracefully if logo missing

**Fix 2 - Notifications:**
- [ ] Settings has "Notification Preferences" section
- [ ] Email toggle works
- [ ] SMS toggle shows "Coming Soon"
- [ ] Webhook URL accepts input
- [ ] Settings save correctly

**Fix 3 - Reordering:**
- [ ] Menu Manager shows up/down arrows
- [ ] First item: up arrow disabled
- [ ] Last item: down arrow disabled
- [ ] Clicking arrows swaps positions
- [ ] Order persists after refresh
- [ ] Customer site reflects new order

**Fix 4 - Tab Persistence:**
- [ ] URL shows `?tab=settings` when on Settings
- [ ] Refreshing keeps you on same tab
- [ ] Stripe redirect to `?tab=settings` works

**Fix 5 - Loading States:**
- [ ] Menu Manager shows spinner while loading
- [ ] Spinner disappears when loaded

**Fix 6 - Error Messages:**
- [ ] Errors show specific messages
- [ ] No generic "Failed" messages

**Fix 7 - Mobile:**
- [ ] Admin works on mobile
- [ ] Tabs become dropdown
- [ ] Tables scroll or stack

---

## ROLLBACK PLAN

If any fix breaks something:

**Git Restore:**
```bash
# Restore specific file
git checkout HEAD -- components/admin/AdminDashboardClient.tsx

# Or restore all admin components
git checkout HEAD -- components/admin/
```

**Manual Backup (before editing):**
```bash
cp components/admin/AdminDashboardClient.tsx components/admin/AdminDashboardClient.tsx.backup
cp components/admin/Settings.tsx components/admin/Settings.tsx.backup
cp components/admin/MenuManager.tsx components/admin/MenuManager.tsx.backup
```

---

## PRIORITY SUMMARY

If short on time, apply in this order:

1. **Fix 1 (Logo)** - 5 min - High visual impact
2. **Fix 4 (Tab Persistence)** - 10 min - Fixes Stripe redirect UX
3. **Fix 2 (Notifications)** - 15 min - Adds valuable feature
4. **Fix 5 (Loading States)** - 10 min - Improves perceived performance
5. **Fix 3 (Reordering)** - 30 min - Nice-to-have
6. **Fix 6 (Error Messages)** - 15 min - Better DX
7. **Fix 7 (Mobile)** - 20 min - Future-proofing

**Total for top 4:** 40 minutes
**Total for all 7:** 105 minutes

---

**STATUS:** Ready for Cursor to apply
**RISK:** Low - all changes are isolated and backwards-compatible
**IMPACT:** Increases admin polish from 95% → 100%
