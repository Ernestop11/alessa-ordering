'use client';

import { RedisStatus, SystemOverview } from '@/lib/vps-dashboard/types';
import MiniFlowView from '../canvas/MiniFlowView';

type ViewMode = 'overview' | 'pages' | 'apis' | 'nginx' | 'pm2' | 'postgres' | 'redis';

interface RedisOfficeProps {
  redis: RedisStatus;
  system: SystemOverview;
  onClose: () => void;
  onNavigate: (target: ViewMode) => void;
}

export default function RedisOffice({ redis, system, onClose, onNavigate }: RedisOfficeProps) {
  return (
    <div className="h-full overflow-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-red-500/20 rounded-xl flex items-center justify-center">
            <span className="text-4xl">🔴</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              Redis Cache
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                redis.status === 'running'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {redis.status.toUpperCase()}
              </span>
            </h2>
            <p className="text-slate-400">Lightning-fast in-memory data store</p>
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
          focusedSystem="redis"
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
      <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <span>📚</span> What is Redis?
        </h3>
        <p className="text-slate-300 mb-4">
          Redis is like a <strong>super-fast sticky note board</strong>. While PostgreSQL is the filing cabinet (slow but permanent), Redis is:
        </p>
        <ul className="space-y-2 text-slate-400">
          <li className="flex items-start gap-2">
            <span className="text-red-400">⚡</span>
            <span><strong>Blazingly fast</strong> - Data lives in RAM, not on disk. Microseconds vs milliseconds.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-400">⚡</span>
            <span><strong>Session storage</strong> - Remembers logged-in users without hitting the database</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-400">⚡</span>
            <span><strong>Caching</strong> - Stores frequently accessed data to reduce database load</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-red-400">⚡</span>
            <span><strong>Rate limiting</strong> - Prevents API abuse by tracking request counts</span>
          </li>
        </ul>
      </div>

      {/* Live Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="text-3xl font-bold text-red-400">{redis.keys}</div>
          <div className="text-sm text-slate-400">Stored Keys</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="text-3xl font-bold text-orange-400">{redis.memory}</div>
          <div className="text-sm text-slate-400">Memory Used</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="text-3xl font-bold text-yellow-400">{redis.uptime}</div>
          <div className="text-sm text-slate-400">Uptime</div>
        </div>
      </div>

      {/* Speed Comparison */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Speed Comparison</h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-slate-400">Redis (in-memory)</span>
              <span className="text-sm text-red-400 font-mono">~0.1ms</span>
            </div>
            <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full" style={{ width: '5%' }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-slate-400">PostgreSQL (disk)</span>
              <span className="text-sm text-purple-400 font-mono">~5-50ms</span>
            </div>
            <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 to-violet-500 rounded-full" style={{ width: '50%' }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-slate-400">External API call</span>
              <span className="text-sm text-blue-400 font-mono">~100-500ms</span>
            </div>
            <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" style={{ width: '100%' }} />
            </div>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-4">
          Redis is 50-500x faster than database queries because it stores data in RAM.
        </p>
      </div>

      {/* Common Use Cases */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">What We Store in Redis</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🔐</span>
              <span className="font-medium text-white">Sessions</span>
            </div>
            <p className="text-xs text-slate-400">
              User login sessions. When you log in, your session is stored in Redis for instant verification.
            </p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">📊</span>
              <span className="font-medium text-white">Rate Limits</span>
            </div>
            <p className="text-xs text-slate-400">
              Tracks API requests per user/IP to prevent abuse and DDoS attacks.
            </p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">📦</span>
              <span className="font-medium text-white">Cache</span>
            </div>
            <p className="text-xs text-slate-400">
              Menu data, tenant settings - anything accessed frequently but changes rarely.
            </p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">📡</span>
              <span className="font-medium text-white">Real-time</span>
            </div>
            <p className="text-xs text-slate-400">
              Pub/sub for real-time order updates and live dashboard data.
            </p>
          </div>
        </div>
      </div>

      {/* Connection Flow */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Data Flow</h3>
        <div className="flex items-center justify-center gap-6 py-4">
          <div
            className="text-center cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onNavigate('pm2')}
          >
            <div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center mb-2 mx-auto">
              <span className="text-2xl">⚡</span>
            </div>
            <span className="text-xs text-slate-400">PM2 App</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <span className="text-red-400 text-xs">Fast Path</span>
            <span className="text-red-400">→</span>
          </div>

          <div className="text-center">
            <div className="w-14 h-14 bg-red-500/20 rounded-xl flex items-center justify-center mb-2 mx-auto ring-2 ring-red-500">
              <span className="text-2xl">🔴</span>
            </div>
            <span className="text-xs text-red-400 font-medium">Redis</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <span className="text-slate-500 text-xs">Cache Miss</span>
            <span className="text-slate-500">→</span>
          </div>

          <div
            className="text-center cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onNavigate('postgres')}
          >
            <div className="w-14 h-14 bg-purple-500/20 rounded-xl flex items-center justify-center mb-2 mx-auto">
              <span className="text-2xl">🐘</span>
            </div>
            <span className="text-xs text-slate-400">PostgreSQL</span>
          </div>
        </div>
        <p className="text-xs text-slate-500 text-center mt-4">
          Apps check Redis first (fast). If data isn&apos;t cached, they query PostgreSQL (slower) and cache the result.
        </p>
      </div>
    </div>
  );
}
