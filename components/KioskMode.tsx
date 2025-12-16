'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

/**
 * KioskMode component - Keeps screen awake and maintains session
 * For iOS, this works in conjunction with:
 * 1. iPad Settings > Display & Brightness > Auto-Lock > Never
 * 2. Guided Access mode (triple-click home button)
 */
export default function KioskMode() {
  const { data: session, status } = useSession();

  useEffect(() => {
    // Keep screen awake using NoSleep API (works in WebView)
    let noSleep: any = null;
    
    // Try to use NoSleep.js if available (for web)
    if (typeof window !== 'undefined') {
      // For Capacitor iOS, the native AppDelegate already handles isIdleTimerDisabled
      // This is a fallback for web version
      
      // Prevent screen sleep using visibility API and wake lock (if available)
      const preventSleep = () => {
        // Use Wake Lock API if available (modern browsers)
        if ('wakeLock' in navigator) {
          (navigator as any).wakeLock.request('screen').catch((err: Error) => {
            console.log('Wake Lock not available:', err);
          });
        }
      };

      // Request wake lock on mount
      preventSleep();

      // Re-request wake lock when page becomes visible
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          preventSleep();
        }
      });

      // Keep-alive ping to prevent session timeout
      const keepAliveInterval = setInterval(() => {
        // Refresh session every 5 minutes to keep it alive
        if (status === 'authenticated' && session) {
          // Session refresh is handled by NextAuth automatically
          // This just ensures the page stays active
          fetch('/api/auth/session', { method: 'GET', cache: 'no-store' }).catch(() => {
            // Silent fail - session refresh is optional
          });
        }
      }, 5 * 60 * 1000); // Every 5 minutes

      return () => {
        clearInterval(keepAliveInterval);
        if (noSleep) {
          noSleep.disable();
        }
      };
    }
  }, [session, status]);

  // This component doesn't render anything
  return null;
}

