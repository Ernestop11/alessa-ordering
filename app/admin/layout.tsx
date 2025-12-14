'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFulfillmentPage = pathname?.includes('/admin/fulfillment');

  useEffect(() => {
    // One-time cache clear for admin pages
    const cacheCleared = sessionStorage.getItem('admin-cache-cleared-v3');
    if (!cacheCleared && 'caches' in window) {
      caches.keys().then((names) => {
        // Delete all old cache versions
        Promise.all(
          names
            .filter((name) => name.startsWith('alessa-ordering') && !name.includes('v3-2025-12-13'))
            .map((name) => {
              console.log('[Cache] Deleting old cache:', name);
              return caches.delete(name);
            })
        ).then(() => {
          sessionStorage.setItem('admin-cache-cleared-v3', 'true');
          console.log('[Cache] Old caches cleared successfully');
        });
      });
    }
  }, []);

  useEffect(() => {
    // Register service worker for PWA support and force update
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('[SW] Service Worker registered:', registration.scope);

          // Force service worker to update immediately
          registration.update().then(() => {
            console.log('[SW] Service Worker update check completed');
          });

          // Listen for service worker updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'activated') {
                  console.log('[SW] New service worker activated - reloading page');
                  // Reload to get fresh content
                  window.location.reload();
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('[SW] Service Worker registration failed:', error);
        });

      // Listen for cache update messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'CACHE_UPDATED' && event.data?.action === 'reload') {
          console.log('[SW] Cache updated - reloading page');
          window.location.reload();
        }
      });
    }

    // Add fulfillment-specific manifest if on fulfillment page
    if (isFulfillmentPage) {
      let link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'manifest';
        document.head.appendChild(link);
      }
      link.href = '/admin/fulfillment/manifest';
    }
  }, [isFulfillmentPage]);

  return <>{children}</>;
}
