import { NextRequest, NextResponse } from 'next/server';
import { getTenantBySlug } from '@/lib/tenant';
import { getTenantFromRequest } from '@/lib/get-tenant-from-request';
import { searchAll, formatSearchContext } from '@/lib/search';

const SECTION_PROMPT = `
FORMATO DE RESPOSTA - SIGA ESTRITAMENTE:
Forneça sua resposta em seções separadas. Cada seção DEVE começar com @@@SECTION@@@ na própria linha, seguido de um JSON na linha seguinte.

Exemplo:
@@@SECTION@@@
{"sectionType":"resumo","title":"Resumo","content":"Resposta direta e objetiva aqui."}
@@@SECTION@@@
{"sectionType":"detalhes","title":"Detalhes","content":"Informações detalhadas..."}
@@@SECTION@@@
{"sectionType":"dicas","title":"Dicas","content":"Dicas práticas, atalhos, como encontrar ou fazer..."}

REGRAS:
- sectionType pode ser: "resumo", "detalhes", "dicas" ou outro que fizer sentido
- O "resumo" deve ser a primeira seção, enxuta e direta
- Os campos title e content são string
- O content pode ter múltiplas linhas e markdown
- Responda APENAS no formato acima, sem texto fora das seções
- Use português brasileiro
`;

const FALLBACK_CHAIN = (
  process.env.FALLBACK_CHAIN ||
  'openai/gpt-4o-mini,minimax/minimax-m2.5:free,google/gemini-flash-1.5,anthropic/claude-3.5-haiku'
).split(',').map((m) => m.trim()).filter(Boolean);

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const requestTenant = getTenantFromRequest(request);
    let systemPrompt = SECTION_PROMPT;
    let model = 'openai/gpt-4o-mini';
    let tenantSlug = requestTenant?.slug || '';

    if (requestTenant?.slug) {
      const tenant = await getTenantBySlug(requestTenant.slug);
      if (tenant?.ai_enabled && tenant.ai_config) {
        const config = tenant.ai_config as Record<string, unknown>;
        const userPrompt = (config.system_prompt as string) || '';
        if (userPrompt) {
          systemPrompt = `${userPrompt}\n\n${SECTION_PROMPT}`;
        }
        model = (config.model as string) || model;
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

    const modelsToTry = model
      ? [model, ...FALLBACK_CHAIN.filter((m) => m !== model)]
      : FALLBACK_CHAIN;

    const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
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

    if (!orRes.ok) {
      const errData = await orRes.json().catch(() => null);
      throw new Error(errData?.error?.message || `OpenRouter error (${orRes.status})`);
    }

    const stream = orRes.body;
    if (!stream) throw new Error('No response body');

    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let lineBuffer = '';

    const readableStream = new ReadableStream({
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

    return new NextResponse(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('OpenRouter error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
