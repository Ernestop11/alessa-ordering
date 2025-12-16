'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import FulfillmentDashboard from './FulfillmentDashboard';
import type { FulfillmentOrder } from './types';

interface Props {
  initialOrders: FulfillmentOrder[];
  feedUrl: string;
  scope: 'tenant' | 'platform';
}

/**
 * Client wrapper for fulfillment page that handles authentication
 * and prevents server-side redirects that could open Safari
 */
export default function FulfillmentPageClient({ initialOrders, feedUrl, scope }: Props) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Wait for session to load
    if (status === 'loading') return;

    const role = (session?.user as { role?: string } | undefined)?.role;
    
    // Check if we're in a Capacitor app
    const isCapacitor = typeof window !== 'undefined' && !!(window as any).Capacitor;

    // If not authenticated, redirect to login (client-side to stay in app)
    if (!session || (scope === 'tenant' && role !== 'admin') || (scope === 'platform' && role !== 'super_admin')) {
      const returnTo = window.location.pathname + window.location.search;
      // Use client-side navigation to stay in Capacitor WebView
      router.push(`/admin/login?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }
  }, [session, status, router, scope]);

  // Show loading state while checking auth
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const role = (session?.user as { role?: string } | undefined)?.role;
  
  // Don't render dashboard if not authenticated (redirect is in progress)
  if (!session || (scope === 'tenant' && role !== 'admin') || (scope === 'platform' && role !== 'super_admin')) {
    return null;
  }

  return (
    <FulfillmentDashboard
      initialOrders={initialOrders}
      feedUrl={feedUrl}
      scope={scope}
    />
  );
}

