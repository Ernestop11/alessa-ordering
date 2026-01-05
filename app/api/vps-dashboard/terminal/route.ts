import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Blocked dangerous commands
const BLOCKED_COMMANDS = [
  'rm -rf /',
  'rm -rf /*',
  'dd if=',
  'mkfs',
  ':(){:|:&};:',
  '> /dev/sda',
  'chmod -R 777 /',
  'chown -R',
  'wget -O- | sh',
  'curl | sh',
  'shutdown',
  'reboot',
  'init 0',
  'init 6',
  'halt',
  'poweroff',
];

// Blocked command patterns
const BLOCKED_PATTERNS = [
  /rm\s+-rf?\s+\/(?!\w)/,  // rm -rf / but not rm -rf /some/path
  />\s*\/dev\/sd/,
  /dd\s+if=.*of=\/dev/,
  /mkfs\./,
];

function isCommandBlocked(command: string): boolean {
  const lowerCmd = command.toLowerCase().trim();

  // Check exact matches
  for (const blocked of BLOCKED_COMMANDS) {
    if (lowerCmd.includes(blocked.toLowerCase())) {
      return true;
    }
  }

  // Check patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(command)) {
      return true;
    }
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
      return NextResponse.json({ error: 'Missing command' }, { status: 400 });
    }

    // Security check
    if (isCommandBlocked(command)) {
      return NextResponse.json({
        output: 'Error: This command is blocked for safety reasons.',
        blocked: true,
      });
    }

    if (!IS_PRODUCTION) {
      return NextResponse.json({
        output: `[Development Mode]\nWould execute: ${command}\n\nIn production, this runs on the VPS.`,
      });
    }

    // Execute command
    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: 30000, // 30 second timeout
        maxBuffer: 1024 * 1024, // 1MB buffer
        cwd: '/var/www/alessa-ordering',
        env: {
          ...process.env,
          PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/root/.local/bin',
        },
      });

      return NextResponse.json({
        output: stdout || stderr || '(no output)',
        success: true,
      });
    } catch (execError) {
      const error = execError as { stdout?: string; stderr?: string; message?: string; code?: number };

      // Return output even on error
      if (error.stdout || error.stderr) {
        return NextResponse.json({
          output: error.stderr || error.stdout || '',
          success: false,
          exitCode: error.code,
        });
      }

      return NextResponse.json({
        output: `Error: ${error.message || 'Command failed'}`,
        success: false,
      });
    }
  } catch (error) {
    console.error('Terminal error:', error);
    return NextResponse.json(
      {
        output: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
}
