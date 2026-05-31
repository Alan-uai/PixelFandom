'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/supabase';
import { useUserPreferences, type ChatSettings } from '@/context/user-preferences-context';
import { AI_PERSONALITIES } from '@/lib/ai-personalities';
import { personas } from '@/lib/personas';
import { emojiStyles } from '@/lib/emoji-styles';
import { responseStyles } from '@/lib/response-styles';
import { officialLanguages } from '@/lib/official-languages';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/supabase';
import {
  MessageCircle,
  Headphones,
  Palette,
  Settings2,
  Volume2,
  Mic,
  Ear,
  Loader2,
  Check,
  AlertTriangle,
  Trash2,
} from 'lucide-react';

const THEME_PRESETS = [
  {
    id: 'ciano',
    name: 'Ciano',
    colors: { primary: '198 100% 65%', accent: '0 100% 65%', background: '0 0% 13%', card: '0 0% 15%' },
  },
  {
    id: 'azul',
    name: 'Azul',
    colors: { primary: '220 80% 55%', accent: '340 75% 55%', background: '220 30% 10%', card: '220 25% 13%' },
  },
  {
    id: 'roxo',
    name: 'Roxo',
    colors: { primary: '270 80% 60%', accent: '30 80% 55%', background: '270 30% 10%', card: '270 25% 13%' },
  },
  {
    id: 'rosa',
    name: 'Rosa',
    colors: { primary: '340 75% 60%', accent: '198 100% 65%', background: '340 30% 12%', card: '340 25% 14%' },
  },
  {
    id: 'vermelho',
    name: 'Vermelho',
    colors: { primary: '0 80% 55%', accent: '220 80% 55%', background: '0 30% 10%', card: '0 25% 13%' },
  },
  {
    id: 'laranja',
    name: 'Laranja',
    colors: { primary: '25 90% 55%', accent: '270 80% 60%', background: '25 30% 10%', card: '25 25% 13%' },
  },
  {
    id: 'verde',
    name: 'Verde',
    colors: { primary: '145 60% 45%', accent: '340 75% 55%', background: '145 30% 10%', card: '145 25% 13%' },
  },
  {
    id: 'verde-limao',
    name: 'Verde Limão',
    colors: { primary: '85 70% 50%', accent: '25 90% 55%', background: '85 30% 10%', card: '85 25% 13%' },
  },
  {
    id: 'cinza',
    name: 'Cinza',
    colors: { primary: '0 0% 60%', accent: '198 100% 65%', background: '0 0% 13%', card: '0 0% 15%' },
  },
];

function applyThemePreset(id: string) {
  const preset = THEME_PRESETS.find((p) => p.id === id);
  if (!preset) return;
  const root = document.documentElement;
  root.style.setProperty('--primary', preset.colors.primary);
  root.style.setProperty('--accent', preset.colors.accent);
  root.style.setProperty('--background', preset.colors.background);
  root.style.setProperty('--card', preset.colors.card);
  root.style.setProperty('--ring', preset.colors.primary);
  root.style.setProperty('--sidebar-primary', preset.colors.primary);
  root.style.setProperty('--sidebar-ring', preset.colors.primary);
}

const VOICES = [
  { value: 'Puck', label: 'Puck — Equilibrada' },
  { value: 'Kore', label: 'Kore — Brilhante e clara' },
  { value: 'Charon', label: 'Charon — Grave e acolhedora' },
  { value: 'Fenrir', label: 'Fenrir — Forte e assertiva' },
  { value: 'Aoede', label: 'Aoede — Suave e melódica' },
];

