'use client';

import { PM2Status } from '@/lib/vps-dashboard/types';

type ViewMode = 'overview' | 'pages' | 'apis' | 'nginx' | 'pm2' | 'postgres' | 'redis';

interface PM2OfficeProps {
  pm2: PM2Status;
  onClose: () => void;
  onNavigate: (target: ViewMode) => void;
}

export default function PM2Office({ pm2, onClose, onNavigate }: PM2OfficeProps) {
  const onlineApps = pm2.apps.filter(a => a.status === 'online').length;
  const totalRestarts = pm2.apps.reduce((sum, a) => sum + a.restarts, 0);

  return (
    <div className="h-full overflow-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-500/20 rounded-xl flex items-center justify-center">
            <span className="text-4xl">⚡</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              PM2 Process Manager
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                {onlineApps}/{pm2.apps.length} ONLINE
              </span>
            </h2>
            <p className="text-slate-400">Keeps your apps running 24/7</p>
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
      <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <span>📚</span> What is PM2?
        </h3>
        <p className="text-slate-300 mb-4">
          PM2 is like a <strong>supervisor for your applications</strong>. Think of it as a manager that:
        </p>
        <ul className="space-y-2 text-slate-400">
          <li className="flex items-start gap-2">
            <span className="text-blue-400">⚡</span>
            <span><strong>Keeps apps running</strong> - If an app crashes, PM2 automatically restarts it</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400">⚡</span>
            <span><strong>Monitors resources</strong> - Tracks memory usage, CPU, and uptime</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400">⚡</span>
            <span><strong>Manages logs</strong> - Collects and rotates application logs</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400">⚡</span>
            <span><strong>Cluster mode</strong> - Can run multiple instances for better performance</span>
          </li>
        </ul>
      </div>

      {/* Live Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="text-3xl font-bold text-blue-400">{pm2.apps.length}</div>
          <div className="text-sm text-slate-400">Total Apps</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="text-3xl font-bold text-green-400">{onlineApps}</div>
          <div className="text-sm text-slate-400">Online</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="text-3xl font-bold text-purple-400">{pm2.totalMemory}</div>
          <div className="text-sm text-slate-400">Total Memory</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="text-3xl font-bold text-yellow-400">{totalRestarts}</div>
          <div className="text-sm text-slate-400">Total Restarts</div>
        </div>
      </div>

      {/* Applications */}
      <h3 className="text-lg font-semibold text-white mb-4">Running Applications</h3>
      <div className="space-y-4">
        {pm2.apps.map((app) => (
          <div
            key={app.id}
            className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden"
          >
            {/* App Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  app.status === 'online'
                    ? 'bg-green-500/20'
                    : app.status === 'errored'
                    ? 'bg-red-500/20'
                    : 'bg-slate-700'
                }`}>
                  <span className="text-2xl">
                    {app.status === 'online' ? '✅' : app.status === 'errored' ? '❌' : '⏸️'}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-white text-lg">{app.name}</h4>
                  <p className="text-xs text-slate-500">PID: {app.pid} | ID: {app.id}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                app.status === 'online'
                  ? 'bg-green-500/20 text-green-400'
                  : app.status === 'errored'
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-slate-700 text-slate-400'
              }`}>
                {app.status.toUpperCase()}
              </span>
            </div>

            {/* App Stats */}
            <div className="grid grid-cols-5 divide-x divide-slate-700">
              <div className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">:{app.port}</div>
                <div className="text-xs text-slate-500">Port</div>
              </div>
              <div className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">{app.memory}</div>
                <div className="text-xs text-slate-500">Memory</div>
              </div>
              <div className="p-4 text-center">
                <div className="text-2xl font-bold text-cyan-400">{app.cpu}%</div>
                <div className="text-xs text-slate-500">CPU</div>
              </div>
              <div className="p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{app.uptime}</div>
                <div className="text-xs text-slate-500">Uptime</div>
              </div>
              <div className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">{app.restarts}</div>
                <div className="text-xs text-slate-500">Restarts</div>
              </div>
            </div>

            {/* Serves */}
            {app.serves && app.serves.length > 0 && (
              <div className="p-4 bg-slate-700/30">
                <div className="text-xs text-slate-400 mb-2">SERVES:</div>
                <div className="flex flex-wrap gap-2">
                  {app.serves.map((domain) => (
                    <span
                      key={domain}
                      className="px-3 py-1 bg-slate-700 rounded-full text-sm text-slate-300"
                    >
                      🌐 {domain}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Connection Flow */}
      <div className="mt-6 bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Connections</h3>
        <div className="flex items-center justify-center gap-8 py-4">
          <div
            className="text-center cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onNavigate('nginx')}
          >
            <div className="w-14 h-14 bg-green-500/20 rounded-xl flex items-center justify-center mb-2 mx-auto">
              <span className="text-2xl">🛡️</span>
            </div>
            <span className="text-xs text-slate-400">Nginx</span>
          </div>

          <span className="text-slate-500">→</span>

          <div className="text-center">
            <div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center mb-2 mx-auto ring-2 ring-blue-500">
              <span className="text-2xl">⚡</span>
            </div>
            <span className="text-xs text-blue-400 font-medium">PM2</span>
          </div>

          <span className="text-slate-500">→</span>

          <div
            className="text-center cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onNavigate('postgres')}
          >
            <div className="w-14 h-14 bg-purple-500/20 rounded-xl flex items-center justify-center mb-2 mx-auto">
              <span className="text-2xl">🐘</span>
            </div>
            <span className="text-xs text-slate-400">PostgreSQL</span>
          </div>

          <span className="text-slate-500">+</span>

          <div
            className="text-center cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onNavigate('redis')}
          >
            <div className="w-14 h-14 bg-red-500/20 rounded-xl flex items-center justify-center mb-2 mx-auto">
              <span className="text-2xl">🔴</span>
            </div>
            <span className="text-xs text-slate-400">Redis</span>
          </div>
        </div>
      </div>
    </div>
  );
}
