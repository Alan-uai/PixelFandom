

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

import { MODEL_CONTEXT_WINDOWS } from '@/lib/models';

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


