const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_GEMINI_MODEL = 'gemini-3.1-flash-preview';

export interface GeminiConfig {
  apiKey?: string;
  fallbackChain?: string[];
}

function buildGeminiBody(
  messages: Array<{ role: string; content: string }>,
  temperature = 0.7
) {
  const systemMessages = messages.filter(m => m.role === 'system');
  const nonSystemMessages = messages.filter(m => m.role !== 'system');

  const contents = nonSystemMessages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const body: Record<string, unknown> = {
    contents,
    generationConfig: { temperature, maxOutputTokens: 8192 },
  };

  if (systemMessages.length > 0) {
    body.systemInstruction = {
      parts: systemMessages.map(m => ({ text: m.content })),
    };
  }

  return body;
}

export async function chatStreamGemini({
  messages,
  model,
  temperature = 0.7,
  config,
}: {
  messages: Array<{ role: string; content: string }>;
  model?: string;
  temperature?: number;
  config?: GeminiConfig;
}): Promise<ReadableStream> {
  const apiKey = config?.apiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const chain = config?.fallbackChain ?? [];
  const primaryModel = model || DEFAULT_GEMINI_MODEL;
  const modelsToTry = [primaryModel, ...chain.filter(m => m !== primaryModel)];

  for (const currentModel of modelsToTry) {
    try {
      const body = buildGeminiBody(messages, temperature);
      const res = await fetch(
        `${GEMINI_API_BASE}/models/${currentModel}:streamGenerateContent?alt=sse`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(60_000),
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error?.message || `Gemini error (${res.status})`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      return new ReadableStream({
        async start(controller) {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const data = line.slice(6);
                try {
                  const parsed = JSON.parse(data);
                  const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
                  if (text) {
                    controller.enqueue(new TextEncoder().encode(text));
                  }
                } catch {
                  // skip malformed JSON lines
                }
              }
            }
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });
    } catch (error) {
      console.warn(`Gemini model ${currentModel} failed:`, error);
    }
  }

  throw new Error('All Gemini models failed');
}

export async function chatGemini({
  messages,
  model,
  temperature = 0.7,
  config,
}: {
  messages: Array<{ role: string; content: string }>;
  model?: string;
  temperature?: number;
  config?: GeminiConfig;
}): Promise<string> {
  const apiKey = config?.apiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const chain = config?.fallbackChain ?? [];
  const primaryModel = model || DEFAULT_GEMINI_MODEL;
  const modelsToTry = [primaryModel, ...chain.filter(m => m !== primaryModel)];

  for (const currentModel of modelsToTry) {
    try {
      const body = buildGeminiBody(messages, temperature);
      const res = await fetch(
        `${GEMINI_API_BASE}/models/${currentModel}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(60_000),
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error?.message || `Gemini error (${res.status})`);
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return text;
    } catch (error) {
      console.warn(`Gemini model ${currentModel} failed:`, error);
    }
  }

  throw new Error('All Gemini models failed');
}
