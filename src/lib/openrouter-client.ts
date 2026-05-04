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

export async function* chatStream({
  messages,
  model = 'openai/gpt-4o-mini',
  temperature = 0.7,
}: {
  messages: Array<{ role: string; content: string }>;
  model?: string;
  temperature?: number;
}) {
  const stream = await openRouter.chat.send({
    messages,
    model,
    temperature,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices?.[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
}

export async function chatStreamSSE({
  messages,
  model = 'openai/gpt-4o-mini',
  temperature = 0.7,
}: {
  messages: Array<{ role: string; content: string }>;
  model?: string;
  temperature?: number;
}) {
  const stream = await openRouter.chat.send({
    messages,
    model,
    temperature,
    stream: true,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const content = chunk.choices?.[0]?.delta?.content;
          if (content) {
            const data = JSON.stringify({ delta: content });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
        }

        if (stream.response) {
          const usage = await stream.response;
          const usageData = JSON.stringify({ usage });
          controller.enqueue(encoder.encode(`data: {"done": true, "usage": ${usageData}}\n\n`));
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        const errorData = JSON.stringify({ error: error.message });
        controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
        controller.close();
      }
    }
  });

  return readable;
}

export { openRouter };