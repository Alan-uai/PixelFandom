export interface ModelInfo {
  id: string;
  displayName: string;
  contextWindow: number;
  provider: 'openrouter' | 'gemini' | 'openai' | 'anthropic' | 'google';
}

export const AVAILABLE_MODELS: ModelInfo[] = [
  { id: 'openai/gpt-4o-mini', displayName: 'GPT-4o Mini', contextWindow: 128000, provider: 'openrouter' },
  { id: 'minimax/minimax-m2.5:free', displayName: 'MiniMax M2.5', contextWindow: 262144, provider: 'openrouter' },
  { id: 'google/gemini-flash-1.5', displayName: 'Gemini Flash 1.5', contextWindow: 1000000, provider: 'openrouter' },
  { id: 'anthropic/claude-3.5-haiku', displayName: 'Claude 3.5 Haiku', contextWindow: 200000, provider: 'openrouter' },
  { id: 'deepseek/deepseek-chat:free', displayName: 'DeepSeek Chat', contextWindow: 131072, provider: 'openrouter' },
  { id: 'deepseek/deepseek-v4-flash:free', displayName: 'DeepSeek V4 Flash', contextWindow: 1048576, provider: 'openrouter' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', displayName: 'Llama 3.3 70B', contextWindow: 131072, provider: 'openrouter' },
  { id: 'qwen/qwen3-coder:free', displayName: 'Qwen3 Coder', contextWindow: 1048576, provider: 'openrouter' },
  { id: 'nousresearch/hermes-3-llama-3.1-405b:free', displayName: 'Hermes 3 405B', contextWindow: 131072, provider: 'openrouter' },
  { id: 'gemini-3.1-flash-preview', displayName: 'Gemini 3.1 Flash Preview', contextWindow: 1000000, provider: 'gemini' },
  { id: 'gemini-2.0-flash', displayName: 'Gemini 2.0 Flash', contextWindow: 1000000, provider: 'gemini' },
  { id: 'gemini-2.0-flash-lite', displayName: 'Gemini 2.0 Flash-Lite', contextWindow: 1000000, provider: 'gemini' },
  { id: 'gemini-2.0-pro', displayName: 'Gemini 2.0 Pro', contextWindow: 2000000, provider: 'gemini' },
  { id: 'gemini-1.5-flash', displayName: 'Gemini 1.5 Flash', contextWindow: 1000000, provider: 'gemini' },
  { id: 'gemini-1.5-pro', displayName: 'Gemini 1.5 Pro', contextWindow: 2000000, provider: 'gemini' },
];

export const MODEL_CONTEXT_WINDOWS: Record<string, number> =
  Object.fromEntries(AVAILABLE_MODELS.map((m) => [m.id, m.contextWindow]));

export const DEFAULT_FALLBACK_CHAIN = [
  'openai/gpt-4o-mini',
  'minimax/minimax-m2.5:free',
  'google/gemini-flash-1.5',
  'anthropic/claude-3.5-haiku',
];

export const OPENROUTER_FREE_MODELS = AVAILABLE_MODELS
  .filter((m) => m.provider === 'openrouter')
  .map((m) => ({ id: m.id, name: m.displayName, context_length: m.contextWindow }));

export const GEMINI_FREE_MODELS = AVAILABLE_MODELS
  .filter((m) => m.provider === 'gemini')
  .map((m) => ({ id: m.id, name: m.displayName, context_length: m.contextWindow }));
