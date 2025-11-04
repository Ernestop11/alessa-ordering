"use client";

import { useState } from 'react';
import DashboardLayout from './DashboardLayout';
import OrderList from './OrderList';
import MenuEditor from './MenuEditor';
import Settings from './Settings';
import MenuSectionsManager from './MenuSectionsManager';
import CustomerList from './CustomerList';
import IntegrationLogs from './IntegrationLogs';
import { signOut } from 'next-auth/react';

type Tab = 'orders' | 'customers' | 'logs' | 'sections' | 'menu' | 'settings';

export default function AdminDashboardClient() {
  const [activeTab, setActiveTab] = useState<Tab>('orders');

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
                    { key: 'logs', label: 'Integration Logs' },
                    { key: 'sections', label: 'Menu Sections' },
                    { key: 'menu', label: 'Menu' },
                    { key: 'settings', label: 'Settings' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as Tab)}
                      className={`${
                        activeTab === tab.key
                          ? 'border-blue-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                    >
                      {tab.label}
                    </button>
                  ))}
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
          {renderContent()}
        </main>
      </div>
    </DashboardLayout>
  );
}
