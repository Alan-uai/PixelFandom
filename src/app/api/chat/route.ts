import { NextRequest, NextResponse } from 'next/server';
import { getTenantBySlug } from '@/lib/tenant';
import { getTenantFromRequest } from '@/lib/get-tenant-from-request';
import { generateEmbedding } from '@/lib/gemini-embedding';

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

async function retrieveContext(
  message: string,
  tenantSlug: string,
  signal?: AbortSignal
): Promise<string> {
  try {
    const embedding = await generateEmbedding(message, signal);
    const embStr = `[${embedding.join(',')}]`;

    const { supabase } = await import('@/supabase');

    const [wikiRes, collectionRes] = await Promise.all([
      supabase.rpc('get_wiki_data', {
        p_slug: tenantSlug,
        p_search: message,
        p_embedding: embStr,
      }),
      supabase.rpc('search_collection_items', {
        p_tenant_slug: tenantSlug,
        p_embedding: embStr,
        p_search: message,
        p_limit: 5,
      }),
    ]);

    const parts: string[] = [];

    const wikiResults = (wikiRes.data?.search_results as any[]) || [];
    if (wikiResults.length > 0) {
      parts.push('--- Artigos do Wiki ---');
      for (const r of wikiResults.slice(0, 3)) {
        const content = r.content ? (r.content as string).replace(/<[^>]+>/g, '').slice(0, 1000) : '';
        parts.push(`Título: ${r.title}\nResumo: ${r.summary || ''}\n${content ? `Conteúdo: ${content}` : ''}`);
      }
    }

    const collectionResults = (collectionRes.data as any[]) || [];
    if (collectionResults.length > 0) {
      parts.push('--- Itens do Jogo ---');
      for (const item of collectionResults.slice(0, 5)) {
        const data = item.data || {};
        const stats = Object.entries(data)
          .filter(([k]) => !['name', 'description'].includes(k))
          .map(([k, v]) => `  ${k}: ${v}`)
          .join('\n');
        parts.push(`Item: ${item.name || data.name || 'Sem nome'}
Coleção: ${item.collection_name || ''}
Descrição: ${item.description || data.description || ''}
${stats ? `Stats:\n${stats}` : ''}`);
      }
    }

    return parts.join('\n\n');
  } catch {
    return '';
  }
}

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

    const contextPromise = retrieveContext(message, tenantSlug, abortCtx.signal);

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
        models: modelsToTry,
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
