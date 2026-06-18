'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/supabase';
import { useCachedData } from '@/hooks/use-cached-data';
import { useSiteCache } from '@/lib/site-cache';
import { Button } from '@/components/ui/button';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';
import { FloatingLabelTextarea } from '@/components/ui/floating-label-textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/ui/image-upload';
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { WeldingCard } from '@/components/ui/welding-card';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
import { SelectCard } from '@/components/ui/select-card';
import { OPENROUTER_FREE_MODELS, GEMINI_FREE_MODELS as GEMINI_FREE_MODELS_SHARED } from '@/lib/models';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mic, MicOff, Cpu, Layers, Key, Globe, MessageSquare, Bot } from 'lucide-react';
import { WakeWordDetector } from '@/lib/voice/wakeWord';
import { AI_PERSONALITIES, getPersonality } from '@/lib/ai-personalities';
import { responseFormatStyles, responseStyleGroups } from '@/lib/response-styles';
import { useRegisterUnsavedChanges } from '@/components/unsaved-changes';

interface FreeModel {
  id: string;
  name: string;
  context_length: number;
}

const DEFAULT_FREE_MODELS: FreeModel[] = OPENROUTER_FREE_MODELS;

const DEFAULT_GEMINI_FREE_MODELS: FreeModel[] = GEMINI_FREE_MODELS_SHARED;

