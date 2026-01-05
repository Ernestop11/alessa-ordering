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
  fixSteps?: FixStep[];
}

interface FixStep {
  id: string;
  title: string;
  command?: string;
  description: string;
  risk: 'safe' | 'moderate' | 'dangerous';
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
      fixSteps: [
        { id: 'nginx-1', title: 'Check Nginx Status', command: 'systemctl status nginx', description: 'View current Nginx service status and recent logs', risk: 'safe' },
        { id: 'nginx-2', title: 'Test Configuration', command: 'nginx -t', description: 'Validate Nginx configuration files for syntax errors', risk: 'safe' },
        { id: 'nginx-3', title: 'Restart Nginx', command: 'sudo systemctl restart nginx', description: 'Restart the Nginx service', risk: 'moderate' },
        { id: 'nginx-4', title: 'View Error Logs', command: 'tail -50 /var/log/nginx/error.log', description: 'Check recent error logs for issues', risk: 'safe' },
      ],
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
        fixSteps: [
          { id: 'site-1', title: 'Check Site Config', command: `cat /etc/nginx/sites-enabled/${site.domain}`, description: 'View the Nginx configuration for this site', risk: 'safe' },
          { id: 'site-2', title: 'Test Connectivity', command: `curl -I ${site.domain}`, description: 'Test if the site responds to HTTP requests', risk: 'safe' },
          { id: 'site-3', title: 'Check Upstream', command: `curl -I localhost${site.proxyTo}`, description: 'Test if the upstream application is responding', risk: 'safe' },
          { id: 'site-4', title: 'Reload Nginx', command: 'sudo nginx -s reload', description: 'Reload Nginx configuration without downtime', risk: 'moderate' },
        ],
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
          fixSteps: [
            { id: 'ssl-1', title: 'Check Certificate', command: `sudo certbot certificates -d ${site.domain}`, description: 'View current certificate status and expiry date', risk: 'safe' },
            { id: 'ssl-2', title: 'Test Renewal', command: `sudo certbot renew --dry-run`, description: 'Test certificate renewal without making changes', risk: 'safe' },
            { id: 'ssl-3', title: 'Renew Certificate', command: `sudo certbot renew`, description: 'Renew SSL certificate using Certbot', risk: 'moderate' },
          ],
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
        fixSteps: [
          { id: 'pm2-1', title: 'View Error Logs', command: `pm2 logs ${app.name} --lines 50`, description: 'Check recent logs to see the crash error', risk: 'safe' },
          { id: 'pm2-2', title: 'Check App Info', command: `pm2 show ${app.name}`, description: 'View detailed app information and status', risk: 'safe' },
          { id: 'pm2-3', title: 'Restart App', command: `pm2 restart ${app.name}`, description: 'Restart the application', risk: 'moderate' },
          { id: 'pm2-4', title: 'Reset Restart Count', command: `pm2 reset ${app.name}`, description: 'Reset the restart counter to 0', risk: 'safe' },
        ],
      });
    } else if (app.status === 'stopped') {
      alerts.push({
        id: `pm2-stopped-${app.name}`,
        severity: 'warning',
        title: `App Stopped: ${app.name}`,
        message: `${app.name} is stopped`,
        component: 'pm2',
        timestamp: now,
        fixSteps: [
          { id: 'pm2-1', title: 'Check Status', command: `pm2 status`, description: 'View all PM2 processes and their status', risk: 'safe' },
          { id: 'pm2-2', title: 'View Logs', command: `pm2 logs ${app.name} --lines 30`, description: 'Check logs before the app stopped', risk: 'safe' },
          { id: 'pm2-3', title: 'Start App', command: `pm2 start ${app.name}`, description: 'Start the stopped application', risk: 'safe' },
        ],
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
        fixSteps: [
          { id: 'pm2-1', title: 'View Recent Logs', command: `pm2 logs ${app.name} --lines 100`, description: 'Check logs for crash patterns', risk: 'safe' },
          { id: 'pm2-2', title: 'Monitor App', command: `pm2 monit`, description: 'Open real-time monitoring dashboard', risk: 'safe' },
          { id: 'pm2-3', title: 'Reset Counter', command: `pm2 reset ${app.name}`, description: 'Reset the restart counter to track fresh restarts', risk: 'safe' },
          { id: 'pm2-4', title: 'Check Memory', command: `pm2 show ${app.name} | grep memory`, description: 'Check if memory limits are being hit', risk: 'safe' },
        ],
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
      fixSteps: [
        { id: 'pg-1', title: 'Check Status', command: 'systemctl status postgresql', description: 'View PostgreSQL service status', risk: 'safe' },
        { id: 'pg-2', title: 'View Logs', command: 'sudo journalctl -u postgresql --since "1 hour ago"', description: 'Check recent PostgreSQL logs', risk: 'safe' },
        { id: 'pg-3', title: 'Start Database', command: 'sudo systemctl start postgresql', description: 'Start the PostgreSQL service', risk: 'moderate' },
        { id: 'pg-4', title: 'Check Disk Space', command: 'df -h /var/lib/postgresql', description: 'Verify disk space for database files', risk: 'safe' },
      ],
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
        fixSteps: [
          { id: 'conn-1', title: 'View Active Connections', command: "sudo -u postgres psql -c \"SELECT pid, usename, application_name, state FROM pg_stat_activity WHERE state != 'idle';\"", description: 'List all active database connections', risk: 'safe' },
          { id: 'conn-2', title: 'Kill Idle Connections', command: "sudo -u postgres psql -c \"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND pid <> pg_backend_pid();\"", description: 'Terminate idle connections to free up pool', risk: 'moderate' },
          { id: 'conn-3', title: 'Restart PM2 Apps', command: 'pm2 restart all', description: 'Restart all apps to reset their connection pools', risk: 'moderate' },
        ],
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
      fixSteps: [
        { id: 'redis-1', title: 'Check Status', command: 'systemctl status redis', description: 'View Redis service status', risk: 'safe' },
        { id: 'redis-2', title: 'Start Redis', command: 'sudo systemctl start redis', description: 'Start the Redis service', risk: 'safe' },
        { id: 'redis-3', title: 'Check Memory', command: 'redis-cli info memory', description: 'Check Redis memory usage', risk: 'safe' },
      ],
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
      fixSteps: [
        { id: 'mem-1', title: 'View Top Processes', command: 'ps aux --sort=-%mem | head -15', description: 'List processes using the most memory', risk: 'safe' },
        { id: 'mem-2', title: 'Clear System Cache', command: 'sudo sync && sudo sh -c "echo 3 > /proc/sys/vm/drop_caches"', description: 'Clear system page cache (safe, temporary)', risk: 'safe' },
        { id: 'mem-3', title: 'Restart Heavy Apps', command: 'pm2 restart alessa-ordering', description: 'Restart apps to release memory', risk: 'moderate' },
      ],
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
      fixSteps: [
        { id: 'disk-1', title: 'Find Large Files', command: 'du -ah / 2>/dev/null | sort -rh | head -20', description: 'Find the largest files on disk', risk: 'safe' },
        { id: 'disk-2', title: 'Clean PM2 Logs', command: 'pm2 flush', description: 'Clear all PM2 log files', risk: 'safe' },
        { id: 'disk-3', title: 'Clean Journal Logs', command: 'sudo journalctl --vacuum-time=7d', description: 'Remove system logs older than 7 days', risk: 'safe' },
        { id: 'disk-4', title: 'Clean Apt Cache', command: 'sudo apt autoremove && sudo apt clean', description: 'Remove unused packages and clean apt cache', risk: 'safe' },
      ],
    });
  }

  return alerts;
}

