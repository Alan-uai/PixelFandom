'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/supabase';
import { Button } from '@/components/ui/button';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';
import { FloatingLabelTextarea } from '@/components/ui/floating-label-textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/ui/image-upload';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Check, Headphones, Mic, MicOff, Power, Cpu, Layers, Key, Globe, MessageSquare, Bot, Sparkles } from 'lucide-react';
import { WakeWordDetector } from '@/lib/voice/wakeWord';
import { AI_PERSONALITIES, getPersonality } from '@/lib/ai-personalities';

interface FreeModel {
  id: string;
  name: string;
  context_length: number;
}

const DEFAULT_FREE_MODELS: FreeModel[] = [
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', context_length: 128000 },
  { id: 'minimax/minimax-m2.5:free', name: 'MiniMax M2.5', context_length: 262144 },
  { id: 'google/gemini-flash-1.5', name: 'Gemini Flash 1.5', context_length: 1000000 },
  { id: 'anthropic/claude-3.5-haiku', name: 'Claude 3.5 Haiku', context_length: 200000 },
  { id: 'deepseek/deepseek-v4-flash:free', name: 'DeepSeek V4 Flash', context_length: 1048576 },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B', context_length: 131072 },
];

const DEFAULT_GEMINI_FREE_MODELS: FreeModel[] = [
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', context_length: 1_000_000 },
  { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash-Lite', context_length: 1_000_000 },
  { id: 'gemini-2.0-pro', name: 'Gemini 2.0 Pro', context_length: 2_000_000 },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', context_length: 1_000_000 },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', context_length: 2_000_000 },
];

