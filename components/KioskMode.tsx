'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

/**
 * KioskMode component - Keeps screen awake and maintains session
 *
 * For NATIVE iOS (Capacitor from TestFlight):
 * - Screen stays awake automatically (AppDelegate.swift has isIdleTimerDisabled = true)
 * - App loads directly to /admin/fulfillment
 * - Use iPad Guided Access for extra lockdown (Settings > Accessibility > Guided Access)
 *
 * For WEB/PWA:
 * - Uses Wake Lock API to prevent sleep
 * - Works in conjunction with iPad Settings > Display & Brightness > Auto-Lock > Never
 *
 * Also handles Capacitor splash screen hiding when content is ready.
 */

// Export for use in other components
export function useIsNativeApp(): boolean {
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const capacitor = (window as any).Capacitor;
      setIsNative(!!capacitor?.isNativePlatform?.());
    }
  }, []);

  return isNative;
}

// Hook to get kiosk mode status and controls
export function useKioskStatus() {
  const isNative = useIsNativeApp();
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [wakeLockRef, setWakeLockRef] = useState<any>(null);

  const requestWakeLock = useCallback(async () => {
    if (typeof window === 'undefined') return false;

    // Native app already has screen wake lock via AppDelegate
    if (isNative) {
      setWakeLockActive(true);
      return true;
    }

    // Web: use Wake Lock API
    if ('wakeLock' in navigator) {
      try {
        const lock = await (navigator as any).wakeLock.request('screen');
        setWakeLockRef(lock);
        setWakeLockActive(true);
        console.log('[Kiosk] Wake lock acquired');
        return true;
      } catch (err) {
        console.warn('[Kiosk] Wake lock not available:', err);
        return false;
      }
    }
    return false;
  }, [isNative]);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef) {
      try {
        await wakeLockRef.release();
        setWakeLockRef(null);
        setWakeLockActive(false);
        console.log('[Kiosk] Wake lock released');
      } catch (err) {
        console.warn('[Kiosk] Failed to release wake lock:', err);
      }
    }
  }, [wakeLockRef]);

  return {
    isNative,
    wakeLockActive,
    requestWakeLock,
    releaseWakeLock,
  };
}

export default function KioskMode() {
  const { data: session, status } = useSession();
  const isNative = useIsNativeApp();

  // Hide Capacitor splash screen when the app is ready
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if we're running in a Capacitor native app
      const capacitor = (window as any).Capacitor;
      const isCapacitorNative = capacitor?.isNativePlatform?.();

      if (isCapacitorNative) {
        console.log('[KioskMode] Running in native Capacitor app');

        // Dynamically import and hide splash screen
        import('@capacitor/splash-screen')
          .then(({ SplashScreen }) => {
            // Small delay to ensure the page content is rendered
            setTimeout(() => {
              SplashScreen.hide().catch((err: Error) => {
                console.log('[KioskMode] Splash screen hide error (safe to ignore):', err.message);
              });
            }, 500);
          })
          .catch(() => {
            // SplashScreen plugin not available - that's fine
            console.log('[KioskMode] SplashScreen plugin not available');
          });

        // Log native kiosk mode status
        console.log('[KioskMode] Native kiosk features:');
        console.log('  - Screen wake lock: ENABLED (via AppDelegate)');
        console.log('  - Auto-loads fulfillment dashboard');
        console.log('  - Bluetooth printing: AVAILABLE');
      }
    }
  }, []);

  // Request Wake Lock for web browsers
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Native app already has screen wake lock via AppDelegate.swift
    // This is only needed for web/PWA
    if (isNative) {
      console.log('[KioskMode] Native app - using iOS idle timer disabled');
      return;
    }

    let wakeLock: any = null;

    // Prevent screen sleep using Wake Lock API
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator) {
        try {
          wakeLock = await (navigator as any).wakeLock.request('screen');
          console.log('[KioskMode] Web wake lock acquired');

          wakeLock.addEventListener('release', () => {
            console.log('[KioskMode] Wake lock released');
          });
        } catch (err: any) {
          console.log('[KioskMode] Wake lock not available:', err.message);
        }
      }
    };

    // Request wake lock on mount
    requestWakeLock();

    // Re-request wake lock when page becomes visible (it gets released when hidden)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
    };
  }, [isNative]);

  // Keep-alive ping to prevent session timeout
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const keepAliveInterval = setInterval(() => {
      // Refresh session every 5 minutes to keep it alive
      if (status === 'authenticated' && session) {
        fetch('/api/auth/session', { method: 'GET', cache: 'no-store' }).catch(() => {
          // Silent fail - session refresh is optional
        });
      }
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(keepAliveInterval);
  }, [session, status]);

  // This component doesn't render anything
  return null;
}

