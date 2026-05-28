import { NextRequest, NextResponse } from 'next/server';
import { getTenantBySlug } from '@/lib/tenant';
import { getTenantFromRequest } from '@/lib/get-tenant-from-request';
import { searchAll, formatSearchContext } from '@/lib/search';
import { chatStreamGemini } from '@/lib/gemini-chat';

const SCHEMA_PROMPT = `
## ESTRUTURA DO BANCO DE DADOS

Você tem acesso a um banco de dados PostgreSQL com as seguintes tabelas e colunas para itens do jogo:

### weapons (Armas)
name, rarity (common/rare/epic/legendary/vaulted), weapon_type, damage_min, damage_max, crit_chance_min, crit_chance_max, attack_speed (fast/medium/slow), knockback, element (fire/frost/poison/dark/ghost/void/earth/none), ability_name, ability_description, ability_energy_cost, ability_cooldown, ability_effect, obtain_method (COMO OBTER), craft_cost, craft_materials, is_worth_crafting, drop_rate_multiplier, drop_rate_percentage, tier (s_plus/s/a/b/c/d), notes

### armors (Armaduras)
name, rarity, world_name, health_bonus, speed_bonus, energy_bonus, passive_ability, passive_ability_level, obtain_method (COMO OBTER), craft_cost, craft_materials, set_bonus, is_worth_crafting, tier, notes

### rings (Anéis)
name, tier, rarity, description, starting_banner, key_buffs, possible_stats, synergy, is_craftable, craft_cost, craft_materials, is_worth_crafting, obtain_method (COMO OBTER), drop_wave_requirement

### enemies (Inimigos)
name, world_name, chapters, enemy_type, description, health_level, speed_level, strength_level, difficulty, attacks, effects, xp_drop, coin_drop, items_dropped, weakness

### bosses (Chefes)
name, world_name, chapter, boss_type, description, hp_level, difficulty, attacks, phase_mechanics, weakness, strategy, tips, xp_drop, items_dropped, notable_loot

### potions (Poções)
name, effects, shop_price, crafting_cost, crafting_materials, unlock_level, max_uses_per_run

### upgrades (Upgrades/Banners)
name, category (offensive/defensive/utility), description, effect, per_rank_effect, max_ranks, tier, is_must_pick, notes

### worlds (Mundos)
world_name, world_number, world_type, level_range, description, environment, chapters, levels_per_chapter, is_coming_soon

### crafting_recipes (Receitas)
item_name, item_type, rarity, gold_cost, materials, is_worth_crafting, worth_notes

### resources (Materiais)
resource_name, resource_type, source_world, source_method, usage_description

## REGRAS DE BUSCA INTELIGENTE
1. NÃO faça busca com a pergunta completa do usuário. Extraia os termos-chave primeiro.
2. Exemplo: "como obter a espada noturna" → busque por "espada noturna" (nome do item)
3. Exemplo: "qual a fraqueza do goblin rei" → busque por "goblin rei" e procure na coluna "weakness" ou "strategy"
4. Se o termo exato não funcionar, tente variações: singular/plural, partes da palavra, sinônimos
5. Exemplo: "necro flash" → mesmo que o banco tenha "Necro Flask", a busca fuzzy encontra
6. A busca agora varre TODAS as tabelas e TODAS as colunas de texto automaticamente
7. Os resultados incluem TODOS os atributos do item — leia os números reais, não invente
`;

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
    const { message } = await request.json();
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const requestTenant = getTenantFromRequest(request);
    let systemPrompt = `${SCHEMA_PROMPT}\n\n${SECTION_PROMPT}`;
    let provider = 'openrouter';
    let model = 'openai/gpt-4o-mini';
    let customApiKey = '';
    let fallbackChain: string[] = [];
    let geminiModel = 'gemini-2.0-flash';
    let geminiCustomApiKey = '';
    let geminiFallbackChain: string[] = [];
    let primaryProvider = 'openrouter';
    let tenantSlug = requestTenant?.slug || '';

    if (requestTenant?.slug) {
      const tenant = await getTenantBySlug(requestTenant.slug);
      if (tenant?.ai_enabled && tenant.ai_config) {
        const config = tenant.ai_config as Record<string, unknown>;
        let userPrompt = (config.system_prompt as string) || '';
        if (userPrompt) {
          systemPrompt = `${userPrompt}\n\n${SCHEMA_PROMPT}\n\n${SECTION_PROMPT}`;
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
