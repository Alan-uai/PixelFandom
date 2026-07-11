'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePageState } from '@/hooks/use-page-state';
import { useTranslations } from 'next-intl';
import { supabase } from '@/supabase';
import { Button } from '@/components/ui/button';
import { useCachedData } from '@/hooks/use-cached-data';
import { useSiteCache } from '@/lib/site-cache';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';

import { ImageUpload } from '@/components/ui/image-upload';
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { WeldingCard } from '@/components/ui/welding-card';
import { Checkbox3D } from '@/components/ui/checkbox-3d';
import { CollapsibleSection } from '@/components/ui/collapsible-section';
import { Select3D } from '@/components/ui/select3d';
import { SliderTabs, SliderTabsList, SliderTabsTrigger, SliderTabsContent, SliderTabsContentGroup } from '@/components/ui/slider-tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Bot, Pencil, Settings2, Webhook } from 'lucide-react';
import { GuildDataProvider } from '@/components/discord/guild-data-context';
import { DiscordLoginGate } from '@/components/discord/discord-login-gate';
import { ChannelSelect } from '@/components/discord/channel-select';
import { RoleSelect } from '@/components/discord/role-select';
import { migrateOldCommand, generateId, type DiscordConfig as DiscordConfigType, type CustomCommand, type IngestConfig } from '@/components/discord/types';
import { IngestEntry } from '@/components/discord/ingest-entry';
import { useRegisterUnsavedChanges } from '@/components/unsaved-changes';

