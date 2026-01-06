'use client';

import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Users,
  DollarSign,
  TrendingDown,
  RefreshCw,
  Phone,
  Mail,
  Clock,
  ShoppingCart,
  AlertOctagon,
  Activity,
  Copy,
  ExternalLink,
  Send,
  Eye,
  X,
  Loader2,
} from 'lucide-react';

interface AffectedCustomer {
  name: string;
  email: string | null;
  phone: string | null;
  tenantName: string;
  tenantSlug: string;
  attempts: number;
  totalLost: number;
  firstAttempt: string;
  lastAttempt: string;
  items: string[];
}

interface TenantMetric {
  tenantName: string;
  tenantSlug: string;
  pending: number;
  completed: number;
  pendingAmount: number;
  completedAmount: number;
  successRate: number;
  last24hPending: number;
  last24hCompleted: number;
}

interface RecentFailure {
  id: string;
  tenantName: string;
  customerName: string;
  amount: number;
  createdAt: string;
  items: string[];
}

interface ErrorLog {
  id: string;
  tenantName: string;
  source: string;
  message: string;
  createdAt: string;
}

interface RecentOrder {
  id: string;
  tenantName: string;
  customerName: string;
  amount: number;
  status: string;
  createdAt: string;
}

interface DashboardData {
  alertLevel: 'normal' | 'warning' | 'critical';
  lastUpdated: string;
  overall: {
    successRate: number;
    totalPending: number;
    totalCompleted: number;
    pendingAmount: number;
    completedAmount: number;
  };
  last24h: {
    successRate: number;
    pending: number;
    completed: number;
  };
  tenantMetrics: TenantMetric[];
  affectedCustomers: AffectedCustomer[];
  recentFailures: RecentFailure[];
  errorLogs: ErrorLog[];
  recentOrders: RecentOrder[];
}

