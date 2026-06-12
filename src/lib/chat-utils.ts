

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


