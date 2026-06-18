import { getGameData, getUpdateLog } from '@/supabase';

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

const DEFAULT_FALLBACK_CHAIN = (process.env.FALLBACK_CHAIN ||
  'openai/gpt-4o-mini,minimax/minimax-m2.5:free,google/gemini-flash-1.5,anthropic/claude-3.5-haiku'
).split(',').map(m => m.trim()).filter(Boolean);

export interface OpenRouterConfig {
  apiKey?: string;
  fallbackChain?: string[];
}

export const GENERIC_ERROR_MESSAGE = 'Desculpe não pude te responder, porém acredito que @suporte pode te ajudar';

const getGameDataToolDef = {
  type: 'function' as const,
  function: {
    name: 'getGameData',
    description: 'Get information about game content like powers, NPCs, pets, accessories, or dungeons from a specific world.',
    parameters: {
      type: 'object',
      properties: {
        worldName: { type: 'string', description: 'The name of the world to search in (e.g., "World 1", "Windmill Island").' },
        category: { type: 'string', description: 'The category of information to get (e.g., "powers", "npcs", "pets", "accessories", "dungeons", "missions").' },
        itemName: { type: 'string', description: 'The specific name of the item to look for.' },
      },
      required: ['worldName', 'category'],
    },
  },
};

const getUpdateLogToolDef = {
  type: 'function' as const,
  function: {
    name: 'getUpdateLog',
    description: 'Gets the latest game update log. Use this when the user asks "what is the new update?", "what changed?", "update log", etc.',
    parameters: { type: 'object', properties: {} },
  },
};

const TOOLS = [getGameDataToolDef, getUpdateLogToolDef];

async function openRouterFetch(
  body: Record<string, unknown>,
  signal?: AbortSignal,
  apiKey?: string
): Promise<Response> {
  return fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey || process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://pixelfandom.vercel.app',
      'X-Title': 'PixelFandom',
    },
    body: JSON.stringify(body),
    signal,
  });
}

async function withFallback<T>(
  fn: (model: string) => Promise<T>,
  preferredModel?: string,
  customChain?: string[]
): Promise<T> {
  const chain = customChain && customChain.length > 0 ? customChain : DEFAULT_FALLBACK_CHAIN;
  const modelsToTry = preferredModel
    ? [preferredModel, ...chain.filter((m) => m !== preferredModel)]
    : [...chain];

  let lastError: any;
  for (const model of modelsToTry) {
    try {
      return await fn(model);
    } catch (error) {
      lastError = error;
      console.warn(`Model ${model} failed, trying next fallback:`, error);
    }
  }
  throw new Error(lastError?.message || GENERIC_ERROR_MESSAGE);
}

export async function chat({
  messages,
  model,
  temperature = 0.7,
  maxTokens,
  config,
}: {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  config?: OpenRouterConfig;
}) {
  return withFallback(async (currentModel) => {
    const res = await openRouterFetch({
      model: currentModel,
      messages,
      temperature,
      max_tokens: maxTokens,
    }, undefined, config?.apiKey);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);
    return data.choices[0].message.content;
  }, model, config?.fallbackChain);
}

export async function chatStructured({
  messages,
  model,
  temperature = 0.7,
  responseFormat = 'json_object',
  config,
}: {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  model?: string;
  temperature?: number;
  responseFormat?: string;
  config?: OpenRouterConfig;
}) {
  return withFallback(async (currentModel) => {
    const res = await openRouterFetch({
      model: currentModel,
      messages,
      temperature,
      response_format: { type: responseFormat },
    }, undefined, config?.apiKey);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);
    return data.choices[0].message.content;
  }, model, config?.fallbackChain);
}

export async function chatWithTools({
  messages,
  model,
  temperature = 0.7,
  tools = TOOLS,
  maxToolRounds = 5,
  config,
}: {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  model?: string;
  temperature?: number;
  tools?: any[];
  maxToolRounds?: number;
  config?: OpenRouterConfig;
}) {
  return withFallback(async (currentModel) => {
    let currentMessages = [...messages];
    let toolResults: any[] = [];

    for (let round = 0; round < maxToolRounds; round++) {
      const res = await openRouterFetch({
        model: currentModel,
        messages: currentMessages,
        temperature,
        tools,
      }, undefined, config?.apiKey);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);

      const choice = data.choices[0];
      const message = choice.message;

      if (!message.tool_calls || message.tool_calls.length === 0) {
        return { content: message.content, toolResults };
      }

      currentMessages.push(message);

      for (const tc of message.tool_calls) {
        let result: any;
        try {
          const args = JSON.parse(tc.function.arguments);
          if (tc.function.name === 'getGameData') {
            result = await getGameData(args.worldName, args.category, args.itemName);
          } else if (tc.function.name === 'getUpdateLog') {
            result = await getUpdateLog();
          } else {
            result = { error: `Unknown tool: ${tc.function.name}` };
          }
        } catch (err: any) {
          result = { error: err.message };
        }
        toolResults.push({ name: tc.function.name, result });
        currentMessages.push({
          role: 'tool' as any,
          tool_call_id: tc.id as string,
          content: JSON.stringify(result),
        } as any);
      }
    }

    return { content: 'Maximum tool rounds reached.', toolResults };
  }, model, config?.fallbackChain);
}

export async function chatStreamSSE({
  messages,
  model,
  temperature = 0.7,
  config,
}: {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  model?: string;
  temperature?: number;
  config?: OpenRouterConfig;
}) {
  const chain = config?.fallbackChain && config.fallbackChain.length > 0 ? config.fallbackChain : DEFAULT_FALLBACK_CHAIN;
  const modelsToTry = model
    ? [model, ...chain.filter((m) => m !== model)]
    : [...chain];

  for (const currentModel of modelsToTry) {
    try {
      const res = await openRouterFetch(
        { model: currentModel, messages, temperature, stream: true },
        undefined,
        config?.apiKey
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.body;
    } catch (error) {
      console.warn(`Model ${currentModel} failed for stream:`, error);
    }
  }

  return new ReadableStream({
    start(controller) {
      const err = JSON.stringify({
        generalResponse: JSON.stringify([
          { marcador: 'texto_introdutorio', titulo: 'Erro', conteudo: GENERIC_ERROR_MESSAGE },
        ]),
        personalizedResponse: JSON.stringify([]),
      });
      controller.enqueue(new TextEncoder().encode(err));
      controller.close();
    },
  });
}

export { getGameDataToolDef, getUpdateLogToolDef };
