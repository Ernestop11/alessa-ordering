'use client';

import { useState, useEffect } from 'react';
import { SystemOverview, NginxSite, PM2App } from '@/lib/vps-dashboard/types';

interface StatusLightsProps {
  system: SystemOverview;
}

interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  component: string;
  timestamp: Date;
}

function getSystemAlerts(system: SystemOverview): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date();

  // Check Nginx
  if (system.nginx.status !== 'running') {
    alerts.push({
      id: 'nginx-down',
      severity: 'critical',
      title: 'NGINX DOWN',
      message: 'Nginx gateway is not running. All sites are inaccessible!',
      component: 'nginx',
      timestamp: now,
    });
  }

  // Check each Nginx site
  system.nginx.sites.forEach((site) => {
    if (site.status === 'error') {
      alerts.push({
        id: `site-${site.domain}`,
        severity: 'critical',
        title: `Site Down: ${site.domain}`,
        message: `${site.domain} is not responding`,
        component: 'nginx',
        timestamp: now,
      });
    }

    // SSL expiry warning
    if (site.sslExpires) {
      const expiryDate = new Date(site.sslExpires);
      const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry < 7) {
        alerts.push({
          id: `ssl-${site.domain}`,
          severity: daysUntilExpiry < 3 ? 'critical' : 'warning',
          title: `SSL Expiring: ${site.domain}`,
          message: `SSL certificate expires in ${daysUntilExpiry} days`,
          component: 'nginx',
          timestamp: now,
        });
      }
    }
  });

  // Check PM2 apps
  system.pm2.apps.forEach((app) => {
    if (app.status === 'errored') {
      alerts.push({
        id: `pm2-${app.name}`,
        severity: 'critical',
        title: `App Crashed: ${app.name}`,
        message: `${app.name} has crashed and is in errored state`,
        component: 'pm2',
        timestamp: now,
      });
    } else if (app.status === 'stopped') {
      alerts.push({
        id: `pm2-stopped-${app.name}`,
        severity: 'warning',
        title: `App Stopped: ${app.name}`,
        message: `${app.name} is stopped`,
        component: 'pm2',
        timestamp: now,
      });
    }

    // High restart count warning
    if (app.restarts > 50) {
      alerts.push({
        id: `pm2-restarts-${app.name}`,
        severity: 'warning',
        title: `High Restarts: ${app.name}`,
        message: `${app.name} has restarted ${app.restarts} times`,
        component: 'pm2',
        timestamp: now,
      });
    }
  });

  // Check PostgreSQL
  if (system.postgres.status !== 'running') {
    alerts.push({
      id: 'postgres-down',
      severity: 'critical',
      title: 'DATABASE DOWN',
      message: 'PostgreSQL database is not running!',
      component: 'postgres',
      timestamp: now,
    });
  } else {
    // Connection pool warning
    const connPercent = (system.postgres.connections / system.postgres.maxConnections) * 100;
    if (connPercent > 80) {
      alerts.push({
        id: 'postgres-connections',
        severity: connPercent > 95 ? 'critical' : 'warning',
        title: 'High DB Connections',
        message: `${system.postgres.connections}/${system.postgres.maxConnections} connections (${Math.round(connPercent)}%)`,
        component: 'postgres',
        timestamp: now,
      });
    }
  }

  // Check Redis
  if (system.redis.status !== 'running') {
    alerts.push({
      id: 'redis-down',
      severity: 'warning',
      title: 'REDIS DOWN',
      message: 'Redis cache is not running. Performance may be degraded.',
      component: 'redis',
      timestamp: now,
    });
  }

  // Check system resources
  if (system.system.memoryPercent > 90) {
    alerts.push({
      id: 'memory-high',
      severity: system.system.memoryPercent > 95 ? 'critical' : 'warning',
      title: 'High Memory Usage',
      message: `Memory at ${system.system.memoryPercent}% (${system.system.memoryUsed}/${system.system.memoryTotal})`,
      component: 'system',
      timestamp: now,
    });
  }

  if (system.system.diskPercent > 85) {
    alerts.push({
      id: 'disk-high',
      severity: system.system.diskPercent > 95 ? 'critical' : 'warning',
      title: 'High Disk Usage',
      message: `Disk at ${system.system.diskPercent}% (${system.system.diskUsed}/${system.system.diskTotal})`,
      component: 'system',
      timestamp: now,
    });
  }

  return alerts;
}

