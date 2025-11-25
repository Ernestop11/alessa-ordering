'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import DashboardLayout from './DashboardLayout';
import DoorDashConnectButton from './DoorDashConnectButton';

interface DoorDashPageProps {
  tenant: {
    id: string;
    slug: string;
    integrations?: {
      doorDashStoreId: string | null;
      paymentConfig?: any;
    } | null;
  };
}

export default function DoorDashPage({ tenant }: DoorDashPageProps) {

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/admin" className="text-gray-500 hover:text-gray-700">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">DoorDash Connect</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* DoorDash Connection */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">DoorDash Drive Integration</h2>
            <DoorDashConnectButton />
          </div>

          {/* Info Card */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">Demo Mode</h2>
            <p className="text-sm text-blue-700">
              DoorDash integration is currently in demo mode. Test buttons are available in the connection card above.
              Use the "Test $7.99 Quote" button to simulate delivery quotes and "Test Webhook" to verify integration connectivity.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

