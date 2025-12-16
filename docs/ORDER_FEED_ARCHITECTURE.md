# Order Feed Architecture - Real-Time Order Sync

This document describes the working architecture for real-time order synchronization in the Alessa Ordering fulfillment dashboard.

## Overview

The order feed system uses a dual-channel approach for maximum reliability:
1. **Server-Sent Events (SSE)** - Primary real-time channel
2. **Polling Fallback** - Aggressive 2-second polling for PWA/iPad reliability

## Key Components

### 1. useOrderFeed Hook (`components/fulfillment/useOrderFeed.tsx`)

The core hook that manages order state and real-time updates.

```typescript
const { orders, connected, newOrderCount, ackNewOrders, lastCreatedOrder } = useOrderFeed({
  feedUrl: '/api/admin/fulfillment/stream?tenant=lasreinas',
  initialOrders,
});
```

**Critical Implementation Details:**

- **EventSource** for SSE stream connection
- **Polling Fallback** every 2 seconds with proper URL construction:
  ```typescript
  const baseUrl = feedUrl.replace('/stream', '');
  const separator = baseUrl.includes('?') ? '&' : '?';
  const pollUrl = `${baseUrl}${separator}t=${Date.now()}`;
  const response = await fetch(pollUrl, { credentials: 'include' });
  ```

- **Credentials**: Always use `credentials: 'include'` to send auth cookies
- **URL Construction**: Use proper `&` vs `?` separator to avoid double `?` issues

### 2. SSE Stream Endpoint (`app/api/admin/fulfillment/stream/route.ts`)

Server-side SSE implementation that:
- Authenticates admin users via session
- Subscribes to order events via `subscribeToOrders()`
- Sends `init` event with all orders on connect
- Sends `order.created` and `order.updated` events in real-time

### 3. Polling Endpoint (`app/api/admin/fulfillment/route.ts`)

REST endpoint that returns current orders as JSON array for polling fallback.

### 4. Cache Busting (`app/layout.tsx`)

Critical for PWA/mobile: Force cache clear on version updates.

```typescript
const cacheCleanupScript = `
  (function() {
    var cleared = sessionStorage.getItem('sw-cleared-v7');
    if (!cleared && 'serviceWorker' in navigator) {
      // Clear all caches - AGGRESSIVE: delete everything
      if ('caches' in window) {
        caches.keys().then(function(names) {
          names.forEach(function(name) {
            caches.delete(name);
          });
        });
      }
      sessionStorage.setItem('sw-cleared-v7', 'true');
    }
  })();
`;
```

**IMPORTANT**: Increment version (e.g., `v7` → `v8`) when deploying JavaScript changes to force cache refresh on mobile devices.

## Troubleshooting

### Orders Not Appearing on Mobile

1. **Check nginx logs** for 200 responses with data
2. **Verify polling URL** doesn't have double `?` (should be `?tenant=x&t=123`)
3. **Bump cache version** in layout.tsx and redeploy
4. **Hard refresh** on device (close browser completely, reopen)

### EventSource Not Working (iPad/PWA)

This is expected - iOS Safari PWA has SSE issues. The polling fallback handles this automatically.

### Authentication Errors (401)

Ensure `credentials: 'include'` is used in fetch calls for polling.

## Deployment Checklist

1. Commit changes to git
2. Push to origin
3. SSH to VPS: `ssh root@77.243.85.8`
4. Pull and build:
   ```bash
   cd /var/www/alessa-ordering
   git pull origin main
   npm run build
   pm2 restart alessa-ordering
   ```
5. Test on mobile device (close/reopen browser to clear cache)

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         Client (Browser/PWA)                     │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   useOrderFeed Hook                                              │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                         │   │
│   │   EventSource ──────────────────────┐                   │   │
│   │   (SSE Primary)                     │                   │   │
│   │                                     ▼                   │   │
│   │                              ┌─────────────┐            │   │
│   │                              │   orders    │            │   │
│   │   Polling ──────────────────►│   state     │            │   │
│   │   (2s Fallback)              │             │            │   │
│   │                              └─────────────┘            │   │
│   │                                                         │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                         Server (Next.js)                         │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   /api/admin/fulfillment/stream (SSE)                           │
│   ├── Authentication check                                       │
│   ├── Subscribe to order events                                  │
│   └── Stream events to client                                    │
│                                                                  │
│   /api/admin/fulfillment (REST)                                  │
│   ├── Authentication check                                       │
│   └── Return orders as JSON                                      │
│                                                                  │
│   Order Event Bus (lib/order-events.ts)                          │
│   └── Broadcasts order.created/order.updated                     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Version History

- **v7** (2025-12-15): Fixed polling URL construction, aggressive cache clearing
- **v6** (2025-12-14): Added SSE + polling dual approach
