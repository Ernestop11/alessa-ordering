"use client";

import Link from 'next/link';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from './DashboardLayout';
import OrderList from './OrderList';
import MenuEditor from './MenuEditor';
import Settings from './Settings';
import MenuSectionsManager from './MenuSectionsManager';
import CustomerList from './CustomerList';
import IntegrationLogs from './IntegrationLogs';
import CateringManager from './CateringManager';
import BundlesManager from './BundlesManager';
import SubscriptionStatus from './SubscriptionStatus';
// import CustomizeTab from './CustomizeTab'; // Not needed for tenant admin
import { signOut } from 'next-auth/react';

type Tab = 'orders' | 'customers' | 'logs' | 'sections' | 'menu' | 'catering' | 'bundles' | 'customize' | 'settings';

function AdminDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams?.get('tab') as Tab | null;
  
  // Initialize tab from URL or default to 'orders'
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    if (tabFromUrl && ['orders', 'customers', 'logs', 'sections', 'menu', 'catering', 'bundles', 'customize', 'settings'].includes(tabFromUrl)) {
      return tabFromUrl;
    }
    return 'orders';
  });

  // Sync tab state with URL
  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl, activeTab]);

  // Update URL when tab changes (without page reload)
  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('tab', tab);
    router.push(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  // Prevent browser refresh confirmation dialogs
  // We intentionally don't add beforeunload handler to allow free refresh

  const renderContent = () => {
    switch (activeTab) {
      case 'orders':
        return <OrderList />;
      case 'customers':
        return <CustomerList />;
      case 'logs':
        return <IntegrationLogs />;
      case 'sections':
        return <MenuSectionsManager />;
      case 'menu':
        return <MenuEditor />;
      case 'catering':
        return <CateringManager />;
      case 'bundles':
        return <BundlesManager />;
      case 'customize':
        return <div className="p-6">Customize feature coming soon</div>;
      case 'settings':
        return <Settings />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="text-xl font-bold text-gray-800">Restaurant Dashboard</h1>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  {[
                    { key: 'orders', label: 'Orders' },
                    { key: 'customers', label: 'Customers' },
                    { key: 'sections', label: 'Sections' },
                    { key: 'menu', label: 'Menu Items' },
                    { key: 'catering', label: 'Catering' },
                    { key: 'bundles', label: 'Bundles' },
                    { key: 'customize', label: 'Customize' },
                    { key: 'settings', label: 'Settings' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => handleTabChange(tab.key as Tab)}
                      className={`${
                        activeTab === tab.key
                          ? 'border-blue-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors`}
                      aria-current={activeTab === tab.key ? 'page' : undefined}
                    >
                      {tab.label}
                    </button>
                  ))}
                  <Link
                    href="/admin/fulfillment"
                    className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700 transition hover:border-blue-400 hover:bg-blue-100"
                  >
                    Fulfillment Board
                  </Link>
                </div>
              </div>
              <div className="flex items-center">
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <SubscriptionStatus />
          {renderContent()}
        </main>
      </div>
    </DashboardLayout>
  );
}

export default function AdminDashboardClient() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    }>
      <AdminDashboardContent />
    </Suspense>
  );
}
