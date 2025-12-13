"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Clock, DollarSign, Users, TrendingUp, AlertCircle } from 'lucide-react';

interface OrderingDashboardData {
  product: {
    id: string;
    name: string;
    slug: string;
  };
  metrics: {
    totalTenants: number;
    activeSubscriptions: number;
    totalOrders: number;
    totalRevenue: number;
    mrr: number;
  };
  tenants: Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
    contactEmail: string | null;
    contactPhone: string | null;
    subscription: {
      status: string;
      subscribedAt: string;
      expiresAt: string | null;
      trialEndsAt: string | null;
      daysUntilExpiry: number | null;
    } | null;
    monthlyFee: number;
    stats: {
      orders: number;
      menuItems: number;
      customers: number;
    };
    lastActivity: string | null;
    recentNotes: number;
  }>;
  upcomingExpirations: Array<{
    tenantId: string;
    tenantName: string;
    tenantSlug: string;
    expiresAt: string;
    daysUntilExpiry: number;
  }>;
}

export default function OrderingDashboardClient() {
  const [data, setData] = useState<OrderingDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tenants' | 'crm' | 'calendar'>('overview');

  useEffect(() => {
    fetch('/api/super/ordering/dashboard')
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error loading dashboard:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-600">Failed to load dashboard data</p>
      </div>
    );
  }

  const selectedTenantData = data.tenants.find((t) => t.id === selectedTenant);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{data.product.name}</h1>
              <p className="mt-1 text-sm text-gray-600">Manage all ordering system tenants and operations</p>
            </div>
            <Link
              href="/super-admin"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'tenants', label: 'Tenants' },
              { id: 'crm', label: 'CRM' },
              { id: 'calendar', label: 'Calendar' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Metrics */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm text-gray-500">Total Tenants</p>
                    <p className="mt-1 text-3xl font-bold text-gray-900">{data.metrics.totalTenants}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm text-gray-500">Active Subscriptions</p>
                    <p className="mt-1 text-3xl font-bold text-gray-900">{data.metrics.activeSubscriptions}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm text-gray-500">MRR</p>
                    <p className="mt-1 text-3xl font-bold text-gray-900">${data.metrics.mrr.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm text-gray-500">Total Orders</p>
                    <p className="mt-1 text-3xl font-bold text-gray-900">{data.metrics.totalOrders.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-indigo-600" />
                  <div className="ml-4">
                    <p className="text-sm text-gray-500">Total Revenue</p>
                    <p className="mt-1 text-3xl font-bold text-gray-900">
                      ${data.metrics.totalRevenue.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Expirations */}
            {data.upcomingExpirations.length > 0 && (
              <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-6">
                <div className="flex items-center mb-4">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Upcoming Expirations (Next 90 Days)</h3>
                </div>
                <div className="space-y-2">
                  {data.upcomingExpirations.map((exp) => (
                    <div key={exp.tenantId} className="flex items-center justify-between bg-white rounded-lg p-3">
                      <div>
                        <p className="font-semibold text-gray-900">{exp.tenantName}</p>
                        <p className="text-sm text-gray-600">
                          Expires: {new Date(exp.expiresAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          exp.daysUntilExpiry <= 30
                            ? 'bg-red-100 text-red-700'
                            : exp.daysUntilExpiry <= 60
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {exp.daysUntilExpiry} days
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tenants Tab */}
        {activeTab === 'tenants' && (
          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">All Tenants</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {data.tenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedTenant(tenant.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">{tenant.name}</h3>
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          tenant.status === 'LIVE'
                            ? 'bg-green-100 text-green-700'
                            : tenant.status === 'PENDING_REVIEW'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {tenant.status}
                        </span>
                        {tenant.subscription && (
                          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            tenant.subscription.status === 'prepaid'
                              ? 'bg-blue-100 text-blue-700'
                              : tenant.subscription.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {tenant.subscription.status.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 grid grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-semibold">{tenant.stats.orders}</span> orders
                        </div>
                        <div>
                          <span className="font-semibold">{tenant.stats.menuItems}</span> menu items
                        </div>
                        <div>
                          <span className="font-semibold">{tenant.stats.customers}</span> customers
                        </div>
                        <div>
                          ${tenant.monthlyFee}/mo
                        </div>
                      </div>
                      {tenant.subscription?.expiresAt && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600">
                            Expires: {new Date(tenant.subscription.expiresAt).toLocaleDateString()}
                            {tenant.subscription.daysUntilExpiry !== null && (
                              <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
                                tenant.subscription.daysUntilExpiry <= 30
                                  ? 'bg-red-100 text-red-700'
                                  : tenant.subscription.daysUntilExpiry <= 90
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {tenant.subscription.daysUntilExpiry} days remaining
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                      <div className="mt-2 flex gap-4 text-xs">
                        <Link
                          href={`https://${tenant.slug}.alessacloud.com/order`}
                          target="_blank"
                          className="text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View Storefront →
                        </Link>
                        <Link
                          href={`/admin?tenant=${tenant.slug}`}
                          className="text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Admin Dashboard →
                        </Link>
                        {tenant.contactEmail && (
                          <a
                            href={`mailto:${tenant.contactEmail}`}
                            className="text-blue-600 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Email →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CRM Tab */}
        {activeTab === 'crm' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">CRM Overview</h3>
              <p className="text-gray-600">CRM features coming soon. This will show activities and notes per tenant.</p>
            </div>
          </div>
        )}

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Service Checkup Calendar</h3>
              <p className="text-gray-600">Calendar view coming soon. This will show scheduled service checkups.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

