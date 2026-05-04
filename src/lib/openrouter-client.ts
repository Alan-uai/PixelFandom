import { OpenRouter } from '@openrouter/sdk';

const openRouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function chat({
  messages,
  model = 'openai/gpt-4o-mini',
  temperature = 0.7,
  maxTokens,
}: {
  messages: Array<{ role: string; content: string }>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}) {
  const result = await openRouter.chat.send({
    messages,
    model,
    temperature,
    max_tokens: maxTokens,
  });

  const response = await result;
  return response.choices[0].message.content;
}

export async function chatStructured({
  messages,
  model = 'openai/gpt-4o-mini',
  temperature = 0.7,
  responseFormat,
}: {
  messages: Array<{ role: string; content: string }>;
  model?: string;
  temperature?: number;
  responseFormat?: 'json' | 'text';
}) {
  const result = await openRouter.chat.send({
    messages,
    model,
    temperature,
    response_format: responseFormat === 'json' ? { type: 'json_object' } : undefined,
  });

  const response = await result;
  return response.choices[0].message.content;
}

export async function chatStream({
  messages,
  model = 'openai/gpt-4o-mini',
  temperature = 0.7,
}: {
  messages: Array<{ role: string; content: string }>;
  model?: string;
  temperature?: number;
}) {
  const result = await openRouter.chat.send({
    messages,
    model,
    temperature,
    stream: true,
  });

  return result;
}

export { openRouter };