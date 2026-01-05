'use client';

import { PostgresStatus } from '@/lib/vps-dashboard/types';

type ViewMode = 'overview' | 'pages' | 'apis' | 'nginx' | 'pm2' | 'postgres' | 'redis';

interface PostgresOfficeProps {
  postgres: PostgresStatus;
  onClose: () => void;
  onNavigate: (target: ViewMode) => void;
}

export default function PostgresOffice({ postgres, onClose, onNavigate }: PostgresOfficeProps) {
  const connectionPercent = postgres.maxConnections > 0
    ? Math.round((postgres.connections / postgres.maxConnections) * 100)
    : 0;

  return (
    <div className="h-full overflow-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-purple-500/20 rounded-xl flex items-center justify-center">
            <span className="text-4xl">🐘</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              PostgreSQL Database
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                postgres.status === 'running'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {postgres.status.toUpperCase()}
              </span>
            </h2>
            <p className="text-slate-400">Your data vault - stores everything</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
        >
          ← Back to Overview
        </button>
      </div>

      {/* Educational Section */}
      <div className="bg-gradient-to-r from-purple-500/10 to-violet-500/10 border border-purple-500/20 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <span>📚</span> What is PostgreSQL?
        </h3>
        <p className="text-slate-300 mb-4">
          PostgreSQL is your <strong>data vault</strong> - a giant organized filing cabinet that stores:
        </p>
        <ul className="space-y-2 text-slate-400">
          <li className="flex items-start gap-2">
            <span className="text-purple-400">📦</span>
            <span><strong>All your tenants</strong> - Restaurant information, settings, branding</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-400">📦</span>
            <span><strong>Orders & Customers</strong> - Every order, customer detail, payment record</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-400">📦</span>
            <span><strong>Menu Items</strong> - Products, categories, modifiers, prices</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-400">📦</span>
            <span><strong>Relationships</strong> - How all this data connects together</span>
          </li>
        </ul>
      </div>

      {/* Live Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="text-2xl font-bold text-purple-400">{postgres.version}</div>
          <div className="text-sm text-slate-400">Version</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="text-2xl font-bold text-blue-400">{postgres.databases.length}</div>
          <div className="text-sm text-slate-400">Databases</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-green-400">{postgres.connections}</span>
            <span className="text-slate-500">/ {postgres.maxConnections}</span>
          </div>
          <div className="text-sm text-slate-400">Connections</div>
          <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                connectionPercent > 80 ? 'bg-red-500' : connectionPercent > 50 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${connectionPercent}%` }}
            />
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="text-2xl font-bold text-cyan-400">{postgres.uptime}</div>
          <div className="text-sm text-slate-400">Uptime</div>
        </div>
      </div>

      {/* Databases */}
      <h3 className="text-lg font-semibold text-white mb-4">Databases</h3>
      <div className="grid gap-4 mb-6">
        {postgres.databases.map((db) => (
          <div
            key={db.name}
            className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden hover:border-purple-500/50 transition-colors"
          >
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🗄️</span>
                </div>
                <div>
                  <h4 className="font-semibold text-white">{db.name}</h4>
                  <p className="text-xs text-slate-500">Owner: {db.owner}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-xl font-bold text-purple-400">{db.size}</div>
                  <div className="text-xs text-slate-500">Size</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-blue-400">{db.tableCount}</div>
                  <div className="text-xs text-slate-500">Tables</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table Visualization */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Table Relationships (alessa_ordering)</h3>
        <p className="text-sm text-slate-400 mb-4">
          Each box is a table. Lines show how tables relate to each other.
        </p>

        {/* Simple visualization of table relationships */}
        <div className="relative py-8">
          <div className="flex justify-center gap-8 flex-wrap">
            {/* Core Tables */}
            <div className="flex flex-col items-center gap-4">
              <div className="bg-purple-500/20 border border-purple-500/40 rounded-lg p-4 text-center">
                <div className="text-2xl mb-1">🏢</div>
                <div className="font-semibold text-white">Tenant</div>
                <div className="text-xs text-slate-400">The restaurant</div>
              </div>
              <div className="text-purple-400">↓</div>
              <div className="flex gap-4">
                <div className="bg-blue-500/20 border border-blue-500/40 rounded-lg p-3 text-center">
                  <div className="text-xl mb-1">🍽️</div>
                  <div className="font-semibold text-white text-sm">MenuItem</div>
                </div>
                <div className="bg-green-500/20 border border-green-500/40 rounded-lg p-3 text-center">
                  <div className="text-xl mb-1">📋</div>
                  <div className="font-semibold text-white text-sm">Order</div>
                </div>
                <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-lg p-3 text-center">
                  <div className="text-xl mb-1">👤</div>
                  <div className="font-semibold text-white text-sm">Customer</div>
                </div>
              </div>
              <div className="text-slate-500 flex gap-4">
                <span>↓</span>
                <span>↓</span>
                <span>↓</span>
              </div>
              <div className="flex gap-4">
                <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-2 text-center">
                  <div className="text-sm mb-1">🛒</div>
                  <div className="text-xs text-slate-300">OrderItem</div>
                </div>
                <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-2 text-center">
                  <div className="text-sm mb-1">💳</div>
                  <div className="text-xs text-slate-300">Payment</div>
                </div>
                <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-2 text-center">
                  <div className="text-sm mb-1">⭐</div>
                  <div className="text-xs text-slate-300">Reward</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-500 text-center mt-4">
          Click on any table to see its columns and data (coming soon)
        </p>
      </div>

      {/* Navigation */}
      <div className="mt-6 bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Data Flow</h3>
        <div className="flex items-center justify-center gap-8 py-4">
          <div
            className="text-center cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onNavigate('pm2')}
          >
            <div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center mb-2 mx-auto">
              <span className="text-2xl">⚡</span>
            </div>
            <span className="text-xs text-slate-400">PM2 Apps</span>
          </div>

          <span className="text-slate-500">↔</span>

          <div className="text-center">
            <div className="w-14 h-14 bg-purple-500/20 rounded-xl flex items-center justify-center mb-2 mx-auto ring-2 ring-purple-500">
              <span className="text-2xl">🐘</span>
            </div>
            <span className="text-xs text-purple-400 font-medium">PostgreSQL</span>
          </div>

          <span className="text-slate-500">+</span>

          <div
            className="text-center cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onNavigate('redis')}
          >
            <div className="w-14 h-14 bg-red-500/20 rounded-xl flex items-center justify-center mb-2 mx-auto">
              <span className="text-2xl">🔴</span>
            </div>
            <span className="text-xs text-slate-400">Redis Cache</span>
          </div>
        </div>
        <p className="text-xs text-slate-500 text-center mt-4">
          PostgreSQL stores permanent data. Redis caches frequently accessed data for speed.
        </p>
      </div>
    </div>
  );
}
