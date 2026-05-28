export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const GAME_KEYWORDS = [
  'arma', 'armas', 'weapon', 'weapons',
  'armadura', 'armaduras', 'armor', 'armors',
  'anel', 'aneis', 'ring', 'rings',
  'inimigo', 'inimigos', 'enemy', 'enemies',
  'chefe', 'boss', 'bosses',
  'pocao', 'pocoes', 'potions', 'potion',
  'upgrade', 'banner', 'upgrades', 'banners',
  'mundo', 'world', 'worlds',
  'item', 'items', 'item', 'itens',
  'receita', 'craft', 'crafting', 'receitas',
  'recurso', 'resources', 'resource', 'recursos',
  'dano', 'damage', 'crit', 'critical',
  'raro', 'raridade', 'rarity', 'epic', 'legendary', 'comum',
  'fogo', 'fire', 'gelo', 'frost', 'veneno', 'poison',
  'trevas', 'dark', 'ghost', 'void', 'terra', 'earth',
  'tier', 'rank', 'tier',
  'drop', 'farm', 'dropar', 'farme',
  'atributo', 'stats', 'status',
  'habilidade', 'ability', 'skill',
  'forja', 'forge', 'melhorar', 'upgrade',
];

export function isGameRelated(query: string): boolean {
  const q = query.toLowerCase();
  return GAME_KEYWORDS.some(word => q.includes(word));
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function trimMessagesToBudget(
  history: ChatMessage[],
  systemPrompt: string,
  budget: number
): ChatMessage[] {
  const systemTokens = estimateTokens(systemPrompt);

  let available = budget - systemTokens - 512;

  const userAssistantMessages = history.filter(m => m.role !== 'system');
  const recent: ChatMessage[] = [];

  for (let i = userAssistantMessages.length - 1; i >= 0; i--) {
    const msgTokens = estimateTokens(userAssistantMessages[i].content);
    if (available - msgTokens < 256) break;
    recent.unshift(userAssistantMessages[i]);
    available -= msgTokens;
  }

  const result: ChatMessage[] = [{ role: 'system', content: systemPrompt }, ...recent];

  if (userAssistantMessages.length > recent.length) {
    const trimmed = userAssistantMessages.length - recent.length;
    result.splice(1, 0, {
      role: 'system',
      content: `[${trimmed} mensagens anteriores omitidas para caber no contexto.]`,
    });
  }

  return result;
}

const MODEL_CONTEXT_WINDOWS: Record<string, number> = {
  'openai/gpt-4o-mini': 128000,
  'minimax/minimax-m2.5:free': 262144,
  'google/gemini-flash-1.5': 1000000,
  'anthropic/claude-3.5-haiku': 200000,
  'gemini-3.1-flash-preview': 1000000,
  'gemini-2.0-flash': 1000000,
  'gemini-2.0-pro': 2000000,
  'gemini-1.5-flash': 1000000,
  'gemini-1.5-pro': 2000000,
};

export function getContextWindow(model: string): number {
  return MODEL_CONTEXT_WINDOWS[model] || 128000;
}

export const SCHEMA_PROMPT = `
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

export const SECTION_PROMPT = `
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

export function buildSystemPrompt(
  userPrompt: string,
  query: string,
  context: string
): string {
  const includeSchema = isGameRelated(query);
  let prompt = userPrompt || 'Você é um assistente especializado em wikis de jogos.';

  if (includeSchema) {
    prompt += `\n\n${SCHEMA_PROMPT}`;
  }

  prompt += `\n\n${SECTION_PROMPT}`;

  if (context) {
    prompt += `\n\n## Contexto encontrado na base de conhecimento\n${context}\n\nUse o contexto acima como fonte primária para responder. Se o contexto não tiver informação suficiente, complemente com seu conhecimento. Priorize dados dos artigos e itens listados acima.`;
  }

  return prompt;
}
