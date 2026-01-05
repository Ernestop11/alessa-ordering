import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

interface Tool {
  name: string;
  version: string;
  path: string;
  category: 'ai' | 'runtime' | 'database' | 'web' | 'system' | 'package-manager';
  status: 'installed' | 'running' | 'stopped' | 'unknown';
  description: string;
  installedAt?: string;
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

async function runCommand(cmd: string): Promise<string> {
  try {
    const { stdout } = await execAsync(cmd, { timeout: 10000 });
    return stdout.trim();
  } catch {
    return '';
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session || role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!IS_PRODUCTION) {
    // Return mock data for development
    return NextResponse.json({
      tools: [
        { name: 'aider', version: '0.86.1', path: '/root/.local/bin/aider', category: 'ai', status: 'installed', description: 'AI coding assistant' },
        { name: 'ollama', version: '0.1.0', path: '/usr/local/bin/ollama', category: 'ai', status: 'stopped', description: 'Local LLM server' },
        { name: 'node', version: '20.x', path: '/usr/bin/node', category: 'runtime', status: 'installed', description: 'Node.js runtime' },
        { name: 'python3', version: '3.11', path: '/usr/bin/python3', category: 'runtime', status: 'installed', description: 'Python runtime' },
      ],
      services: [
        { name: 'ttyd', status: 'running', port: 7681, description: 'Web terminal', autostart: true },
        { name: 'ollama', status: 'stopped', description: 'Local AI', autostart: false },
      ],
      cronJobs: [
        { schedule: '*/5 * * * *', command: '/root/health-check.sh', description: 'Health check' },
      ],
      globalNpm: ['pm2', 'code-server', 'create-next-app'],
      pipxPackages: ['aider-chat'],
    });
  }

  try {
    // Scan for tools
    const tools: Tool[] = [];

    // Check AI tools
    const aiderVersion = await runCommand('aider --version 2>/dev/null');
    if (aiderVersion) {
      tools.push({
        name: 'aider',
        version: aiderVersion.split(' ').pop() || aiderVersion,
        path: await runCommand('which aider'),
        category: 'ai',
        status: 'installed',
        description: 'AI pair programming assistant',
      });
    }

    const ollamaVersion = await runCommand('ollama --version 2>/dev/null');
    const ollamaStatus = await runCommand('systemctl is-active ollama 2>/dev/null');
    if (ollamaVersion) {
      tools.push({
        name: 'ollama',
        version: ollamaVersion.replace('ollama version ', ''),
        path: '/usr/local/bin/ollama',
        category: 'ai',
        status: ollamaStatus === 'active' ? 'running' : 'stopped',
        description: 'Local LLM server',
      });
    }

    // Check runtimes
    const nodeVersion = await runCommand('node --version 2>/dev/null');
    if (nodeVersion) {
      tools.push({
        name: 'node',
        version: nodeVersion.replace('v', ''),
        path: await runCommand('which node'),
        category: 'runtime',
        status: 'installed',
        description: 'Node.js JavaScript runtime',
      });
    }

    const pythonVersion = await runCommand('python3 --version 2>/dev/null');
    if (pythonVersion) {
      tools.push({
        name: 'python3',
        version: pythonVersion.replace('Python ', ''),
        path: await runCommand('which python3'),
        category: 'runtime',
        status: 'installed',
        description: 'Python runtime',
      });
    }

    // Check databases
    const mongoVersion = await runCommand('mongod --version 2>/dev/null | head -1');
    const mongoStatus = await runCommand('systemctl is-active mongod 2>/dev/null');
    if (mongoVersion) {
      tools.push({
        name: 'mongodb',
        version: mongoVersion.match(/v[\d.]+/)?.[0] || 'unknown',
        path: await runCommand('which mongod'),
        category: 'database',
        status: mongoStatus === 'active' ? 'running' : 'stopped',
        description: 'NoSQL document database',
      });
    }

    const mariaVersion = await runCommand('mariadb --version 2>/dev/null');
    const mariaStatus = await runCommand('systemctl is-active mariadb 2>/dev/null');
    if (mariaVersion) {
      tools.push({
        name: 'mariadb',
        version: mariaVersion.match(/[\d.]+/)?.[0] || 'unknown',
        path: await runCommand('which mariadb'),
        category: 'database',
        status: mariaStatus === 'active' ? 'running' : 'stopped',
        description: 'MySQL-compatible database',
      });
    }

    // Check web tools
    const ttydStatus = await runCommand('systemctl is-active ttyd 2>/dev/null');
    if (ttydStatus) {
      tools.push({
        name: 'ttyd',
        version: 'web terminal',
        path: '/usr/local/bin/ttyd',
        category: 'web',
        status: ttydStatus === 'active' ? 'running' : 'stopped',
        description: 'Web-based terminal (port 7681)',
      });
    }

    const dockerVersion = await runCommand('docker --version 2>/dev/null');
    if (dockerVersion) {
      tools.push({
        name: 'docker',
        version: dockerVersion.match(/[\d.]+/)?.[0] || 'unknown',
        path: await runCommand('which docker'),
        category: 'system',
        status: 'installed',
        description: 'Container runtime',
      });
    }

    // Get services
    const services: Service[] = [];
    const serviceList = ['nginx', 'pm2-root', 'postgresql', 'redis', 'mongod', 'mariadb', 'ollama', 'ttyd', 'ttyd-ssh'];

    for (const svc of serviceList) {
      const status = await runCommand(`systemctl is-active ${svc} 2>/dev/null`);
      const enabled = await runCommand(`systemctl is-enabled ${svc} 2>/dev/null`);
      if (status) {
        services.push({
          name: svc,
          status: status === 'active' ? 'running' : 'stopped',
          autostart: enabled === 'enabled',
          description: svc,
        });
      }
    }

    // Get cron jobs
    const cronOutput = await runCommand('crontab -l 2>/dev/null');
    const cronJobs: CronJob[] = cronOutput
      .split('\n')
      .filter(line => line && !line.startsWith('#'))
      .map(line => {
        const parts = line.split(' ');
        const schedule = parts.slice(0, 5).join(' ');
        const command = parts.slice(5).join(' ');
        return { schedule, command, description: command.split('/').pop() || command };
      });

    // Get npm global packages
    const npmGlobal = await runCommand('npm list -g --depth=0 --json 2>/dev/null');
    let globalNpm: string[] = [];
    try {
      const parsed = JSON.parse(npmGlobal);
      globalNpm = Object.keys(parsed.dependencies || {});
    } catch {
      globalNpm = [];
    }

    // Get pipx packages
    const pipxOutput = await runCommand('pipx list --short 2>/dev/null');
    const pipxPackages = pipxOutput.split('\n').filter(Boolean).map(p => p.split(' ')[0]);

    return NextResponse.json({
      tools,
      services,
      cronJobs,
      globalNpm,
      pipxPackages,
    });
  } catch (error) {
    console.error('Tools scan error:', error);
    return NextResponse.json(
      { error: 'Failed to scan tools' },
      { status: 500 }
    );
  }
}
