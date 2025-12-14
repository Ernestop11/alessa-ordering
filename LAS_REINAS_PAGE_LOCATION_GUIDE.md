# 🎯 Las Reinas Tenant Page Location & Access Guide

## Problem Identified

You're seeing a UI you've never seen before because there's a **conflicting `page.tsx` file at the root level** of your project. This file is showing a simple "Culinary Excellence" page, which is not part of your actual Next.js app.

### The Issue

- ❌ **Root level**: `/page.tsx` - This is the OLD/STALE file showing "Culinary Excellence"
- ✅ **Actual app**: `/app/page.tsx` - This is your real Next.js app that handles tenant routing

## Where is the Las Reinas Page?

The Las Reinas tenant page is actually **multi-layered**:

### 1. Main Entry Point
**Location**: `/app/page.tsx`
- Handles root domain routing
- Redirects tenant subdomains to `/order`

### 2. Order Page (Main Customer Interface)
**Location**: `/app/order/page.tsx`
- This is where Las Reinas menu/catalog is shown
- Uses `requireTenant()` to resolve tenant from:
  - Query param: `?tenant=lasreinas`
  - Subdomain: `lasreinas.alessacloud.com`
  - Custom domain: `lasreinascolusa.com`
  - Middleware header: `x-tenant-slug`

### 3. Order Page Client Component
**Location**: `/components/order/OrderPageClient.tsx`
- The actual UI component that renders the menu
- Receives tenant data and menu sections as props

## How to Access Las Reinas Tenant Page

### Option 1: Query Parameter (Easiest for Local Testing)
```
http://localhost:3001/order?tenant=lasreinas
```

### Option 2: Root with Tenant Param
```
http://localhost:3001?tenant=lasreinas
```
This will redirect to `/order` automatically.

### Option 3: Subdomain (Production)
```
https://lasreinas.alessacloud.com/order
```

### Option 4: Custom Domain (Production)
```
https://lasreinascolusa.com/order
```

## File Structure Reference

```
/Users/ernestoponce/alessa-ordering/
├── page.tsx  ⚠️  OLD FILE - DELETE THIS
├── app/
│   ├── page.tsx  ✅ Main entry point (handles tenant routing)
│   ├── order/
│   │   └── page.tsx  ✅ Las Reinas order page (loads tenant data)
│   └── layout.tsx
├── components/
│   └── order/
│       └── OrderPageClient.tsx  ✅ Actual UI component
├── lib/
│   └── tenant.ts  ✅ Tenant resolution logic
└── middleware.ts  ✅ Adds x-tenant-slug header
```

## Quick Fix: Remove Conflicting File

The root `page.tsx` should be deleted or moved. It's interfering with the App Router structure.

**File to remove**: `/Users/ernestoponce/alessa-ordering/page.tsx`

## How Tenant Resolution Works

1. **Middleware** (`middleware.ts`) runs first and determines tenant from:
   - Subdomain pattern: `lasreinas.alessacloud.com`
   - Custom domain lookup
   - Query parameter: `?tenant=lasreinas`
   - Falls back to `DEFAULT_TENANT_SLUG`

2. Sets `x-tenant-slug` header: `lasreinas`

3. **App Router** (`/app/page.tsx`) checks host:
   - If root domain → shows landing page
   - If tenant subdomain → redirects to `/order`

4. **Order Page** (`/app/order/page.tsx`):
   - Calls `requireTenant()` which reads header
   - Fetches menu sections from database
   - Passes data to `OrderPageClient`

5. **OrderPageClient** renders the UI with Las Reinas branding

## Testing Checklist

- [ ] Remove root `/page.tsx` file
- [ ] Test: `http://localhost:3001/order?tenant=lasreinas`
- [ ] Verify Las Reinas menu loads
- [ ] Check tenant-specific styling/colors
- [ ] Verify tenant assets load: `/tenant/lasreinas/images/*`

## Environment Variables

Make sure these are set correctly:

```env
DEFAULT_TENANT_SLUG=lapoblanita  # Default fallback
ROOT_DOMAIN=alessacloud.com
CUSTOM_DOMAIN_MAP={"lasreinascolusa.com":"lasreinas"}
```

## Database Check

Verify Las Reinas tenant exists:
```sql
SELECT * FROM "Tenant" WHERE slug = 'lasreinas';
```

## For Claude Chat Sync

Share this with Claude Chat in VS Code:

**Las Reinas Tenant Page Location:**
- Main route handler: `/app/order/page.tsx`
- UI component: `/components/order/OrderPageClient.tsx`
- Tenant resolution: `/lib/tenant.ts`
- Middleware: `/middleware.ts`

**How to test:**
```bash
npm run dev
# Then visit: http://localhost:3001/order?tenant=lasreinas
```

**Issue to fix:**
- Remove `/page.tsx` at root level (it's conflicting)
- All pages should be in `/app/` directory for App Router





















