'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/supabase';
import { Button } from '@/components/ui/button';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/ui/image-upload';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Check, Plus, Bot, Power, MessageSquare, Terminal, Server, Pencil } from 'lucide-react';
import { PageSubNav } from '@/components/dashboard/page-subnav';
import { GuildDataProvider } from '@/components/discord/guild-data-context';
import { DiscordLoginGate } from '@/components/discord/discord-login-gate';
import { createDefaultCommand, migrateOldCommand, type DiscordConfig as DiscordConfigType, type CustomCommand } from '@/components/discord/types';

export default function WikiDiscordPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const { toast } = useToast();

  const [tenant, setTenant] = useState<any>(null);
  const [dbGuilds, setDbGuilds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const initialRef = useRef({
    enabled: false,
    botName: '',
    botAvatar: null as string | null,
    prefix: '!',
    status: 'online' as 'online' | 'idle' | 'dnd' | 'invisible',
    commands: [] as CustomCommand[],
  });

  const [enabled, setEnabled] = useState(false);
  const [botName, setBotName] = useState('');
  const [botAvatar, setBotAvatar] = useState<string | null>(null);
  const [prefix, setPrefix] = useState('!');
  const [status, setStatus] = useState<'online' | 'idle' | 'dnd' | 'invisible'>('online');
  const [commands, setCommands] = useState<CustomCommand[]>([]);

  const migrateCommands = (raw: any): CustomCommand[] => {
    if (!raw || !Array.isArray(raw) || raw.length === 0) return [];
    if ('actions' in raw[0]) return raw as CustomCommand[];
    return raw.map(migrateOldCommand);
  };

  const loadConfig = (config: DiscordConfigType) => {
    setEnabled(config.enabled ?? false);
    setBotName(config.bot_name ?? '');
    setBotAvatar(config.bot_avatar ?? null);
    setPrefix(config.prefix ?? '!');
    setStatus(config.status ?? 'online');
    const loadedCommands = migrateCommands(config.custom_commands);
    setCommands(loadedCommands);
    initialRef.current = {
      enabled: config.enabled ?? false,
      botName: config.bot_name ?? '',
      botAvatar: config.bot_avatar ?? null,
      prefix: config.prefix ?? '!',
      status: config.status ?? 'online',
      commands: loadedCommands,
    };
  };

  useEffect(() => {
    (async () => {
      try {
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .select('*')
          .eq('slug', slug)
          .single();

        if (tenantError) {
          console.error('Load error:', tenantError);
          toast({ variant: 'destructive', title: 'Erro ao carregar', description: tenantError.message });
          setLoading(false);
          return;
        }

        if (tenantData) {
          setTenant(tenantData);
          const config = (tenantData.discord_config as DiscordConfigType) || {};
          loadConfig(config);

          const { data: guildsData } = await supabase
            .from('discord_guilds')
            .select('*')
            .eq('tenant_id', tenantData.id);

          if (guildsData) setDbGuilds(guildsData);
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
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const toggleCommand = (index: number) => {
    setCommands((prev) => prev.map((cmd, i) => i === index ? { ...cmd, enabled: !cmd.enabled } : cmd));
  };

  const handleSave = async () => {
    if (!tenant) return;
    setSaving(true);

    try {
      const discordConfig: DiscordConfigType = {
        enabled,
        bot_name: botName,
        bot_avatar: botAvatar,
        prefix,
        status,
        custom_commands: commands,
      };

      const { error } = await supabase
        .from('tenants')
        .update({ discord_config: discordConfig as any })
        .eq('id', tenant.id);

      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: error.message });
      } else {
        initialRef.current = { enabled, botName, botAvatar, prefix, status, commands: JSON.parse(JSON.stringify(commands)) };
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

  if (!tenant) {
    return <p className="text-muted-foreground">Wiki não encontrada.</p>;
  }

  const isDirty =
    enabled !== initialRef.current.enabled ||
    botName !== initialRef.current.botName ||
    botAvatar !== initialRef.current.botAvatar ||
    prefix !== initialRef.current.prefix ||
    status !== initialRef.current.status ||
    JSON.stringify(commands.map((c) => c.enabled)) !== JSON.stringify(initialRef.current.commands.map((c) => c.enabled));

  const sections = [
    { id: 'discord-login', label: 'Conexão', icon: Server },
    { id: 'status', label: 'Status do Bot', icon: Power },
    { id: 'identity', label: 'Identidade do Bot', icon: Bot },
    { id: 'messages', label: 'Prefixo e Mensagens', icon: MessageSquare },
    { id: 'commands', label: 'Comandos Personalizados', icon: Terminal },
    { id: 'servers', label: 'Servidores Conectados', icon: Server },
  ];

  return (
    <GuildDataProvider>
      <div className="flex min-w-0">
        <PageSubNav sections={sections} />
        <div className="flex-1 min-w-0 p-6 max-w-2xl mx-auto space-y-6">

        <section id="discord-login">
          <DiscordLoginGate />
        </section>

        <section id="status">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Power className="h-5 w-5" />
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
        </section>

        <section id="identity">
        <Card>
          <CardHeader>
            <CardTitle>Identidade do Bot</CardTitle>
            <CardDescription>Nome e avatar do bot no Discord.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FloatingLabelInput
              label="Nome do Bot"
              value={botName}
              onChange={(e) => setBotName(e.target.value)}
            />

            <div className="space-y-2">
              <Label>Avatar do Bot</Label>
              <ImageUpload
                bucket="wiki-images"
                pathPrefix={`discord-avatars/${slug}`}
                value={botAvatar || ''}
                onChange={(url) => setBotAvatar(url || null)}
                previewSize="w-16 h-16 rounded-full"
              />
              <p className="text-xs text-muted-foreground">JPEG, PNG ou GIF. Tamanho recomendado: 512x512.</p>
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
        </section>

        <section id="messages">
        <Card>
          <CardHeader>
            <CardTitle>Prefixo de Comandos</CardTitle>
            <CardDescription>Configure o prefixo dos comandos do bot.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FloatingLabelInput
              label="Prefixo de Comandos"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              maxLength={5}
              className="w-24"
            />
          </CardContent>
        </Card>
        </section>

        <section id="commands">
        <Card>
          <CardHeader>
            <CardTitle>Comandos Personalizados</CardTitle>
            <CardDescription>
              Ative/desative comandos existentes. Clique em "Editar" para configurar triggers, ações e embeds.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {commands.length === 0 ? (
              <div className="text-center py-6 space-y-3">
                <p className="text-sm text-muted-foreground">Nenhum comando personalizado ainda.</p>
                <Button
                  variant="default"
                  onClick={() => router.push(`/dashboard/${slug}/discord/commands/new`)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Comando
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {commands.map((cmd, index) => (
                  <div
                    key={cmd.id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <label className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={cmd.enabled}
                        onChange={() => toggleCommand(index)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </label>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{cmd.name || 'Comando sem nome'}</p>
                      {cmd.description && (
                        <p className="text-[11px] text-muted-foreground truncate">{cmd.description}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground">
                        {cmd.actions.length} aç{cmd.actions.length === 1 ? 'ão' : 'ões'}
                        {' · '}
                        {cmd.executionMode === 'sequential' ? 'sequencial' : 'paralelo'}
                        {' · '}
                        {cmd.triggerType === 'mention' ? '@menção' : `${cmd.trigger.filter(Boolean).length} trigger${cmd.trigger.filter(Boolean).length !== 1 ? 's' : ''}`}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/dashboard/${slug}/discord/commands/${cmd.id}`)}
                      className="shrink-0 h-8 gap-1"
                    >
                      <Pencil className="h-3 w-3" /> Editar
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {commands.length > 0 && (
              <Button
                variant="outline"
                onClick={() => router.push(`/dashboard/${slug}/discord/commands/new`)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Comando
              </Button>
            )}
          </CardContent>
        </Card>
        </section>

        <section id="servers">
        {dbGuilds.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Servidores Conectados</CardTitle>
              <CardDescription>Servidores onde o bot está presente.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {dbGuilds.map((guild) => (
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
        </section>

        {savedFeedback ? (
          <div className="flex items-center gap-2 text-sm text-green-500 font-medium">
            <Check className="h-4 w-4" />
            Configurações salvas!
          </div>
        ) : isDirty ? (
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Configuração
          </Button>
        ) : null}
        </div>
      </div>
    </GuildDataProvider>
  );
}
