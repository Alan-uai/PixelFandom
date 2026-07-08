import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_FALLBACK_CHAIN as BASE_FALLBACK } from '@/lib/models';
import { MAIN_URL } from '@/lib/constants';
import { getTenantBySlug } from '@/lib/tenant';
import { getTenantFromRequest } from '@/lib/get-tenant-from-request';
import { searchAll, formatSearchContext } from '@/lib/search';
import { chatStreamGemini } from '@/lib/gemini-chat';
import { createClient } from '@/supabase/server';
import { checkRateLimit } from '@/lib/rate-limiter';
import { decryptApiKey } from '@/lib/crypto';
import {
  loadChatHistory,
  trimMessagesToBudget,
  getContextWindow,
} from '@/lib/chat-utils';
import { getSchemaPrompt } from '@/lib/game-schema';
import { getOrBuildPrompt } from '@/lib/text-chat-prompt';
import {
  TEXT_CHAT_TOOLS,
  executeTextChatTool,
  type ToolContext,
} from '@/lib/text-chat-tools';

const FALLBACK_CHAIN = (
  process.env.FALLBACK_CHAIN ||
  BASE_FALLBACK.join(',')
).split(',').map((m) => m.trim()).filter(Boolean);

const STREAM_HEADERS = {
  'Content-Type': 'text/plain; charset=utf-8',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
};

async function streamOpenRouter(
  messages: Record<string, unknown>[],
  modelsToTry: string[],
  apiKey: string
): Promise<ReadableStream> {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': MAIN_URL,
      'X-Title': 'PixelFandom',
    },
    body: JSON.stringify({
      model: modelsToTry[0],
      messages,
      stream: true,
      stream_options: { include_usage: true },
    }),
    signal: AbortSignal.timeout(120_000),
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
            } catch {/* noop */}
          }
        }

        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

async function callOpenRouter(
  messages: Record<string, unknown>[],
  modelsToTry: string[],
  apiKey: string,
  tools?: typeof TEXT_CHAT_TOOLS
): Promise<Record<string, unknown>> {
  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    const body: Record<string, unknown> = {
      model,
      messages,
      stream: false,
      max_tokens: tools ? 512 : 4096,
    };
    if (tools) body.tools = tools;

    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': MAIN_URL,
          'X-Title': 'PixelFandom',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30_000),
      });

      if (res.ok) {
        return await res.json();
      }

      if (res.status === 429 || res.status === 402 || res.status === 403) {
        lastError = new Error(`Model ${model} unavailable (${res.status})`);
        continue;
      }

      const errData = await res.json().catch(() => null);
      throw new Error(errData?.error?.message || `OpenRouter error (${res.status})`);
    } catch (e: any) {
      if (e.name === 'AbortError') {
        lastError = e;
        continue;
      }
      throw e;
    }
  }

  throw lastError || new Error('All models failed');
}

async function saveMessage(
  sessionId: string,
  role: string,
  content: string
): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from('chat_messages').insert({
      session_id: sessionId,
      role,
      content,
      provider: 'text',
    });
  } catch (e) {
    console.error('Failed to save message:', e);
  }
}

function createTextStream(
  text: string
): ReadableStream {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(text));
      controller.close();
    },
  });
}

