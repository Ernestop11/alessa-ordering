import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Whitelist of safe commands that can be executed
const SAFE_COMMANDS = [
  // Nginx commands
  'sudo systemctl status nginx',
  'sudo systemctl restart nginx',
  'sudo nginx -s reload',
  'sudo nginx -t',
  'sudo tail -50 /var/log/nginx/error.log',
  // PM2 commands
  'pm2 list',
  'pm2 logs --lines 50',
  'pm2 restart all',
  // PostgreSQL commands
  'sudo systemctl status postgresql',
  'sudo systemctl restart postgresql',
  'sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"',
  'sudo tail -50 /var/log/postgresql/postgresql-*-main.log',
  // Redis commands
  'sudo systemctl status redis',
  'sudo systemctl start redis',
  'sudo systemctl restart redis',
  'redis-cli info',
];

// Pattern for dynamic PM2 restart commands
const PM2_RESTART_PATTERN = /^pm2 restart [\w-]+$/;

function isCommandAllowed(command: string): boolean {
  // Check exact matches
  if (SAFE_COMMANDS.includes(command)) {
    return true;
  }

  // Check PM2 restart pattern for specific app names
  if (PM2_RESTART_PATTERN.test(command)) {
    return true;
  }

  return false;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session || role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { command } = await request.json();

    if (!command) {
      return NextResponse.json(
        { error: 'Missing command' },
        { status: 400 }
      );
    }

    // Security: Only allow whitelisted commands
    if (!isCommandAllowed(command)) {
      return NextResponse.json(
        { error: 'Command not allowed', details: 'This command is not in the whitelist' },
        { status: 403 }
      );
    }

    if (!IS_PRODUCTION) {
      // Development: return mock response
      return NextResponse.json({
        output: `[Development Mode]\n\nWould execute: ${command}\n\nIn production, this command would run on the VPS.`,
        success: true,
      });
    }

    // Production: Execute the command
    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: 30000, // 30 second timeout
        maxBuffer: 1024 * 1024, // 1MB buffer
      });

      return NextResponse.json({
        output: stdout || stderr || 'Command completed successfully (no output)',
        success: true,
      });
    } catch (execError) {
      const error = execError as { stdout?: string; stderr?: string; message?: string; code?: number };

      // Some commands return non-zero but have useful output
      if (error.stdout || error.stderr) {
        return NextResponse.json({
          output: error.stdout || error.stderr,
          success: false,
          warning: `Command returned exit code ${error.code}`,
        });
      }

      throw error;
    }
  } catch (error) {
    console.error('Fix command error:', error);
    return NextResponse.json(
      {
        error: 'Failed to execute command',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
