'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFulfillmentPage = pathname?.includes('/admin/fulfillment');

  useEffect(() => {
    // Register service worker for PWA support
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('[SW] Service Worker registered:', registration.scope);
        })
        .catch((error) => {
          console.error('[SW] Service Worker registration failed:', error);
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