export default function WikiAIConfigPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { toast } = useToast();
  const [savedConfig, setSavedConfig] = useState({
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
    responseStyle: 'detalhado',
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
  const [responseStyle, setResponseStyle] = useState('detalhado');
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [botBanner, setBotBanner] = useState('');

  const [primaryProvider, setPrimaryProvider] = useState<'openrouter' | 'gemini'>('openrouter');
  const [freeModels, setFreeModels] = useState<FreeModel[]>(DEFAULT_FREE_MODELS);
  const [loadingModels, setLoadingModels] = useState(true);
  const [geminiFreeModels] = useState<FreeModel[]>([]);
  const initializedRef = useRef(false);

  const { data: tenantData, error: tenantError, loading: tenantLoading } = useCachedData<{ id: string }>(
    `tenant-id:${slug}`,
    async () => {
      const { data } = await supabase.from('tenants').select('id').eq('slug', slug).single();
      return data!;
    }
  );

  const cacheKey = tenantData?.id ? `ai-config:${tenantData.id}` : null;
  const { data: aiConfig, loading } = useCachedData<{
    ai_enabled: boolean; ai_config: Record<string, unknown>;
  }>(
    cacheKey,
    async () => {
      const r = await fetch(`/api/tenants/${tenantData!.id}/ai-config`);
      return r.json();
    }
  );

  useEffect(() => {
    if (!tenantData || !aiConfig || initializedRef.current) return;
    initializedRef.current = true;

    const config = aiConfig.ai_config;
    setEnabled(aiConfig.ai_enabled);

    if (!config) return;

    const savedProvider = (config.provider as string) || 'openrouter';
    setProvider(savedProvider as 'openrouter' | 'gemini' | 'hybrid');

    const savedPrimaryProvider = (config.primary_provider as string) || 'openrouter';
    setPrimaryProvider(savedPrimaryProvider as 'openrouter' | 'gemini');

    const savedModel = (config.model as string) || 'openai/gpt-4o-mini';
    const savedCustomApiKey = (config.custom_api_key as string) || '';
    const savedFallbackChain = (config.fallback_chain as string[]) || [];
    const isCustomModel = savedCustomApiKey && !freeModels.some((m) => m.id === savedModel);

    setModel(isCustomModel ? 'openai/gpt-4o-mini' : savedModel);
    setCustomModel(isCustomModel ? savedModel : '');
    setModelSource(isCustomModel ? 'custom' : 'free');
    setCustomApiKey(savedCustomApiKey);
    setFallbackChain(savedFallbackChain);
    setFallbackSource(savedCustomApiKey ? 'custom' : 'free');

    const savedGeminiModel = (config.gemini_model as string) || 'gemini-2.0-flash';
    const savedGeminiCustomApiKey = (config.gemini_custom_api_key as string) || '';
    const savedGeminiFallbackChain = (config.gemini_fallback_chain as string[]) || [];
    const geminiList = geminiFreeModels.length > 0 ? geminiFreeModels : DEFAULT_GEMINI_FREE_MODELS;
    const isCustomGemini = savedGeminiCustomApiKey && !geminiList.some((m) => m.id === savedGeminiModel);

    setGeminiModel(isCustomGemini ? 'gemini-2.0-flash' : savedGeminiModel);
    setGeminiCustomModel(isCustomGemini ? savedGeminiModel : '');
    setGeminiModelSource(isCustomGemini ? 'custom' : 'free');
    setGeminiCustomApiKey(savedGeminiCustomApiKey);
    setGeminiFallbackChain(savedGeminiFallbackChain);
    setGeminiFallbackSource(savedGeminiCustomApiKey ? 'custom' : 'free');

    setWakeWordText((config.wake_word_text as string) || 'Psycho');
    setChatName((config.chat_name as string) || 'Assistente');
    setBotLogo((config.bot_logo as string) || '');
    setPersonalityId((config.personality_id as string) || 'friendly');
    setResponseStyle((config.response_style as string) || 'detalhado');
    setSuggestedQuestions((config.suggested_questions as string[]) || []);
    setBotBanner((config.bot_banner as string) || '');

    setSavedConfig({
      enabled: aiConfig.ai_enabled,
      provider: savedProvider as any,
      primaryProvider: savedPrimaryProvider as any,
      model: isCustomModel ? 'openai/gpt-4o-mini' : savedModel,
      modelSource: isCustomModel ? 'custom' : 'free',
      customModel: isCustomModel ? savedModel : '',
      customApiKey: savedCustomApiKey,
      fallbackChain: savedFallbackChain,
      fallbackSource: savedCustomApiKey ? 'custom' : 'free',
      geminiModel: isCustomGemini ? 'gemini-2.0-flash' : savedGeminiModel,
      geminiCustomModel: isCustomGemini ? savedGeminiModel : '',
      geminiModelSource: isCustomGemini ? 'custom' : 'free',
      geminiCustomApiKey: savedGeminiCustomApiKey,
      geminiFallbackChain: savedGeminiFallbackChain,
      geminiFallbackSource: savedGeminiCustomApiKey ? 'custom' : 'free',
      wakeWordText: (config.wake_word_text as string) || 'Psycho',
      chatName: (config.chat_name as string) || 'Assistente',
      botLogo: (config.bot_logo as string) || '',
      personalityId: (config.personality_id as string) || 'friendly',
      responseStyle: (config.response_style as string) || 'detalhado',
      suggestedQuestions: (config.suggested_questions as string[]) || [],
      botBanner: (config.bot_banner as string) || '',
    });
  }, [tenantData, aiConfig]);

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
      } catch {/* noop */} finally {
        setLoadingModels(false);
      }
    })();
  }, []);

  const resolvedModel = modelSource === 'custom' ? customModel : model;
  const resolvedGeminiModel = geminiModelSource === 'custom' ? geminiCustomModel : geminiModel;

  const handleSave = useCallback(async () => {
    const tid = tenantData?.id;
    if (!tid) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Tenant não encontrado.' });
      return;
    }

    const effectiveApiKey = modelSource === 'custom' || fallbackSource === 'custom' ? customApiKey : '';
    const effectiveGeminiApiKey = geminiModelSource === 'custom' || geminiFallbackSource === 'custom' ? geminiCustomApiKey : '';

    try {
      const res = await fetch(`/api/tenants/${tid}/ai-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ai_enabled: enabled,
          ai_config: {
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
            response_style: responseStyle,
            system_prompt: getPersonality(personalityId).systemPrompt,
            suggested_questions: suggestedQuestions,
            bot_banner: botBanner,
            wake_word: true,
          },
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Save failed' }));
        toast({ variant: 'destructive', title: 'Erro', description: errData.error });
        return;
      }

      const result = await res.json();
      setSavedConfig({
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
        responseStyle,
        suggestedQuestions,
        botBanner,
      });

      useSiteCache.getState().set(`ai-config:${tid}`, result);
      toast({ title: 'Salvo', description: 'Configurações salvas com sucesso.' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar configurações';
      toast({ variant: 'destructive', title: 'Erro', description: message });
    }
  }, [
    tenantData, enabled, provider, primaryProvider, resolvedModel, modelSource,
    customModel, customApiKey, fallbackChain, fallbackSource,
    resolvedGeminiModel, geminiModelSource, geminiCustomModel,
    geminiCustomApiKey, geminiFallbackChain, geminiFallbackSource,
    wakeWordText, chatName, botLogo, personalityId, responseStyle,
    suggestedQuestions, botBanner, toast,
  ]);

  const isDirty = useMemo(() =>
    enabled !== savedConfig.enabled ||
    provider !== savedConfig.provider ||
    primaryProvider !== savedConfig.primaryProvider ||
    resolvedModel !== (savedConfig.modelSource === 'custom' ? savedConfig.customModel : savedConfig.model) ||
    modelSource !== savedConfig.modelSource ||
    customModel !== savedConfig.customModel ||
    customApiKey !== savedConfig.customApiKey ||
    JSON.stringify(fallbackChain) !== JSON.stringify(savedConfig.fallbackChain) ||
    fallbackSource !== savedConfig.fallbackSource ||
    resolvedGeminiModel !== (savedConfig.geminiModelSource === 'custom' ? savedConfig.geminiCustomModel : savedConfig.geminiModel) ||
    geminiModelSource !== savedConfig.geminiModelSource ||
    geminiCustomModel !== savedConfig.geminiCustomModel ||
    geminiCustomApiKey !== savedConfig.geminiCustomApiKey ||
    JSON.stringify(geminiFallbackChain) !== JSON.stringify(savedConfig.geminiFallbackChain) ||
    geminiFallbackSource !== savedConfig.geminiFallbackSource ||
    wakeWordText !== savedConfig.wakeWordText ||
    chatName !== savedConfig.chatName ||
    botLogo !== savedConfig.botLogo ||
    personalityId !== savedConfig.personalityId ||
    responseStyle !== savedConfig.responseStyle ||
    JSON.stringify(suggestedQuestions) !== JSON.stringify(savedConfig.suggestedQuestions) ||
    botBanner !== savedConfig.botBanner,
  [
    savedConfig,
    enabled, provider, primaryProvider, resolvedModel, modelSource,
    customModel, customApiKey, fallbackChain, fallbackSource,
    resolvedGeminiModel, geminiModelSource, geminiCustomModel,
    geminiCustomApiKey, geminiFallbackChain, geminiFallbackSource,
    wakeWordText, chatName, botLogo, personalityId, responseStyle,
    suggestedQuestions, botBanner,
  ]);

  const handleDiscard = useCallback(() => {
    setEnabled(savedConfig.enabled);
    setProvider(savedConfig.provider);
    setPrimaryProvider(savedConfig.primaryProvider);
    setModel(savedConfig.modelSource === 'custom' ? 'openai/gpt-4o-mini' : savedConfig.model);
    setModelSource(savedConfig.modelSource);
    setCustomModel(savedConfig.customModel);
    setCustomApiKey(savedConfig.customApiKey);
    setFallbackChain(savedConfig.fallbackChain);
    setFallbackSource(savedConfig.fallbackSource);
    setGeminiModel(savedConfig.geminiModelSource === 'custom' ? 'gemini-2.0-flash' : savedConfig.geminiModel);
    setGeminiModelSource(savedConfig.geminiModelSource);
    setGeminiCustomModel(savedConfig.geminiCustomModel);
    setGeminiCustomApiKey(savedConfig.geminiCustomApiKey);
    setGeminiFallbackChain(savedConfig.geminiFallbackChain);
    setGeminiFallbackSource(savedConfig.geminiFallbackSource);
    setWakeWordText(savedConfig.wakeWordText);
    setChatName(savedConfig.chatName);
    setBotLogo(savedConfig.botLogo);
    setPersonalityId(savedConfig.personalityId);
    setResponseStyle(savedConfig.responseStyle);
    setSuggestedQuestions(savedConfig.suggestedQuestions);
    setBotBanner(savedConfig.botBanner);
  }, [savedConfig]);

  useRegisterUnsavedChanges({ isDirty, onSave: handleSave, onDiscard: handleDiscard });

  if (tenantLoading || loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (tenantError) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-destructive">{tenantError}</p>
      </div>
    );
  }

  const showOpenRouter = provider === 'openrouter' || provider === 'hybrid';
  const showGemini = provider === 'gemini' || provider === 'hybrid';

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">

      <CollapsibleSection id="activation" title="Ativação" description="Ligue ou desligue o assistente IA.">
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
      </CollapsibleSection>

      <CollapsibleSection id="model" title="Configuração do Modelo" description="Escolha o provedor de IA, modelo e personalize o comportamento.">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Provedor</Label>
            <SelectCard
              options={[
                { value: 'openrouter', label: 'OpenRouter', icon: <Globe />, description: 'Fallback entre modelos' },
                { value: 'gemini', label: 'Gemini Nativo', icon: <Cpu />, description: 'API direta do Google' },
                { value: 'hybrid', label: 'Híbrido', icon: <Layers />, description: 'Tenta um, fallback no outro' },
              ]}
              value={provider}
              onChange={(v) => setProvider(v as 'openrouter' | 'gemini' | 'hybrid')}
              layout="compact"
              className="flex-nowrap"
            />
            <p className="text-xs text-muted-foreground">
              {provider === 'openrouter' && 'Usa OpenRouter com fallback entre modelos.'}
              {provider === 'gemini' && 'Usa diretamente a API Gemini do Google.'}
              {provider === 'hybrid' && 'Tenta o provedor primário; se falhar, usa o outro como fallback.'}
            </p>
          </div>

          {provider === 'hybrid' && (
            <div className="space-y-2">
              <Label>Provedor Primário (Híbrido)</Label>
              <SelectCard
                options={[
                  { value: 'openrouter', label: 'OpenRouter', icon: <Globe /> },
                  { value: 'gemini', label: 'Gemini', icon: <Cpu /> },
                ]}
                value={primaryProvider}
                onChange={(v) => setPrimaryProvider(v as 'openrouter' | 'gemini')}
                layout="compact"
              />
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
                <div className="mb-2">
                  <SelectCard
                    options={[
                      { value: 'free', label: 'Gratuito (padrão)', icon: <Globe /> },
                      { value: 'custom', label: 'Custom (minha chave)', icon: <Key /> },
                    ]}
                    value={modelSource}
                    onChange={(v) => setModelSource(v as 'free' | 'custom')}
                    layout="compact"
                  />
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

                <div className="mb-2">
                  <SelectCard
                    options={[
                      { value: 'free', label: 'Gratuito (padrão)', icon: <Globe /> },
                      { value: 'custom', label: 'Custom (minha chave)', icon: <Key /> },
                    ]}
                    value={fallbackSource}
                    onChange={(v) => setFallbackSource(v as 'free' | 'custom')}
                    layout="compact"
                  />
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
                <div className="mb-2">
                  <SelectCard
                    options={[
                      { value: 'free', label: 'Gratuito (padrão)', icon: <Globe /> },
                      { value: 'custom', label: 'Custom (minha chave)', icon: <Key /> },
                    ]}
                    value={geminiModelSource}
                    onChange={(v) => setGeminiModelSource(v as 'free' | 'custom')}
                    layout="compact"
                  />
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

                <div className="mb-2">
                  <SelectCard
                    options={[
                      { value: 'free', label: 'Gratuito (padrão)', icon: <Globe /> },
                      { value: 'custom', label: 'Custom (minha chave)', icon: <Key /> },
                    ]}
                    value={geminiFallbackSource}
                    onChange={(v) => setGeminiFallbackSource(v as 'free' | 'custom')}
                    layout="compact"
                  />
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
        </div>
      </CollapsibleSection>

      <CollapsibleSection id="personality" title="Personalidade" description="Escolha o estilo de resposta do assistente IA.">
        <div className="space-y-4">
          <SelectCard
            options={AI_PERSONALITIES.map((p) => ({
              value: p.id,
              label: p.name,
              description: p.description,
              emoji: p.emoji,
            }))}
            value={personalityId}
            onChange={(v) => setPersonalityId(v as string)}
            layout="grid"
            columns={4}
            size="md"
          />
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Formato de Resposta Padrão da Wiki</Label>
            <p className="text-xs text-muted-foreground mb-2">Usado quando o usuário não define uma preferência própria.</p>
            {responseStyleGroups.map(group => (
              <div key={group.label}>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">{group.label}</p>
                <SelectCard
                  options={group.keys.map(k => {
                    const s = responseFormatStyles[k]
                    return { value: k, label: s.label, description: s.description, emoji: s.icon }
                  })}
                  value={responseStyle}
                  onChange={(v) => setResponseStyle(v as string)}
                  layout="compact"
                />
              </div>
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
          <WeldingCard>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bot className="h-4 w-4" />
                Logo do Bot
              </CardTitle>
              <CardDescription>Imagem de perfil do assistente IA.</CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUpload
                bucket="wiki-images"
                pathPrefix={`bot-logos/${slug}`}
                value={botLogo}
                onChange={setBotLogo}
                label="Logo do Bot"
                previewSize="w-16 h-16 rounded-full"
              />
              <p className="text-xs text-muted-foreground mt-2">JPEG, PNG ou GIF. Recomendado: 256x256.</p>
            </CardContent>
          </WeldingCard>
          <WeldingCard>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4" />
                Banner do Chat
              </CardTitle>
              <CardDescription>Imagem de fundo do cabeçalho do chat.</CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUpload
                bucket="wiki-images"
                pathPrefix={`bot-banners/${slug}`}
                value={botBanner}
                onChange={setBotBanner}
                label="Banner do Chat"
                previewSize="w-full h-20"
              />
              <p className="text-xs text-muted-foreground mt-2">Imagem de fundo do cabeçalho do chat.</p>
            </CardContent>
          </WeldingCard>
        </div>
      </CollapsibleSection>

      <CollapsibleSection id="voice" title="Agente de Voz" description="Configure a palavra de ativação do assistente de voz.">
        <div className="space-y-4">
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
        </div>
      </CollapsibleSection>

      <CollapsibleSection id="test" title="Testar Assistente de Voz" description="Teste a palavra de ativação do agente de voz.">
        {enabled && <WakeWordTest wakeWordText={wakeWordText} />}
      </CollapsibleSection>
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
