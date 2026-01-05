import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session || role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { filePath, message } = await request.json();

    if (!filePath || !message) {
      return NextResponse.json(
        { error: 'Missing filePath or message' },
        { status: 400 }
      );
    }

    if (!IS_PRODUCTION) {
      // Development: return mock response
      return NextResponse.json({
        response: `[Development Mode]\n\nI would make the following changes to ${filePath}:\n\n${message}\n\nIn production, Aider would actually modify the file.`,
        success: true,
      });
    }

    // Production: Call Aider CLI
    // Note: Aider must be installed on the VPS and ANTHROPIC_API_KEY must be set
    const projectDir = process.cwd();
    const fullPath = `${projectDir}/${filePath}`;

    // Escape the message for shell
    const escapedMessage = message.replace(/'/g, "'\\''");

    // Run Aider in no-auto-commits mode with the file and message
    const command = `cd ${projectDir} && aider --yes --no-auto-commits --message '${escapedMessage}' ${fullPath} 2>&1`;

    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: 60000, // 60 second timeout
        env: {
          ...process.env,
          // Ensure API key is available
        },
      });

      return NextResponse.json({
        response: stdout || stderr || 'Changes applied.',
        success: true,
      });
    } catch (execError) {
      const error = execError as { stdout?: string; stderr?: string; message?: string };

      // Aider might return non-zero exit code but still have useful output
      if (error.stdout || error.stderr) {
        return NextResponse.json({
          response: error.stdout || error.stderr,
          success: false,
          warning: 'Aider returned an error but may have made changes',
        });
      }

      throw error;
    }
  } catch (error) {
    console.error('Aider error:', error);
    return NextResponse.json(
      {
        error: 'Failed to run Aider',
        details: error instanceof Error ? error.message : 'Unknown error',
        hint: 'Make sure Aider is installed: pip install aider-chat',
      },
      { status: 500 }
    );
  }
}
