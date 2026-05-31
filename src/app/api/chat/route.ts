import { NextRequest, NextResponse } from 'next/server';
import { getTenantBySlug } from '@/lib/tenant';
import { getTenantFromRequest } from '@/lib/get-tenant-from-request';
import { searchAll, formatSearchContext } from '@/lib/search';
import { chatStreamGemini } from '@/lib/gemini-chat';
import { createClient } from '@/supabase/server';
import { SECTION_PROMPT, getSchemaPrompt } from '@/lib/chat-utils';

const FALLBACK_CHAIN = (
  process.env.FALLBACK_CHAIN ||
  'openai/gpt-4o-mini,minimax/minimax-m2.5:free,google/gemini-flash-1.5,anthropic/claude-3.5-haiku'
).split(',').map((m) => m.trim()).filter(Boolean);

const STREAM_HEADERS = {
  'Content-Type': 'text/plain; charset=utf-8',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
};

async function streamOpenRouter(
  messages: { role: string; content: string }[],
  modelsToTry: string[],
  apiKey: string
): Promise<ReadableStream> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://pixelfandom.vercel.app',
      'X-Title': 'PixelFandom',
    },
    body: JSON.stringify({
      model: modelsToTry[0],
      models: modelsToTry.slice(0, 3),
      route: 'fallback',
      messages,
      stream: true,
      stream_options: { include_usage: true },
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    throw new Error(errData?.error?.message || `OpenRouter error (${res.status})`);
  }

  const stream = res.body;
  if (!stream) throw new Error('No response body');

  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let lineBuffer = '';

  return new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          lineBuffer += chunk;

          const lines = lineBuffer.split('\n');
          lineBuffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              if (content) {
                controller.enqueue(new TextEncoder().encode(content));
              }
            } catch {
              // skip malformed JSON lines
            }
          }
        }

        if (lineBuffer.startsWith('data: ')) {
          const data = lineBuffer.slice(6);
          if (data !== '[DONE]') {
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
}

export async function POST(request: NextRequest) {
  try {
    const { message, session_id } = await request.json();
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const requestTenant = getTenantFromRequest(request);
    const schemaPrompt = await getSchemaPrompt();
    let systemPrompt = `${schemaPrompt}\n\n${SECTION_PROMPT}`;
    let provider = 'openrouter';
    let model = 'openai/gpt-4o-mini';
    let customApiKey = '';
    let fallbackChain: string[] = [];
    let geminiModel = 'gemini-2.0-flash';
    let geminiCustomApiKey = '';
    let geminiFallbackChain: string[] = [];
    let primaryProvider = 'openrouter';
    let tenantSlug = requestTenant?.slug || '';
    let tenantId: string | null = null;

    if (requestTenant?.slug) {
      const tenant = await getTenantBySlug(requestTenant.slug);
      tenantId = tenant?.id || null;
      if (tenant?.ai_enabled && tenant.ai_config) {
        const config = tenant.ai_config as Record<string, unknown>;
        let userPrompt = (config.system_prompt as string) || '';
        if (userPrompt) {
          systemPrompt = `${userPrompt}\n\n${schemaPrompt}\n\n${SECTION_PROMPT}`;
        }
        provider = (config.provider as string) || 'openrouter';
        model = (config.model as string) || model;
        customApiKey = (config.custom_api_key as string) || '';
        fallbackChain = (config.fallback_chain as string[]) || [];
        geminiModel = (config.gemini_model as string) || geminiModel;
        geminiCustomApiKey = (config.gemini_custom_api_key as string) || '';
        geminiFallbackChain = (config.gemini_fallback_chain as string[]) || [];
        primaryProvider = (config.primary_provider as string) || 'openrouter';
      }
    }

    const abortCtx = new AbortController();

    const contextPromise = (async () => {
      if (!tenantSlug) return '';
      try {
        const result = await searchAll(tenantSlug, message, {
          signal: abortCtx.signal,
        });
        return formatSearchContext(result);
      } catch {
        return '';
      }
    })();

    const context = await Promise.race([
      contextPromise,
      new Promise<string>((resolve) => {
        setTimeout(() => {
          abortCtx.abort();
          resolve('');
        }, 5000);
      }),
    ]);

    const ragPrompt = context
      ? `${systemPrompt}

## Contexto encontrado na base de conhecimento
${context}

Use o contexto acima como fonte primária para responder. Se o contexto não tiver informação suficiente, complemente com seu conhecimento. Priorize dados dos artigos e itens listados acima.`
      : systemPrompt;

    const messages: { role: string; content: string }[] = [
      { role: 'system', content: ragPrompt },
      { role: 'user', content: message },
    ];

    // Save user message to DB if session_id provided
    if (session_id) {
      try {
        const supabase = await createClient();
        await supabase.from('chat_messages').insert({
          session_id,
          role: 'user',
          content: message,
          provider: 'text',
        });
      } catch (e) {
        console.error('Failed to save user message:', e);
      }
    }

    if (provider === 'gemini') {
      const geminiApiKey = geminiCustomApiKey || process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        throw new Error('GEMINI_API_KEY not configured');
      }
      const stream = await chatStreamGemini({
        messages,
        model: geminiModel,
        config: {
          apiKey: geminiApiKey,
          fallbackChain: geminiFallbackChain,
        },
      });
      return new NextResponse(stream, { headers: STREAM_HEADERS });
    }

    const effectiveFallbackChain = fallbackChain.length > 0 ? fallbackChain : FALLBACK_CHAIN;
    const modelsToTry = model
      ? [model, ...effectiveFallbackChain.filter((m) => m !== model)]
      : effectiveFallbackChain;

    const apiKey = customApiKey || process.env.OPENROUTER_API_KEY || '';

    try {
      if (provider === 'hybrid') {
        try {
          const stream = await streamOpenRouter(messages, modelsToTry, apiKey);
          return new NextResponse(stream, { headers: STREAM_HEADERS });
        } catch (orError) {
          console.warn('OpenRouter failed, trying Gemini fallback:', orError);
          const geminiApiKey = geminiCustomApiKey || process.env.GEMINI_API_KEY;
          if (!geminiApiKey) throw orError;
          const stream = await chatStreamGemini({
            messages,
            model: geminiModel,
            config: {
              apiKey: geminiApiKey,
              fallbackChain: geminiFallbackChain,
            },
          });
          return new NextResponse(stream, { headers: STREAM_HEADERS });
        }
      }

      const stream = await streamOpenRouter(messages, modelsToTry, apiKey);
      return new NextResponse(stream, { headers: STREAM_HEADERS });
    } catch (error) {
      console.error('Chat error:', error);
      return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
