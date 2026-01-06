'use client';

import { useState, useMemo } from 'react';
import { SystemOverview } from '@/lib/vps-dashboard/types';
import MiniFlowView from '../canvas/MiniFlowView';

type ViewMode = 'overview' | 'pages' | 'apis' | 'nginx' | 'pm2' | 'postgres' | 'redis';

interface ApiRoute {
  route: string;
  methods: string[];
  filePath: string;
}

interface APIsOfficeProps {
  apiRoutes: ApiRoute[];
  system: SystemOverview;
  onClose: () => void;
  onNavigate: (target: ViewMode) => void;
}

const METHOD_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  GET: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
  POST: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  PUT: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  PATCH: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  DELETE: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
};

export default function APIsOffice({ apiRoutes, system, onClose, onNavigate }: APIsOfficeProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  // Group APIs by prefix
  const groupedApis = useMemo(() => {
    const groups: Record<string, ApiRoute[]> = {};
    for (const api of apiRoutes) {
      const segments = api.route.split('/').filter(Boolean);
      const prefix = segments[1] || 'root'; // Skip 'api' prefix
      if (!groups[prefix]) groups[prefix] = [];
      groups[prefix].push(api);
    }
    return groups;
  }, [apiRoutes]);

  // Get method statistics
  const methodStats = useMemo(() => {
    const stats: Record<string, number> = { GET: 0, POST: 0, PUT: 0, PATCH: 0, DELETE: 0 };
    for (const api of apiRoutes) {
      for (const method of api.methods) {
        stats[method] = (stats[method] || 0) + 1;
      }
    }
    return stats;
  }, [apiRoutes]);

  // Filter APIs
  const filteredApis = useMemo(() => {
    let apis = apiRoutes;

    if (selectedGroup) {
      apis = apis.filter(api => {
        const segments = api.route.split('/').filter(Boolean);
        const prefix = segments[1] || 'root';
        return prefix === selectedGroup;
      });
    }

    if (selectedMethod) {
      apis = apis.filter(api => api.methods.includes(selectedMethod));
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      apis = apis.filter(api =>
        api.route.toLowerCase().includes(query) ||
        api.filePath.toLowerCase().includes(query)
      );
    }

    return apis;
  }, [apiRoutes, selectedGroup, selectedMethod, searchQuery]);

  const groupKeys = Object.keys(groupedApis).sort();

  return (
    <div className="h-full overflow-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-cyan-500/20 rounded-xl flex items-center justify-center">
            <span className="text-4xl">🔌</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              API Routes
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400">
                {apiRoutes.length} ENDPOINTS
              </span>
            </h2>
            <p className="text-slate-400">Backend API endpoints powering your applications</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
        >
          ← Back to Overview
        </button>
      </div>

      {/* Mini System Flow */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-slate-400 mb-2">System Architecture</h3>
        <MiniFlowView
          focusedSystem="pm2"
          systemData={{
            nginx: { status: system.nginx.status, sitesCount: system.nginx.sites.length },
            pm2: { status: 'running', appsCount: system.pm2.apps.length },
            postgres: { status: system.postgres.status, dbCount: system.postgres.databases.length },
            redis: { status: system.redis.status, keys: system.redis.keys },
          }}
          onNavigate={onNavigate}
          height="180px"
        />
      </div>

      {/* Educational Section */}
      <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <span>📚</span> What are API Routes?
        </h3>
        <p className="text-slate-300 mb-4">
          API Routes are the <strong>backend endpoints</strong> that handle data operations. They&apos;re like the kitchen staff in a restaurant:
        </p>
        <ul className="space-y-2 text-slate-400">
          <li className="flex items-start gap-2">
            <span className="text-green-400 font-bold">GET</span>
            <span><strong>Fetch data</strong> - Like reading the menu or checking order status</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 font-bold">POST</span>
            <span><strong>Create new</strong> - Like placing a new order or registering a customer</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-yellow-400 font-bold">PUT/PATCH</span>
            <span><strong>Update existing</strong> - Like modifying an order or updating menu prices</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-400 font-bold">DELETE</span>
            <span><strong>Remove data</strong> - Like cancelling an order or removing a menu item</span>
          </li>
        </ul>
      </div>

      {/* Method Stats */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {Object.entries(methodStats).map(([method, count]) => {
          const colors = METHOD_COLORS[method] || { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' };
          const isActive = selectedMethod === method;
          return (
            <button
              key={method}
              onClick={() => setSelectedMethod(isActive ? null : method)}
              className={`rounded-xl p-4 border transition-all ${colors.bg} ${colors.border} ${
                isActive ? 'ring-2 ring-offset-2 ring-offset-slate-900' : ''
              }`}
              style={{ '--tw-ring-color': colors.text.replace('text-', '#').replace('-400', '') } as React.CSSProperties}
            >
              <div className={`text-2xl font-bold ${colors.text}`}>{count}</div>
              <div className={`text-xs font-mono ${colors.text}`}>{method}</div>
            </button>
          );
        })}
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search routes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 pl-10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
        </div>
        <select
          value={selectedGroup || ''}
          onChange={(e) => setSelectedGroup(e.target.value || null)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Groups</option>
          {groupKeys.map(group => (
            <option key={group} value={group}>
              /{group} ({groupedApis[group].length})
            </option>
          ))}
        </select>
      </div>

      {/* Results count */}
      <div className="text-sm text-slate-400 mb-4">
        Showing {filteredApis.length} of {apiRoutes.length} endpoints
        {selectedGroup && <span className="text-cyan-400"> in /{selectedGroup}</span>}
        {selectedMethod && <span className="text-cyan-400"> with {selectedMethod}</span>}
      </div>

      {/* API Groups */}
      {selectedGroup ? (
        // Show flat list when group is selected
        <div className="space-y-2">
          {filteredApis.map((api) => (
            <ApiRouteCard key={api.route} api={api} />
          ))}
        </div>
      ) : (
        // Show grouped view
        <div className="space-y-6">
          {groupKeys.map(group => {
            const groupApis = filteredApis.filter(api => {
              const segments = api.route.split('/').filter(Boolean);
              return (segments[1] || 'root') === group;
            });

            if (groupApis.length === 0) return null;

            return (
              <div key={group} className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
                <button
                  onClick={() => setSelectedGroup(group)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{getGroupIcon(group)}</span>
                    <span className="font-semibold text-white">/api/{group}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">
                      {groupApis.length} routes
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Show method summary */}
                    {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(method => {
                      const count = groupApis.filter(a => a.methods.includes(method)).length;
                      if (count === 0) return null;
                      const colors = METHOD_COLORS[method];
                      return (
                        <span key={method} className={`text-xs px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                          {count}
                        </span>
                      );
                    })}
                    <span className="text-slate-500 ml-2">→</span>
                  </div>
                </button>
                <div className="px-4 pb-3 space-y-1.5">
                  {groupApis.slice(0, 3).map((api) => (
                    <ApiRouteCard key={api.route} api={api} compact />
                  ))}
                  {groupApis.length > 3 && (
                    <button
                      onClick={() => setSelectedGroup(group)}
                      className="w-full text-center text-sm text-cyan-400 hover:text-cyan-300 py-2"
                    >
                      View all {groupApis.length} routes →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* API Flow Visualization */}
      <div className="mt-8 bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Request Flow</h3>
        <div className="flex items-center justify-center gap-4 py-6">
          <div className="text-center">
            <div className="w-14 h-14 bg-slate-700 rounded-xl flex items-center justify-center mb-2">
              <span className="text-2xl">📱</span>
            </div>
            <span className="text-xs text-slate-400">Client</span>
          </div>

          <div className="flex-1 flex items-center">
            <div className="flex-1 h-0.5 bg-gradient-to-r from-slate-600 to-cyan-500" />
            <span className="text-lg mx-2 text-cyan-400">→</span>
          </div>

          <div className="text-center">
            <div className="w-14 h-14 bg-cyan-500/20 rounded-xl flex items-center justify-center mb-2">
              <span className="text-2xl">🔌</span>
            </div>
            <span className="text-xs text-slate-400">API Route</span>
          </div>

          <div className="flex-1 flex items-center">
            <span className="text-lg mx-2 text-purple-400">→</span>
            <div className="flex-1 h-0.5 bg-gradient-to-r from-cyan-500 to-purple-500" />
          </div>

          <div className="text-center">
            <div
              className="w-14 h-14 bg-purple-500/20 rounded-xl flex items-center justify-center mb-2 cursor-pointer hover:bg-purple-500/30 transition-colors"
              onClick={() => onNavigate('postgres')}
            >
              <span className="text-2xl">🐘</span>
            </div>
            <span className="text-xs text-slate-400">Database</span>
          </div>

          <div className="flex-1 flex items-center">
            <span className="text-lg mx-2 text-red-400">⇄</span>
            <div className="flex-1 h-0.5 bg-gradient-to-r from-purple-500 to-red-500 opacity-50" style={{ strokeDasharray: '5,5' }} />
          </div>

          <div className="text-center">
            <div
              className="w-14 h-14 bg-red-500/20 rounded-xl flex items-center justify-center mb-2 cursor-pointer hover:bg-red-500/30 transition-colors"
              onClick={() => onNavigate('redis')}
            >
              <span className="text-2xl">🔴</span>
            </div>
            <span className="text-xs text-slate-400">Cache</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ApiRouteCard({ api, compact }: { api: ApiRoute; compact?: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 bg-slate-700/30 rounded-lg ${
        compact ? 'p-2' : 'p-3'
      } hover:bg-slate-700/50 transition-colors`}
    >
      <div className="flex gap-1 flex-shrink-0">
        {api.methods.map((method) => {
          const colors = METHOD_COLORS[method] || { bg: 'bg-slate-500/20', text: 'text-slate-400' };
          return (
            <span
              key={method}
              className={`text-xs font-mono px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}
            >
              {method}
            </span>
          );
        })}
      </div>
      <span className={`font-mono text-slate-300 ${compact ? 'text-xs' : 'text-sm'} truncate`}>
        {api.route}
      </span>
      {!compact && (
        <span className="text-xs text-slate-500 ml-auto truncate max-w-[200px]">
          {api.filePath}
        </span>
      )}
    </div>
  );
}

function getGroupIcon(group: string): string {
  const icons: Record<string, string> = {
    admin: '⚙️',
    auth: '🔐',
    orders: '📦',
    menu: '🍽️',
    customers: '👤',
    tenant: '🏪',
    tenants: '🏪',
    super: '👑',
    webhooks: '🔗',
    stripe: '💳',
    tax: '📊',
    catering: '🍱',
    grocery: '🛒',
    delivery: '🚗',
    rewards: '⭐',
    crm: '📋',
    vps: '🖥️',
    'vps-dashboard': '🔭',
    upload: '📤',
    uploads: '📤',
    print: '🖨️',
    ai: '🤖',
    pos: '💰',
    checkout: '🛍️',
    'sub-tenant': '🏷️',
  };
  return icons[group] || '📁';
}
