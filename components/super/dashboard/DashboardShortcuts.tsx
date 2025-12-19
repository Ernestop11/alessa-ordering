'use client';

import { Users, Package, TrendingUp, FileText, Settings, Sparkles, Layers, Network } from 'lucide-react';

interface ShortcutCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  count?: number;
  onClick: () => void;
}

interface Props {
  totalTenants: number;
  liveTenants: number;
  pendingTenants: number;
  totalProducts: number;
  totalMRR: number;
  onNavigate: (tab: string) => void;
}

export default function DashboardShortcuts({
  totalTenants,
  liveTenants,
  pendingTenants,
  totalProducts,
  totalMRR,
  onNavigate,
}: Props) {
  const shortcuts: ShortcutCard[] = [
    {
      id: 'tenants',
      title: 'Tenants',
      description: 'Manage all restaurant tenants',
      icon: <Users className="h-6 w-6" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      count: totalTenants,
      onClick: () => onNavigate('tenants'),
    },
    {
      id: 'products',
      title: 'Products',
      description: 'View product ecosystem and features',
      icon: <Package className="h-6 w-6" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      count: totalProducts,
      onClick: () => onNavigate('products'),
    },
    {
      id: 'onboarding',
      title: 'Onboarding',
      description: 'Create new tenant accounts',
      icon: <Sparkles className="h-6 w-6" />,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      onClick: () => onNavigate('onboarding'),
    },
    {
      id: 'templates',
      title: 'Templates',
      description: 'Manage business templates',
      icon: <Layers className="h-6 w-6" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      onClick: () => onNavigate('templates'),
    },
    {
      id: 'crm',
      title: 'CRM',
      description: 'Customer relationship management',
      icon: <Network className="h-6 w-6" />,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      onClick: () => onNavigate('crm'),
    },
    {
      id: 'mlm',
      title: 'MLM',
      description: 'Multi-level marketing tree',
      icon: <Network className="h-6 w-6" />,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
      onClick: () => onNavigate('mlm'),
    },
  ];

  const stats = [
    {
      label: 'Total Tenants',
      value: totalTenants,
      subValue: `${liveTenants} live`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Pending Review',
      value: pendingTenants,
      subValue: 'needs attention',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      label: 'Monthly Revenue',
      value: `$${totalMRR.toLocaleString()}`,
      subValue: 'MRR',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Products',
      value: totalProducts,
      subValue: 'in ecosystem',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-xl border-2 border-gray-200 ${stat.bgColor} p-6 shadow-sm transition-all hover:shadow-md`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">{stat.label}</p>
            <p className={`text-3xl font-bold ${stat.color} mt-2`}>{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.subValue}</p>
          </div>
        ))}
      </div>

      {/* Shortcut Cards */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shortcuts.map((shortcut) => (
            <button
              key={shortcut.id}
              onClick={shortcut.onClick}
              className="group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white p-6 text-left shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`rounded-lg ${shortcut.bgColor} p-2 ${shortcut.color}`}>
                      {shortcut.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{shortcut.title}</h4>
                      {shortcut.count !== undefined && (
                        <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                          {shortcut.count}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{shortcut.description}</p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className={`rounded-full ${shortcut.bgColor} p-2 ${shortcut.color}`}>
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

