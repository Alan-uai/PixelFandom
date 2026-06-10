'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useWikiData } from '@/context/wiki-provider'
import { useUserPreferences, type ChatSettings } from '@/context/user-preferences-context'
import { responseFormatStyles, responseStyleGroups, displayModeGroups, displayModes } from '@/lib/response-styles'
import type { VoiceName } from '@/lib/voice/geminilive'
import { AI_PERSONALITIES } from '@/lib/ai-personalities'
import { personas } from '@/lib/personas'
import { officialLanguages } from '@/lib/official-languages'
import { Button } from '@/components/ui/button'
import { FloatingLabelInput } from '@/components/ui/floating-label-input'
import { Label } from '@/components/ui/label'
import { SelectCard } from '@/components/ui/select-card'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Volume2, Save, Mic, Headphones, Ear, Loader2, MessageCircle, Check, Sparkles, Globe, Radio } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useUser, supabase } from '@/supabase'

type VoiceSettings = {
  userName: string
  voice: VoiceName
  temperature: number
  volume: number
  userLang: string
  noiseCancellation: boolean
  echoCancellation: boolean
  autoGainControl: boolean
  wakeWordEnabled: boolean
  publicMode: boolean
  publicModeSensitivity: number
  voiceFilterEnabled: boolean
  voiceFilterThreshold: number
  primaryNavigation: boolean
}

const VOICE_STORAGE_KEY = 'pixelfandom:voice-settings'

const defaultVoice: VoiceSettings = {
  userName: '',
  voice: 'Kore' as VoiceName,
  temperature: 0.7,
  volume: 80,
  userLang: 'pt',
  noiseCancellation: true,
  echoCancellation: true,
  autoGainControl: true,
  wakeWordEnabled: false,
  publicMode: false,
  publicModeSensitivity: 5,
  voiceFilterEnabled: false,
  voiceFilterThreshold: 0.78,
  primaryNavigation: false,
}

function loadVoice(): VoiceSettings {
  try {
    const raw = localStorage.getItem(VOICE_STORAGE_KEY)
    if (raw) return { ...defaultVoice, ...JSON.parse(raw) }
  } catch {}
  return defaultVoice
}

function saveVoice(s: VoiceSettings) {
  localStorage.setItem(VOICE_STORAGE_KEY, JSON.stringify(s))
}

function LayerBadge({ isWikiSpecific }: { isWikiSpecific: boolean }) {
  if (isWikiSpecific) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
        <Radio className="h-2.5 w-2.5" />
        Wiki
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
      <Globe className="h-2.5 w-2.5" />
      Global
    </span>
  )
}

