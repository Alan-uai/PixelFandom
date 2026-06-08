'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/supabase';
import { Button } from '@/components/ui/button';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/ui/image-upload';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Check, Plus, Bot, Power, MessageSquare, Terminal, Server, Pencil, Settings2, Hash, Shield } from 'lucide-react';
import { GuildDataProvider } from '@/components/discord/guild-data-context';
import { DiscordLoginGate } from '@/components/discord/discord-login-gate';
import { ChannelSelect } from '@/components/discord/channel-select';
import { RoleSelect } from '@/components/discord/role-select';
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
    textChatChannelId: '', textChatChannelName: '',
    curationChannelId: '', curationChannelName: '',
    supportRoleId: '', supportRoleName: '',
    memberRoleId: '', memberRoleName: '',
    editorRoleId: '', editorRoleName: '',
    adminRoleId: '', adminRoleName: '',
    autoPostCodesEnabled: false,
    autoPostCodesChannelId: '', autoPostCodesChannelName: '',
    autoPostArticlesEnabled: false,
    autoPostArticlesChannelId: '', autoPostArticlesChannelName: '',
    autoPostUpdatesEnabled: false,
    autoPostUpdatesChannelId: '', autoPostUpdatesChannelName: '',
  });

  const [enabled, setEnabled] = useState(false);
  const [botName, setBotName] = useState('');
  const [botAvatar, setBotAvatar] = useState<string | null>(null);
  const [prefix, setPrefix] = useState('!');
  const [status, setStatus] = useState<'online' | 'idle' | 'dnd' | 'invisible'>('online');
  const [commands, setCommands] = useState<CustomCommand[]>([]);

  const [textChatChannelId, setTextChatChannelId] = useState('');
  const [textChatChannelName, setTextChatChannelName] = useState('');
  const [curationChannelId, setCurationChannelId] = useState('');
  const [curationChannelName, setCurationChannelName] = useState('');
  const [supportRoleId, setSupportRoleId] = useState('');
  const [supportRoleName, setSupportRoleName] = useState('');
  const [memberRoleId, setMemberRoleId] = useState('');
  const [memberRoleName, setMemberRoleName] = useState('');
  const [editorRoleId, setEditorRoleId] = useState('');
  const [editorRoleName, setEditorRoleName] = useState('');
  const [adminRoleId, setAdminRoleId] = useState('');
  const [adminRoleName, setAdminRoleName] = useState('');
  const [autoPostCodesEnabled, setAutoPostCodesEnabled] = useState(false);
  const [autoPostCodesChannelId, setAutoPostCodesChannelId] = useState('');
  const [autoPostCodesChannelName, setAutoPostCodesChannelName] = useState('');
  const [autoPostArticlesEnabled, setAutoPostArticlesEnabled] = useState(false);
  const [autoPostArticlesChannelId, setAutoPostArticlesChannelId] = useState('');
  const [autoPostArticlesChannelName, setAutoPostArticlesChannelName] = useState('');
  const [autoPostUpdatesEnabled, setAutoPostUpdatesEnabled] = useState(false);
  const [autoPostUpdatesChannelId, setAutoPostUpdatesChannelId] = useState('');
  const [autoPostUpdatesChannelName, setAutoPostUpdatesChannelName] = useState('');

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

    setTextChatChannelId(config.text_chat_channel_id ?? '');
    setTextChatChannelName(config.text_chat_channel_name ?? '');
    setCurationChannelId(config.curation_channel_id ?? '');
    setCurationChannelName(config.curation_channel_name ?? '');
    setSupportRoleId(config.support_role_id ?? '');
    setSupportRoleName(config.support_role_name ?? '');
    setMemberRoleId(config.member_role_id ?? '');
    setMemberRoleName(config.member_role_name ?? '');
    setEditorRoleId(config.editor_role_id ?? '');
    setEditorRoleName(config.editor_role_name ?? '');
    setAdminRoleId(config.admin_role_id ?? '');
    setAdminRoleName(config.admin_role_name ?? '');
    setAutoPostCodesEnabled(config.auto_post_codes_enabled ?? false);
    setAutoPostCodesChannelId(config.auto_post_codes_channel_id ?? '');
    setAutoPostCodesChannelName(config.auto_post_codes_channel_name ?? '');
    setAutoPostArticlesEnabled(config.auto_post_articles_enabled ?? false);
    setAutoPostArticlesChannelId(config.auto_post_articles_channel_id ?? '');
    setAutoPostArticlesChannelName(config.auto_post_articles_channel_name ?? '');
    setAutoPostUpdatesEnabled(config.auto_post_updates_enabled ?? false);
    setAutoPostUpdatesChannelId(config.auto_post_updates_channel_id ?? '');
    setAutoPostUpdatesChannelName(config.auto_post_updates_channel_name ?? '');

    initialRef.current = {
      enabled: config.enabled ?? false,
      botName: config.bot_name ?? '',
      botAvatar: config.bot_avatar ?? null,
      prefix: config.prefix ?? '!',
      status: config.status ?? 'online',
      commands: loadedCommands,
      textChatChannelId: config.text_chat_channel_id ?? '',
      textChatChannelName: config.text_chat_channel_name ?? '',
      curationChannelId: config.curation_channel_id ?? '',
      curationChannelName: config.curation_channel_name ?? '',
      supportRoleId: config.support_role_id ?? '',
      supportRoleName: config.support_role_name ?? '',
      memberRoleId: config.member_role_id ?? '',
      memberRoleName: config.member_role_name ?? '',
      editorRoleId: config.editor_role_id ?? '',
      editorRoleName: config.editor_role_name ?? '',
      adminRoleId: config.admin_role_id ?? '',
      adminRoleName: config.admin_role_name ?? '',
      autoPostCodesEnabled: config.auto_post_codes_enabled ?? false,
      autoPostCodesChannelId: config.auto_post_codes_channel_id ?? '',
      autoPostCodesChannelName: config.auto_post_codes_channel_name ?? '',
      autoPostArticlesEnabled: config.auto_post_articles_enabled ?? false,
      autoPostArticlesChannelId: config.auto_post_articles_channel_id ?? '',
      autoPostArticlesChannelName: config.auto_post_articles_channel_name ?? '',
      autoPostUpdatesEnabled: config.auto_post_updates_enabled ?? false,
      autoPostUpdatesChannelId: config.auto_post_updates_channel_id ?? '',
      autoPostUpdatesChannelName: config.auto_post_updates_channel_name ?? '',
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
        text_chat_channel_id: textChatChannelId || undefined,
        text_chat_channel_name: textChatChannelName || undefined,
        curation_channel_id: curationChannelId || undefined,
        curation_channel_name: curationChannelName || undefined,
        support_role_id: supportRoleId || undefined,
        support_role_name: supportRoleName || undefined,
        member_role_id: memberRoleId || undefined,
        member_role_name: memberRoleName || undefined,
        editor_role_id: editorRoleId || undefined,
        editor_role_name: editorRoleName || undefined,
        admin_role_id: adminRoleId || undefined,
        admin_role_name: adminRoleName || undefined,
        auto_post_codes_enabled: autoPostCodesEnabled || undefined,
        auto_post_codes_channel_id: autoPostCodesChannelId || undefined,
        auto_post_codes_channel_name: autoPostCodesChannelName || undefined,
        auto_post_articles_enabled: autoPostArticlesEnabled || undefined,
        auto_post_articles_channel_id: autoPostArticlesChannelId || undefined,
        auto_post_articles_channel_name: autoPostArticlesChannelName || undefined,
        auto_post_updates_enabled: autoPostUpdatesEnabled || undefined,
        auto_post_updates_channel_id: autoPostUpdatesChannelId || undefined,
        auto_post_updates_channel_name: autoPostUpdatesChannelName || undefined,
      };

      const { error } = await supabase
        .from('tenants')
        .update({ discord_config: discordConfig as any })
        .eq('id', tenant.id);

      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: error.message });
      } else {
        initialRef.current = {
          enabled, botName, botAvatar, prefix, status,
          commands: JSON.parse(JSON.stringify(commands)),
          textChatChannelId, textChatChannelName,
          curationChannelId, curationChannelName,
          supportRoleId, supportRoleName,
          memberRoleId, memberRoleName,
          editorRoleId, editorRoleName,
          adminRoleId, adminRoleName,
          autoPostCodesEnabled, autoPostCodesChannelId, autoPostCodesChannelName,
          autoPostArticlesEnabled, autoPostArticlesChannelId, autoPostArticlesChannelName,
          autoPostUpdatesEnabled, autoPostUpdatesChannelId, autoPostUpdatesChannelName,
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

  if (!tenant) {
    return <p className="text-muted-foreground">Wiki não encontrada.</p>;
  }

  const isDirty =
    enabled !== initialRef.current.enabled ||
    botName !== initialRef.current.botName ||
    botAvatar !== initialRef.current.botAvatar ||
    prefix !== initialRef.current.prefix ||
    status !== initialRef.current.status ||
    JSON.stringify(commands.map((c) => c.enabled)) !== JSON.stringify(initialRef.current.commands.map((c) => c.enabled)) ||
    textChatChannelId !== initialRef.current.textChatChannelId ||
    textChatChannelName !== initialRef.current.textChatChannelName ||
    curationChannelId !== initialRef.current.curationChannelId ||
    curationChannelName !== initialRef.current.curationChannelName ||
    supportRoleId !== initialRef.current.supportRoleId ||
    supportRoleName !== initialRef.current.supportRoleName ||
    memberRoleId !== initialRef.current.memberRoleId ||
    memberRoleName !== initialRef.current.memberRoleName ||
    editorRoleId !== initialRef.current.editorRoleId ||
    editorRoleName !== initialRef.current.editorRoleName ||
    adminRoleId !== initialRef.current.adminRoleId ||
    adminRoleName !== initialRef.current.adminRoleName ||
    autoPostCodesEnabled !== initialRef.current.autoPostCodesEnabled ||
    autoPostCodesChannelId !== initialRef.current.autoPostCodesChannelId ||
    autoPostCodesChannelName !== initialRef.current.autoPostCodesChannelName ||
    autoPostArticlesEnabled !== initialRef.current.autoPostArticlesEnabled ||
    autoPostArticlesChannelId !== initialRef.current.autoPostArticlesChannelId ||
    autoPostArticlesChannelName !== initialRef.current.autoPostArticlesChannelName ||
    autoPostUpdatesEnabled !== initialRef.current.autoPostUpdatesEnabled ||
    autoPostUpdatesChannelId !== initialRef.current.autoPostUpdatesChannelId ||
    autoPostUpdatesChannelName !== initialRef.current.autoPostUpdatesChannelName;

  return (
    <GuildDataProvider>
      <div className="p-6 max-w-2xl mx-auto space-y-6">

        <section id="discord-login">
          <DiscordLoginGate />
        </section>

        <Tabs defaultValue="geral">
          <TabsList className="w-full">
            <TabsTrigger value="geral" className="flex-1 gap-2">
              <Bot className="h-4 w-4" />
              Geral
            </TabsTrigger>
            <TabsTrigger value="configuracoes" className="flex-1 gap-2">
              <Settings2 className="h-4 w-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="geral" className="space-y-6">
            <CollapsibleSection id="status" title="Status do Bot" description="Ligue ou desligue o bot do Discord.">
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
            </CollapsibleSection>

            <CollapsibleSection id="identity" title="Identidade do Bot" description="Nome e avatar do bot no Discord.">
              <div className="space-y-4">
                <FloatingLabelInput
                  label="Nome do Bot"
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                />

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Bot className="h-4 w-4" />
                      Avatar do Bot
                    </CardTitle>
                    <CardDescription>Imagem de perfil do bot no Discord.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ImageUpload
                      bucket="wiki-images"
                      pathPrefix={`discord-avatars/${slug}`}
                      value={botAvatar || ''}
                      onChange={(url) => setBotAvatar(url || null)}
                      label="Avatar do Bot"
                      previewSize="w-16 h-16 rounded-full"
                    />
                    <p className="text-xs text-muted-foreground mt-2">JPEG, PNG ou GIF. Tamanho recomendado: 512x512.</p>
                  </CardContent>
                </Card>

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
              </div>
            </CollapsibleSection>

            <CollapsibleSection id="messages" title="Prefixo de Comandos" description="Configure o prefixo dos comandos do bot.">
              <div className="space-y-4">
                <FloatingLabelInput
                  label="Prefixo de Comandos"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  maxLength={5}
                  className="w-24"
                />
              </div>
            </CollapsibleSection>

            <CollapsibleSection id="commands" title="Comandos Personalizados" description='Ative/desative comandos existentes. Clique em "Editar" para configurar triggers, ações e embeds.'>
              <div className="space-y-3">
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
              </div>
            </CollapsibleSection>

            <CollapsibleSection id="servers" title="Servidores Conectados" description="Servidores onde o bot está presente.">
              {dbGuilds.length > 0 ? (
                <div className="space-y-3">
                  {dbGuilds.map((guild) => (
                    <div key={guild.guild_id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-mono font-medium">{guild.guild_id}</p>
                        {guild.channel_id && (
                          <p className="text-xs text-muted-foreground">Canal: {guild.channel_id}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${guild.bot_enabled ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                        <span className="text-xs text-muted-foreground">{guild.bot_enabled ? 'Ativo' : 'Inativo'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </CollapsibleSection>
          </TabsContent>

          <TabsContent value="configuracoes" className="space-y-6">
            <CollapsibleSection
              id="channels"
              title="Canais"
              description="Configure os canais que o bot utiliza no Discord."
            >
              <div className="space-y-4">
                <ChannelSelect
                  label="Chat de Texto do Jogo"
                  description="Canal onde o chat de texto do jogo opera."
                  channelId={textChatChannelId}
                  channelName={textChatChannelName}
                  onChange={(id, name) => { setTextChatChannelId(id); setTextChatChannelName(name); }}
                />
                <ChannelSelect
                  label="Curadoria de Respostas"
                  description="Canal onde respostas com reação negativa são enviadas para revisão."
                  channelId={curationChannelId}
                  channelName={curationChannelName}
                  onChange={(id, name) => { setCurationChannelId(id); setCurationChannelName(name); }}
                />
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              id="roles"
              title="Cargos"
              description="Configure os cargos do Discord sincronizados com a wiki."
            >
              <div className="space-y-4">
                <RoleSelect
                  label="Suporte"
                  description="Cargo mencionado quando o bot não souber responder."
                  roleId={supportRoleId}
                  roleName={supportRoleName}
                  onChange={(id, name) => { setSupportRoleId(id); setSupportRoleName(name); }}
                />
                <RoleSelect
                  label="Membro"
                  description="Cargo base de membro da wiki no Discord."
                  roleId={memberRoleId}
                  roleName={memberRoleName}
                  onChange={(id, name) => { setMemberRoleId(id); setMemberRoleName(name); }}
                />
                <RoleSelect
                  label="Editor"
                  description="Cargo de editor da wiki no Discord."
                  roleId={editorRoleId}
                  roleName={editorRoleName}
                  onChange={(id, name) => { setEditorRoleId(id); setEditorRoleName(name); }}
                />
                <RoleSelect
                  label="Administrador"
                  description="Cargo de administrador da wiki no Discord."
                  roleId={adminRoleId}
                  roleName={adminRoleName}
                  onChange={(id, name) => { setAdminRoleId(id); setAdminRoleName(name); }}
                />
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              id="auto-post"
              title="Auto-Post"
              description="Publique automaticamente conteúdo da wiki no Discord."
            >
              <div className="space-y-6">
                <div className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Códigos Promocionais</p>
                      <p className="text-xs text-muted-foreground">
                        Publique automaticamente novos códigos no Discord.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoPostCodesEnabled}
                      onChange={(e) => setAutoPostCodesEnabled(e.target.checked)}
                      className="h-5 w-5 rounded border-gray-300"
                    />
                  </div>
                  {autoPostCodesEnabled && (
                    <ChannelSelect
                      label="Canal de Códigos"
                      description="Canal onde os códigos serão publicados."
                      channelId={autoPostCodesChannelId}
                      channelName={autoPostCodesChannelName}
                      onChange={(id, name) => { setAutoPostCodesChannelId(id); setAutoPostCodesChannelName(name); }}
                    />
                  )}
                </div>

                <div className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Artigos da Wiki</p>
                      <p className="text-xs text-muted-foreground">
                        Publique automaticamente novos artigos no Discord.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoPostArticlesEnabled}
                      onChange={(e) => setAutoPostArticlesEnabled(e.target.checked)}
                      className="h-5 w-5 rounded border-gray-300"
                    />
                  </div>
                  {autoPostArticlesEnabled && (
                    <ChannelSelect
                      label="Canal de Artigos"
                      description="Canal onde os artigos serão publicados."
                      channelId={autoPostArticlesChannelId}
                      channelName={autoPostArticlesChannelName}
                      onChange={(id, name) => { setAutoPostArticlesChannelId(id); setAutoPostArticlesChannelName(name); }}
                    />
                  )}
                </div>

                <div className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Update Log do Jogo</p>
                      <p className="text-xs text-muted-foreground">
                        Publique automaticamente atualizações do jogo no Discord.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoPostUpdatesEnabled}
                      onChange={(e) => setAutoPostUpdatesEnabled(e.target.checked)}
                      className="h-5 w-5 rounded border-gray-300"
                    />
                  </div>
                  {autoPostUpdatesEnabled && (
                    <ChannelSelect
                      label="Canal de Updates"
                      description="Canal onde os updates serão publicados."
                      channelId={autoPostUpdatesChannelId}
                      channelName={autoPostUpdatesChannelName}
                      onChange={(id, name) => { setAutoPostUpdatesChannelId(id); setAutoPostUpdatesChannelName(name); }}
                    />
                  )}
                </div>
              </div>
            </CollapsibleSection>
          </TabsContent>
        </Tabs>

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
    </GuildDataProvider>
  );
}
