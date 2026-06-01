export interface ChatMessage {
  role: string;
  content: string | null;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
}

const GAME_KEYWORDS = [
  'arma', 'armas', 'weapon', 'weapons',
  'armadura', 'armaduras', 'armor', 'armors',
  'anel', 'aneis', 'ring', 'rings',
  'inimigo', 'inimigos', 'enemy', 'enemies',
  'chefe', 'boss', 'bosses',
  'pocao', 'pocoes', 'poção', 'poções', 'potions', 'potion',
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
    const content = userAssistantMessages[i].content || '';
    const msgTokens = estimateTokens(content);
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
- O content pode ter múltiplas linhas e markdown (negrito, itálico, listas, etc)
- Para referenciar artigos da wiki, use o formato: [[slug-do-artigo|Nome do Artigo]]
- Responda APENAS no formato acima, sem texto fora das seções
- Use português brasileiro
`;

export const TEXT_CHAT_SYSTEM_PROMPT = `
You are an expert wiki assistant integrated with a game database. You have access to tools that let you search and retrieve real data.

TOOLS AVAILABLE:
1. searchWiki(query) — Search ALL wiki + game data. Returns wiki articles (lore, guides) and game_items (weapons, armors, bosses, enemies, rings, potions, upgrades with stats). Use this for finding specific items, enemies, or articles by name.
2. getWikiInfo() — Get wiki metadata: total article count, per-tag counts (tag_counts), all tags. Use for "how many articles", "quantas poções existem", "what categories exist".
3. getWikiArticle(slug) — Get full article content + item stats by slug. Use after searchWiki to read details.
4. listWikiArticles(tag?) — List articles by category tag (potions, weapons, etc.) or all if no tag.

CRITICAL RULES:
1. ALWAYS use tools to get real data. NEVER invent numbers, stats, or counts.
2. Extract key terms for search — search for "espada noturna" not "como obter a espada noturna".
3. Use getWikiInfo for COUNT questions. It returns exact tag_counts from the database.
4. If a tool returns empty or null, say the info is not available — do not hallucinate.
5. Be thorough: if search returns nothing, try variations before giving up.
6. Respond in natural Portuguese (PT-BR) unless the user asks otherwise.
7. Format your response in the @@@SECTION@@@ format described below.
`;

export async function loadChatHistory(
  sessionId: string,
  limit = 20
): Promise<ChatMessage[]> {
  const { createClient } = await import('@/supabase/server');
  const supabase = await createClient();
  const { data } = await supabase
    .from('chat_messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .eq('provider', 'text')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (!data) return [];
  return data as ChatMessage[];
}

export { getSchemaPrompt } from './game-schema';
