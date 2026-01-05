import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const SYSTEM_PROMPT = `You are a helpful VPS management assistant. You help users manage their server, troubleshoot issues, edit code, and understand their infrastructure.

The VPS runs:
- Nginx (web server/reverse proxy)
- PM2 (process manager for Node.js apps)
- PostgreSQL 16 (database)
- Redis (cache)
- Ollama (local AI with llama3.2, mistral, phi3, and other models)
- Docker (available but not actively used)

Apps deployed:
- alessa-ordering (Next.js on port 3001) - serves lasreinascolusa.com, lapoblanitamexicanfood.com, alessacloud.com
- switchmenu-api (Node.js on port 4000) - serves switchmenupro.com

Tools available: Aider (AI coding), TTYD (web terminal on port 7681)

Be concise and helpful. If the user asks to run commands, suggest the exact command they should run in the terminal.`;

// Model configurations
const ANTHROPIC_MODELS: Record<string, string> = {
  'sonnet': 'claude-sonnet-4-20250514',
  'opus': 'claude-opus-4-20250514',
  'haiku': 'claude-3-5-haiku-20241022',
};

const OPENAI_MODELS: Record<string, string> = {
  'gpt-4o': 'gpt-4o',
  'gpt-4o-mini': 'gpt-4o-mini',
  'gpt-4-turbo': 'gpt-4-turbo',
};

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session || role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { message, model } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Missing message' }, { status: 400 });
    }

    // Determine provider based on model
    const isOpenAI = model in OPENAI_MODELS;
    const isAnthropic = model in ANTHROPIC_MODELS;

    if (!IS_PRODUCTION) {
      return NextResponse.json({
        response: `[Development Mode]\n\nProvider: ${isOpenAI ? 'OpenAI' : 'Anthropic'}\nModel: ${model}\n\nYour message: "${message}"`,
      });
    }

    if (isOpenAI) {
      // OpenAI API call
      const apiKey = process.env.OPENAI_API_KEY;

      if (!apiKey || apiKey.includes('YOUR_') || apiKey.length < 20) {
        return NextResponse.json({
          response: `[OpenAI API Key Not Configured]\n\nTo use GPT models, set OPENAI_API_KEY in your environment.\n\nYour message was: "${message}"`,
        });
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: OPENAI_MODELS[model],
          max_tokens: 4096,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: message },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const assistantMessage = data.choices?.[0]?.message?.content || 'No response from OpenAI';

      return NextResponse.json({ response: assistantMessage });
    }

    // Default to Anthropic (Claude)
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey || apiKey.includes('YOUR_') || apiKey.length < 20) {
      return NextResponse.json({
        response: `[Anthropic API Key Not Configured]\n\nTo enable Claude chat, set ANTHROPIC_API_KEY in your environment.\n\nYour message was: "${message}"`,
      });
    }

    const selectedModel = ANTHROPIC_MODELS[model] || ANTHROPIC_MODELS['sonnet'];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: selectedModel,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
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
    console.error('AI chat error:', error);
    return NextResponse.json(
      {
        response: `Error: ${error instanceof Error ? error.message : 'Failed to connect to AI'}`,
      },
      { status: 500 }
    );
  }
}