async function buildMessages(
  schemaPrompt: string,
  message: string,
  sessionId?: string,
  userPrompt?: string,
  tenantSlug?: string,
  responseStyle?: string,
  displayMode?: string,
  userId?: string,
): Promise<Record<string, unknown>[]> {
  let history: Record<string, unknown>[] = [];

  if (sessionId) {
    const chatHistory = await loadChatHistory(sessionId, 20);
    history = chatHistory.filter(
      (m) => m.role === 'user' || m.role === 'assistant'
    ).map((m) => ({ role: m.role, content: m.content }));
  }

  const systemPrompt = getOrBuildPrompt({
    schemaPrompt, userPrompt, responseStyle, displayMode,
  }, tenantSlug || 'default', userId);

  return [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: message },
  ];
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const rl = checkRateLimit(`chat:${ip}`, {
    windowMs: 60_000,
    maxRequests: 30,
  });
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Muitas requisições. Tente novamente em breve.' }, {
      status: 429,
      headers: { 'X-RateLimit-Reset': String(rl.resetAt) },
    });
  }

  try {
    const { message, session_id } = await request.json();
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const requestTenant = getTenantFromRequest(request);
    const schemaPrompt = await getSchemaPrompt();
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
    let userPrompt = '';
    let responseStyle = 'detalhado';
    let displayMode = 'acordeao';
    let userId: string | undefined;

    if (requestTenant?.slug) {
      const tenant = await getTenantBySlug(requestTenant.slug);
      tenantId = tenant?.id || null;
      if (tenant?.ai_enabled && tenant.ai_config) {
        const config = tenant.ai_config as Record<string, unknown>;
        userPrompt = (config.system_prompt as string) || '';
        provider = (config.provider as string) || 'openrouter';
        model = (config.model as string) || model;
        try { customApiKey = decryptApiKey((config.custom_api_key as string) || ''); } catch { customApiKey = ''; }
        fallbackChain = (config.fallback_chain as string[]) || [];
        geminiModel = (config.gemini_model as string) || geminiModel;
        try { geminiCustomApiKey = decryptApiKey((config.gemini_custom_api_key as string) || ''); } catch { geminiCustomApiKey = ''; }
        geminiFallbackChain = (config.gemini_fallback_chain as string[]) || [];
        primaryProvider = (config.primary_provider as string) || 'openrouter';
        responseStyle = (config.response_style as string) || responseStyle; // Layer 3 (admin default)
        displayMode = (config.display_mode as string) || displayMode;
      }
    }

    // Cascade: Layer 2 (global user) > Layer 1 (wiki-specific user)
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
        const { data: prefs } = await supabase
          .from('user_preferences')
          .select('preferences')
          .eq('user_id', user.id)
          .single();
        if (prefs?.preferences) {
          const p = prefs.preferences as Record<string, unknown>;
          const chatSettings = p.chat_settings as Record<string, string> | undefined;
          const wikiPrefs = p.wiki_preferences as Record<string, Record<string, string>> | undefined;
          // Layer 1: wiki-specific user preference (highest priority)
          if (tenantSlug && wikiPrefs?.[tenantSlug]) {
            responseStyle = wikiPrefs[tenantSlug].response_style || responseStyle;
            displayMode = wikiPrefs[tenantSlug].display_mode || displayMode;
          }
          // Layer 2: global user preference (fallback)
          if (chatSettings) {
            responseStyle = chatSettings.response_style || responseStyle;
            displayMode = chatSettings.display_mode || displayMode;
          }
          const VALID_DISPLAY_MODES = ['acordeao', 'texto_puro', 'tabela', 'cards', 'hibrido', 'auto'];
          if (!VALID_DISPLAY_MODES.includes(displayMode)) {
            displayMode = 'acordeao';
          }
        }
      }
    } catch { /* ignore profile load errors */ }

    const VALID_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (session_id && !VALID_UUID.test(session_id)) {
      return NextResponse.json({ error: 'Invalid session ID format' }, { status: 400 });
    }

    const truncatedMessage = message.slice(0, 4000);

    if (session_id) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: existing } = await supabase
          .from('chat_sessions')
          .select('user_id')
          .eq('id', session_id)
          .single();
        if (existing && existing.user_id !== user.id) {
          return NextResponse.json({ error: 'Session does not belong to you' }, { status: 403 });
        }
      }
      await saveMessage(session_id, 'user', truncatedMessage);
    }

    // Check if any API key is available
    const hasOpenRouterKey = !!(customApiKey || process.env.OPENROUTER_API_KEY);
    const hasGeminiKey = !!(geminiCustomApiKey || process.env.GEMINI_API_KEY);

    if (!hasOpenRouterKey && !hasGeminiKey) {
      return NextResponse.json({
        error: 'Chat indisponível',
        details: 'Nenhuma chave de API configurada. Entre em contato com o administrador.',
        code: 'NO_API_KEY',
      }, { status: 503 });
    }

    if (provider === 'gemini') {
      const geminiApiKey = geminiCustomApiKey || process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        throw new Error('GEMINI_API_KEY not configured');
      }

      const abortCtx = new AbortController();
      const contextPromise = (async () => {
        if (!tenantSlug) return '';
        try {
          const result = await searchAll(tenantSlug, truncatedMessage, {
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

      const geminiSystem = getOrBuildPrompt({
        schemaPrompt, userPrompt, responseStyle, displayMode,
      }, tenantSlug || 'default');
      const ragPrompt = context
        ? `${geminiSystem}

## Contexto encontrado na base de conhecimento
${context}

Use o contexto acima como fonte primária para responder. Se o contexto não tiver informação suficiente, complemente com seu conhecimento. Priorize dados dos artigos e itens listados acima.`
        : geminiSystem;

      const geminiMessages: { role: string; content: string }[] = [
        { role: 'system', content: ragPrompt },
        { role: 'user', content: truncatedMessage },
      ];

      const stream = await chatStreamGemini({
        messages: geminiMessages,
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
    const supabaseClient = await createClient();
    const toolCtx: ToolContext = { slug: tenantSlug, tenantId, userClient: supabaseClient };

    try {
      let messages = await buildMessages(
        schemaPrompt, truncatedMessage, session_id, userPrompt, tenantSlug, responseStyle, displayMode, userId
      );
      const contextWindow = getContextWindow(model);
      if (contextWindow && messages.length > 1) {
        const systemContent = String(messages[0]?.content || '');
        messages = trimMessagesToBudget(messages as any, systemContent, contextWindow) as any;
      }
      let finalText: string | null = null;
      const MAX_TOOL_ROUNDS = 2;

      for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
        const response = await callOpenRouter(messages, modelsToTry, apiKey, TEXT_CHAT_TOOLS);
        const choice = (response.choices as any[])?.[0];
        const responseMsg = choice?.message;

        if (!responseMsg || !responseMsg.tool_calls || responseMsg.tool_calls.length === 0) {
          finalText = responseMsg?.content ?? null;
          break;
        }

        messages.push({
          role: 'assistant',
          content: null,
          tool_calls: responseMsg.tool_calls,
        });

        const toolResults = await Promise.all(
          responseMsg.tool_calls.map(async (tc: any) => {
            try {
              const args = JSON.parse(tc.function.arguments);
              const result = await executeTextChatTool(tc.function.name, args, toolCtx);
              return {
                role: 'tool',
                tool_call_id: tc.id,
                content: JSON.stringify(result),
              };
            } catch (e: any) {
              return {
                role: 'tool',
                tool_call_id: tc.id,
                content: JSON.stringify({ error: e.message }),
              };
            }
          })
        );

        messages.push(...toolResults);
      }

      let stream: ReadableStream;

      if (finalText !== null) {
        stream = createTextStream(finalText);
      } else {
        stream = await streamOpenRouter(messages, modelsToTry, apiKey);
      }

      if (session_id) {
        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        const capturingStream = new ReadableStream({
          async start(controller) {
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) {
                  controller.close();
                  if (fullResponse) {
                    saveMessage(session_id, 'assistant', fullResponse);
                  }
                  return;
                }
                fullResponse += decoder.decode(value, { stream: true });
                controller.enqueue(value);
              }
            } catch (error) {
              controller.error(error);
            }
          },
          cancel() {
            reader.cancel();
          },
        });

        return new NextResponse(capturingStream, { headers: STREAM_HEADERS });
      }

      return new NextResponse(stream, { headers: STREAM_HEADERS });
    } catch (orError) {
      if (primaryProvider === 'hybrid' || provider === 'hybrid') {
        console.warn('OpenRouter failed, trying Gemini fallback:', orError);
        const geminiApiKey = geminiCustomApiKey || process.env.GEMINI_API_KEY;
        if (!geminiApiKey) throw orError;

        const abortCtx = new AbortController();
        const contextPromise = (async () => {
          if (!tenantSlug) return '';
          try {
            const result = await searchAll(tenantSlug, truncatedMessage, {
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

        const geminiSystem = getOrBuildPrompt({
          schemaPrompt, userPrompt, responseStyle, displayMode,
        }, tenantSlug || 'default');
        const ragPrompt = context
          ? `${geminiSystem}

## Contexto encontrado na base de conhecimento
${context}

Use o contexto acima como fonte primária para responder. Se o contexto não tiver informação suficiente, complemente com seu conhecimento. Priorize dados dos artigos e itens listados acima.`
          : geminiSystem;

        const geminiMessages = [
          { role: 'system', content: ragPrompt },
          { role: 'user', content: truncatedMessage },
        ];

        const stream = await chatStreamGemini({
          messages: geminiMessages,
          model: geminiModel,
          config: {
            apiKey: geminiApiKey,
            fallbackChain: geminiFallbackChain,
          },
        });
        return new NextResponse(stream, { headers: STREAM_HEADERS });
      }
      throw orError;
    }
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
