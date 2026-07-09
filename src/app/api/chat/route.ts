import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_FALLBACK_CHAIN as BASE_FALLBACK } from '@/lib/models';
import { getTenantBySlug } from '@/lib/tenant';
import { getTenantFromRequest } from '@/lib/get-tenant-from-request';
import { searchAll, formatSearchContext } from '@/lib/search';
import { chatStreamGemini } from '@/lib/gemini-chat';
import { chatStreamSSEWithTools } from '@/lib/openrouter-client';
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
  const IP_V4_REGEX = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const validatedIp = IP_V4_REGEX.test(ip) ? ip : 'unknown';
  const rl = await checkRateLimit(`chat:${validatedIp}`, {
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
      const { data: existing } = await supabase
        .from('chat_sessions')
        .select('user_id')
        .eq('id', session_id)
        .single();

      if (existing) {
        if (existing.user_id) {
          if (!user || existing.user_id !== user.id) {
            return NextResponse.json({ error: 'Session does not belong to you' }, { status: 403 });
          }
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
      const stream = await chatStreamSSEWithTools({
        messages,
        model: modelsToTry[0],
        config: { apiKey, fallbackChain: modelsToTry },
        tools: TEXT_CHAT_TOOLS,
        executeTool: async (name, args) => executeTextChatTool(name, args, toolCtx),
        maxToolRounds: 2,
      });

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
