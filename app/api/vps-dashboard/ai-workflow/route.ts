import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

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

Be concise and helpful. When explaining solutions, always mention specific commands the user could run.`;

const OPTIONS_PROMPT = `Based on the user's question and your previous response, generate 2-4 actionable options the user can take.

Return ONLY a JSON array with this exact format (no markdown, no explanation):
[
  {
    "id": "opt1",
    "label": "Short action name",
    "description": "What this does in one sentence",
    "command": "exact terminal command or file path for aider",
    "type": "terminal",
    "risk": "safe"
  }
]

Rules:
- "type" must be "terminal" or "aider"
- "risk" must be "safe", "moderate", or "dangerous"
- "command" must be a real, executable command
- For aider commands, format as: "filepath describe changes"
- Include at least one safe option
- Order from safest to most risky

Common commands:
- pm2 status, pm2 logs [app] --lines N, pm2 restart [app], pm2 reset [app]
- systemctl status/restart nginx/postgresql/redis
- nginx -t, nginx -s reload
- psql -c "SQL", redis-cli info
- df -h, free -h, top -bn1`;

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session || role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { message, context, model, action } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Missing message' }, { status: 400 });
    }

    // Determine provider
    const isOpenAI = model in OPENAI_MODELS;
    const isAnthropic = model in ANTHROPIC_MODELS;

    if (!IS_PRODUCTION) {
      if (action === 'generate-options') {
        return NextResponse.json({
          options: [
            {
              id: 'opt1',
              label: 'Check Status',
              description: 'View current PM2 process status',
              command: 'pm2 status',
              type: 'terminal',
              risk: 'safe',
            },
            {
              id: 'opt2',
              label: 'View Logs',
              description: 'Check recent application logs',
              command: 'pm2 logs alessa-ordering --lines 20',
              type: 'terminal',
              risk: 'safe',
            },
          ],
        });
      }
      return NextResponse.json({
        response: `[Dev Mode] Provider: ${isOpenAI ? 'OpenAI' : 'Anthropic'}, Model: ${model}\nWould process: "${message}"`,
      });
    }

    // OpenAI API handling
    if (isOpenAI) {
      const openaiKey = process.env.OPENAI_API_KEY;
      if (!openaiKey || openaiKey.includes('YOUR_') || openaiKey.length < 20) {
        return NextResponse.json({
          response: '[OpenAI API Key Not Configured] Set OPENAI_API_KEY to use GPT models.',
        });
      }

      if (action === 'generate-options') {
        // Use GPT-4o-mini for fast option generation
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            max_tokens: 1024,
            messages: [
              { role: 'system', content: OPTIONS_PROMPT },
              { role: 'user', content: `User's question: ${message}\n\nYour previous response: ${context}\n\nGenerate actionable options as JSON array:` },
            ],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '[]';

        try {
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const options = JSON.parse(jsonMatch[0]);
            return NextResponse.json({ options });
          }
        } catch (parseError) {
          console.error('Failed to parse options:', parseError, content);
        }

        return NextResponse.json({ options: [] });
      }

      // Regular chat with OpenAI
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
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

    // Anthropic (Claude) API handling
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey.includes('YOUR_') || apiKey.length < 20) {
      return NextResponse.json({
        response: '[Anthropic API Key Not Configured] Set ANTHROPIC_API_KEY to enable AI workflow.',
      });
    }

    const selectedModel = ANTHROPIC_MODELS[model] || ANTHROPIC_MODELS['sonnet'];

    if (action === 'generate-options') {
      // Generate actionable options from previous context
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: ANTHROPIC_MODELS['haiku'], // Always use haiku for fast option generation
          max_tokens: 1024,
          system: OPTIONS_PROMPT,
          messages: [
            {
              role: 'user',
              content: `User's question: ${message}\n\nYour previous response: ${context}\n\nGenerate actionable options as JSON array:`,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Claude API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.content?.[0]?.text || '[]';

      // Parse JSON from response
      try {
        // Extract JSON array from response (in case there's extra text)
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const options = JSON.parse(jsonMatch[0]);
          return NextResponse.json({ options });
        }
      } catch (parseError) {
        console.error('Failed to parse options:', parseError, content);
      }

      return NextResponse.json({ options: [] });
    }

    // Regular chat with Anthropic
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
    console.error('AI Workflow error:', error);
    return NextResponse.json(
      {
        response: `Error: ${error instanceof Error ? error.message : 'Failed to connect to Claude'}`,
      },
      { status: 500 }
    );
  }
}
