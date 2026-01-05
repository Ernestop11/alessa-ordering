/**
 * VPS Observatory - System Scanner
 * Scans VPS system components: Nginx, PM2, PostgreSQL, Redis
 *
 * NOTE: This runs server-side and executes shell commands to gather system info.
 * For production VPS, this uses local commands. For development, it returns mock data.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import {
  NginxStatus,
  PM2Status,
  PM2App,
  PostgresStatus,
  RedisStatus,
  SystemMetrics,
  SystemOverview,
  TenantInfo,
  NginxSite,
} from './types';
import prisma from '@/lib/prisma';

const execAsync = promisify(exec);

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

async function runCommand(cmd: string): Promise<string> {
  try {
    const { stdout } = await execAsync(cmd, { timeout: 10000 });
    return stdout.trim();
  } catch (err) {
    console.error(`Command failed: ${cmd}`, err);
    return '';
  }
}

// ============================================
// NGINX SCANNER
// ============================================

export async function scanNginx(): Promise<NginxStatus> {
  if (!IS_PRODUCTION) {
    // Development mock data
    return {
      status: 'running',
      sites: [
        { domain: 'lasreinascolusa.com', configPath: '/etc/nginx/sites-enabled/lasreinascolusa.com', proxyTo: 'localhost:3001', sslExpires: '2026-03-16', status: 'healthy' },
        { domain: 'lapoblanitamexicanfood.com', configPath: '/etc/nginx/sites-enabled/lapoblanita', proxyTo: 'localhost:3001', sslExpires: '2026-03-06', status: 'healthy' },
        { domain: 'alessacloud.com', configPath: '/etc/nginx/sites-enabled/alessacloud.com', proxyTo: 'localhost:3001', sslExpires: '2026-02-16', status: 'healthy' },
        { domain: 'switchmenupro.com', configPath: '/etc/nginx/sites-enabled/switchmenupro.conf', proxyTo: 'localhost:4000', sslExpires: '2026-03-01', status: 'healthy' },
      ],
      requestsPerMin: 142,
      uptime: '2 weeks',
    };
  }

  // Production: actual system commands
  const statusOutput = await runCommand('systemctl is-active nginx');
  const isRunning = statusOutput === 'active';

  // Get sites from nginx config
  const sitesOutput = await runCommand('ls -1 /etc/nginx/sites-enabled/ 2>/dev/null');
  const siteFiles = sitesOutput.split('\n').filter(Boolean);

  const sites: NginxSite[] = [];
  for (const file of siteFiles) {
    if (file === '.' || file === '..') continue;

    const configPath = `/etc/nginx/sites-enabled/${file}`;
    const configContent = await runCommand(`cat ${configPath} 2>/dev/null`);

    // Extract server_name
    const serverNameMatch = configContent.match(/server_name\s+([^;]+);/);
    const domain = serverNameMatch ? serverNameMatch[1].split(' ')[0].trim() : file;

    // Extract proxy_pass
    const proxyMatch = configContent.match(/proxy_pass\s+([^;]+);/);
    const proxyTo = proxyMatch ? proxyMatch[1].replace('http://', '') : 'unknown';

    // Check SSL expiry
    let sslExpires: string | null = null;
    try {
      const sslOutput = await runCommand(
        `echo | openssl s_client -servername ${domain} -connect ${domain}:443 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null`
      );
      if (sslOutput) {
        const match = sslOutput.match(/notAfter=(.+)/);
        if (match) {
          sslExpires = new Date(match[1]).toISOString().split('T')[0];
        }
      }
    } catch {
      // SSL check failed
    }

    sites.push({
      domain,
      configPath,
      proxyTo,
      sslExpires,
      status: isRunning ? 'healthy' : 'error',
    });
  }

  return {
    status: isRunning ? 'running' : 'stopped',
    sites,
    requestsPerMin: 0, // Would need access logs parsing
    uptime: await runCommand("systemctl show nginx --property=ActiveEnterTimestamp | cut -d'=' -f2") || 'unknown',
  };
}

// ============================================
// PM2 SCANNER
// ============================================

export async function scanPM2(): Promise<PM2Status> {
  if (!IS_PRODUCTION) {
    return {
      apps: [
        {
          id: 21,
          name: 'alessa-ordering',
          status: 'online',
          port: 3001,
          memory: '65 MB',
          memoryBytes: 65 * 1024 * 1024,
          cpu: 0,
          uptime: '23 hours',
          restarts: 77,
          pid: 371328,
          serves: ['lasreinascolusa.com', 'lapoblanitamexicanfood.com', 'alessacloud.com'],
        },
        {
          id: 0,
          name: 'switchmenu-api',
          status: 'online',
          port: 4000,
          memory: '125 MB',
          memoryBytes: 125 * 1024 * 1024,
          cpu: 0,
          uptime: '4 days',
          restarts: 18,
          pid: 4164416,
          serves: ['switchmenupro.com'],
        },
      ],
      totalMemory: '190 MB',
    };
  }

  // Production: actual PM2 commands
  const pm2Output = await runCommand('pm2 jlist 2>/dev/null');
  if (!pm2Output) {
    return { apps: [], totalMemory: '0 MB' };
  }

  try {
    const pm2Data = JSON.parse(pm2Output);
    const apps: PM2App[] = pm2Data.map((app: Record<string, unknown>) => {
      const monit = app.monit as Record<string, number> || {};
      const pm2Env = app.pm2_env as Record<string, unknown> || {};

      return {
        id: app.pm_id as number,
        name: app.name as string,
        status: (pm2Env.status as string) || 'stopped',
        port: (pm2Env.PORT as number) || 0,
        memory: formatBytes(monit.memory || 0),
        memoryBytes: monit.memory || 0,
        cpu: monit.cpu || 0,
        uptime: formatUptime(pm2Env.pm_uptime as number),
        restarts: (pm2Env.restart_time as number) || 0,
        pid: app.pid as number || 0,
        serves: [], // Would need to cross-reference with nginx
      };
    });

    const totalBytes = apps.reduce((sum, app) => sum + app.memoryBytes, 0);

    return {
      apps,
      totalMemory: formatBytes(totalBytes),
    };
  } catch (err) {
    console.error('Failed to parse PM2 data:', err);
    return { apps: [], totalMemory: '0 MB' };
  }
}

// ============================================
// POSTGRESQL SCANNER
// ============================================

export async function scanPostgres(): Promise<PostgresStatus> {
  if (!IS_PRODUCTION) {
    return {
      status: 'running',
      version: '15.x',
      connections: 16,
      maxConnections: 100,
      databases: [
        { name: 'alessa_ordering', owner: 'alessa_ordering_user', size: '13 MB', tableCount: 56 },
        { name: 'switchmenu_db', owner: 'switchmenu_user', size: '10 MB', tableCount: 12 },
        { name: 'alessa_db', owner: 'alessa', size: '8 MB', tableCount: 5 },
      ],
      uptime: '60 days',
    };
  }

  // Production: actual PostgreSQL commands
  const isRunning = (await runCommand('systemctl is-active postgresql')) === 'active';

  if (!isRunning) {
    return {
      status: 'stopped',
      version: '',
      connections: 0,
      maxConnections: 0,
      databases: [],
      uptime: '0',
    };
  }

  const version = await runCommand('psql --version | head -1');
  const connections = await runCommand("sudo -u postgres psql -t -c 'SELECT count(*) FROM pg_stat_activity;'");
  const maxConn = await runCommand("sudo -u postgres psql -t -c 'SHOW max_connections;'");

  // Get databases
  const dbOutput = await runCommand(
    "sudo -u postgres psql -t -c \"SELECT datname, pg_size_pretty(pg_database_size(datname)) FROM pg_database WHERE datistemplate = false;\""
  );

  const databases = dbOutput.split('\n')
    .filter(Boolean)
    .map(line => {
      const [name, size] = line.split('|').map(s => s.trim());
      return {
        name,
        owner: 'postgres',
        size,
        tableCount: 0, // Would need per-db query
      };
    });

  return {
    status: 'running',
    version: version.replace('psql (PostgreSQL) ', ''),
    connections: parseInt(connections.trim()) || 0,
    maxConnections: parseInt(maxConn.trim()) || 100,
    databases,
    uptime: '60 days', // Would need to calculate from pg_postmaster_start_time
  };
}

// ============================================
// REDIS SCANNER
// ============================================

export async function scanRedis(): Promise<RedisStatus> {
  if (!IS_PRODUCTION) {
    return {
      status: 'running',
      memory: '16 MB',
      keys: 142,
      uptime: '60 days',
    };
  }

  const ping = await runCommand('redis-cli ping 2>/dev/null');
  if (ping !== 'PONG') {
    return { status: 'stopped', memory: '0', keys: 0, uptime: '0' };
  }

  const info = await runCommand('redis-cli info memory 2>/dev/null');
  const memMatch = info.match(/used_memory_human:(\S+)/);
  const memory = memMatch ? memMatch[1] : '0';

  const keys = await runCommand('redis-cli dbsize 2>/dev/null');
  const keyCount = parseInt(keys.replace(/\D/g, '')) || 0;

  const uptimeInfo = await runCommand('redis-cli info server 2>/dev/null');
  const uptimeMatch = uptimeInfo.match(/uptime_in_days:(\d+)/);
  const uptimeDays = uptimeMatch ? uptimeMatch[1] : '0';

  return {
    status: 'running',
    memory,
    keys: keyCount,
    uptime: `${uptimeDays} days`,
  };
}

// ============================================
// SYSTEM METRICS SCANNER
// ============================================

export async function scanSystemMetrics(): Promise<SystemMetrics> {
  if (!IS_PRODUCTION) {
    return {
      memoryUsed: '1.2 GB',
      memoryTotal: '7.8 GB',
      memoryPercent: 15,
      diskUsed: '43 GB',
      diskTotal: '99 GB',
      diskPercent: 45,
      cpuLoad: 0.14,
      uptime: '60 days',
      uptimeDays: 60,
    };
  }

  // Memory
  const memInfo = await runCommand("free -h | grep Mem | awk '{print $2,$3}'");
  const [memTotal, memUsed] = memInfo.split(' ');
  const memPercent = await runCommand("free | grep Mem | awk '{printf \"%.0f\", $3/$2 * 100}'");

  // Disk
  const diskInfo = await runCommand("df -h / | tail -1 | awk '{print $2,$3,$5}'");
  const [diskTotal, diskUsed, diskPercent] = diskInfo.split(' ');

  // Load
  const load = await runCommand("cat /proc/loadavg | awk '{print $1}'");

  // Uptime
  const uptimeOutput = await runCommand('uptime -p');
  const uptimeDaysMatch = uptimeOutput.match(/(\d+)\s+day/);
  const uptimeDays = uptimeDaysMatch ? parseInt(uptimeDaysMatch[1]) : 0;

  return {
    memoryUsed: memUsed || '0',
    memoryTotal: memTotal || '0',
    memoryPercent: parseInt(memPercent) || 0,
    diskUsed: diskUsed || '0',
    diskTotal: diskTotal || '0',
    diskPercent: parseInt(diskPercent) || 0,
    cpuLoad: parseFloat(load) || 0,
    uptime: uptimeOutput || 'unknown',
    uptimeDays,
  };
}

// ============================================
// TENANT SCANNER
// ============================================

export async function scanTenants(): Promise<TenantInfo[]> {
  try {
    // Get all root tenants (no parent) with their sub-tenants and counts
    const tenants = await prisma.tenant.findMany({
      where: {
        parentTenantId: null, // Only root tenants
      },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        domain: true,
        customDomain: true,
        primaryColor: true,
        secondaryColor: true,
        logoUrl: true,
        parentTenantId: true,
        subTenants: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            primaryColor: true,
            secondaryColor: true,
            logoUrl: true,
            _count: {
              select: {
                menuSections: true,
                menuItems: true,
              },
            },
          },
        },
        _count: {
          select: {
            menuSections: true,
            menuItems: true,
            orders: true,
            customers: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return tenants.map(t => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      status: t.status,
      domain: t.domain,
      customDomain: t.customDomain,
      primaryColor: t.primaryColor,
      secondaryColor: t.secondaryColor,
      logoUrl: t.logoUrl,
      parentTenantId: t.parentTenantId,
      hasAssets: true,
      subTenants: t.subTenants.map(sub => ({
        id: sub.id,
        name: sub.name,
        slug: sub.slug,
        status: sub.status,
        primaryColor: sub.primaryColor,
        secondaryColor: sub.secondaryColor,
        logoUrl: sub.logoUrl,
        menuSectionCount: sub._count.menuSections,
        menuItemCount: sub._count.menuItems,
      })),
      menuSectionCount: t._count.menuSections,
      menuItemCount: t._count.menuItems,
      orderCount: t._count.orders,
      customerCount: t._count.customers,
    }));
  } catch (err) {
    console.error('Failed to scan tenants:', err);
    return [];
  }
}

// ============================================
// FULL SYSTEM OVERVIEW
// ============================================

export async function getSystemOverview(): Promise<SystemOverview> {
  const [nginx, pm2, postgres, redis, system, tenants] = await Promise.all([
    scanNginx(),
    scanPM2(),
    scanPostgres(),
    scanRedis(),
    scanSystemMetrics(),
    scanTenants(),
  ]);

  return {
    nginx,
    pm2,
    postgres,
    redis,
    system,
    tenants,
    scannedAt: new Date().toISOString(),
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatUptime(startTime: number): string {
  if (!startTime) return 'unknown';
  const now = Date.now();
  const diff = now - startTime;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  return `${hours} hours`;
}