export default function AISettingsPage() {
  const params = useParams()
  const slug = params?.slug as string
  const { data, loading } = useWikiData()
  const { toast } = useToast()
  const { user } = useUser()
  const { preferences, updatePreference } = useUserPreferences()
  const aiConfig = (data?.tenant?.ai_config as Record<string, unknown>) || {}
  const tenantId = (data?.tenant?.id as string) || ''

  const wikiPrefs = preferences.wiki_preferences?.[tenantId] ?? {}

  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => ({
    ...loadVoice(),
    voice: (aiConfig.voice_name as VoiceName) || loadVoice().voice,
    volume: (aiConfig.voice_volume as number) || loadVoice().volume,
  }))
  const [saving, setSaving] = useState(false)
  const [synced, setSynced] = useState(false)

  useEffect(() => {
    if (!user || synced) return
    ;(async () => {
      const { data } = await supabase
        .from('user_preferences')
        .select('preferences')
        .eq('user_id', user.id)
        .single()
      if (data?.preferences) {
        const cloud = data.preferences as Partial<VoiceSettings>
        setVoiceSettings((prev) => ({ ...prev, ...cloud }))
      }
      setSynced(true)
    })()
  }, [user, synced])

  useEffect(() => {
    saveVoice(voiceSettings)
  }, [voiceSettings])

  const updateVoice = <K extends keyof VoiceSettings>(key: K, value: VoiceSettings[K]) => {
    setVoiceSettings((prev) => ({ ...prev, [key]: value }))
  }

  const updateWikiChat = <K extends keyof ChatSettings>(key: K, value: ChatSettings[K]) => {
    const current = preferences.wiki_preferences?.[tenantId] ?? {}
    updatePreference('wiki_preferences', {
      ...preferences.wiki_preferences,
      [tenantId]: { ...current, [key]: value },
    })
  }

  const effectiveChatSetting = <K extends keyof ChatSettings>(key: K): ChatSettings[K] => {
    return (wikiPrefs[key] ?? preferences.chat_settings[key]) as ChatSettings[K]
  }

  const isWikiSpecific = (key: keyof ChatSettings): boolean => {
    return key in wikiPrefs
  }

  const responseStyleOptions = useMemo(() => {
    return responseStyleGroups.flatMap(group =>
      group.keys.map(k => {
        const s = responseFormatStyles[k]
        return { value: k, label: s.label, description: s.description, emoji: s.icon }
      })
    )
  }, [])

  const handleSaveVoice = async () => {
    if (!user) {
      saveVoice(voiceSettings)
      toast({ title: 'Configurações salvas localmente', description: 'Faça login para sincronizar entre dispositivos.' })
      return
    }
    setSaving(true)
    const { error } = await supabase
      .from('user_preferences')
      .upsert(
        { user_id: user.id, preferences: voiceSettings, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: error.message })
    } else {
      saveVoice(voiceSettings)
      toast({ title: 'Configurações salvas!', description: 'Preferências sincronizadas com a nuvem.' })
    }
    setSaving(false)
  }

  const lang = voiceSettings.userLang as 'pt' | 'en' | 'es'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-8">
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4"
        >
          <Sparkles className="h-8 w-8 text-primary" />
        </motion.div>
        <h1 className="text-2xl font-bold">Configurações de IA</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Personalize a experiência do assistente de texto e voz da wiki.
        </p>
      </div>

      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            <span>Chat de Texto</span>
          </TabsTrigger>
          <TabsTrigger value="voice" className="flex items-center gap-2">
            <Headphones className="h-4 w-4" />
            <span>Voz</span>
          </TabsTrigger>
        </TabsList>

        {/* ── Chat de Texto ── */}
        <TabsContent value="chat" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Personalidade</CardTitle>
                  <CardDescription>Escolha a personalidade do assistente IA.</CardDescription>
                </div>
                <LayerBadge isWikiSpecific={isWikiSpecific('personality_id')} />
              </div>
            </CardHeader>
            <CardContent>
              <SelectCard
                options={AI_PERSONALITIES.map((p) => ({
                  value: p.id,
                  label: p.name,
                  description: p.description,
                  emoji: p.emoji,
                }))}
                value={effectiveChatSetting('personality_id')}
                onChange={(v) => updateWikiChat('personality_id', v as string)}
                layout="grid"
                columns={2}
                size="md"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Persona</CardTitle>
                  <CardDescription>Define o tom geral das respostas.</CardDescription>
                </div>
                <LayerBadge isWikiSpecific={isWikiSpecific('persona')} />
              </div>
            </CardHeader>
            <CardContent>
              <SelectCard
                options={Object.entries(personas).map(([key]) => ({
                  value: key,
                  label: key.charAt(0).toUpperCase() + key.slice(1),
                }))}
                value={effectiveChatSetting('persona')}
                onChange={(v) => updateWikiChat('persona', v as string)}
                layout="compact"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Emojis</CardTitle>
                  <CardDescription>Define o uso de emojis nas respostas.</CardDescription>
                </div>
                <LayerBadge isWikiSpecific={isWikiSpecific('emoji_style')} />
              </div>
            </CardHeader>
            <CardContent>
              <SelectCard
                options={[
                  { value: 'moderate', label: 'Moderado' },
                  { value: 'none', label: 'Sem emojis' },
                  { value: 'lots', label: 'Vários' },
                ]}
                value={effectiveChatSetting('emoji_style')}
                onChange={(v) => updateWikiChat('emoji_style', v as string)}
                layout="compact"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Estilo de Resposta</CardTitle>
                  <CardDescription>Como o assistente estrutura as respostas.</CardDescription>
                </div>
                <LayerBadge isWikiSpecific={isWikiSpecific('response_style')} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {responseStyleGroups.map(group => (
                <div key={group.label}>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">{group.label}</p>
                  <SelectCard
                    options={group.keys.map(k => {
                      const s = responseFormatStyles[k]
                      return { value: k, label: s.label, description: s.description, emoji: s.icon }
                    })}
                    value={effectiveChatSetting('response_style')}
                    onChange={(v) => updateWikiChat('response_style', v as string)}
                    layout="compact"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Modo de Exibição</CardTitle>
                  <CardDescription>Como as respostas do assistente são exibidas.</CardDescription>
                </div>
                <LayerBadge isWikiSpecific={isWikiSpecific('display_mode')} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {displayModeGroups.map(group => (
                <div key={group.label}>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">{group.label}</p>
                  <SelectCard
                    options={group.keys.map(k => {
                      const m = displayModes[k as keyof typeof displayModes]
                      return { value: k, label: m.label, description: m.description, emoji: m.icon }
                    })}
                    value={effectiveChatSetting('display_mode')}
                    onChange={(v) => updateWikiChat('display_mode', v as string)}
                    layout="compact"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Idioma do Chat</CardTitle>
                  <CardDescription>Idioma padrão para respostas do assistente.</CardDescription>
                </div>
                <LayerBadge isWikiSpecific={isWikiSpecific('language')} />
              </div>
            </CardHeader>
            <CardContent>
              <SelectCard
                options={Object.entries(officialLanguages).map(([key, val]) => ({
                  value: key,
                  label: val.instruction,
                }))}
                value={effectiveChatSetting('language')}
                onChange={(v) => updateWikiChat('language', v as string)}
                layout="compact"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Chat de Voz ── */}
        <TabsContent value="voice" className="space-y-6 mt-6">
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Mic className="h-4 w-4 text-primary" />
              <span>O assistente de voz pode ser acessado pelo botão flutuante com microfone em qualquer página da wiki.</span>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Perfil</CardTitle>
              <CardDescription>Configure seu nome e preferências de idioma.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FloatingLabelInput
                label="Seu Nome"
                value={voiceSettings.userName}
                onChange={(e) => updateVoice('userName', e.target.value)}
              />
              <div className="space-y-2">
                <Label htmlFor="v-lang">Idioma</Label>
                <select
                  id="v-lang"
                  value={voiceSettings.userLang}
                  onChange={(e) => updateVoice('userLang', e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="pt">Português</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Voz</CardTitle>
              <CardDescription>Escolha a voz e ajuste o volume do assistente.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="voice">Voz do Assistente</Label>
                <select
                  id="voice"
                  value={voiceSettings.voice}
                  onChange={(e) => updateVoice('voice', e.target.value as VoiceName)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="Puck">Puck — Equilibrada</option>
                  <option value="Kore">Kore — Brilhante e clara</option>
                  <option value="Charon">Charon — Grave e acolhedora</option>
                  <option value="Fenrir">Fenrir — Forte e assertiva</option>
                  <option value="Aoede">Aoede — Suave e melódica</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  Volume ({voiceSettings.volume}%)
                </Label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={voiceSettings.volume}
                  onChange={(e) => updateVoice('volume', Number(e.target.value))}
                  className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                />
              </div>
              <div className="space-y-2">
                <Label>Tom da Conversa</Label>
                <div className="flex gap-2">
                  {[
                    { value: 0.3, label: 'Profissional' },
                    { value: 0.7, label: 'Natural' },
                    { value: 1.0, label: 'Criativo' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateVoice('temperature', opt.value)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                        voiceSettings.temperature === opt.value
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-muted-foreground hover:text-foreground hover:border-primary/50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Áudio</CardTitle>
              <CardDescription>Ajuste a qualidade e o comportamento do microfone.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(['noiseCancellation', 'echoCancellation', 'autoGainControl'] as const).map((key) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">
                      {key === 'noiseCancellation' ? 'Cancelamento de Ruído'
                        : key === 'echoCancellation' ? 'Cancelamento de Eco'
                        : 'Controle Automático de Ganho'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {key === 'noiseCancellation' ? 'Reduz ruídos de fundo'
                        : key === 'echoCancellation' ? 'Elimina eco do áudio'
                        : 'Ajusta o volume automaticamente'}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={voiceSettings[key]}
                    onChange={(e) => updateVoice(key, e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ear className="h-5 w-5" />
                Ativação por Voz
              </CardTitle>
              <CardDescription>Ative ou desative a wake word para iniciar o assistente por comando de voz.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted/50 px-4 py-3">
                <p className="text-xs text-muted-foreground mb-1">Palavra de ativação configurada pelo admin</p>
                <p className="text-sm font-mono font-semibold text-primary">
                  {(aiConfig.wake_word_text as string) || 'xWiki'}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Wake Word</p>
                  <p className="text-xs text-muted-foreground">Diga a palavra de ativação seguida da sua mensagem</p>
                </div>
                <input
                  type="checkbox"
                  checked={voiceSettings.wakeWordEnabled}
                  onChange={(e) => updateVoice('wakeWordEnabled', e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Modo Público</CardTitle>
              <CardDescription>Configure o comportamento em ambientes públicos ou silenciosos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Modo Público</p>
                  <p className="text-xs text-muted-foreground">Menos sensível a ruídos ambiente</p>
                </div>
                <input
                  type="checkbox"
                  checked={voiceSettings.publicMode}
                  onChange={(e) => updateVoice('publicMode', e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300"
                />
              </div>
              {voiceSettings.publicMode && (
                <div className="space-y-2">
                  <Label>Sensibilidade ({voiceSettings.publicModeSensitivity})</Label>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={voiceSettings.publicModeSensitivity}
                    onChange={(e) => updateVoice('publicModeSensitivity', Number(e.target.value))}
                    className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comportamento</CardTitle>
              <CardDescription>Configure como o agente reage aos seus comandos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Navegação Primária</p>
                  <p className="text-xs text-muted-foreground">
                    Ao encontrar um item, navegue direto para a página antes de mostrar estatísticas
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={voiceSettings.primaryNavigation}
                  onChange={(e) => updateVoice('primaryNavigation', e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button onClick={handleSaveVoice} disabled={saving} size="lg">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
