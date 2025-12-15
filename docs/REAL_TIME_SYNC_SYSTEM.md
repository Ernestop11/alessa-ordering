# Real-Time Admin-to-Frontend Sync System

## Overview

This document explains how the Alessa Ordering platform implements real-time synchronization between admin changes and the customer-facing frontend. When an admin makes changes (like toggling "Accepting Orders" or updating Featured Carousel items), the frontend automatically updates without requiring a page refresh.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Admin Panel   │────▶│   Database      │◀────│   Frontend      │
│   (Updates)     │     │   (Source of    │     │   (Polls API)   │
│                 │     │    Truth)       │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                              │
                              ▼
                        ┌─────────────────┐
                        │   API Endpoint  │
                        │   (Polling)     │
                        └─────────────────┘
```

## How It Works

### 1. Admin Makes a Change
- Admin clicks a toggle, saves a form, or updates settings
- Frontend calls the admin API endpoint (e.g., `PUT /api/admin/tenant-settings`)
- API updates the database (Prisma → PostgreSQL)
- API returns success response

### 2. Frontend Polls for Changes
- Customer-facing frontend has a `useEffect` hook that runs on mount
- Sets up an interval (typically 10 seconds) to poll a read-only API endpoint
- API endpoint reads current state from database
- Frontend compares new data with current state
- If changed, updates React state → triggers re-render

### 3. UI Updates Automatically
- React state change causes component re-render
- Customer sees updated UI without refreshing page

## Implementation Pattern

### Step 1: Create a Polling API Endpoint

```typescript
// app/api/[feature-name]/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';

