'use client';

import Link from 'next/link';
import { CheckCircle2, XCircle, CreditCard, Truck, Package, Settings, Menu, BarChart3, ChefHat } from 'lucide-react';
import DashboardLayout from './DashboardLayout';

interface AdminDashboardHomeProps {
  tenant: {
    id: string;
    name: string;
    slug: string;
    domain: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    addressLine1: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    logoUrl?: string | null;
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

export default function AdminDashboardHome({
  tenant,
  stripeStatus,
  doordashStatus,
  menuItemCount,
  orderStats,
  recentOrders,
}: AdminDashboardHomeProps) {
  const onboardingSteps = [
    { label: 'Connect Stripe for payments', completed: stripeStatus.connected, link: '/admin/payments' },
    { label: 'Add menu items', completed: menuItemCount > 0, link: '/admin/menu' },
    { label: 'Configure business hours', completed: tenant.contactPhone !== null, link: '/admin/settings' },
  ];
  const completedSteps = onboardingSteps.filter(s => s.completed).length;
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {tenant.logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={tenant.logoUrl}
                    alt={`${tenant.name} logo`}
                    className="h-12 w-12 rounded-lg object-contain"
                  />
                )}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{tenant.name}</h1>
                  <p className="mt-1 text-sm text-gray-500">
                    {tenant.addressLine1 && `${tenant.addressLine1}, `}
                    {tenant.city && `${tenant.city}, `}
                    {tenant.state} {tenant.postalCode}
                  </p>
                </div>
              </div>
              <Link
                href="/admin/settings"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Onboarding Checklist */}
          {completedSteps < onboardingSteps.length && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-blue-900">Getting Started</h2>
                  <p className="text-sm text-blue-700 mt-1">
                    Complete these steps to start accepting orders
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                  {completedSteps} / {onboardingSteps.length}
                </span>
              </div>
              <div className="space-y-3">
                {onboardingSteps.map((step, index) => (
                  <div key={index} className="flex items-center gap-3">
                    {step.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                    )}
                    <span className={`text-sm ${step.completed ? 'text-gray-500 line-through' : 'text-gray-900 font-medium'}`}>
                      {step.label}
                    </span>
                    {!step.completed && (
                      <Link
                        href={step.link}
                        className="ml-auto text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Complete →
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{orderStats.totalOrders}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${orderStats.totalRevenue.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                  <Truck className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Recent Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{recentOrders.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Integration Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Stripe Status Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
                  Stripe Connect
                </h2>
                {stripeStatus.connected ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <XCircle className="h-3 w-3 mr-1" />
                    Not Connected
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-4">
                {stripeStatus.connected
                  ? 'Your Stripe account is connected and ready to accept payments.'
                  : 'Connect your Stripe account to start accepting payments.'}
              </p>
              <Link
                href="/admin/payments"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                {stripeStatus.connected ? 'Manage Stripe' : 'Connect Stripe'}
              </Link>
            </div>

            {/* DoorDash Status Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Truck className="h-5 w-5 mr-2 text-orange-600" />
                  DoorDash Connect
                </h2>
                {doordashStatus.connected ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Demo Mode
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Connect your DoorDash Drive account for delivery quotes and courier dispatch.
              </p>
              <Link
                href="/admin/doordash"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700"
              >
                {doordashStatus.connected ? 'Manage DoorDash' : 'Begin DoorDash Setup (Demo)'}
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link
                href="/admin/menu"
                className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <Menu className="h-6 w-6 text-gray-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Open Menu Editor</p>
                  <p className="text-sm text-gray-500">Manage sections and items</p>
                </div>
              </Link>

              <Link
                href="/admin/fulfillment"
                className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
              >
                <Package className="h-6 w-6 text-gray-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Open Fulfillment Dashboard</p>
                  <p className="text-sm text-gray-500">Manage orders and delivery</p>
                </div>
              </Link>

              <Link
                href="/admin/settings"
                className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
              >
                <Settings className="h-6 w-6 text-gray-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Business Settings</p>
                  <p className="text-sm text-gray-500">Update hours, contact info</p>
                </div>
              </Link>

              <Link
                href="/admin/catering-tab"
                className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
              >
                <ChefHat className="h-6 w-6 text-gray-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Catering Tab Settings</p>
                  <p className="text-sm text-gray-500">Configure catering button</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        No orders yet
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.id.slice(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.customerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${order.totalAmount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