export default function WikiDiscordPage() {
  const params = useParams();
  const slug = params.slug as string;
  const t = useTranslations('discord');
  const tc = useTranslations('common');
  const router = useRouter();
  const { toast } = useToast();

  const [tenant, setTenant] = useState<any>(null);
  const [dbGuilds, setDbGuilds] = useState<any[]>([]);
  const [savedConfig, setSavedConfig] = useState({
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
    autoIngest: [] as IngestConfig[],
  });

  const { data: tenantData, loading } = useCachedData<any>(
    `discord:${slug}`,
    async () => {
      const { data } = await supabase.from('tenants').select('*').eq('slug', slug).single();
      return data!;
    }
  );

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

  const [autoIngest, setAutoIngest] = useState<IngestConfig[]>([]);
  const [discordTab, setDiscordTab] = usePageState('tab', 'geral');

  const migrateCommands = (raw: any): CustomCommand[] => {
    if (!raw || !Array.isArray(raw) || raw.length === 0) return [];
    if ('actions' in raw[0]) return raw as CustomCommand[];
    return raw.map(migrateOldCommand);
  };

  const loadConfig = useCallback((config: DiscordConfigType) => {
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
    setAutoIngest(config.auto_ingest ?? []);

    setSavedConfig({
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
      autoIngest: config.auto_ingest ?? [],
    });
  }, []);

  const guildsKey = tenantData?.id ? `discord-guilds:${tenantData.id}` : null;
  const { data: guildsData } = useCachedData<any[]>(
    guildsKey,
    async () => {
      const { data } = await supabase.from('discord_guilds').select('*').eq('tenant_id', tenantData!.id);
      return data || [];
    }
  );

  useEffect(() => {
    if (!tenantData) return;
    setTenant(tenantData);
    const config = (tenantData.discord_config as DiscordConfigType) || {};
    loadConfig(config);
  }, [tenantData, loadConfig]);

  useEffect(() => {
    if (guildsData) setDbGuilds(guildsData);
  }, [guildsData]);

  const toggleCommand = (index: number) => {
    setCommands((prev) => prev.map((cmd, i) => i === index ? { ...cmd, enabled: !cmd.enabled } : cmd));
  };

  const handleSave = async () => {
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
      auto_ingest: autoIngest.length > 0 ? autoIngest : undefined,
    };

    const res = await fetch(`/api/tenants/${tenant!.id}/discord-config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discordConfig),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erro ao salvar' }));
      toast({ variant: 'destructive', title: tc('error'), description: err.error || err.details?.[0]?.message || 'Erro ao salvar configuração.' });
      throw new Error(err.error);
    }

    setSavedConfig({
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
      autoIngest: JSON.parse(JSON.stringify(autoIngest)),
    });

    useSiteCache.getState().set(`discord:${slug}`, {
      ...tenantData,
      discord_config: discordConfig,
    });
  };

  const isDirty = useMemo(() =>
    enabled !== savedConfig.enabled ||
    botName !== savedConfig.botName ||
    botAvatar !== savedConfig.botAvatar ||
    prefix !== savedConfig.prefix ||
    status !== savedConfig.status ||
    JSON.stringify(commands.map((c) => c.enabled)) !== JSON.stringify(savedConfig.commands.map((c) => c.enabled)) ||
    textChatChannelId !== savedConfig.textChatChannelId ||
    textChatChannelName !== savedConfig.textChatChannelName ||
    curationChannelId !== savedConfig.curationChannelId ||
    curationChannelName !== savedConfig.curationChannelName ||
    supportRoleId !== savedConfig.supportRoleId ||
    supportRoleName !== savedConfig.supportRoleName ||
    memberRoleId !== savedConfig.memberRoleId ||
    memberRoleName !== savedConfig.memberRoleName ||
    editorRoleId !== savedConfig.editorRoleId ||
    editorRoleName !== savedConfig.editorRoleName ||
    adminRoleId !== savedConfig.adminRoleId ||
    adminRoleName !== savedConfig.adminRoleName ||
    autoPostCodesEnabled !== savedConfig.autoPostCodesEnabled ||
    autoPostCodesChannelId !== savedConfig.autoPostCodesChannelId ||
    autoPostCodesChannelName !== savedConfig.autoPostCodesChannelName ||
    autoPostArticlesEnabled !== savedConfig.autoPostArticlesEnabled ||
    autoPostArticlesChannelId !== savedConfig.autoPostArticlesChannelId ||
    autoPostArticlesChannelName !== savedConfig.autoPostArticlesChannelName ||
    autoPostUpdatesEnabled !== savedConfig.autoPostUpdatesEnabled ||
    autoPostUpdatesChannelId !== savedConfig.autoPostUpdatesChannelId ||
    autoPostUpdatesChannelName !== savedConfig.autoPostUpdatesChannelName ||
    JSON.stringify(autoIngest) !== JSON.stringify(savedConfig.autoIngest),
  [
    savedConfig,
    enabled, botName, botAvatar, prefix, status, commands,
    textChatChannelId, textChatChannelName,
    curationChannelId, curationChannelName,
    supportRoleId, supportRoleName,
    memberRoleId, memberRoleName,
    editorRoleId, editorRoleName,
    adminRoleId, adminRoleName,
    autoPostCodesEnabled, autoPostCodesChannelId, autoPostCodesChannelName,
    autoPostArticlesEnabled, autoPostArticlesChannelId, autoPostArticlesChannelName,
    autoPostUpdatesEnabled, autoPostUpdatesChannelId, autoPostUpdatesChannelName,
    autoIngest,
  ]);

  useRegisterUnsavedChanges({ isDirty, onSave: handleSave, onDiscard: () => {} });

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tenant) {
    return <p className="text-muted-foreground">{t('wiki_not_found')}</p>;
  }

  return (
    <GuildDataProvider>
      <div className="p-6 max-w-2xl mx-auto space-y-6">

        <section id="discord-login">
          <DiscordLoginGate />
        </section>

        <SliderTabs value={discordTab} onValueChange={setDiscordTab} defaultValue="geral">
          <SliderTabsList className="w-full">
            <SliderTabsTrigger value="geral" icon={Bot}>
              {t('tab.general')}
            </SliderTabsTrigger>
            <SliderTabsTrigger value="configuracoes" icon={Settings2}>
              {t('tab.settings')}
            </SliderTabsTrigger>
            <SliderTabsTrigger value="automacao" icon={Webhook}>
              {t('tab.automation')}
            </SliderTabsTrigger>
          </SliderTabsList>

          <SliderTabsContentGroup>
            <SliderTabsContent value="geral" className="space-y-6">
            <CollapsibleSection id="status" title={t('status.title')} description={t('status.description')} storageKey="status">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t('status.active')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('status.active_hint')}
                  </p>
                </div>
                <Checkbox3D
                  checked={enabled}
                  onChange={setEnabled}
                  size="lg"
                />
              </div>
            </CollapsibleSection>

            <CollapsibleSection id="identity" title={t('identity.title')} description={t('identity.description')} storageKey="identity">
              <div className="space-y-4">
                <FloatingLabelInput
                  label={t('identity.bot_name')}
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                />

                <WeldingCard>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Bot className="h-4 w-4" />
                      {t('identity.avatar_title')}
                    </CardTitle>
                    <CardDescription>{t('identity.avatar_description')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ImageUpload
                      bucket="wiki-images"
                      pathPrefix={`discord-avatars/${slug}`}
                      value={botAvatar || ''}
                      onChange={(url) => setBotAvatar(url || null)}
                      label={t('identity.avatar_label')}
                      previewSize="w-16 h-16 rounded-full"
                    />
                    <p className="text-xs text-muted-foreground mt-2">{t('identity.avatar_recommendation')}</p>
                  </CardContent>
                </WeldingCard>

                <Select3D label={t('identity.status_label')} value={status} options={[
                  {value: 'online', label: t('identity.status_online')},
                  {value: 'idle', label: t('identity.status_idle')},
                  {value: 'dnd', label: t('identity.status_dnd')},
                  {value: 'invisible', label: t('identity.status_invisible')},
                ]} onChange={(v) => setStatus(v as any)} />
              </div>
            </CollapsibleSection>

            <CollapsibleSection id="messages" title={t('prefix.title')} description={t('prefix.description')} storageKey="messages">
              <div className="space-y-4">
                <FloatingLabelInput
                  label={t('prefix.label')}
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  maxLength={5}
                  className="w-24"
                />
              </div>
            </CollapsibleSection>

            <CollapsibleSection id="commands" title={t('commands.title')} description={t('commands.description')} storageKey="commands">
              <div className="space-y-3">
                {commands.length === 0 ? (
                  <div className="text-center py-6 space-y-3">
                    <p className="text-sm text-muted-foreground">{t('commands.empty')}</p>
                    <Button
                      variant="default"
                      onClick={() => router.push(`/dashboard/${slug}/discord/commands/new`)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t('commands.create_first')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {commands.map((cmd, index) => (
                      <div
                        key={cmd.id}
                        className="flex items-center gap-3 rounded-lg border p-3"
                      >
                        <div className="flex items-center shrink-0" onClick={(e) => e.stopPropagation()}>
                          <Checkbox3D
                            checked={cmd.enabled}
                            onChange={() => toggleCommand(index)}
                            size="md"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{cmd.name || t('commands.unnamed')}</p>
                          {cmd.description && (
                            <p className="text-[11px] text-muted-foreground truncate">{cmd.description}</p>
                          )}
                          <p className="text-[10px] text-muted-foreground">
                            {cmd.actions.length} {cmd.actions.length === 1 ? t('commands.actions_suffix') : t('commands.actions_plural_suffix')}
                            {' · '}
                            {cmd.executionMode === 'sequential' ? t('commands.sequential') : t('commands.parallel')}
                            {' · '}
                            {cmd.triggerType === 'mention' ? t('commands.mention') : `${cmd.trigger.filter(Boolean).length} ${cmd.trigger.filter(Boolean).length !== 1 ? t('commands.triggers') : t('commands.trigger')}`}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/${slug}/discord/commands/${cmd.id}`)}
                          className="shrink-0 h-8 gap-1"
                        >
                          <Pencil className="h-3 w-3" /> {t('commands.edit')}
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
                    {t('commands.new')}
                  </Button>
                )}
              </div>
            </CollapsibleSection>

            <CollapsibleSection id="servers" title={t('servers.title')} description={t('servers.description')} storageKey="servers">
              {dbGuilds.length > 0 ? (
                <div className="space-y-3">
                  {dbGuilds.map((guild) => (
                    <div key={guild.guild_id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-mono font-medium">{guild.guild_id}</p>
                        {guild.channel_id && (
                          <p className="text-xs text-muted-foreground">{t('servers.channel')} {guild.channel_id}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${guild.bot_enabled ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                        <span className="text-xs text-muted-foreground">{guild.bot_enabled ? t('servers.active') : t('servers.inactive')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </CollapsibleSection>
          </SliderTabsContent>

          <SliderTabsContent value="configuracoes" className="space-y-6">
            <CollapsibleSection
              id="channels"
              title={t('channels.title')}
              description={t('channels.description')}
              storageKey="channels"
            >
              <div className="space-y-4">
                <ChannelSelect
                  label={t('channels.text_chat')}
                  description={t('channels.text_chat_desc')}
                  channelId={textChatChannelId}
                  channelName={textChatChannelName}
                  onChange={(id, name) => { setTextChatChannelId(id); setTextChatChannelName(name); }}
                />
                <ChannelSelect
                  label={t('channels.curation')}
                  description={t('channels.curation_desc')}
                  channelId={curationChannelId}
                  channelName={curationChannelName}
                  onChange={(id, name) => { setCurationChannelId(id); setCurationChannelName(name); }}
                />
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              id="roles"
              title={t('roles.title')}
              description={t('roles.description')}
              storageKey="roles"
            >
              <div className="space-y-4">
                <RoleSelect
                  label={t('roles.support')}
                  description={t('roles.support_desc')}
                  roleId={supportRoleId}
                  roleName={supportRoleName}
                  onChange={(id, name) => { setSupportRoleId(id); setSupportRoleName(name); }}
                />
                <RoleSelect
                  label={t('roles.member')}
                  description={t('roles.member_desc')}
                  roleId={memberRoleId}
                  roleName={memberRoleName}
                  onChange={(id, name) => { setMemberRoleId(id); setMemberRoleName(name); }}
                />
                <RoleSelect
                  label={t('roles.editor')}
                  description={t('roles.editor_desc')}
                  roleId={editorRoleId}
                  roleName={editorRoleName}
                  onChange={(id, name) => { setEditorRoleId(id); setEditorRoleName(name); }}
                />
                <RoleSelect
                  label={t('roles.admin')}
                  description={t('roles.admin_desc')}
                  roleId={adminRoleId}
                  roleName={adminRoleName}
                  onChange={(id, name) => { setAdminRoleId(id); setAdminRoleName(name); }}
                />
              </div>
            </CollapsibleSection>
          </SliderTabsContent>

          <SliderTabsContent value="automacao" className="space-y-6">
            <CollapsibleSection
              id="auto-post"
              title={t('auto_post.title')}
              description={t('auto_post.description')}
              storageKey="auto-post"
            >
              <div className="space-y-6">
                <div className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{t('auto_post.codes')}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('auto_post.codes_desc')}
                      </p>
                    </div>
                    <Checkbox3D
                      checked={autoPostCodesEnabled}
                      onChange={setAutoPostCodesEnabled}
                      size="lg"
                    />
                  </div>
                  {autoPostCodesEnabled && (
                    <ChannelSelect
                      label={t('auto_post.codes_channel')}
                      description={t('auto_post.codes_channel_desc')}
                      channelId={autoPostCodesChannelId}
                      channelName={autoPostCodesChannelName}
                      onChange={(id, name) => { setAutoPostCodesChannelId(id); setAutoPostCodesChannelName(name); }}
                    />
                  )}
                </div>

                <div className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{t('auto_post.articles')}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('auto_post.articles_desc')}
                      </p>
                    </div>
                    <Checkbox3D
                      checked={autoPostArticlesEnabled}
                      onChange={setAutoPostArticlesEnabled}
                      size="lg"
                    />
                  </div>
                  {autoPostArticlesEnabled && (
                    <ChannelSelect
                      label={t('auto_post.articles_channel')}
                      description={t('auto_post.articles_channel_desc')}
                      channelId={autoPostArticlesChannelId}
                      channelName={autoPostArticlesChannelName}
                      onChange={(id, name) => { setAutoPostArticlesChannelId(id); setAutoPostArticlesChannelName(name); }}
                    />
                  )}
                </div>

                <div className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{t('auto_post.updates')}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('auto_post.updates_desc')}
                      </p>
                    </div>
                    <Checkbox3D
                      checked={autoPostUpdatesEnabled}
                      onChange={setAutoPostUpdatesEnabled}
                      size="lg"
                    />
                  </div>
                  {autoPostUpdatesEnabled && (
                    <ChannelSelect
                      label={t('auto_post.updates_channel')}
                      description={t('auto_post.updates_channel_desc')}
                      channelId={autoPostUpdatesChannelId}
                      channelName={autoPostUpdatesChannelName}
                      onChange={(id, name) => { setAutoPostUpdatesChannelId(id); setAutoPostUpdatesChannelName(name); }}
                    />
                  )}
                </div>
              </div>
            </CollapsibleSection>

            <CollapsibleSection
              id="auto-ingest"
              title={t('auto_ingest.title')}
              description={t('auto_ingest.description')}
              storageKey="auto-ingest"
            >
              <div className="space-y-4">
                {autoIngest.map((entry, i) => (
                  <IngestEntry
                    key={entry.id}
                    slug={slug}
                    entry={entry}
                    onChange={(updated) => setAutoIngest((prev) => prev.map((e, j) => j === i ? updated : e))}
                    onRemove={() => setAutoIngest((prev) => prev.filter((_, j) => j !== i))}
                  />
                ))}
                <Button
                  variant="outline"
                  onClick={() => setAutoIngest((prev) => [...prev, {
                    id: generateId(),
                    source_channel_id: '',
                    source_channel_name: '',
                    target_table: '',
                    target_label: '',
                    trigger_type: 'command',
                    command_prefix: '!ingest',
                    enabled: true,
                  }])}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('auto_ingest.add')}
                </Button>
              </div>
            </CollapsibleSection>
          </SliderTabsContent>
        </SliderTabsContentGroup>
        </SliderTabs>

      </div>
    </GuildDataProvider>
  );
}
