import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session || role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Missing message' }, { status: 400 });
    }

    // Check for Anthropic API key
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey || apiKey.includes('YOUR_') || apiKey.length < 20) {
      return NextResponse.json({
        response: `[API Key Not Configured]\n\nTo enable Claude chat, you need to set a valid ANTHROPIC_API_KEY in your environment.\n\nYour message was: "${message}"\n\nFor now, you can use the Terminal tab to run commands directly on the VPS.`,
      });
    }

    if (!IS_PRODUCTION) {
      return NextResponse.json({
        response: `[Development Mode]\n\nIn production, this would send your message to Claude API.\n\nYour message: "${message}"`,
      });
    }

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        system: `You are a helpful VPS management assistant. You help users manage their server, troubleshoot issues, edit code, and understand their infrastructure.

The VPS runs:
- Nginx (web server/reverse proxy)
- PM2 (process manager for Node.js apps)
- PostgreSQL (database)
- Redis (cache)
- MongoDB (document database)
- Docker

Apps deployed:
- alessa-ordering (Next.js on port 3001) - serves lasreinascolusa.com, lapoblanitamexicanfood.com, alessacloud.com
- switchmenu-api (Node.js on port 4000) - serves switchmenupro.com

Be concise and helpful. If the user asks to run commands, suggest the exact command they should run in the terminal.`,
        messages: [{ role: 'user', content: message }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const assistantMessage = data.content?.[0]?.text || 'No response from Claude';

    return NextResponse.json({ response: assistantMessage });
  } catch (error) {
    console.error('Claude chat error:', error);
    return NextResponse.json(
      {
        response: `Error: ${error instanceof Error ? error.message : 'Failed to connect to Claude'}`,
      },
      { status: 500 }
    );
  }
}
