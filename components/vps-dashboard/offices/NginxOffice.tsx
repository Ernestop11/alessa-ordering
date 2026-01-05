'use client';

import { NginxStatus } from '@/lib/vps-dashboard/types';

type ViewMode = 'overview' | 'pages' | 'apis' | 'nginx' | 'pm2' | 'postgres' | 'redis';

interface NginxOfficeProps {
  nginx: NginxStatus;
  onClose: () => void;
  onNavigate: (target: ViewMode) => void;
}

export default function NginxOffice({ nginx, onClose, onNavigate }: NginxOfficeProps) {
  return (
    <div className="h-full overflow-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-green-500/20 rounded-xl flex items-center justify-center">
            <span className="text-4xl">🛡️</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              Nginx Gateway
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                nginx.status === 'running'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {nginx.status.toUpperCase()}
              </span>
            </h2>
            <p className="text-slate-400">The front door of your VPS</p>
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
      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <span>📚</span> What is Nginx?
        </h3>
        <p className="text-slate-300 mb-4">
          Think of Nginx as the <strong>receptionist at a building</strong>. When someone visits your website, Nginx:
        </p>
        <ul className="space-y-2 text-slate-400">
          <li className="flex items-start gap-2">
            <span className="text-green-400">✓</span>
            <span><strong>Checks HTTPS</strong> - Makes sure the connection is secure (like checking ID)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400">✓</span>
            <span><strong>Routes by domain</strong> - Sends lasreinascolusa.com visitors to Las Reinas, alessacloud.com to Alessa Cloud</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400">✓</span>
            <span><strong>Load balances</strong> - Distributes traffic so no single server gets overwhelmed</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400">✓</span>
            <span><strong>Serves static files</strong> - Quickly delivers images, CSS, and JavaScript</span>
          </li>
        </ul>
      </div>

      {/* Live Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="text-3xl font-bold text-green-400">{nginx.sites.length}</div>
          <div className="text-sm text-slate-400">Active Sites</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="text-3xl font-bold text-blue-400">{nginx.requestsPerMin}</div>
          <div className="text-sm text-slate-400">Requests/min</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="text-3xl font-bold text-purple-400">{nginx.uptime}</div>
          <div className="text-sm text-slate-400">Uptime</div>
        </div>
      </div>

      {/* Sites Grid */}
      <h3 className="text-lg font-semibold text-white mb-4">Active Sites</h3>
      <div className="grid gap-4 mb-6">
        {nginx.sites.map((site) => (
          <div
            key={site.domain}
            className="bg-slate-800 rounded-xl p-4 border border-slate-700 hover:border-green-500/50 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🌐</span>
                <div>
                  <h4 className="font-semibold text-white">{site.domain}</h4>
                  <p className="text-xs text-slate-500">{site.configPath}</p>
                </div>
              </div>
              <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                site.status === 'healthy'
                  ? 'bg-green-500/20 text-green-400'
                  : site.status === 'warning'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  site.status === 'healthy' ? 'bg-green-500' : site.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                {site.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="text-slate-400 text-xs mb-1">Proxies To</div>
                <div className="font-mono text-blue-400">{site.proxyTo}</div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="text-slate-400 text-xs mb-1">SSL Expires</div>
                <div className={`font-mono ${
                  site.sslExpires && new Date(site.sslExpires) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                    ? 'text-yellow-400'
                    : 'text-green-400'
                }`}>
                  {site.sslExpires || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Traffic Flow Visualization */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Traffic Flow</h3>
        <div className="flex items-center justify-center gap-4 py-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-xl flex items-center justify-center mb-2">
              <span className="text-3xl">🌐</span>
            </div>
            <span className="text-xs text-slate-400">Internet</span>
          </div>

          <div className="flex-1 flex items-center">
            <div className="flex-1 h-1 bg-gradient-to-r from-yellow-500 to-green-500 animate-pulse" />
            <span className="text-2xl mx-2">→</span>
            <div className="flex-1 h-1 bg-gradient-to-r from-green-500 to-green-500/50" />
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-xl flex items-center justify-center mb-2">
              <span className="text-3xl">🛡️</span>
            </div>
            <span className="text-xs text-slate-400">Nginx</span>
          </div>

          <div className="flex-1 flex items-center">
            <div className="flex-1 h-1 bg-gradient-to-r from-green-500 to-blue-500 animate-pulse" />
            <span className="text-2xl mx-2">→</span>
            <div className="flex-1 h-1 bg-gradient-to-r from-blue-500 to-blue-500/50" />
          </div>

          <div className="text-center">
            <div
              className="w-16 h-16 bg-blue-500/20 rounded-xl flex items-center justify-center mb-2 cursor-pointer hover:bg-blue-500/30 transition-colors"
              onClick={() => onNavigate('pm2')}
            >
              <span className="text-3xl">⚡</span>
            </div>
            <span className="text-xs text-slate-400">PM2 Apps</span>
          </div>
        </div>
      </div>
    </div>
  );
}
