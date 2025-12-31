/**
 * Service Worker for Alessa Ordering PWA
 * Provides offline support and caching
 */

const CACHE_NAME = 'alessa-ordering-v22-2025-12-30';
const OFFLINE_PAGE = '/offline.html';

// Install event - cache only truly static files (NOT dynamic pages like /)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/offline.html',
        '/manifest.json',
        '/icon-192.png',
        '/icon-512.png',
      ]);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches and force refresh
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      // Force all clients to reload with fresh cache
      return self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'CACHE_UPDATED', action: 'reload' });
        });
      });
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension URLs (can't be cached)
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  // Skip API requests (always use network) - CRITICAL for real-time updates
  if (event.request.url.includes('/api/')) {
    return;
  }

  // Skip dynamic pages that should never be cached (always use network)
  const url = new URL(event.request.url);
  if (
    url.pathname.startsWith('/order') ||
    url.pathname.startsWith('/grocery') ||
    url.pathname.startsWith('/admin') ||
    url.pathname.startsWith('/checkout') ||
    url.pathname.includes('/_next/static/chunks/pages/admin')
  ) {
    event.respondWith(
      fetch(event.request, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      }).catch(() => {
        // If fetch fails and it's a navigation request, return offline page
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_PAGE);
        }
      })
    );
    return;
  }

  // Skip EventSource/Server-Sent Events (always use network)
  if (event.request.headers.get('Accept')?.includes('text/event-stream')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

          return fetch(event.request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Don't cache chrome-extension URLs
          if (event.request.url.startsWith('chrome-extension://')) {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            try {
              cache.put(event.request, responseToCache);
            } catch (error) {
              // Silently fail if caching fails (e.g., chrome-extension URLs)
              console.warn('Failed to cache:', event.request.url, error);
            }
          });

          return response;
        })
        .catch(() => {
          // If fetch fails and it's a navigation request, return offline page
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_PAGE);
          }
        });
    })
  );
});

// Background sync for offline order submission (future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(
      // TODO: Sync pending orders when back online
      Promise.resolve()
    );
  }
});

// Push notifications (future enhancement)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'New Order';
  const options = {
    body: data.body || 'You have a new order',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'order',
    data: data.data,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/admin/fulfillment')
  );
});