export default function WikiAIConfigPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { toast } = useToast();
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const initialRef = useRef({
    enabled: false,
    provider: 'openrouter' as 'openrouter' | 'gemini' | 'hybrid',
    primaryProvider: 'openrouter' as 'openrouter' | 'gemini',
    model: 'openai/gpt-4o-mini',
    modelSource: 'free' as 'free' | 'custom',
    customModel: '',
    customApiKey: '',
    fallbackChain: [] as string[],
    fallbackSource: 'free' as 'free' | 'custom',
    geminiModel: 'gemini-2.0-flash',
    geminiModelSource: 'free' as 'free' | 'custom',
    geminiCustomModel: '',
    geminiCustomApiKey: '',
    geminiFallbackChain: [] as string[],
    geminiFallbackSource: 'free' as 'free' | 'custom',
    wakeWordText: 'Psycho',
    chatName: 'Assistente',
    botLogo: '',
    personalityId: 'friendly',
    suggestedQuestions: [] as string[],
    botBanner: '',
  });

  const [enabled, setEnabled] = useState(false);
  const [provider, setProvider] = useState<'openrouter' | 'gemini' | 'hybrid'>('openrouter');
  const [model, setModel] = useState('openai/gpt-4o-mini');
  const [modelSource, setModelSource] = useState<'free' | 'custom'>('free');
  const [customModel, setCustomModel] = useState('');
  const [customApiKey, setCustomApiKey] = useState('');
  const [fallbackChain, setFallbackChain] = useState<string[]>([]);
  const [fallbackSource, setFallbackSource] = useState<'free' | 'custom'>('free');
  const [geminiModel, setGeminiModel] = useState('gemini-2.0-flash');
  const [geminiModelSource, setGeminiModelSource] = useState<'free' | 'custom'>('free');
  const [geminiCustomModel, setGeminiCustomModel] = useState('');
  const [geminiCustomApiKey, setGeminiCustomApiKey] = useState('');
  const [geminiFallbackChain, setGeminiFallbackChain] = useState<string[]>([]);
  const [geminiFallbackSource, setGeminiFallbackSource] = useState<'free' | 'custom'>('free');
  const [wakeWordText, setWakeWordText] = useState('Psycho');
  const [chatName, setChatName] = useState('Assistente');
  const [botLogo, setBotLogo] = useState('');
  const [personalityId, setPersonalityId] = useState('friendly');
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [botBanner, setBotBanner] = useState('');

  const [primaryProvider, setPrimaryProvider] = useState<'openrouter' | 'gemini'>('openrouter');
  const [freeModels, setFreeModels] = useState<FreeModel[]>(DEFAULT_FREE_MODELS);
  const [loadingModels, setLoadingModels] = useState(true);
  const [geminiFreeModels, setGeminiFreeModels] = useState<FreeModel[]>([]);
  const [loadingGeminiModels, setLoadingGeminiModels] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from('tenants')
          .select('*')
          .eq('slug', slug)
          .single();

        if (error) {
          console.error('Load error:', error);
          toast({ variant: 'destructive', title: 'Erro ao carregar', description: error.message });
          setLoading(false);
          return;
        }

        if (data) {
          setTenant(data);
          setEnabled(data.ai_enabled);
          const config = data.ai_config as Record<string, unknown> || {};

          const savedProvider = (config.provider as string) || 'openrouter';
          setProvider(savedProvider as 'openrouter' | 'gemini' | 'hybrid');

          const savedPrimaryProvider = (config.primary_provider as string) || 'openrouter';
          setPrimaryProvider(savedPrimaryProvider as 'openrouter' | 'gemini');

          const savedModel = (config.model as string) || 'openai/gpt-4o-mini';
          const savedCustomApiKey = (config.custom_api_key as string) || '';
          const savedFallbackChain = (config.fallback_chain as string[]) || [];
          const savedModelSource = savedCustomApiKey ? 'custom' : 'free';
          const isCustomModel = savedCustomApiKey && !isFreeModel(savedModel);
          const savedFallbackSource = savedCustomApiKey ? 'custom' : 'free';

          setModel(isCustomModel ? 'openai/gpt-4o-mini' : savedModel);
          setCustomModel(isCustomModel ? savedModel : '');
          setModelSource(isCustomModel ? 'custom' : 'free');
          setCustomApiKey(savedCustomApiKey);
          setFallbackChain(savedFallbackChain);
          setFallbackSource(savedFallbackSource);

          const savedGeminiModel = (config.gemini_model as string) || 'gemini-2.0-flash';
          const savedGeminiCustomApiKey = (config.gemini_custom_api_key as string) || '';
          const savedGeminiFallbackChain = (config.gemini_fallback_chain as string[]) || [];
          const isCustomGemini = savedGeminiCustomApiKey && !isGeminiFreeModel(savedGeminiModel);
          const savedGeminiFallbackSource = savedGeminiCustomApiKey ? 'custom' : 'free';

          setGeminiModel(isCustomGemini ? 'gemini-2.0-flash' : savedGeminiModel);
          setGeminiCustomModel(isCustomGemini ? savedGeminiModel : '');
          setGeminiModelSource(isCustomGemini ? 'custom' : 'free');
          setGeminiCustomApiKey(savedGeminiCustomApiKey);
          setGeminiFallbackChain(savedGeminiFallbackChain);
          setGeminiFallbackSource(savedGeminiFallbackSource);

          setWakeWordText((config.wake_word_text as string) || 'Psycho');
          setChatName((config.chat_name as string) || 'Assistente');
          setBotLogo((config.bot_logo as string) || '');
          setPersonalityId((config.personality_id as string) || 'friendly');
          setSuggestedQuestions((config.suggested_questions as string[]) || []);
          setBotBanner((config.bot_banner as string) || '');

          initialRef.current = {
            enabled: data.ai_enabled,
            provider: savedProvider as any,
            primaryProvider: savedPrimaryProvider as any,
            model: isCustomModel ? 'openai/gpt-4o-mini' : savedModel,
            modelSource: isCustomModel ? 'custom' : 'free',
            customModel: isCustomModel ? savedModel : '',
            customApiKey: savedCustomApiKey,
            fallbackChain: savedFallbackChain,
            fallbackSource: savedFallbackSource,
            geminiModel: isCustomGemini ? 'gemini-2.0-flash' : savedGeminiModel,
            geminiCustomModel: isCustomGemini ? savedGeminiModel : '',
            geminiModelSource: isCustomGemini ? 'custom' : 'free',
            geminiCustomApiKey: savedGeminiCustomApiKey,
            geminiFallbackChain: savedGeminiFallbackChain,
            geminiFallbackSource: savedGeminiFallbackSource,
            wakeWordText: (config.wake_word_text as string) || 'Psycho',
            chatName: (config.chat_name as string) || 'Assistente',
            botLogo: (config.bot_logo as string) || '',
            personalityId: (config.personality_id as string) || 'friendly',
            suggestedQuestions: (config.suggested_questions as string[]) || [],
            botBanner: (config.bot_banner as string) || '',
          };
        }
        setLoading(false);
      } catch (err) {
        console.error('Unexpected load error:', err);
        toast({ variant: 'destructive', title: 'Erro de rede', description: 'Não foi possível carregar as configurações.' });
        setLoading(false);
      }
    })();
  }, [slug]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/openrouter/models');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setFreeModels(data);
          }
        }
      } catch {
      } finally {
        setLoadingModels(false);
      }
    })();
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function isFreeModel(modelId: string) {
    return freeModels.some((m) => m.id === modelId);
  }

  function isGeminiFreeModel(modelId: string) {
    const list = geminiFreeModels.length > 0 ? geminiFreeModels : DEFAULT_GEMINI_FREE_MODELS;
    return list.some((m) => m.id === modelId);
  }

  const resolvedModel = modelSource === 'custom' ? customModel : model;
  const resolvedGeminiModel = geminiModelSource === 'custom' ? geminiCustomModel : geminiModel;

  const handleSave = async () => {
    if (!tenant) return;
    setSaving(true);

    const effectiveApiKey = modelSource === 'custom' || fallbackSource === 'custom' ? customApiKey : '';
    const effectiveGeminiApiKey = geminiModelSource === 'custom' || geminiFallbackSource === 'custom' ? geminiCustomApiKey : '';

    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          ai_enabled: enabled,
          ai_config: {
            ...(tenant.ai_config as Record<string, unknown> || {}),
            provider,
            primary_provider: primaryProvider,
            model: resolvedModel,
            custom_api_key: effectiveApiKey,
            fallback_chain: fallbackChain,
            gemini_model: resolvedGeminiModel,
            gemini_custom_api_key: effectiveGeminiApiKey,
            gemini_fallback_chain: geminiFallbackChain,
            wake_word_text: wakeWordText,
            chat_name: chatName,
            bot_logo: botLogo,
            personality_id: personalityId,
            system_prompt: getPersonality(personalityId).systemPrompt,
            suggested_questions: suggestedQuestions,
            bot_banner: botBanner,
            wake_word: true,
          },
        })
        .eq('id', tenant.id);

      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: error.message });
      } else {
        initialRef.current = {
          enabled,
          provider,
          primaryProvider,
          model: modelSource === 'custom' ? 'openai/gpt-4o-mini' : model,
          modelSource,
          customModel,
          customApiKey: effectiveApiKey,
          fallbackChain,
          fallbackSource,
          geminiModel: geminiModelSource === 'custom' ? 'gemini-2.0-flash' : geminiModel,
          geminiModelSource,
          geminiCustomModel,
          geminiCustomApiKey: effectiveGeminiApiKey,
          geminiFallbackChain,
          geminiFallbackSource,
          wakeWordText,
            chatName,
            botLogo,
            personalityId,
            suggestedQuestions,
          botBanner,
        };
        setSavedFeedback(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setSavedFeedback(false), 3000);
      }
    } catch (err) {
      console.error('Save error:', err);
      toast({ variant: 'destructive', title: 'Erro inesperado', description: 'Não foi possível salvar. Verifique sua conexão e tente novamente.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const showOpenRouter = provider === 'openrouter' || provider === 'hybrid';
  const showGemini = provider === 'gemini' || provider === 'hybrid';

  const isDirty =
    enabled !== initialRef.current.enabled ||
    provider !== initialRef.current.provider ||
    primaryProvider !== initialRef.current.primaryProvider ||
    resolvedModel !== (initialRef.current.modelSource === 'custom' ? initialRef.current.customModel : initialRef.current.model) ||
    modelSource !== initialRef.current.modelSource ||
    customModel !== initialRef.current.customModel ||
    customApiKey !== initialRef.current.customApiKey ||
    JSON.stringify(fallbackChain) !== JSON.stringify(initialRef.current.fallbackChain) ||
    fallbackSource !== initialRef.current.fallbackSource ||
    resolvedGeminiModel !== (initialRef.current.geminiModelSource === 'custom' ? initialRef.current.geminiCustomModel : initialRef.current.geminiModel) ||
    geminiModelSource !== initialRef.current.geminiModelSource ||
    geminiCustomModel !== initialRef.current.geminiCustomModel ||
    geminiCustomApiKey !== initialRef.current.geminiCustomApiKey ||
    JSON.stringify(geminiFallbackChain) !== JSON.stringify(initialRef.current.geminiFallbackChain) ||
    geminiFallbackSource !== initialRef.current.geminiFallbackSource ||
    wakeWordText !== initialRef.current.wakeWordText ||
    chatName !== initialRef.current.chatName ||
    botLogo !== initialRef.current.botLogo ||
    personalityId !== initialRef.current.personalityId ||
    JSON.stringify(suggestedQuestions) !== JSON.stringify(initialRef.current.suggestedQuestions) ||
    botBanner !== initialRef.current.botBanner;

  const sections = [
    { id: 'activation', label: 'Ativação', icon: Power },
    { id: 'model', label: 'Configuração do Modelo', icon: Cpu },
    { id: 'personality', label: 'Personalidade', icon: MessageSquare },
    { id: 'voice', label: 'Agente de Voz', icon: Headphones },
    { id: 'test', label: 'Testar Assistente de Voz', icon: Mic },
  ];

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">

      <section id="activation">
      <Card>
        <CardHeader>
          <CardTitle>Ativação</CardTitle>
          <CardDescription>Ligue ou desligue o assistente IA.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Assistente IA</p>
              <p className="text-sm text-muted-foreground">
                Quando ativo, usuários podem conversar com a IA sobre o conteúdo da wiki.
              </p>
            </div>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="h-5 w-5 rounded border-gray-300"
            />
          </div>
        </CardContent>
      </Card>
      </section>

      <section id="model">
      <Card>
        <CardHeader>
          <CardTitle>Configuração do Modelo</CardTitle>
          <CardDescription>Escolha o provedor de IA, modelo e personalize o comportamento.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          <div className="space-y-2">
            <Label>Provedor</Label>
            <div className="flex gap-2">
              {(['openrouter', 'gemini', 'hybrid'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProvider(p)}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                    provider === p ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent'
                  }`}
                >
                  {p === 'openrouter' ? <Globe className="h-3.5 w-3.5" /> : p === 'gemini' ? <Cpu className="h-3.5 w-3.5" /> : <Layers className="h-3.5 w-3.5" />}
                  {p === 'openrouter' ? 'OpenRouter' : p === 'gemini' ? 'Gemini Nativo' : 'Híbrido'}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {provider === 'openrouter' && 'Usa OpenRouter com fallback entre modelos.'}
              {provider === 'gemini' && 'Usa diretamente a API Gemini do Google.'}
              {provider === 'hybrid' && 'Tenta o provedor primário; se falhar, usa o outro como fallback.'}
            </p>
          </div>

          {provider === 'hybrid' && (
            <div className="space-y-2">
              <Label>Provedor Primário (Híbrido)</Label>
              <div className="flex gap-2">
                {(['openrouter', 'gemini'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPrimaryProvider(p)}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                      primaryProvider === p ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent'
                    }`}
                  >
                    {p === 'openrouter' ? <Globe className="h-3.5 w-3.5" /> : <Cpu className="h-3.5 w-3.5" />}
                    {p === 'openrouter' ? 'OpenRouter' : 'Gemini'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {primaryProvider === 'openrouter'
                  ? 'Tenta OpenRouter primeiro; se falhar, usa Gemini.'
                  : 'Tenta Gemini primeiro; se falhar, usa OpenRouter.'}
              </p>
            </div>
          )}

          {showOpenRouter && (
            <>
            <div className="border-t pt-4 space-y-4">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Globe className="h-4 w-4" />
                OpenRouter
              </h4>

              <div className="space-y-2">
                <Label>Chave de API Própria (opcional)</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    value={customApiKey}
                    onChange={(e) => setCustomApiKey(e.target.value)}
                    placeholder="sk-or-..."
                    className="pl-10 h-8 text-xs font-mono"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Sua chave OpenRouter. Necessária para modelos pagos. Se vazia, usamos a chave padrão do sistema.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Modelo</Label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setModelSource('free')}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                      modelSource === 'free' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent'
                    }`}
                  >
                    <Globe className="h-3.5 w-3.5" />
                    Gratuito (padrão)
                  </button>
                  <button
                    type="button"
                    onClick={() => setModelSource('custom')}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                      modelSource === 'custom' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent'
                    }`}
                  >
                    <Key className="h-3.5 w-3.5" />
                    Custom (minha chave)
                  </button>
                </div>

                {modelSource === 'free' ? (
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {loadingModels && freeModels.length === 0 ? (
                      <option value="">Carregando modelos...</option>
                    ) : (
                      freeModels.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.id}) — {formatContext(m.context_length)}
                        </option>
                      ))
                    )}
                  </select>
                ) : (
                  <FloatingLabelInput
                    label="openai/gpt-4o"
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                    className="text-xs"
                  />
                )}
                <p className="text-xs text-muted-foreground">
                  {modelSource === 'free'
                    ? 'Modelos gratuitos disponíveis via OpenRouter.'
                    : 'Digite o ID completo do modelo (ex: openai/gpt-4o). Requer chave de API própria.'}
                </p>
              </div>

              <div className="border-t pt-4 space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  Chain de Fallback (OpenRouter)
                </Label>
                <p className="text-xs text-muted-foreground">
                  Modelos extras para tentar caso o principal falhe.
                </p>

                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setFallbackSource('free')}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                      fallbackSource === 'free' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent'
                    }`}
                  >
                    <Globe className="h-3.5 w-3.5" />
                    Gratuito (padrão)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFallbackSource('custom')}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                      fallbackSource === 'custom' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent'
                    }`}
                  >
                    <Key className="h-3.5 w-3.5" />
                    Custom (minha chave)
                  </button>
                </div>

                {fallbackSource === 'free' ? (
                  <div className="max-h-40 overflow-y-auto space-y-1 rounded-lg border p-2">
                    {freeModels.map((m) => (
                      <label
                        key={m.id}
                        className="flex items-center gap-2 rounded px-2 py-1 hover:bg-accent cursor-pointer text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={fallbackChain.includes(m.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFallbackChain([...fallbackChain, m.id]);
                            } else {
                              setFallbackChain(fallbackChain.filter((id) => id !== m.id));
                            }
                          }}
                          className="h-3.5 w-3.5 rounded border-gray-300"
                        />
                        <span className="flex-1 truncate">{m.name}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">{formatContext(m.context_length)}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div>
                    <FloatingLabelInput
                      label="modelo1, modelo2, modelo3"
                      value={fallbackChain.join(', ')}
                      onChange={(e) => {
                        const models = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                        setFallbackChain(models);
                      }}
                      className="text-xs"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Digite os IDs separados por vírgula. Requer chave de API própria.
                    </p>
                  </div>
                )}
              </div>
            </div>
            </>
          )}

          {showGemini && (
            <>
            <div className="border-t pt-4 space-y-4">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                Gemini (Google)
              </h4>

              <div className="space-y-2">
                <Label>Chave de API Própria (opcional)</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    value={geminiCustomApiKey}
                    onChange={(e) => setGeminiCustomApiKey(e.target.value)}
                    placeholder="AIza..."
                    className="pl-10 h-8 text-xs font-mono"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Sua chave Gemini API. Se vazia, usamos a chave padrão do sistema.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Modelo</Label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setGeminiModelSource('free')}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                      geminiModelSource === 'free' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent'
                    }`}
                  >
                    <Globe className="h-3.5 w-3.5" />
                    Gratuito (padrão)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGeminiModelSource('custom')}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                      geminiModelSource === 'custom' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent'
                    }`}
                  >
                    <Key className="h-3.5 w-3.5" />
                    Custom (minha chave)
                  </button>
                </div>

                {geminiModelSource === 'free' ? (
                  <select
                    value={geminiModel}
                    onChange={(e) => setGeminiModel(e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {(geminiFreeModels.length > 0 ? geminiFreeModels : DEFAULT_GEMINI_FREE_MODELS).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.id}) — {formatContext(m.context_length)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <FloatingLabelInput
                    label="gemini-2.0-flash"
                    value={geminiCustomModel}
                    onChange={(e) => setGeminiCustomModel(e.target.value)}
                    className="text-xs"
                  />
                )}
                <p className="text-xs text-muted-foreground">
                  {geminiModelSource === 'free'
                    ? 'Modelos gratuitos disponíveis via API Gemini.'
                    : 'Digite o ID do modelo Gemini (ex: gemini-2.0-flash). Requer chave de API própria.'}
                </p>
              </div>

              <div className="border-t pt-4 space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  Chain de Fallback (Gemini)
                </Label>
                <p className="text-xs text-muted-foreground">
                  Modelos extras para tentar caso o principal falhe.
                </p>

                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setGeminiFallbackSource('free')}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                      geminiFallbackSource === 'free' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent'
                    }`}
                  >
                    <Globe className="h-3.5 w-3.5" />
                    Gratuito (padrão)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGeminiFallbackSource('custom')}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                      geminiFallbackSource === 'custom' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent'
                    }`}
                  >
                    <Key className="h-3.5 w-3.5" />
                    Custom (minha chave)
                  </button>
                </div>

                {geminiFallbackSource === 'free' ? (
                  <div className="max-h-40 overflow-y-auto space-y-1 rounded-lg border p-2">
                    {(geminiFreeModels.length > 0 ? geminiFreeModels : DEFAULT_GEMINI_FREE_MODELS).map((m) => (
                      <label
                        key={m.id}
                        className="flex items-center gap-2 rounded px-2 py-1 hover:bg-accent cursor-pointer text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={geminiFallbackChain.includes(m.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setGeminiFallbackChain([...geminiFallbackChain, m.id]);
                            } else {
                              setGeminiFallbackChain(geminiFallbackChain.filter((id) => id !== m.id));
                            }
                          }}
                          className="h-3.5 w-3.5 rounded border-gray-300"
                        />
                        <span className="flex-1 truncate">{m.name}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">{formatContext(m.context_length)}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div>
                    <FloatingLabelInput
                      label="modelo1, modelo2, modelo3"
                      value={geminiFallbackChain.join(', ')}
                      onChange={(e) => {
                        const models = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                        setGeminiFallbackChain(models);
                      }}
                      className="text-xs"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Digite os IDs separados por vírgula. Requer chave de API própria.
                    </p>
                  </div>
                )}
              </div>
            </div>
            </>
          )}

          <div className="border-t pt-4">
            <FloatingLabelInput
              label="Nome do Chat"
              value={chatName}
              onChange={(e) => setChatName(e.target.value)}
              className="text-xs"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Nome exibido na interface do chat (texto e voz).
            </p>
          </div>
        </CardContent>
      </Card>

      {savedFeedback ? (
        <div className="flex items-center gap-2 text-sm text-green-500 font-medium">
          <Check className="h-4 w-4" />
          Configurações salvas!
        </div>
      ) : isDirty ? (
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Salvar Configuração
        </Button>
      ) : null}
      </section>

      <section id="personality">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Personalidade
          </CardTitle>
          <CardDescription>Escolha o estilo de resposta do assistente IA.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {AI_PERSONALITIES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPersonalityId(p.id)}
                className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-all ${
                  personalityId === p.id
                    ? 'border-primary bg-primary/10 ring-1 ring-primary'
                    : 'border-border hover:bg-accent hover:border-muted-foreground/30'
                }`}
              >
                <span className="text-2xl">{p.emoji}</span>
                <span className="text-xs font-medium leading-tight">{p.name}</span>
                <span className="text-[10px] text-muted-foreground leading-tight line-clamp-2">{p.description}</span>
              </button>
            ))}
          </div>
          <div className="rounded-lg bg-muted/50 border p-3">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Prompt da personalidade:</span>{' '}
              {getPersonality(personalityId).systemPrompt}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Perguntas Sugeridas — uma por linha. Aparecem como sugestão no chat.</p>
            <FloatingLabelTextarea
              label="O que é este jogo?
Como faço para começar?
Quais são as melhores armas?"
              value={suggestedQuestions.join('\n')}
              onChange={(e) => setSuggestedQuestions(e.target.value.split('\n').filter(Boolean))}
              className="text-xs min-h-[80px]"
            />
          </div>
          <div className="space-y-2">
            <Label>Logo do Bot</Label>
            <ImageUpload
              bucket="wiki-images"
              pathPrefix={`bot-logos/${slug}`}
              value={botLogo}
              onChange={setBotLogo}
              previewSize="w-16 h-16 rounded-full"
            />
            <p className="text-xs text-muted-foreground">JPEG, PNG ou GIF. Recomendado: 256x256.</p>
          </div>
          <div className="space-y-2">
            <Label>Banner do Chat</Label>
            <ImageUpload
              bucket="wiki-images"
              pathPrefix={`bot-banners/${slug}`}
              value={botBanner}
              onChange={setBotBanner}
              previewSize="w-full h-20"
            />
            <p className="text-xs text-muted-foreground">Imagem de fundo do cabeçalho do chat.</p>
          </div>
        </CardContent>
      </Card>
      </section>

      <section id="voice">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Headphones className="h-5 w-5" />
            Agente de Voz
          </CardTitle>
          <CardDescription>Configure a palavra de ativação do assistente de voz.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <FloatingLabelInput
              label="Nome do Agente (Palavra de Ativação)"
              value={wakeWordText}
              onChange={(e) => setWakeWordText(e.target.value)}
              className="text-xs"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Nome usado para ativar o assistente de voz por comando de voz.
            </p>
          </div>
        </CardContent>
      </Card>
      </section>

      <section id="test">
      {enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Testar Assistente de Voz
            </CardTitle>
            <CardDescription>Teste a palavra de ativação do agente de voz.</CardDescription>
          </CardHeader>
          <CardContent>
            <WakeWordTest wakeWordText={wakeWordText} />
          </CardContent>
        </Card>
      )}
      </section>
    </div>
  );
}

function formatContext(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(0)}M ctx`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)}K ctx`;
  return `${bytes} ctx`;
}

function WakeWordTest({ wakeWordText }: { wakeWordText: string }) {
  const [state, setState] = useState<'idle' | 'requesting' | 'listening' | 'detected'>('idle');
  const detectorRef = useRef<WakeWordDetector | null>(null);

  const cleanup = () => {
    detectorRef.current?.stop();
    detectorRef.current = null;
  };

  const startTest = async () => {
    cleanup();
    setState('requesting');
    try {
      const detector = new WakeWordDetector([wakeWordText]);
      detector.onWakeDetected(() => setState('detected'));
      await detector.start();
      detectorRef.current = detector;
      setState('listening');
    } catch {
      cleanup();
      setState('idle');
    }
  };

  useEffect(() => {
    return () => cleanup();
  }, []);

  return (
    <div className="space-y-4">
      {state === 'idle' && (
        <div className="flex flex-col items-center gap-3 py-4">
          <Button onClick={startTest} className="gap-2">
            <Mic className="h-4 w-4" />
            Iniciar Teste
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Clique para testar a palavra de ativação. Será solicitada permissão para usar o microfone.
          </p>
        </div>
      )}

      {state === 'requesting' && (
        <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Solicitando permissão do microfone...</span>
        </div>
      )}

      {state === 'listening' && (
        <div className="space-y-4 py-2">
          <div className="flex flex-col items-center gap-2">
            <Mic className="h-8 w-8 text-primary animate-pulse" />
            <p className="text-sm font-medium">Ouvindo...</p>
            <p className="text-sm text-muted-foreground">
              Diga: <span className="font-semibold text-foreground">&ldquo;{wakeWordText}&rdquo;</span>
            </p>
          </div>
          <div className="flex justify-center">
            <Button variant="outline" size="sm" onClick={cleanup} className="gap-2">
              <MicOff className="h-4 w-4" />
              Parar
            </Button>
          </div>
        </div>
      )}

      {state === 'detected' && (
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="flex items-center gap-2 text-green-500">
            <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
            <span className="font-medium">Palavra de ativação detectada!</span>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            O assistente de voz está funcionando corretamente.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={cleanup} className="gap-2">
              <MicOff className="h-4 w-4" />
              Parar
            </Button>
            <Button size="sm" onClick={startTest} className="gap-2">
              <Mic className="h-4 w-4" />
              Testar Novamente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
