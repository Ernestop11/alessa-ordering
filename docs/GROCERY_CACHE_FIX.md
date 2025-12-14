# Grocery Page Cache Fix

## Problem
The grocery page (`/grocery`) was being cached by the browser and service worker, causing users to see stale content even after normal refresh. Hard refresh (Ctrl+Shift+R / Cmd+Shift+R) showed the current version.

## Root Causes
1. **Service Worker Caching**: The service worker was caching all page requests, including dynamic pages like `/grocery`
2. **Missing Cache Headers**: The grocery route was not included in Next.js headers configuration
3. **Missing Middleware Rules**: The middleware was not setting no-cache headers for `/grocery`

## Solutions Applied

### 1. Updated Service Worker (`public/service-worker.js`)
- Added exclusions for dynamic pages: `/order`, `/grocery`, `/admin`, `/checkout`
- These pages now bypass the service worker cache and always fetch fresh from network
- Updated cache version from `v1` to `v2` to force existing service workers to update

### 2. Updated Next.js Headers Config (`next.config.js`)
- Added `/grocery` and `/grocery/:path*` routes with no-cache headers:
  - `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0`
  - `Pragma: no-cache`
  - `Expires: 0`
  - `Surrogate-Control: no-store` (for CDN/proxy caching)

### 3. Updated Middleware (`middleware.ts`)
- Added `/grocery` to the list of paths that receive no-cache headers
- Added `Surrogate-Control: no-store` header for proxy/CDN caching

## Deployment Notes

After deploying these changes:

1. **Service Worker Update**: Users with existing service workers will need to:
   - Hard refresh once (Ctrl+Shift+R / Cmd+Shift+R) to get the new service worker
   - Or wait for the service worker to auto-update (within 24 hours typically)

2. **Clear Browser Cache** (if needed on VPS):
   ```bash
   # The changes are in code, but if you need to clear server-side caches:
   # Restart Next.js app (if using PM2):
   pm2 restart alessa-ordering
   ```

3. **Verify Nginx** (if using reverse proxy):
   - Nginx should pass through the cache-control headers from Next.js
   - If Nginx has its own caching, ensure `/grocery` is excluded

## Testing

1. Navigate to `/grocery`
2. Make a change to a grocery item (e.g., change price or availability)
3. Refresh the page (normal refresh, not hard refresh)
4. The change should appear immediately

## Files Changed
- `public/service-worker.js` - Added grocery exclusion, updated cache version
- `next.config.js` - Added grocery headers configuration
- `middleware.ts` - Added grocery to no-cache paths
- `app/grocery/page.tsx` - Already had proper dynamic config
- `components/grocery/GroceryPageClient.tsx` - Removed unnecessary router.refresh()

## Related Issues
- Similar fixes may be needed for other dynamic pages
- The service worker now properly excludes all dynamic pages from caching


