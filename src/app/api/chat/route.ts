import { NextRequest, NextResponse } from 'next/server';
import { getTenantBySlug } from '@/lib/tenant';
import { getTenantFromRequest } from '@/lib/get-tenant-from-request';

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

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

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const requestTenant = getTenantFromRequest(request);
    let systemPrompt = SECTION_PROMPT;
    let model = 'openai/gpt-4o-mini';

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

    const messages: { role: string; content: string }[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message },
    ];

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