const LANGUAGES = [
  { value: 'pt', label: 'Português' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
];

export default function GlobalSettingsPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const { preferences, updatePreference, updatePreferences, saving } = useUserPreferences();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    applyThemePreset(preferences.theme_preset);
  }, [preferences.theme_preset]);

  const updateChat = <K extends keyof ChatSettings>(key: K, value: ChatSettings[K]) => {
    updatePreference('chat_settings', { ...preferences.chat_settings, [key]: value });
  };

  const updateVoice = (key: string, value: unknown) => {
    updatePreference('voice_settings', { ...preferences.voice_settings, [key]: value });
  };

  const [deleteStep, setDeleteStep] = useState<'hidden' | 'warning' | 'successors' | 'confirm'>('hidden');
  const [ownedTenants, setOwnedTenants] = useState<{ id: string; name: string; admins: { id: string; display_name: string }[] }[]>([]);
  const [successors, setSuccessors] = useState<Record<string, string>>({});
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: memberships } = await supabase
        .from('tenant_members')
        .select('tenant_id, tenants!inner(id, name)')
        .eq('user_id', user.id)
        .eq('role', 'owner');

      if (!memberships || memberships.length === 0) return;

      const tenants: { id: string; name: string; admins: { id: string; display_name: string }[] }[] = [];
      for (const m of memberships as any[]) {
        const { data: admins } = await supabase
          .from('tenant_members')
          .select('user_id, profiles!inner(id, display_name)')
          .eq('tenant_id', (m as any).tenants.id)
          .eq('role', 'admin')
          .neq('user_id', user.id);

        tenants.push({
          id: (m as any).tenants.id,
          name: (m as any).tenants.name,
          admins: ((admins as any[]) || []).map((a) => ({
            id: a.user_id,
            display_name: a.profiles?.display_name || a.user_id.slice(0, 8),
          })),
        });
      }
      setOwnedTenants(tenants);
    })();
  }, [user]);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await fetch('/api/profile/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ successors }),
      });
      if (!res.ok) throw new Error('Failed to delete account');
      await supabase.auth.signOut();
      router.push('/');
    } catch (err) {
      console.error('Delete account error:', err);
      setDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground mt-1">
          Preferências globais da sua conta.
        </p>
      </div>

      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Chat</span>
          </TabsTrigger>
          <TabsTrigger value="voice" className="flex items-center gap-2">
            <Headphones className="h-4 w-4" />
            <span className="hidden sm:inline">Voz</span>
          </TabsTrigger>
          <TabsTrigger value="theme" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Tema</span>
          </TabsTrigger>
          <TabsTrigger value="more" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">Mais</span>
          </TabsTrigger>
        </TabsList>

        {/* ── Chat de Texto ── */}
        <TabsContent value="chat" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Personalidade</CardTitle>
              <CardDescription>
                Escolha a personalidade do assistente IA.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {AI_PERSONALITIES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => updateChat('personality_id', p.id)}
                    className={`relative flex items-start gap-3 rounded-lg border p-3 text-left transition-all ${
                      preferences.chat_settings.personality_id === p.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30 hover:bg-muted/50'
                    }`}
                  >
                    <span className="text-xl">{p.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                    </div>
                    {preferences.chat_settings.personality_id === p.id && (
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Persona</CardTitle>
              <CardDescription>Define o tom geral das respostas.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(personas).map(([key, val]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => updateChat('persona', key)}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                      preferences.chat_settings.persona === key
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-muted-foreground hover:text-foreground hover:border-primary/50'
                    }`}
                  >
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Emojis</CardTitle>
              <CardDescription>Define o uso de emojis nas respostas.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(emojiStyles).map(([key, val]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => updateChat('emoji_style', key)}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                      preferences.chat_settings.emoji_style === key
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-muted-foreground hover:text-foreground hover:border-primary/50'
                    }`}
                  >
                    {key === 'moderate' ? 'Moderado' : key === 'none' ? 'Sem emojis' : 'Vários'}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estilo de Resposta</CardTitle>
              <CardDescription>Como o assistente estrutura as respostas.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(responseStyles).map(([key, val]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => updateChat('response_style', key)}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                      preferences.chat_settings.response_style === key
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-muted-foreground hover:text-foreground hover:border-primary/50'
                    }`}
                  >
                    {key === 'detailed' ? 'Detalhado' : key === 'short' ? 'Curto' : 'Tópicos'}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Idioma do Chat</CardTitle>
              <CardDescription>Idioma padrão para respostas do assistente.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(officialLanguages).map(([key, val]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => updateChat('language', key)}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                      preferences.chat_settings.language === key
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-muted-foreground hover:text-foreground hover:border-primary/50'
                    }`}
                  >
                    {val.instruction}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Chat de Voz ── */}
        <TabsContent value="voice" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Voz</CardTitle>
              <CardDescription>Escolha a voz e ajuste as preferências de áudio.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="voice">Voz do Assistente</Label>
                <select
                  id="voice"
                  value={(preferences.voice_settings.voice as string) || 'Kore'}
                  onChange={(e) => updateVoice('voice', e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {VOICES.map((v) => (
                    <option key={v.value} value={v.value}>{v.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  Volume ({(preferences.voice_settings.volume as number) || 80}%)
                </Label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={(preferences.voice_settings.volume as number) || 80}
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
                        (preferences.voice_settings.temperature as number) === opt.value
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-muted-foreground hover:text-foreground hover:border-primary/50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="voice-lang">Idioma</Label>
                <select
                  id="voice-lang"
                  value={(preferences.voice_settings.userLang as string) || 'pt'}
                  onChange={(e) => updateVoice('userLang', e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Áudio</CardTitle>
              <CardDescription>Ajuste a qualidade e o comportamento do microfone.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {([
                { key: 'noiseCancellation', label: 'Cancelamento de Ruído', desc: 'Reduz ruídos de fundo' },
                { key: 'echoCancellation', label: 'Cancelamento de Eco', desc: 'Elimina eco do áudio' },
                { key: 'autoGainControl', label: 'Controle Automático de Ganho', desc: 'Ajusta o volume automaticamente' },
              ] as const).map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <Switch
                    checked={(preferences.voice_settings[key] as boolean) ?? true}
                    onCheckedChange={(checked) => updateVoice(key, checked)}
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
              <CardDescription>Ative para iniciar o assistente por comando de voz.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Wake Word</p>
                  <p className="text-xs text-muted-foreground">Diga a palavra de ativação seguida da sua mensagem</p>
                </div>
                <Switch
                  checked={(preferences.voice_settings.wakeWordEnabled as boolean) ?? false}
                  onCheckedChange={(checked) => updateVoice('wakeWordEnabled', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tema ── */}
        <TabsContent value="theme" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Tema Global</CardTitle>
              <CardDescription>Escolha um esquema de cores predefinido para toda a plataforma.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                {THEME_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => updatePreference('theme_preset', preset.id)}
                    className={`relative rounded-lg border p-4 text-center transition-all ${
                      preferences.theme_preset === preset.id
                        ? 'border-primary ring-1 ring-primary'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <div
                      className="h-10 w-full rounded-md mb-2 flex items-center justify-center text-xs font-bold"
                      style={{
                        background: `hsl(${preset.colors.primary})`,
                        color: '#fff',
                      }}
                    >
                      {preset.name}
                    </div>
                    <p className="text-xs font-medium">{preset.name}</p>
                    {preferences.theme_preset === preset.id && (
                      <Check className="absolute top-2 right-2 h-4 w-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Mais ── */}
        <TabsContent value="more" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Aparência</CardTitle>
              <CardDescription>Personalize a experiência visual.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Densidade</Label>
                <div className="flex gap-2">
                  {[
                    { value: 'comfortable' as const, label: 'Confortável' },
                    { value: 'compact' as const, label: 'Compacto' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updatePreference('density', opt.value)}
                      className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                        preferences.density === opt.value
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-muted-foreground hover:text-foreground hover:border-primary/50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Tamanho da Fonte</Label>
                <div className="flex gap-2">
                  {[
                    { value: 'small' as const, label: 'Pequeno' },
                    { value: 'medium' as const, label: 'Médio' },
                    { value: 'large' as const, label: 'Grande' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updatePreference('font_size', opt.value)}
                      className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                        preferences.font_size === opt.value
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-muted-foreground hover:text-foreground hover:border-primary/50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Idioma da Interface</Label>
                <div className="flex gap-2">
                  {[
                    { value: 'pt_br', label: 'Português (BR)' },
                    { value: 'en', label: 'English' },
                    { value: 'es', label: 'Español' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateChat('language', opt.value)}
                      className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                        preferences.chat_settings.language === opt.value
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

          <Separator className="my-6" />

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Excluir Conta
              </CardTitle>
              <CardDescription>
                Esta ação é irreversível. Todos os seus dados serão permanentemente removidos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deleteStep === 'hidden' && (
                <Button variant="destructive" onClick={() => setDeleteStep('warning')}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Conta
                </Button>
              )}

              {deleteStep === 'warning' && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Você está prestes a excluir sua conta permanentemente. Isso irá:
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                    <li>Remover seu perfil e dados pessoais</li>
                    <li>Cancelar todas as suas assinaturas</li>
                    {ownedTenants.length > 0 && (
                      <li>Transferir a propriedade de {ownedTenants.length} wiki(s) para outro membro</li>
                    )}
                    <li>Encerrar sua sessão em todos os dispositivos</li>
                  </ul>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" onClick={() => setDeleteStep('hidden')}>
                      Cancelar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (ownedTenants.length > 0) {
                          setDeleteStep('successors');
                        } else {
                          setDeleteStep('confirm');
                        }
                      }}
                    >
                      Continuar
                    </Button>
                  </div>
                </div>
              )}

              {deleteStep === 'successors' && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Escolha quem receberá a propriedade das suas wikis. Se não escolher, um admin será selecionado automaticamente.
                  </p>
                  {ownedTenants.map((tenant) => (
                    <div key={tenant.id} className="rounded-lg border p-3 space-y-2">
                      <p className="text-sm font-medium">{tenant.name}</p>
                      {tenant.admins.length > 0 ? (
                        <select
                          value={successors[tenant.id] || ''}
                          onChange={(e) =>
                            setSuccessors((prev) => ({ ...prev, [tenant.id]: e.target.value }))
                          }
                          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        >
                          <option value="">Selecionar automaticamente</option>
                          {tenant.admins.map((admin) => (
                            <option key={admin.id} value={admin.id}>
                              {admin.display_name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Nenhum admin disponível — a propriedade será transferida para um editor aleatório.
                        </p>
                      )}
                    </div>
                  ))}
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" onClick={() => setDeleteStep('warning')}>
                      Voltar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setDeleteStep('confirm')}
                    >
                      Continuar
                    </Button>
                  </div>
                </div>
              )}

              {deleteStep === 'confirm' && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-destructive">
                    Esta ação é permanente e não pode ser desfeita.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Digite <strong>EXCLUIR</strong> para confirmar.
                  </p>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="EXCLUIR"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-destructive/50"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDeleteStep('hidden');
                        setConfirmText('');
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={confirmText !== 'EXCLUIR' || deleting}
                      onClick={handleDeleteAccount}
                    >
                      {deleting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      {deleting ? 'Excluindo...' : 'Confirmar Exclusão'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {saving && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-lg">
          <Loader2 className="h-3 w-3 animate-spin" />
          Salvando...
        </div>
      )}
    </div>
  );
}
