'use client';

import { useState } from 'react';
import { SystemOverview } from '@/lib/vps-dashboard/types';

interface FixModalProps {
  isOpen: boolean;
  onClose: () => void;
  componentType: 'nginx' | 'pm2' | 'postgres' | 'redis' | 'system' | null;
  system: SystemOverview;
  onNavigate: (target: 'nginx' | 'pm2' | 'postgres' | 'redis') => void;
}

interface FixAction {
  id: string;
  label: string;
  description: string;
  command: string;
  severity: 'safe' | 'caution' | 'danger';
}

function getFixActions(componentType: string | null, system: SystemOverview): FixAction[] {
  switch (componentType) {
    case 'nginx':
      return [
        {
          id: 'nginx-status',
          label: 'Check Nginx Status',
          description: 'View detailed Nginx status and error logs',
          command: 'sudo systemctl status nginx && sudo nginx -t',
          severity: 'safe',
        },
        {
          id: 'nginx-restart',
          label: 'Restart Nginx',
          description: 'Gracefully restart the Nginx service',
          command: 'sudo systemctl restart nginx',
          severity: 'caution',
        },
        {
          id: 'nginx-reload',
          label: 'Reload Config',
          description: 'Reload Nginx configuration without downtime',
          command: 'sudo nginx -s reload',
          severity: 'safe',
        },
        {
          id: 'nginx-logs',
          label: 'View Error Logs',
          description: 'Check recent error logs',
          command: 'sudo tail -50 /var/log/nginx/error.log',
          severity: 'safe',
        },
      ];

    case 'pm2':
      const crashedApps = system.pm2.apps.filter(a => a.status !== 'online');
      return [
        {
          id: 'pm2-status',
          label: 'Check PM2 Status',
          description: 'View all PM2 processes and their status',
          command: 'pm2 list',
          severity: 'safe',
        },
        ...(crashedApps.length > 0
          ? crashedApps.map((app) => ({
              id: `pm2-restart-${app.name}`,
              label: `Restart ${app.name}`,
              description: `Restart the crashed ${app.name} application`,
              command: `pm2 restart ${app.name}`,
              severity: 'caution' as const,
            }))
          : []),
        {
          id: 'pm2-logs',
          label: 'View PM2 Logs',
          description: 'Check recent application logs',
          command: 'pm2 logs --lines 50',
          severity: 'safe',
        },
        {
          id: 'pm2-restart-all',
          label: 'Restart All Apps',
          description: 'Restart all PM2 managed applications',
          command: 'pm2 restart all',
          severity: 'danger',
        },
      ];

    case 'postgres':
      return [
        {
          id: 'pg-status',
          label: 'Check PostgreSQL Status',
          description: 'View PostgreSQL service status',
          command: 'sudo systemctl status postgresql',
          severity: 'safe',
        },
        {
          id: 'pg-restart',
          label: 'Restart PostgreSQL',
          description: 'Restart the PostgreSQL service',
          command: 'sudo systemctl restart postgresql',
          severity: 'danger',
        },
        {
          id: 'pg-connections',
          label: 'Check Connections',
          description: 'View active database connections',
          command: 'sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"',
          severity: 'safe',
        },
        {
          id: 'pg-logs',
          label: 'View Logs',
          description: 'Check recent PostgreSQL logs',
          command: 'sudo tail -50 /var/log/postgresql/postgresql-*-main.log',
          severity: 'safe',
        },
      ];

    case 'redis':
      return [
        {
          id: 'redis-status',
          label: 'Check Redis Status',
          description: 'View Redis service status',
          command: 'sudo systemctl status redis',
          severity: 'safe',
        },
        {
          id: 'redis-start',
          label: 'Start Redis',
          description: 'Start the Redis service if stopped',
          command: 'sudo systemctl start redis',
          severity: 'safe',
        },
        {
          id: 'redis-restart',
          label: 'Restart Redis',
          description: 'Restart the Redis service',
          command: 'sudo systemctl restart redis',
          severity: 'caution',
        },
        {
          id: 'redis-info',
          label: 'View Redis Info',
          description: 'Get Redis server information',
          command: 'redis-cli info',
          severity: 'safe',
        },
      ];

    default:
      return [];
  }
}

