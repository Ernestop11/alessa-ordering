import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const OLLAMA_URL = 'http://localhost:11434';

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session || role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!IS_PRODUCTION) {
    return NextResponse.json({
      status: 'running',
      models: [
        { name: 'llama3.2:latest', size: '2.0 GB', modified: 'mock' },
      ],
      version: '0.12.9 (dev)',
    });
  }

  try {
    // Check Ollama status
    const versionRes = await fetch(`${OLLAMA_URL}/api/version`, {
      signal: AbortSignal.timeout(5000)
    });

    if (!versionRes.ok) {
      throw new Error('Ollama not responding');
    }

    const versionData = await versionRes.json();

    // Get list of models
    const modelsRes = await fetch(`${OLLAMA_URL}/api/tags`, {
      signal: AbortSignal.timeout(5000)
    });

    const modelsData = modelsRes.ok ? await modelsRes.json() : { models: [] };

    return NextResponse.json({
      status: 'running',
      version: versionData.version || 'unknown',
      models: modelsData.models || [],
    });
  } catch (error) {
    return NextResponse.json({
      status: 'stopped',
      error: error instanceof Error ? error.message : 'Failed to connect to Ollama',
      models: [],
    });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session || role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { action, model, message } = await request.json();

    if (!IS_PRODUCTION) {
      if (action === 'chat') {
        return NextResponse.json({
          response: `[Development Mode]\n\nIn production, Ollama would respond to: "${message}"\n\nModel: ${model || 'llama3.2'}`,
        });
      }
      return NextResponse.json({ success: true, message: 'Dev mode - no action taken' });
    }

    if (action === 'pull') {
      // Start pulling a model (this can take a while)
      const res = await fetch(`${OLLAMA_URL}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: model }),
      });

      if (!res.ok) {
        throw new Error('Failed to start model pull');
      }

      return NextResponse.json({ success: true, message: `Started pulling ${model}` });
    }

    if (action === 'delete') {
      const res = await fetch(`${OLLAMA_URL}/api/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: model }),
      });

      if (!res.ok) {
        throw new Error('Failed to delete model');
      }

      return NextResponse.json({ success: true, message: `Deleted ${model}` });
    }

    if (action === 'chat') {
      const selectedModel = model || 'llama3.2';

      const res = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          prompt: message,
          stream: false,
        }),
        signal: AbortSignal.timeout(120000), // 2 minute timeout
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Ollama error: ${errorText}`);
      }

      const data = await res.json();
      return NextResponse.json({ response: data.response });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Ollama API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ollama request failed' },
      { status: 500 }
    );
  }
}