export default function EmergencyDashboard({ data }: { data: DashboardData }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'customers' | 'failures' | 'logs' | 'email'>('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  // Email modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<TenantMetric | null>(null);
  const [emailPreview, setEmailPreview] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailForm, setEmailForm] = useState({
    recipientEmail: '',
    recipientName: '',
    rootCause: 'A technical issue with our checkout system caused the shopping cart to appear empty when customers tried to complete their orders. This was due to a synchronization problem between our cart storage and checkout page.',
    resolution: 'Our engineering team identified and fixed the issue. The checkout system is now working correctly, and all cart data is properly synchronized.',
    incidentDate: 'December 30, 2025 - January 6, 2026',
  });

  const handleRefresh = () => {
    setRefreshing(true);
    window.location.reload();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(text);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  // Open email modal for a tenant
  const openEmailModal = async (tenant: TenantMetric) => {
    setSelectedTenant(tenant);
    setShowEmailModal(true);
    setEmailPreview(null);
    setEmailSent(false);
    setLoadingPreview(true);

    try {
      // Find tenant ID from the metrics (we need to fetch it)
      const res = await fetch(`/api/super-admin/incidents?tenantId=${encodeURIComponent(tenant.tenantSlug)}&action=preview`);
      if (res.ok) {
        const data = await res.json();
        setEmailPreview(data.emailPreview?.html || null);
        if (data.tenant?.contactEmail) {
          setEmailForm(prev => ({
            ...prev,
            recipientEmail: data.tenant.contactEmail,
            recipientName: data.tenant.name + ' Owner',
          }));
        }
      }
    } catch (err) {
      console.error('Failed to load preview:', err);
    } finally {
      setLoadingPreview(false);
    }
  };

  // Send email
  const handleSendEmail = async () => {
    if (!selectedTenant || !emailForm.recipientEmail) return;

    setSendingEmail(true);
    try {
      const res = await fetch('/api/super-admin/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_tenant_report',
          tenantId: selectedTenant.tenantSlug,
          recipientEmail: emailForm.recipientEmail,
          recipientName: emailForm.recipientName,
          rootCause: emailForm.rootCause,
          resolution: emailForm.resolution,
          incidentDate: emailForm.incidentDate,
          preventionSteps: [
            'Implemented real-time monitoring dashboard for checkout success rates',
            'Added automated alerts when success rate drops below threshold',
            'Created customer contact list for rapid incident response',
            'Enhanced testing procedures for cart and checkout flows',
          ],
        }),
      });

      const result = await res.json();
      if (result.success) {
        setEmailSent(true);
      } else {
        alert('Failed to send email: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  // Send admin alert
  const handleSendAdminAlert = async () => {
    setSendingEmail(true);
    try {
      const res = await fetch('/api/super-admin/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_admin_alert',
          tenantId: data.tenantMetrics[0]?.tenantSlug || 'all',
          failureCount: data.overall.totalPending,
          successRate: data.last24h.successRate,
          timeframe: 'Last 24 hours',
          affectedCustomers: data.affectedCustomers.map(c => ({
            name: c.name,
            email: c.email,
            phone: c.phone,
            attempts: c.attempts,
            totalLost: c.totalLost,
          })),
        }),
      });

      const result = await res.json();
      if (result.success) {
        alert('Admin alert sent successfully!');
      } else {
        alert('Failed to send alert: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Failed to send alert');
    } finally {
      setSendingEmail(false);
    }
  };

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500';
      case 'warning': return 'bg-amber-500';
      default: return 'bg-green-500';
    }
  };

  const getAlertBg = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500/10 border-red-500/30';
      case 'warning': return 'bg-amber-500/10 border-amber-500/30';
      default: return 'bg-green-500/10 border-green-500/30';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A1628] to-[#050A1C] text-white">
      {/* Alert Banner */}
      {data.alertLevel !== 'normal' && (
        <div className={`${data.alertLevel === 'critical' ? 'bg-red-600' : 'bg-amber-600'} px-4 py-3`}>
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <AlertOctagon className="w-6 h-6 animate-pulse" />
            <div className="flex-1">
              <p className="font-bold">
                {data.alertLevel === 'critical' ? 'CRITICAL: ' : 'WARNING: '}
                Checkout Success Rate is {data.last24h.successRate.toFixed(1)}% (Last 24h)
              </p>
              <p className="text-sm opacity-90">
                {data.last24h.pending} failed payment attempts in the last 24 hours
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-white/10 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Activity className="w-7 h-7 text-red-400" />
              Emergency Monitoring Dashboard
            </h1>
            <p className="text-white/60 text-sm mt-1">
              Last updated: {formatDate(data.lastUpdated)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${getAlertBg(data.alertLevel)} border`}>
              <div className={`w-3 h-3 rounded-full ${getAlertColor(data.alertLevel)} animate-pulse`} />
              <span className="font-medium capitalize">{data.alertLevel}</span>
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-1">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'customers', label: `Affected Customers (${data.affectedCustomers.length})`, icon: Users },
              { id: 'failures', label: `Recent Failures (${data.recentFailures.length})`, icon: XCircle },
              { id: 'logs', label: 'Error Logs', icon: AlertTriangle },
              { id: 'email', label: 'Send Reports', icon: Send },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-red-500 text-white'
                    : 'border-transparent text-white/60 hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Success Rate - Last 24h */}
              <div className={`rounded-xl border p-4 ${
                data.last24h.successRate < 50 ? 'bg-red-500/10 border-red-500/30' :
                data.last24h.successRate < 80 ? 'bg-amber-500/10 border-amber-500/30' :
                'bg-green-500/10 border-green-500/30'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/60 text-sm">24h Success Rate</span>
                  {data.last24h.successRate < 80 ? (
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  )}
                </div>
                <p className="text-3xl font-bold">{data.last24h.successRate.toFixed(1)}%</p>
                <p className="text-sm text-white/60 mt-1">
                  {data.last24h.completed} completed / {data.last24h.pending} failed
                </p>
              </div>

              {/* Total Pending */}
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/60 text-sm">Failed Payments (30d)</span>
                  <XCircle className="w-5 h-5 text-red-400" />
                </div>
                <p className="text-3xl font-bold text-red-400">{data.overall.totalPending}</p>
                <p className="text-sm text-white/60 mt-1">
                  {formatCurrency(data.overall.pendingAmount)} lost
                </p>
              </div>

              {/* Total Completed */}
              <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/60 text-sm">Completed Payments (30d)</span>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <p className="text-3xl font-bold text-green-400">{data.overall.totalCompleted}</p>
                <p className="text-sm text-white/60 mt-1">
                  {formatCurrency(data.overall.completedAmount)} revenue
                </p>
              </div>

              {/* Affected Customers */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/60 text-sm">Affected Customers</span>
                  <Users className="w-5 h-5 text-amber-400" />
                </div>
                <p className="text-3xl font-bold text-amber-400">{data.affectedCustomers.length}</p>
                <p className="text-sm text-white/60 mt-1">
                  Need follow-up
                </p>
              </div>
            </div>

            {/* Tenant Breakdown */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Tenant Health Status
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-white/60 text-sm border-b border-white/10">
                      <th className="pb-3 pr-4">Tenant</th>
                      <th className="pb-3 pr-4">Success Rate</th>
                      <th className="pb-3 pr-4">Completed</th>
                      <th className="pb-3 pr-4">Failed</th>
                      <th className="pb-3 pr-4">Revenue</th>
                      <th className="pb-3">Lost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.tenantMetrics.map((tenant, i) => (
                      <tr key={i} className="border-b border-white/5">
                        <td className="py-3 pr-4">
                          <div className="font-medium">{tenant.tenantName}</div>
                          <div className="text-xs text-white/40">{tenant.tenantSlug}</div>
                        </td>
                        <td className="py-3 pr-4">
                          <div className={`inline-flex items-center gap-2 px-2 py-1 rounded text-sm ${
                            tenant.successRate < 50 ? 'bg-red-500/20 text-red-400' :
                            tenant.successRate < 80 ? 'bg-amber-500/20 text-amber-400' :
                            'bg-green-500/20 text-green-400'
                          }`}>
                            {tenant.successRate.toFixed(1)}%
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-green-400">{tenant.completed}</td>
                        <td className="py-3 pr-4 text-red-400">{tenant.pending}</td>
                        <td className="py-3 pr-4 text-green-400">{formatCurrency(tenant.completedAmount)}</td>
                        <td className="py-3 text-red-400">{formatCurrency(tenant.pendingAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Successful Orders */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Recent Successful Orders
              </h2>
              <div className="space-y-2">
                {data.recentOrders.map((order, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div>
                      <span className="font-medium">{order.customerName}</span>
                      <span className="text-white/40 mx-2">•</span>
                      <span className="text-white/60 text-sm">{order.tenantName}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-green-400 font-medium">{formatCurrency(order.amount)}</span>
                      <span className="text-white/40 text-sm">{formatDate(order.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 mb-6">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Customers Who Need Follow-Up
              </h2>
              <p className="text-white/70 mt-1">
                These customers attempted to place orders but their payments failed. Contact them to recover lost sales.
              </p>
            </div>

            {data.affectedCustomers.length === 0 ? (
              <div className="text-center py-12 text-white/60">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
                <p>No affected customers found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.affectedCustomers.map((customer, i) => (
                  <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold">{customer.name}</h3>
                        <p className="text-white/60 text-sm">{customer.tenantName}</p>

                        <div className="mt-3 space-y-2">
                          {customer.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-white/40" />
                              <a href={`mailto:${customer.email}`} className="text-blue-400 hover:underline">
                                {customer.email}
                              </a>
                              <button
                                onClick={() => copyToClipboard(customer.email!)}
                                className="p-1 hover:bg-white/10 rounded"
                              >
                                {copiedEmail === customer.email ? (
                                  <CheckCircle className="w-4 h-4 text-green-400" />
                                ) : (
                                  <Copy className="w-4 h-4 text-white/40" />
                                )}
                              </button>
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-white/40" />
                              <a href={`tel:${customer.phone}`} className="text-blue-400 hover:underline">
                                {customer.phone}
                              </a>
                              <button
                                onClick={() => copyToClipboard(customer.phone!)}
                                className="p-1 hover:bg-white/10 rounded"
                              >
                                {copiedEmail === customer.phone ? (
                                  <CheckCircle className="w-4 h-4 text-green-400" />
                                ) : (
                                  <Copy className="w-4 h-4 text-white/40" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {customer.items.slice(0, 5).map((item, j) => (
                            <span key={j} className="text-xs bg-white/10 px-2 py-1 rounded">
                              {item}
                            </span>
                          ))}
                          {customer.items.length > 5 && (
                            <span className="text-xs text-white/40">+{customer.items.length - 5} more</span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 text-right">
                        <div className="text-2xl font-bold text-red-400">
                          {formatCurrency(customer.totalLost)}
                        </div>
                        <div className="text-white/60 text-sm">
                          {customer.attempts} failed attempt{customer.attempts > 1 ? 's' : ''}
                        </div>
                        <div className="text-white/40 text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Last: {formatDate(customer.lastAttempt)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'failures' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 mb-6">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                Recent Failed Payment Attempts
              </h2>
              <p className="text-white/70 mt-1">
                Payment intents that were created but never completed.
              </p>
            </div>

            {data.recentFailures.length === 0 ? (
              <div className="text-center py-12 text-white/60">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
                <p>No recent failures</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-white/60 text-sm border-b border-white/10">
                      <th className="pb-3 pr-4">Time</th>
                      <th className="pb-3 pr-4">Customer</th>
                      <th className="pb-3 pr-4">Tenant</th>
                      <th className="pb-3 pr-4">Amount</th>
                      <th className="pb-3">Items</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentFailures.map((failure, i) => (
                      <tr key={i} className="border-b border-white/5">
                        <td className="py-3 pr-4 text-white/60 text-sm">
                          {formatDate(failure.createdAt)}
                        </td>
                        <td className="py-3 pr-4 font-medium">{failure.customerName}</td>
                        <td className="py-3 pr-4 text-white/60">{failure.tenantName}</td>
                        <td className="py-3 pr-4 text-red-400 font-medium">
                          {formatCurrency(failure.amount)}
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-1">
                            {failure.items.slice(0, 2).map((item, j) => (
                              <span key={j} className="text-xs bg-white/10 px-2 py-0.5 rounded">
                                {item}
                              </span>
                            ))}
                            {failure.items.length > 2 && (
                              <span className="text-xs text-white/40">+{failure.items.length - 2}</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 mb-6">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Integration Error Logs (Last 7 Days)
              </h2>
            </div>

            {data.errorLogs.length === 0 ? (
              <div className="text-center py-12 text-white/60">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
                <p>No error logs found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.errorLogs.map((log, i) => (
                  <div key={i} className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">
                            {log.source}
                          </span>
                          <span className="text-white/40 text-xs">{log.tenantName}</span>
                        </div>
                        <p className="text-sm text-white/80 font-mono">{log.message}</p>
                      </div>
                      <span className="text-white/40 text-xs whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'email' && (
          <div className="space-y-6">
            {/* Send Admin Alert */}
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-bold text-lg flex items-center gap-2">
                    <Mail className="w-5 h-5 text-blue-400" />
                    Send Admin Alert
                  </h2>
                  <p className="text-white/70 mt-1">
                    Send yourself an alert email with current failure summary
                  </p>
                </div>
                <button
                  onClick={handleSendAdminAlert}
                  disabled={sendingEmail}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded-lg transition"
                >
                  {sendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send Alert to Me
                </button>
              </div>
            </div>

            {/* Tenant Reports */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Send Incident Report to Tenant Owner
              </h2>
              <p className="text-white/60 text-sm mb-4">
                Select a tenant to preview and send an incident report email to the owner.
              </p>

              <div className="space-y-2">
                {data.tenantMetrics.filter(t => t.pending > 0).map((tenant, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition"
                  >
                    <div>
                      <div className="font-medium">{tenant.tenantName}</div>
                      <div className="text-sm text-white/60">
                        {tenant.pending} failed payments • {formatCurrency(tenant.pendingAmount)} lost
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        tenant.successRate < 50 ? 'bg-red-500/20 text-red-400' :
                        tenant.successRate < 80 ? 'bg-amber-500/20 text-amber-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {tenant.successRate.toFixed(1)}% success
                      </span>
                      <button
                        onClick={() => openEmailModal(tenant)}
                        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition"
                      >
                        <Eye className="w-4 h-4" />
                        Preview & Send
                      </button>
                    </div>
                  </div>
                ))}

                {data.tenantMetrics.filter(t => t.pending > 0).length === 0 && (
                  <div className="text-center py-8 text-white/60">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
                    <p>No tenants with failures to report</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Email Preview Modal */}
      {showEmailModal && selectedTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl max-h-[90vh] bg-[#0A1628] rounded-2xl border border-white/10 overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div>
                <h3 className="text-lg font-bold">Incident Report Email</h3>
                <p className="text-white/60 text-sm">{selectedTenant.tenantName}</p>
              </div>
              <button
                onClick={() => setShowEmailModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {emailSent ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8">
                <CheckCircle className="w-16 h-16 text-green-400 mb-4" />
                <h3 className="text-xl font-bold mb-2">Email Sent Successfully!</h3>
                <p className="text-white/60 mb-6">
                  The incident report has been sent to {emailForm.recipientEmail}
                </p>
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="bg-white/10 hover:bg-white/20 px-6 py-2 rounded-lg transition"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                {/* Email Form */}
                <div className="p-6 border-b border-white/10 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-white/60 mb-1">Recipient Email</label>
                      <input
                        type="email"
                        value={emailForm.recipientEmail}
                        onChange={(e) => setEmailForm(prev => ({ ...prev, recipientEmail: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                        placeholder="owner@restaurant.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/60 mb-1">Recipient Name</label>
                      <input
                        type="text"
                        value={emailForm.recipientName}
                        onChange={(e) => setEmailForm(prev => ({ ...prev, recipientName: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                        placeholder="Restaurant Owner"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-1">Incident Date</label>
                    <input
                      type="text"
                      value={emailForm.incidentDate}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, incidentDate: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-1">Root Cause</label>
                    <textarea
                      value={emailForm.rootCause}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, rootCause: e.target.value }))}
                      rows={2}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-1">Resolution</label>
                    <textarea
                      value={emailForm.resolution}
                      onChange={(e) => setEmailForm(prev => ({ ...prev, resolution: e.target.value }))}
                      rows={2}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                    />
                  </div>
                </div>

                {/* Email Preview */}
                <div className="flex-1 overflow-auto p-6">
                  <h4 className="text-sm font-medium text-white/60 mb-3">Email Preview</h4>
                  {loadingPreview ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-white/40" />
                    </div>
                  ) : emailPreview ? (
                    <div
                      className="bg-white rounded-lg overflow-hidden"
                      dangerouslySetInnerHTML={{ __html: emailPreview }}
                    />
                  ) : (
                    <div className="text-center py-12 text-white/40">
                      <Mail className="w-12 h-12 mx-auto mb-3" />
                      <p>Preview will load when available</p>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
                  <button
                    onClick={() => setShowEmailModal(false)}
                    className="px-4 py-2 text-white/60 hover:text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendEmail}
                    disabled={sendingEmail || !emailForm.recipientEmail}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-2 rounded-lg transition font-medium"
                  >
                    {sendingEmail ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Email
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
