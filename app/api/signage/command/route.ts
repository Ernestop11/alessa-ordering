import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';

// In-memory command queue: hostname -> pending command
const commandQueue = new Map<string, string>();

/** Get and clear any pending command for a hostname (called from health endpoint) */
export function popCommand(hostname: string): string | null {
  const cmd = commandQueue.get(hostname);
  if (cmd) {
    commandQueue.delete(hostname);
    return cmd;
  }
  return null;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || (role !== 'admin' && role !== 'super_admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { hostname, command } = await request.json();

    if (!hostname || !command) {
      return NextResponse.json({ error: 'hostname and command required' }, { status: 400 });
    }

    const validCommands = ['refresh', 'reboot', 'tv-on', 'tv-off'];
    if (!validCommands.includes(command)) {
      return NextResponse.json({ error: `Invalid command. Valid: ${validCommands.join(', ')}` }, { status: 400 });
    }

    commandQueue.set(hostname, command);

    return NextResponse.json({ status: 'queued', hostname, command });
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
}
