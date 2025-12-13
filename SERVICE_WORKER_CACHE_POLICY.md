# Service Worker Cache Policy

## ✅ PERMANENT FIX DEPLOYED

The service worker now correctly handles dynamic vs static content caching.

## Cache Strategy

### Pages That Are NEVER Cached (Always Fresh)
These pages bypass the service worker and always fetch from network:

- `/order` - Customer menu page
- `/admin` - Admin dashboard
- `/checkout` - Checkout page
- `/api/*` - All API endpoints

**Why?** These pages need real-time data. Backend changes must appear immediately on refresh.

### Pages That ARE Cached (For Offline Support)
- `/` - Landing page
- `/offline.html` - Offline fallback
- `/manifest.json` - PWA manifest
- Static assets (`/_next/static/*`)

## How It Works

```javascript
// In public/service-worker.js

// Skip dynamic pages that need fresh data
const url = new URL(event.request.url);
if (url.pathname.startsWith('/order') ||
    url.pathname.startsWith('/admin') ||
    url.pathname.startsWith('/checkout')) {
  return; // Always fetch fresh from network
}
```

## Cache Version Management

Current version: `alessa-ordering-v2-no-order-cache`

**When to bump version:**
- When you need to force all clients to update their cached files
- When changing what gets cached vs not cached
- When fixing cache-related bugs

**How to bump:**
1. Change `CACHE_NAME` in `public/service-worker.js`
2. Use descriptive names like `v3-new-feature-name`
3. Deploy and restart app
4. Old caches auto-delete on activate

## Testing Cache Behavior

### Test Fresh Data (No Cache)
```bash
# Should see no-cache headers
curl -I https://lasreinas.alessacloud.com/order | grep -i cache
# Output: cache-control: no-store, no-cache, must-revalidate...
```

### Test Service Worker Update
1. Change something in admin → Save
2. Go to /order page
3. Do normal refresh (Cmd+R)
4. Changes should appear immediately ✅

## For New Developers

**IMPORTANT:** If adding new dynamic pages that need fresh data:

1. Add them to service worker skip list in `public/service-worker.js`
2. Add them to middleware cache headers in `middleware.ts`
3. Add `revalidatePath()` to relevant API endpoints
4. Set page config: `export const dynamic = 'force-dynamic'`

Example:
```javascript
// In service worker
if (url.pathname.startsWith('/my-new-page')) {
  return; // Skip cache
}

// In middleware
if (url.pathname.startsWith('/my-new-page')) {
  response.headers.set('Cache-Control', 'no-store...');
}
```

## Troubleshooting

**Q: Changes still not appearing on refresh?**
1. Check browser DevTools → Application → Service Workers
2. Click "Unregister" to force fresh install
3. Hard refresh once (Cmd+Shift+R)
4. Normal refresh should work after that

**Q: How to force service worker update?**
1. Bump `CACHE_NAME` version
2. Deploy to production
3. Next visit will update service worker automatically

**Q: How to completely disable service worker?**
Don't do this! PWA features depend on it. Instead, add pages to skip list.