export default function StatusLights({ system }: StatusLightsProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [commandOutput, setCommandOutput] = useState<string>('');
  const [isRunningCommand, setIsRunningCommand] = useState(false);

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
                  onClick={() => alert.fixSteps && setSelectedAlert(alert)}
                  className={`p-4 flex items-start gap-4 cursor-pointer hover:bg-slate-700/50 transition-colors ${
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
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 uppercase">{alert.component}</span>
                    {alert.fixSteps && (
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                        Fix →
                      </span>
                    )}
                  </div>
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

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className={`p-6 border-b border-slate-700 ${
              selectedAlert.severity === 'critical' ? 'bg-red-900/30' : 'bg-yellow-900/30'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-4xl">
                    {selectedAlert.severity === 'critical' ? '🔴' : '🟡'}
                  </span>
                  <div>
                    <h3 className={`text-xl font-bold ${
                      selectedAlert.severity === 'critical' ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {selectedAlert.title}
                    </h3>
                    <p className="text-slate-400">{selectedAlert.message}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedAlert(null);
                    setCommandOutput('');
                  }}
                  className="text-slate-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Fix Steps */}
            <div className="flex-1 overflow-auto p-6">
              <h4 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wide">
                Troubleshooting Steps
              </h4>
              <div className="space-y-3">
                {selectedAlert.fixSteps?.map((step, index) => (
                  <div
                    key={step.id}
                    className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-sm text-slate-400">
                            {index + 1}
                          </span>
                          <h5 className="font-semibold text-white">{step.title}</h5>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          step.risk === 'safe' ? 'bg-green-500/20 text-green-400' :
                          step.risk === 'moderate' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {step.risk}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 mb-3">{step.description}</p>
                      {step.command && (
                        <div className="flex items-center gap-2">
                          <code className="flex-1 bg-slate-900 px-3 py-2 rounded-lg text-sm font-mono text-cyan-400 overflow-x-auto">
                            {step.command}
                          </code>
                          <button
                            onClick={() => navigator.clipboard.writeText(step.command || '')}
                            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-slate-300 transition-colors"
                          >
                            Copy
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Command Output (if any) */}
              {commandOutput && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                    Command Output
                  </h4>
                  <pre className="bg-black rounded-xl p-4 text-sm font-mono text-green-400 overflow-auto max-h-48">
                    {commandOutput}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-700 bg-slate-800/50 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                💡 Tip: Copy commands and run them in TTYD terminal or SSH
              </p>
              <div className="flex items-center gap-2">
                <a
                  href="http://77.243.85.8:7681"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Open Terminal (TTYD)
                </a>
                <button
                  onClick={() => {
                    setSelectedAlert(null);
                    setCommandOutput('');
                  }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
