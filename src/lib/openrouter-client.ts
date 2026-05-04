import { OpenRouter } from '@openrouter/sdk';
import { tool } from '@openrouter/sdk';
import { z } from 'zod';
import { getGameData, getUpdateLog } from '@/supabase';

const openRouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const FALLBACK_CHAIN = (process.env.FALLBACK_CHAIN ||
  'openai/gpt-4o-mini,minimax/minimax-m2.5:free,google/gemini-flash-1.5,anthropic/claude-3.5-haiku'
).split(',').map(m => m.trim()).filter(Boolean);

export const GENERIC_ERROR_MESSAGE = 'Desculpe não pude te responder, porém acredito que @suporte pode te ajudar';

const getGameDataTool = tool({
  name: 'getGameData',
  description: 'Get information about game content like powers, NPCs, pets, accessories, or dungeons from a specific world.',
  inputSchema: z.object({
    worldName: z.string().describe('The name of the world to search in (e.g., "World 1", "Windmill Island").'),
    category: z.string().describe('The category of information to get (e.g., "powers", "npcs", "pets", "accessories", "dungeons", "missions").'),
    itemName: z.string().optional().describe('The specific name of the item to look for (e.g., "Grand Elder Power"). Be flexible; if an exact match fails, try a partial name.'),
  }),
  outputSchema: z.unknown(),
  execute: async (params) => {
    return await getGameData(params.worldName, params.category, params.itemName);
  }
});

const getUpdateLogTool = tool({
  name: 'getUpdateLog',
  description: 'Gets the latest game update log. Use this when the user asks "what is the new update?", "what changed?", "update log", etc.',
  inputSchema: z.object({}),
  outputSchema: z.unknown(),
  execute: async () => {
    return await getUpdateLog();
  }
});

async function withFallback<T>(fn: (model: string) => Promise<T>, preferredModel?: string): Promise<T> {
  const modelsToTry = preferredModel 
    ? [preferredModel, ...FALLBACK_CHAIN.filter(m => m !== preferredModel)]
    : [...FALLBACK_CHAIN];
  
  let lastError: any;
  for (const model of modelsToTry) {
    try {
      return await fn(model);
    } catch (error) {
      lastError = error;
      console.warn(`Model ${model} failed, trying next fallback:`, error);
    }
  }
  throw new Error(GENERIC_ERROR_MESSAGE);
}

export async function chat({ 
  messages, 
  model, 
  temperature = 0.7, 
  maxTokens 
}: {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}) {
  return withFallback(async (currentModel) => {
    const result = await openRouter.chat.send({
      chatRequest: {
        messages,
        model: currentModel,
        temperature,
        maxTokens,
      }
    });
    return result.choices[0].message.content;
  }, model);
}

export async function chatStructured({ 
  messages, 
  model, 
  temperature = 0.7, 
  responseFormat = 'json_object' 
}: {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  model?: string;
  temperature?: number;
  responseFormat?: string;
}) {
  return withFallback(async (currentModel) => {
    const result = await openRouter.chat.send({
      chatRequest: {
        messages,
        model: currentModel,
        temperature,
        responseFormat: { type: responseFormat as any },
      }
    });
    return result.choices[0].message.content;
  }, model);
}

export async function chatWithTools({
  messages,
  model,
  temperature = 0.7,
  tools = [getGameDataTool, getUpdateLogTool],
  maxToolRounds = 5,
}: {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  model?: string;
  temperature?: number;
  tools?: any[];
  maxToolRounds?: number;
}) {
  return withFallback(async (currentModel) => {
    const result = await openRouter.callModel({
      chatRequest: {
        messages,
        model: currentModel,
        temperature,
      },
      tools,
      maxToolRounds,
    });
    return result;
  }, model);
}

export async function chatStreamSSE({ 
  messages, 
  model, 
  temperature = 0.7 
}: {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  model?: string;
  temperature?: number;
}) {
  const modelsToTry = model 
    ? [model, ...FALLBACK_CHAIN.filter(m => m !== model)]
    : [...FALLBACK_CHAIN];
  
  for (const currentModel of modelsToTry) {
    try {
      const stream = await openRouter.chat.stream({
        chatRequest: {
          messages,
          model: currentModel,
          temperature,
          stream: true,
        }
      });
      return stream;
    } catch (error) {
      console.warn(`Model ${currentModel} failed for stream, trying next fallback:`, error);
    }
  }
  
  return new ReadableStream({
    start(controller) {
      const errorData = JSON.stringify({
        generalResponse: JSON.stringify([{
          marcador: 'texto_introdutorio',
          titulo: 'Erro',
          conteudo: GENERIC_ERROR_MESSAGE
        }]),
        personalizedResponse: JSON.stringify([])
      });
      controller.enqueue(new TextEncoder().encode(errorData));
      controller.close();
    }
  });
}

export { openRouter, getGameDataTool, getUpdateLogTool };