// IMPORTANT: Force dynamic rendering - never cache
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tenant = await requireTenant();

    // Query the database for current state
    const data = await prisma.someModel.findMany({
      where: { tenantId: tenant.id },
      // ... select relevant fields
    });

    const response = NextResponse.json({
      items: data,
      timestamp: Date.now(), // Helps with debugging
    });

    // CRITICAL: Prevent all caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (err) {
    console.error('[feature-name] GET error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
```

### Step 2: Add State in Frontend Component

```typescript
// components/order/OrderPageClient.tsx (or similar)

// 1. Create state initialized from server props
const [currentData, setCurrentData] = useState<DataType[]>(initialDataFromProps);

// 2. Use state in your rendering logic (not the props!)
const displayItems = useMemo(() => {
  return currentData.map(item => /* ... */);
}, [currentData]); // Dependency on state, not props
```

### Step 3: Add Polling Effect

```typescript
// Poll for updates every 10 seconds
useEffect(() => {
  const fetchData = async () => {
    try {
      const timestamp = Date.now();
      const res = await fetch(`/api/feature-name?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.items)) {
          // Optimization: Only update if data actually changed
          const newIds = data.items.map((i: { id: string }) => i.id).sort().join(',');
          setCurrentData(prev => {
            const oldIds = prev.map(i => i.id).sort().join(',');
            if (newIds !== oldIds) {
              console.log('[FeatureName] Data updated:', data.items.length);
              return data.items;
            }
            return prev; // No change, keep same reference
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch data', err);
    }
  };

  // Fetch immediately on mount
  fetchData();

  // Then poll every 10 seconds
  const interval = setInterval(fetchData, 10000);
  return () => clearInterval(interval);
}, []);
```

## Current Implementations

### 1. Restaurant Status (Accepting Orders Toggle)

| Component | File |
|-----------|------|
| **Polling API** | `app/api/restaurant-status/route.ts` |
| **Admin API** | `app/api/admin/tenant-settings/route.ts` |
| **Frontend State** | `components/order/OrderPageClient.tsx` |
| **Poll Interval** | 10 seconds |
| **Database Field** | `TenantSettings.isOpen`, `TenantSettings.operatingHours` |

**How it works:**
- Admin toggles "Accepting Orders" button in Menu Editor
- Updates `TenantSettings.isOpen` via PUT to `/api/admin/tenant-settings`
- Frontend polls `/api/restaurant-status` every 10 seconds
- Updates `restaurantIsOpen` state → disables/enables ordering buttons

### 2. Featured Carousel Items

| Component | File |
|-----------|------|
| **Polling API** | `app/api/featured-items/route.ts` |
| **Admin API** | `app/api/menu/[id]/route.ts` (PATCH) |
| **Frontend State** | `components/order/OrderPageClient.tsx` |
| **Poll Interval** | 10 seconds |
| **Database Field** | `MenuItem.isFeatured` |

**How it works:**
- Admin clicks items in Featured Carousel editor (Frontend Sections tab)
- Each click immediately PATCHes `/api/menu/{id}` with `{ isFeatured: true/false }`
- Frontend polls `/api/featured-items` every 10 seconds
- Updates `currentFeaturedItems` state → carousel re-renders with new items

### 3. Menu Availability & Prices

| Component | File |
|-----------|------|
| **Polling API** | `app/api/menu-availability/route.ts` |
| **Admin API** | `app/api/menu/[id]/route.ts` (PATCH) |
| **Frontend State** | `components/order/OrderPageClient.tsx` |
| **Poll Interval** | 15 seconds |
| **Database Field** | `MenuItem.available`, `MenuItem.price` |

**How it works:**
- Admin toggles "Available" checkbox or changes price in Menu Editor
- Updates `MenuItem` via PATCH to `/api/menu/{id}`
- Frontend polls `/api/menu-availability` every 15 seconds
- Merges availability/price updates into `currentSections` state
- Items show "Sold Out" and disable ordering buttons when unavailable

### 4. Catering Packages

| Component | File |
|-----------|------|
| **Polling API** | `app/api/catering-packages/route.ts` |
| **Admin API** | `app/api/admin/catering-packages/route.ts` |
| **Frontend State** | `components/order/OrderPageClient.tsx` |
| **Poll Interval** | 30 seconds |
| **Database Field** | `CateringPackage.*` |

**How it works:**
- Admin updates catering packages in Catering tab
- Frontend polls `/api/catering-packages` every 30 seconds
- Updates `cateringPackages` state → catering section re-renders

## Features That Could Use This Pattern (Future)

### Medium Priority (Nice to Have)

| Feature | Admin Location | What Changes | Suggested Endpoint |
|---------|---------------|--------------|-------------------|
| Promotional Banners | Frontend Sections | Banner content/images | `/api/promo-banners` |
| Special Announcements | Settings | Alert messages | `/api/announcements` |
| Menu Section Order | Menu Editor | Section positions | `/api/menu-sections` |
| Grocery Items | Grocery Tab | Grocery inventory | `/api/grocery-items` |
| Rewards Program | Settings | Points, tiers | `/api/rewards-config` |

## Best Practices

### 1. Polling Intervals

| Data Type | Recommended Interval | Reason |
|-----------|---------------------|--------|
| Critical (open/closed) | 10 seconds | Customer needs immediate feedback |
| Content (carousel, banners) | 10-15 seconds | Balance freshness vs server load |
| Inventory/Prices | 15-30 seconds | Less time-sensitive |
| Configuration | 30-60 seconds | Rarely changes |

### 2. Cache Busting

Always include these headers in polling endpoints:
```typescript
response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
response.headers.set('Pragma', 'no-cache');
response.headers.set('Expires', '0');
```

And add timestamp to fetch URL:
```typescript
fetch(`/api/endpoint?t=${Date.now()}`)
```

### 3. State Optimization

Only update state when data actually changes to prevent unnecessary re-renders:
```typescript
setData(prev => {
  const hasChanged = /* compare logic */;
  return hasChanged ? newData : prev;
});
```

### 4. Error Handling

- Never crash the polling loop on error
- Log errors but continue polling
- Consider exponential backoff for repeated failures

### 5. Cleanup

Always clean up intervals on unmount:
```typescript
useEffect(() => {
  const interval = setInterval(fetchData, 10000);
  return () => clearInterval(interval); // IMPORTANT!
}, []);
```

## Debugging

### Console Logs

Each polling implementation should log when data changes:
```
[FeaturedItems] Updated carousel items: 5
[RestaurantStatus] Status changed: open → closed
```

### Network Tab

Check browser DevTools Network tab:
- Filter by "featured" or endpoint name
- Should see requests every 10 seconds
- Response should have `Cache-Control: no-store` header

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Changes not appearing | Caching | Add cache-busting headers |
| Delayed updates | Long poll interval | Reduce interval |
| Too many requests | Interval too short | Increase interval |
| State not updating | Using props instead of state | Use state in render logic |
| Memory leak | Missing cleanup | Add `return () => clearInterval()` |

## File Reference

```
alessa-ordering/
├── app/api/
│   ├── restaurant-status/route.ts    # Restaurant open/closed polling
│   ├── featured-items/route.ts       # Featured carousel polling
│   ├── menu-availability/route.ts    # Menu item availability/prices polling
│   ├── catering-packages/route.ts    # Catering packages polling
│   └── admin/
│       ├── tenant-settings/route.ts  # Admin settings updates
│       └── frontend-ui-sections/     # Frontend section config
├── components/order/
│   └── OrderPageClient.tsx           # Main frontend with polling hooks
├── lib/
│   ├── hours-validator.ts            # Operating hours logic
│   └── prisma.ts                     # Database client
└── docs/
    └── REAL_TIME_SYNC_SYSTEM.md      # This documentation
```

## Future Improvements

1. **WebSocket Support**: For truly instant updates (sub-second), consider implementing WebSocket connections instead of polling.

2. **Server-Sent Events (SSE)**: One-way real-time updates from server to client, lower overhead than WebSockets.

3. **Optimistic Updates**: Update UI immediately on admin action, then confirm with server response.

4. **Selective Polling**: Only poll when tab is visible (`document.visibilityState === 'visible'`).

## Contributing

When adding new real-time sync features:

1. Create the polling API endpoint in `app/api/`
2. Add state in the appropriate frontend component
3. Add the polling `useEffect` hook
4. Update this documentation with the new implementation
5. Test with browser DevTools open to verify polling works
