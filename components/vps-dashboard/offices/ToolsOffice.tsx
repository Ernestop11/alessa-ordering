'use client';

import { useState, useEffect } from 'react';

interface Tool {
  name: string;
  version: string;
  path: string;
  category: 'ai' | 'runtime' | 'database' | 'web' | 'system' | 'package-manager';
  status: 'installed' | 'running' | 'stopped' | 'unknown';
  description: string;
}

interface Service {
  name: string;
  status: 'running' | 'stopped' | 'disabled';
  port?: number;
  description: string;
  autostart: boolean;
}

interface CronJob {
  schedule: string;
  command: string;
  description: string;
}

interface ToolsData {
  tools: Tool[];
  services: Service[];
  cronJobs: CronJob[];
  globalNpm: string[];
  pipxPackages: string[];
}

interface ToolsOfficeProps {
  onClose: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  ai: '🤖',
  runtime: '⚙️',
  database: '🗄️',
  web: '🌐',
  system: '🖥️',
  'package-manager': '📦',
};

const CATEGORY_COLORS: Record<string, string> = {
  ai: '#8b5cf6',
  runtime: '#3b82f6',
  database: '#22c55e',
  web: '#f59e0b',
  system: '#6b7280',
  'package-manager': '#ec4899',
};

export default function ToolsOffice({ onClose }: ToolsOfficeProps) {
  const [data, setData] = useState<ToolsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tools' | 'services' | 'cron' | 'packages'>('tools');

  useEffect(() => {
    async function fetchTools() {
      try {
        const res = await fetch('/api/vps-dashboard/tools');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error('Failed to fetch tools:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchTools();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl animate-bounce mb-4">🔧</div>
          <p className="text-slate-400">Scanning VPS inventory...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-red-400">Failed to load tools inventory</p>
      </div>
    );
  }

  const toolsByCategory = data.tools.reduce((acc, tool) => {
    if (!acc[tool.category]) acc[tool.category] = [];
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<string, Tool[]>);

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-slate-700 bg-gradient-to-r from-orange-500/10 to-amber-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🧰</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Tools & Inventory</h2>
              <p className="text-slate-400">Everything installed on your VPS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors"
          >
            ← Back
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-6">
          {[
            { id: 'tools', label: 'Tools', icon: '🔧', count: data.tools.length },
            { id: 'services', label: 'Services', icon: '⚡', count: data.services.length },
            { id: 'cron', label: 'Cron Jobs', icon: '⏰', count: data.cronJobs.length },
            { id: 'packages', label: 'Packages', icon: '📦', count: data.globalNpm.length + data.pipxPackages.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                activeTab === tab.id
                  ? 'bg-orange-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
              <span className="bg-slate-900/50 px-2 py-0.5 rounded-full text-xs">{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'tools' && (
          <div className="space-y-6">
            {Object.entries(toolsByCategory).map(([category, tools]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-slate-400 uppercase mb-3 flex items-center gap-2">
                  <span>{CATEGORY_ICONS[category] || '📦'}</span>
                  {category.replace('-', ' ')}
                </h3>
                <div className="grid gap-3">
                  {tools.map((tool) => (
                    <div
                      key={tool.name}
                      className="bg-slate-800 rounded-xl p-4 border border-slate-700 hover:border-slate-600 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${CATEGORY_COLORS[tool.category]}20` }}
                          >
                            <span className="text-xl">{CATEGORY_ICONS[tool.category]}</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-white">{tool.name}</h4>
                            <p className="text-sm text-slate-400">{tool.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              tool.status === 'running'
                                ? 'bg-green-500/20 text-green-400'
                                : tool.status === 'stopped'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-slate-600/50 text-slate-400'
                            }`}
                          >
                            {tool.status}
                          </span>
                          <p className="text-xs text-slate-500 mt-1">v{tool.version}</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-slate-700">
                        <code className="text-xs text-slate-500 font-mono">{tool.path}</code>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'services' && (
          <div className="grid gap-3">
            {data.services.map((service) => (
              <div
                key={service.name}
                className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      service.status === 'running' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                    }`}
                  />
                  <div>
                    <h4 className="font-semibold text-white">{service.name}</h4>
                    <p className="text-sm text-slate-400">{service.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {service.port && (
                    <span className="text-xs text-slate-500">Port {service.port}</span>
                  )}
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      service.autostart
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-slate-600/50 text-slate-500'
                    }`}
                  >
                    {service.autostart ? 'Auto-start' : 'Manual'}
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      service.status === 'running'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {service.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'cron' && (
          <div className="space-y-3">
            {data.cronJobs.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No cron jobs found</p>
            ) : (
              data.cronJobs.map((job, i) => (
                <div
                  key={i}
                  className="bg-slate-800 rounded-xl p-4 border border-slate-700"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <code className="text-sm text-amber-400 font-mono">{job.schedule}</code>
                      <p className="text-slate-300 mt-1">{job.description}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <code className="text-xs text-slate-500 font-mono break-all">{job.command}</code>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'packages' && (
          <div className="space-y-6">
            {/* NPM Global */}
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase mb-3 flex items-center gap-2">
                <span>📦</span> NPM Global Packages ({data.globalNpm.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {data.globalNpm.map((pkg) => (
                  <span
                    key={pkg}
                    className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300"
                  >
                    {pkg}
                  </span>
                ))}
              </div>
            </div>

            {/* Pipx */}
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase mb-3 flex items-center gap-2">
                <span>🐍</span> Pipx Packages ({data.pipxPackages.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {data.pipxPackages.map((pkg) => (
                  <span
                    key={pkg}
                    className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300"
                  >
                    {pkg}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer with warning */}
      <div className="flex-shrink-0 p-4 border-t border-slate-700 bg-slate-800/50">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>⚠️</span>
          <span>
            Found unexpected tools? Use the Fix Modal or terminal to remove them.
            TTYD web terminal is available at port 7681.
          </span>
        </div>
      </div>
    </div>
  );
}
