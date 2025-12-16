'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import AdminDashboardHome from './AdminDashboardHome';
import type { Tenant } from '@prisma/client';

interface Props {
  tenant: Tenant & {
    integrations: any;
  };
  stripeStatus: {
    connected: boolean;
    accountId: string | null;
  };
  doordashStatus: {
    connected: boolean;
    storeId: string | null;
  };
  menuItemCount: number;
  orderStats: {
    totalOrders: number;
    totalRevenue: number;
  };
  recentOrders: Array<{
    id: string;
    createdAt: Date;
    status: string;
    totalAmount: number;
    customerName: string;
  }>;
}

/**
 * Client wrapper for admin page that handles authentication
 * and prevents server-side redirects that could open Safari
 */
export default function AdminPageClient({
  tenant,
  stripeStatus,
  doordashStatus,
  menuItemCount,
  orderStats,
  recentOrders,
}: Props) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Wait for session to load
    if (status === 'loading') return;

    const role = (session?.user as { role?: string; tenantSlug?: string } | undefined)?.role;
    const tenantSlug = (session?.user as { tenantSlug?: string } | undefined)?.tenantSlug;

    // Check if we're in a Capacitor app
    const isCapacitor = typeof window !== 'undefined' && !!(window as any).Capacitor;

    // If not authenticated, redirect to login (client-side to stay in app)
    if (!session) {
      router.push('/admin/login');
      return;
    }

    // Super admin redirect (client-side to stay in app)
    if (role === 'super_admin') {
      router.push('/super-admin');
      return;
    }

    // Check if we're on root domain and need to redirect
    // In Capacitor, the app should already be configured to load from the correct subdomain
    // So we only need to handle this on web browsers
    if (!isCapacitor) {
      const host = window.location.hostname;
      const ROOT_DOMAIN = 'alessacloud.com';
      
      if ((host === ROOT_DOMAIN || host === `www.${ROOT_DOMAIN}`) && tenantSlug) {
        // On root domain with tenant - redirect to subdomain
        // This will only happen on web browsers, not in Capacitor
        window.location.href = `https://${tenantSlug}.alessacloud.com/admin`;
        return;
      }

      if (host === ROOT_DOMAIN || host === `www.${ROOT_DOMAIN}`) {
        // On root domain without tenant - redirect to login
        router.push('/admin/login');
        return;
      }
    }

    // Check role
    if (role !== 'admin' && role !== 'super_admin') {
      router.push('/');
      return;
    }
  }, [session, status, router]);

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

  const role = (session?.user as { role?: string; tenantSlug?: string } | undefined)?.role;

  // Don't render dashboard if not authenticated or wrong role (redirect is in progress)
  if (!session || (role !== 'admin' && role !== 'super_admin')) {
    return null;
  }

  return (
    <AdminDashboardHome
      tenant={tenant}
      stripeStatus={stripeStatus}
      doordashStatus={doordashStatus}
      menuItemCount={menuItemCount}
      orderStats={orderStats}
      recentOrders={recentOrders}
    />
  );
}

