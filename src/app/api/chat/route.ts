import { NextRequest, NextResponse } from 'next/server';
import { getTenantBySlug } from '@/lib/tenant';
import { getTenantFromRequest } from '@/lib/get-tenant-from-request';

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Resolve tenant context
    const requestTenant = getTenantFromRequest(request);
    let systemPrompt = '';
    let model = 'openai/gpt-4o-mini';

    if (requestTenant?.slug) {
      const tenant = await getTenantBySlug(requestTenant.slug);
      if (tenant?.ai_enabled && tenant.ai_config) {
        const config = tenant.ai_config as Record<string, unknown>;
        systemPrompt = (config.system_prompt as string) || '';
        model = (config.model as string) || model;
      }
    }

    const messages: { role: string; content: string }[] = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: message });

    const orRes = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://pixelfandom.vercel.app',
        'X-Title': 'PixelFandom',
      },
      body: JSON.stringify({ model, messages, stream: true }),
    });

    if (!orRes.ok) {
      const errData = await orRes.json().catch(() => null);
      throw new Error(errData?.error?.message || `OpenRouter error (${orRes.status})`);
    }

    const stream = orRes.body;
    if (!stream) throw new Error('No response body');

    const reader = stream.getReader();
    const decoder = new TextDecoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));

            for (const line of lines) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || '';
                if (content) {
                  controller.enqueue(new TextEncoder().encode(content));
                }
              } catch {}
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new NextResponse(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('OpenRouter error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