export default function StatusLights({ system }: StatusLightsProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isAlarmActive, setIsAlarmActive] = useState(false);

  useEffect(() => {
    const newAlerts = getSystemAlerts(system);
    setAlerts(newAlerts);
    setIsAlarmActive(newAlerts.some(a => a.severity === 'critical'));
  }, [system]);

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;

  return (
    <div className="h-full overflow-auto p-6 bg-slate-950">
      {/* Submarine Command Center Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">⚓ COMMAND CENTER</h2>
        <p className="text-slate-400">Real-time system status monitoring</p>
      </div>

      {/* Alert Banner */}
      {isAlarmActive && (
        <div className="mb-8 bg-red-900/50 border-2 border-red-500 rounded-xl p-4 animate-pulse">
          <div className="flex items-center justify-center gap-4">
            <span className="text-4xl">🚨</span>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-red-400">CRITICAL ALERT</h3>
              <p className="text-red-300">{criticalCount} critical issue(s) detected</p>
            </div>
            <span className="text-4xl">🚨</span>
          </div>
        </div>
      )}

      {/* Status Summary */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className={`rounded-xl p-4 text-center border-2 ${
          system.nginx.status === 'running'
            ? 'bg-green-900/30 border-green-500'
            : 'bg-red-900/30 border-red-500 animate-pulse'
        }`}>
          <div className={`w-8 h-8 rounded-full mx-auto mb-2 ${
            system.nginx.status === 'running' ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-red-500 shadow-lg shadow-red-500/50 animate-ping'
          }`} />
          <div className="text-lg font-bold text-white">NGINX</div>
          <div className={system.nginx.status === 'running' ? 'text-green-400' : 'text-red-400'}>
            {system.nginx.status === 'running' ? 'ONLINE' : 'OFFLINE'}
          </div>
        </div>

        <div className={`rounded-xl p-4 text-center border-2 ${
          system.pm2.apps.every(a => a.status === 'online')
            ? 'bg-green-900/30 border-green-500'
            : system.pm2.apps.some(a => a.status === 'errored')
            ? 'bg-red-900/30 border-red-500 animate-pulse'
            : 'bg-yellow-900/30 border-yellow-500'
        }`}>
          <div className={`w-8 h-8 rounded-full mx-auto mb-2 ${
            system.pm2.apps.every(a => a.status === 'online')
              ? 'bg-green-500 shadow-lg shadow-green-500/50'
              : system.pm2.apps.some(a => a.status === 'errored')
              ? 'bg-red-500 shadow-lg shadow-red-500/50 animate-ping'
              : 'bg-yellow-500 shadow-lg shadow-yellow-500/50'
          }`} />
          <div className="text-lg font-bold text-white">PM2</div>
          <div className={
            system.pm2.apps.every(a => a.status === 'online') ? 'text-green-400' :
            system.pm2.apps.some(a => a.status === 'errored') ? 'text-red-400' : 'text-yellow-400'
          }>
            {system.pm2.apps.filter(a => a.status === 'online').length}/{system.pm2.apps.length} ONLINE
          </div>
        </div>

        <div className={`rounded-xl p-4 text-center border-2 ${
          system.postgres.status === 'running'
            ? 'bg-green-900/30 border-green-500'
            : 'bg-red-900/30 border-red-500 animate-pulse'
        }`}>
          <div className={`w-8 h-8 rounded-full mx-auto mb-2 ${
            system.postgres.status === 'running' ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-red-500 shadow-lg shadow-red-500/50 animate-ping'
          }`} />
          <div className="text-lg font-bold text-white">POSTGRES</div>
          <div className={system.postgres.status === 'running' ? 'text-green-400' : 'text-red-400'}>
            {system.postgres.status === 'running' ? 'ONLINE' : 'OFFLINE'}
          </div>
        </div>

        <div className={`rounded-xl p-4 text-center border-2 ${
          system.redis.status === 'running'
            ? 'bg-green-900/30 border-green-500'
            : 'bg-yellow-900/30 border-yellow-500'
        }`}>
          <div className={`w-8 h-8 rounded-full mx-auto mb-2 ${
            system.redis.status === 'running' ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-yellow-500 shadow-lg shadow-yellow-500/50'
          }`} />
          <div className="text-lg font-bold text-white">REDIS</div>
          <div className={system.redis.status === 'running' ? 'text-green-400' : 'text-yellow-400'}>
            {system.redis.status === 'running' ? 'ONLINE' : 'OFFLINE'}
          </div>
        </div>
      </div>

      {/* Resource Gauges */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Memory Gauge */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-sm font-semibold text-slate-400 mb-4 text-center">MEMORY</h3>
          <div className="relative w-32 h-32 mx-auto">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#334155" strokeWidth="12" />
              <circle
                cx="50" cy="50" r="40" fill="none"
                stroke={system.system.memoryPercent > 90 ? '#ef4444' : system.system.memoryPercent > 70 ? '#f59e0b' : '#22c55e'}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${system.system.memoryPercent * 2.51} 251`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{system.system.memoryPercent}%</span>
            </div>
          </div>
          <div className="text-center mt-2 text-sm text-slate-400">
            {system.system.memoryUsed} / {system.system.memoryTotal}
          </div>
        </div>

        {/* Disk Gauge */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-sm font-semibold text-slate-400 mb-4 text-center">DISK</h3>
          <div className="relative w-32 h-32 mx-auto">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#334155" strokeWidth="12" />
              <circle
                cx="50" cy="50" r="40" fill="none"
                stroke={system.system.diskPercent > 90 ? '#ef4444' : system.system.diskPercent > 70 ? '#f59e0b' : '#22c55e'}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${system.system.diskPercent * 2.51} 251`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{system.system.diskPercent}%</span>
            </div>
          </div>
          <div className="text-center mt-2 text-sm text-slate-400">
            {system.system.diskUsed} / {system.system.diskTotal}
          </div>
        </div>

        {/* CPU Load */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-sm font-semibold text-slate-400 mb-4 text-center">CPU LOAD</h3>
          <div className="relative w-32 h-32 mx-auto">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#334155" strokeWidth="12" />
              <circle
                cx="50" cy="50" r="40" fill="none"
                stroke={system.system.cpuLoad > 4 ? '#ef4444' : system.system.cpuLoad > 2 ? '#f59e0b' : '#22c55e'}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${Math.min(system.system.cpuLoad * 25, 100) * 2.51} 251`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{system.system.cpuLoad}</span>
            </div>
          </div>
          <div className="text-center mt-2 text-sm text-slate-400">
            Load Average
          </div>
        </div>
      </div>

      {/* Alerts Log */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="px-4 py-3 bg-slate-700/50 border-b border-slate-600 flex items-center justify-between">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <span>📋</span> Alert Log
          </h3>
          <div className="flex items-center gap-3 text-sm">
            {criticalCount > 0 && (
              <span className="flex items-center gap-1 text-red-400">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                {criticalCount} Critical
              </span>
            )}
            {warningCount > 0 && (
              <span className="flex items-center gap-1 text-yellow-400">
                <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                {warningCount} Warning
              </span>
            )}
            {alerts.length === 0 && (
              <span className="text-green-400">✓ All Systems Operational</span>
            )}
          </div>
        </div>

        <div className="max-h-64 overflow-auto">
          {alerts.length === 0 ? (
            <div className="p-8 text-center">
              <span className="text-6xl mb-4 block">✅</span>
              <p className="text-green-400 font-semibold">All Systems Operational</p>
              <p className="text-slate-500 text-sm mt-1">No alerts at this time</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 flex items-start gap-4 ${
                    alert.severity === 'critical' ? 'bg-red-900/20' :
                    alert.severity === 'warning' ? 'bg-yellow-900/20' : ''
                  }`}
                >
                  <span className={`text-2xl ${
                    alert.severity === 'critical' ? 'animate-pulse' : ''
                  }`}>
                    {alert.severity === 'critical' ? '🔴' : alert.severity === 'warning' ? '🟡' : '🔵'}
                  </span>
                  <div className="flex-1">
                    <h4 className={`font-semibold ${
                      alert.severity === 'critical' ? 'text-red-400' :
                      alert.severity === 'warning' ? 'text-yellow-400' : 'text-blue-400'
                    }`}>
                      {alert.title}
                    </h4>
                    <p className="text-sm text-slate-400">{alert.message}</p>
                  </div>
                  <span className="text-xs text-slate-500 uppercase">{alert.component}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Uptime Badge */}
      <div className="mt-6 text-center">
        <div className="inline-flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-full border border-slate-700">
          <span className="text-green-400">⏱️</span>
          <span className="text-slate-300">System Uptime: <span className="text-white font-semibold">{system.system.uptime}</span></span>
        </div>
      </div>
    </div>
  );
}
