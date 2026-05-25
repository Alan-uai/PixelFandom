'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Upload, Plus, Trash2, Bot, ImageIcon } from 'lucide-react';
import type { Tenant, DiscordGuild } from '@/supabase/client';
import { ensureStorageBuckets } from '@/lib/storage';

interface DiscordConfig {
  bot_name?: string;
  bot_avatar?: string | null;
  prefix?: string;
  status?: 'online' | 'idle' | 'dnd' | 'invisible';
  welcome_message?: string;
  custom_commands?: { trigger: string; response: string }[];
  enabled?: boolean;
}

export default function WikiDiscordPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { toast } = useToast();

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [guilds, setGuilds] = useState<DiscordGuild[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [enabled, setEnabled] = useState(false);
  const [botName, setBotName] = useState('');
  const [botAvatar, setBotAvatar] = useState<string | null>(null);
  const [prefix, setPrefix] = useState('!');
  const [status, setStatus] = useState<'online' | 'idle' | 'dnd' | 'invisible'>('online');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [commands, setCommands] = useState<{ trigger: string; response: string }[]>([
    { trigger: '/codes', response: 'Exibe os códigos disponíveis do jogo.' },
    { trigger: '/updatelog', response: 'Exibe o log de atualizações.' },
  ]);

  const avatarInputRef = useRef<HTMLInputElement>(null);

  const loadConfig = (config: DiscordConfig) => {
    setEnabled(config.enabled ?? false);
    setBotName(config.bot_name ?? '');
    setBotAvatar(config.bot_avatar ?? null);
    setPrefix(config.prefix ?? '!');
    setStatus(config.status ?? 'online');
    setWelcomeMessage(config.welcome_message ?? '');
    if (config.custom_commands && config.custom_commands.length > 0) {
      setCommands(config.custom_commands);
    }
  };

  useEffect(() => {
    (async () => {
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', slug)
        .single();

      if (tenantData) {
        setTenant(tenantData);
        const config = (tenantData.discord_config as DiscordConfig) || {};
        loadConfig(config);

        const { data: guildsData } = await supabase
          .from('discord_guilds')
          .select('*')
          .eq('tenant_id', tenantData.id);

        if (guildsData) setGuilds(guildsData);
      }
      setLoading(false);
    })();
  }, [slug]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      await ensureStorageBuckets();
      const filePath = `discord-avatars/${slug}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('wiki-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('wiki-images')
        .getPublicUrl(filePath);

      setBotAvatar(publicUrl);
      toast({ title: 'Avatar enviado!' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro no upload', description: error.message });
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const addCommand = () => {
    setCommands([...commands, { trigger: '', response: '' }]);
  };

  const removeCommand = (index: number) => {
    setCommands(commands.filter((_, i) => i !== index));
  };

  const updateCommand = (index: number, field: 'trigger' | 'response', value: string) => {
    const updated = commands.map((cmd, i) =>
      i === index ? { ...cmd, [field]: value } : cmd
    );
    setCommands(updated);
  };

  const handleSave = async () => {
    if (!tenant) return;
    setSaving(true);

    const discordConfig: DiscordConfig = {
      enabled,
      bot_name: botName,
      bot_avatar: botAvatar,
      prefix,
      status,
      welcome_message: welcomeMessage,
      custom_commands: commands,
    };

    const { error } = await supabase
      .from('tenants')
      .update({ discord_config: discordConfig as any })
      .eq('id', tenant.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      toast({ title: 'Configuração do Discord salva!' });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tenant) {
    return <p className="text-muted-foreground">Wiki não encontrada.</p>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bot do Discord</h1>
        <p className="text-muted-foreground mt-1">
          Configure o bot do Discord da sua wiki.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Status do Bot
          </CardTitle>
          <CardDescription>Ligue ou desligue o bot do Discord.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Bot Ativo</p>
              <p className="text-sm text-muted-foreground">
                Quando ativo, o bot responde a comandos no Discord.
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

      <Card>
        <CardHeader>
          <CardTitle>Identidade do Bot</CardTitle>
          <CardDescription>Nome e avatar do bot no Discord.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="botName">Nome do Bot</Label>
            <Input
              id="botName"
              value={botName}
              onChange={(e) => setBotName(e.target.value)}
              placeholder="Meu Wiki Bot"
            />
          </div>

          <div className="space-y-2">
            <Label>Avatar do Bot</Label>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full border bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                {botAvatar ? (
                  <img src={botAvatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  ref={avatarInputRef}
                  onChange={handleAvatarUpload}
                  style={{ display: 'none' }}
                  accept="image/*"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  {uploadingAvatar ? 'Enviando...' : 'Enviar Imagem'}
                </Button>
                <p className="text-xs text-muted-foreground">
                  JPEG, PNG ou GIF. Tamanho recomendado: 512x512.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="online">Online</option>
              <option value="idle">Ausente</option>
              <option value="dnd">Não Perturbe</option>
              <option value="invisible">Invisível</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prefixo e Mensagens</CardTitle>
          <CardDescription>Configure o prefixo de comandos e mensagem de boas-vindas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prefix">Prefixo de Comandos</Label>
            <Input
              id="prefix"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="!"
              maxLength={5}
              className="w-24"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="welcome">Mensagem de Boas-Vindas</Label>
            <textarea
              id="welcome"
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              rows={3}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Bem-vindo ao servidor!"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comandos Personalizados</CardTitle>
          <CardDescription>
            Comandos que o bot responde no Discord.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {commands.map((cmd, index) => (
            <div key={index} className="flex items-start gap-2 rounded-lg border p-3">
              <div className="flex-1 space-y-2">
                <Input
                  value={cmd.trigger}
                  onChange={(e) => updateCommand(index, 'trigger', e.target.value)}
                  placeholder="/comando"
                  className="font-mono text-sm"
                />
                <textarea
                  value={cmd.response}
                  onChange={(e) => updateCommand(index, 'response', e.target.value)}
                  rows={2}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Resposta do comando..."
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeCommand(index)}
                className="shrink-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" onClick={addCommand} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Comando
          </Button>
        </CardContent>
      </Card>

      {guilds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Servidores Conectados</CardTitle>
            <CardDescription>Servidores onde o bot está presente.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {guilds.map((guild) => (
              <div
                key={guild.guild_id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="text-sm font-mono font-medium">{guild.guild_id}</p>
                  {guild.channel_id && (
                    <p className="text-xs text-muted-foreground">
                      Canal: {guild.channel_id}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      guild.bot_enabled ? 'bg-green-500' : 'bg-muted-foreground'
                    }`}
                  />
                  <span className="text-xs text-muted-foreground">
                    {guild.bot_enabled ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Button onClick={handleSave} disabled={saving}>
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}
        Salvar Configuração
      </Button>
    </div>
  );
}