export default function FixModal({ isOpen, onClose, componentType, system, onNavigate }: FixModalProps) {
  const [executing, setExecuting] = useState<string | null>(null);
  const [output, setOutput] = useState<string>('');
  const [showOutput, setShowOutput] = useState(false);

  if (!isOpen || !componentType) return null;

  const actions = getFixActions(componentType, system);

  const componentLabels: Record<string, { icon: string; label: string; color: string }> = {
    nginx: { icon: '🛡️', label: 'Nginx Gateway', color: '#22c55e' },
    pm2: { icon: '⚡', label: 'PM2 Process Manager', color: '#3b82f6' },
    postgres: { icon: '🐘', label: 'PostgreSQL Database', color: '#8b5cf6' },
    redis: { icon: '🔴', label: 'Redis Cache', color: '#ef4444' },
  };

  const info = componentLabels[componentType] || { icon: '❓', label: componentType, color: '#64748b' };

  const executeAction = async (action: FixAction) => {
    setExecuting(action.id);
    setOutput('');
    setShowOutput(true);

    try {
      // Call the fix API endpoint
      const response = await fetch('/api/vps-dashboard/fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: action.command }),
      });

      const data = await response.json();
      setOutput(data.output || data.error || 'Command executed');
    } catch (error) {
      setOutput(`Error: ${error instanceof Error ? error.message : 'Failed to execute command'}`);
    } finally {
      setExecuting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div
          className="p-6 border-b border-slate-700"
          style={{ background: `linear-gradient(135deg, ${info.color}20 0%, transparent 50%)` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{info.icon}</span>
              <div>
                <h2 className="text-xl font-bold text-white">{info.label}</h2>
                <p className="text-sm text-slate-400">Troubleshooting & Quick Actions</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-2"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Status Summary */}
          <div className="mb-6 p-4 bg-slate-900 rounded-xl border border-slate-700">
            <h3 className="text-sm font-semibold text-slate-400 mb-3">Current Status</h3>
            {componentType === 'nginx' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Service Status</span>
                  <span className={system.nginx.status === 'running' ? 'text-green-400' : 'text-red-400'}>
                    {system.nginx.status === 'running' ? '● Running' : '● Stopped'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Active Sites</span>
                  <span className="text-white">{system.nginx.sites.length}</span>
                </div>
              </div>
            )}
            {componentType === 'pm2' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Total Apps</span>
                  <span className="text-white">{system.pm2.apps.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Online</span>
                  <span className="text-green-400">{system.pm2.apps.filter(a => a.status === 'online').length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Errored/Stopped</span>
                  <span className={system.pm2.apps.some(a => a.status !== 'online') ? 'text-red-400' : 'text-slate-500'}>
                    {system.pm2.apps.filter(a => a.status !== 'online').length}
                  </span>
                </div>
              </div>
            )}
            {componentType === 'postgres' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Service Status</span>
                  <span className={system.postgres.status === 'running' ? 'text-green-400' : 'text-red-400'}>
                    {system.postgres.status === 'running' ? '● Running' : '● Stopped'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Connections</span>
                  <span className="text-white">{system.postgres.connections}/{system.postgres.maxConnections}</span>
                </div>
              </div>
            )}
            {componentType === 'redis' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Service Status</span>
                  <span className={system.redis.status === 'running' ? 'text-green-400' : 'text-red-400'}>
                    {system.redis.status === 'running' ? '● Running' : '● Stopped'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Memory Used</span>
                  <span className="text-white">{system.redis.memory}</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-400 mb-3">Quick Actions</h3>
            <div className="grid gap-2">
              {actions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => executeAction(action)}
                  disabled={executing !== null}
                  className={`
                    flex items-center justify-between p-4 rounded-xl border transition-all text-left
                    ${executing === action.id ? 'bg-blue-900/30 border-blue-500' : 'bg-slate-900 border-slate-700 hover:border-slate-500'}
                    ${executing !== null && executing !== action.id ? 'opacity-50' : ''}
                  `}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{action.label}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          action.severity === 'safe'
                            ? 'bg-green-500/20 text-green-400'
                            : action.severity === 'caution'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {action.severity}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mt-1">{action.description}</p>
                    <code className="text-xs text-slate-500 mt-1 block font-mono">{action.command}</code>
                  </div>
                  {executing === action.id ? (
                    <span className="ml-4 text-blue-400 animate-spin">⟳</span>
                  ) : (
                    <span className="ml-4 text-slate-500">▶</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Command Output */}
          {showOutput && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-400">Output</h3>
                <button
                  onClick={() => setShowOutput(false)}
                  className="text-xs text-slate-500 hover:text-white"
                >
                  Clear
                </button>
              </div>
              <pre className="bg-slate-950 rounded-xl p-4 text-sm text-slate-300 font-mono overflow-x-auto max-h-64 overflow-y-auto border border-slate-700">
                {output || 'Waiting for output...'}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 flex justify-between">
          <button
            onClick={() => {
              onClose();
              if (componentType && componentType !== 'system') {
                onNavigate(componentType as 'nginx' | 'pm2' | 'postgres' | 'redis');
              }
            }}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <span>🔍</span>
            View Full Office
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
