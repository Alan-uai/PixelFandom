import { DEFAULT_FALLBACK_CHAIN as BASE_FALLBACK } from '@/lib/models';
import { MAIN_URL } from '@/lib/constants';
import { getGameData, getUpdateLog } from '@/supabase';

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

const DEFAULT_FALLBACK_CHAIN = (process.env.FALLBACK_CHAIN ||
  BASE_FALLBACK.join(',')
).split(',').map(m => m.trim()).filter(Boolean);

export interface OpenRouterConfig {
  apiKey?: string;
  fallbackChain?: string[];
}

import { GENERIC_ERROR_MESSAGE } from './constants';
export { GENERIC_ERROR_MESSAGE };

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
      'HTTP-Referer': MAIN_URL,
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

export async function chatStreamSSEWithTools({
  messages,
  model,
  temperature = 0.7,
  tools,
  executeTool,
  maxToolRounds = 3,
  config,
}: {
  messages: Record<string, unknown>[];
  model?: string;
  temperature?: number;
  tools?: any[];
  executeTool?: (name: string, args: any) => Promise<any>;
  maxToolRounds?: number;
  config?: OpenRouterConfig;
}): Promise<ReadableStream> {
  const apiKey = config?.apiKey || process.env.OPENROUTER_API_KEY || '';
  const chain = config?.fallbackChain && config.fallbackChain.length > 0 ? config.fallbackChain : DEFAULT_FALLBACK_CHAIN;
  const modelsToTry = model ? [model, ...chain.filter(m => m !== model)] : [...chain];

  let currentMessages = [...messages];
  let round = 0;

  async function pump(controller: ReadableStreamController<Uint8Array>) {
    while (round < maxToolRounds) {
      let lastError: Error | null = null;

      for (const currentModel of modelsToTry) {
        try {
          const body: Record<string, unknown> = {
            model: currentModel,
            messages: currentMessages,
            temperature,
            stream: true,
            stream_options: { include_usage: true },
          };
          if (tools) body.tools = tools;

          const res = await openRouterFetch(body, AbortSignal.timeout(120_000), apiKey);
          if (!res.ok) {
            const errData = await res.json().catch(() => null);
            throw new Error(errData?.error?.message || `HTTP ${res.status}`);
          }

          const reader = res.body?.getReader();
          if (!reader) throw new Error('No response body');

          const decoder = new TextDecoder();
          let buf = '';
          const toolAcc = new Map<number, {
            id: string;
            type: string;
            function: { name: string; arguments: string };
          }>();
          let hadTools = false;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buf += decoder.decode(value, { stream: true });
            const lines = buf.split('\n');
            buf = lines.pop() || '';

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const choice = parsed.choices?.[0];
                if (!choice) continue;
                const delta = choice.delta;

                if (delta?.content) {
                  controller.enqueue(new TextEncoder().encode(delta.content));
                }

                if (tools && delta?.tool_calls) {
                  hadTools = true;
                  for (const tc of delta.tool_calls) {
                    const idx = tc.index;
                    if (!toolAcc.has(idx)) {
                      toolAcc.set(idx, { id: '', type: 'function', function: { name: '', arguments: '' } });
                    }
                    const a = toolAcc.get(idx)!;
                    if (tc.id) a.id = tc.id;
                    if (tc.function?.name) a.function.name += tc.function.name;
                    if (tc.function?.arguments) a.function.arguments += tc.function.arguments;
                  }
                }

                if (tools && choice.finish_reason === 'tool_calls') {
                  hadTools = true;
                }
              } catch {
                // skip malformed JSON lines
              }
            }
          }

          if (!hadTools) {
            controller.close();
            return;
          }

          round++;

          if (round >= maxToolRounds || !executeTool || !tools) {
            controller.close();
            return;
          }

          const toolCalls = Array.from(toolAcc.entries())
            .sort(([a], [b]) => a - b)
            .map(([_, tc]) => tc);

          if (!toolCalls.length) {
            controller.close();
            return;
          }

          currentMessages.push({
            role: 'assistant',
            content: null,
            tool_calls: toolCalls,
          });

          const results = await Promise.all(
            toolCalls.map(async (tc: any) => {
              try {
                const args = JSON.parse(tc.function.arguments);
                const result = await executeTool(tc.function.name, args);
                return { role: 'tool', tool_call_id: tc.id, content: JSON.stringify(result) };
              } catch (e: any) {
                return { role: 'tool', tool_call_id: tc.id, content: JSON.stringify({ error: e.message }) };
              }
            })
          );

          currentMessages.push(...results);
          lastError = null;
          break;
        } catch (e) {
          lastError = e as Error;
          console.warn(`Model ${currentModel} failed (round ${round}):`, e);
        }
      }

      if (lastError) {
        if (round === 0) {
          controller.error(lastError);
        } else {
          controller.close();
        }
        return;
      }
    }

    controller.close();
  }

  return new ReadableStream({ start: pump });
}

export { getGameDataToolDef, getUpdateLogToolDef };
