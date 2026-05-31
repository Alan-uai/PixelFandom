'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/supabase';
import { Button } from '@/components/ui/button';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';
import { FloatingLabelTextarea } from '@/components/ui/floating-label-textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Save, Plus, Trash2, Code2 } from 'lucide-react';
import { GuildDataProvider, useGuildData } from '@/components/discord/guild-data-context';
import { DiscordLoginGate } from '@/components/discord/discord-login-gate';
import { EmbedBuilder } from '@/components/discord/embed-builder';
import { EmbedPreview } from '@/components/discord/embed-preview';
import { ActionListItem, AddActionDropdown } from '@/components/discord/action-configs';
import { VariablePicker } from '@/components/discord/variable-picker';
import {
  createDefaultAction, createDefaultCommand,
  type CustomCommand, type BotAction, type BotActionType, type TriggerType, type ExecutionMode, type EmbedPayload,
} from '@/components/discord/types';

function CommandBuilderInner() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const commandId = params.id as string;
  const isNew = commandId === 'new';
  const { toast } = useToast();
  const { connected, selectedGuild, channels, roles } = useGuildData();

  const [command, setCommand] = useState<CustomCommand>(() => ({
    ...createDefaultCommand(),
    id: isNew ? createDefaultCommand().id : commandId,
  }));
  const [showAddAction, setShowAddAction] = useState(false);
  const [showVars, setShowVars] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  const loadCommand = useCallback(async () => {
    const { data: tenantData } = await supabase
      .from('tenants')
      .select('discord_config')
      .eq('slug', slug)
      .single();

    if (!tenantData) return;

    const config = tenantData.discord_config as any;
    const commands: CustomCommand[] = config?.custom_commands ?? [];
    const found = commands.find((c: CustomCommand) => c.id === commandId);
    if (found) setCommand(found);
    setLoading(false);
  }, [slug, commandId]);

  useEffect(() => {
    if (!isNew) loadCommand();
  }, [isNew, loadCommand]);

  const update = (partial: Partial<CustomCommand>) => setCommand((prev) => ({ ...prev, ...partial }));

  const addAction = (type: BotActionType) => {
    update({ actions: [...command.actions, createDefaultAction(type)] });
    setShowAddAction(false);
  };

  const updateAction = (index: number, action: BotAction) => {
    const actions = command.actions.map((a, i) => (i === index ? action : a));
    update({ actions });
  };

  const removeAction = (index: number) => {
    update({ actions: command.actions.filter((_, i) => i !== index) });
  };

  const moveAction = (index: number, direction: -1 | 1) => {
    const actions = [...command.actions];
    const target = index + direction;
    if (target < 0 || target >= actions.length) return;
    [actions[index], actions[target]] = [actions[target], actions[index]];
    update({ actions });
  };

  const addTriggerInput = () => update({ trigger: [...command.trigger, ''] });

  const updateTrigger = (index: number, value: string) => {
    const triggers = command.trigger.map((t, i) => (i === index ? value : t));
    update({ trigger: triggers });
  };

  const removeTrigger = (index: number) => {
    if (command.trigger.length <= 1) return;
    update({ trigger: command.trigger.filter((_, i) => i !== index) });
  };

  const firstSendMessageAction = command.actions.find((a) => a.type === 'send_message' || a.type === 'edit_message');
  const previewEmbed: EmbedPayload | null = firstSendMessageAction?.payload?.embeds?.[0] ?? null;

  const handleSave = async () => {
    setSaving(true);
    const { data: tenantData } = await supabase
      .from('tenants')
      .select('discord_config')
      .eq('slug', slug)
      .single();

    if (!tenantData) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Wiki não encontrada.' });
      setSaving(false);
      return;
    }

    const config = (tenantData.discord_config as any) || {};
    let commands: CustomCommand[] = config.custom_commands ?? [];

    if (isNew) {
      commands = [...commands, command];
    } else {
      commands = commands.map((c: CustomCommand) => c.id === commandId ? command : c);
    }

    const { error } = await supabase
      .from('tenants')
      .update({ discord_config: { ...config, custom_commands: commands } })
      .eq('slug', slug);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: error.message });
    } else {
      toast({ title: 'Comando salvo!', description: `"${command.name || 'Sem nome'}" foi salvo.` });
      router.push(`/dashboard/${slug}/discord`);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/${slug}/discord`)} className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <h2 className="text-lg font-semibold">{isNew ? 'Novo Comando' : 'Editar Comando'}</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowVars(!showVars)} className="gap-1">
            <Code2 className="h-4 w-4" /> Variáveis
          </Button>
          <Button onClick={handleSave} disabled={saving} size="sm" className="gap-1">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar
          </Button>
        </div>
      </div>

      {showVars && (
        <Card>
          <CardContent className="pt-4">
            <VariablePicker mode="copy" onClose={() => setShowVars(false)} />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Configuração do Comando</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FloatingLabelInput
                label="Nome do Comando"
                value={command.name}
                onChange={(e) => update({ name: e.target.value })}
                className="text-xs"
              />

              <FloatingLabelTextarea
                label="Descrição"
                value={command.description}
                onChange={(e) => update({ description: e.target.value })}
                className="text-xs min-h-[60px]"
              />

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Tipo de Trigger</Label>
                  <select
                    value={command.triggerType}
                    onChange={(e) => update({ triggerType: e.target.value as TriggerType })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="exact">Exato</option>
                    <option value="startsWith">Começa com</option>
                    <option value="includes">Contém</option>
                    <option value="regex">Regex</option>
                    <option value="mention">@Menção</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Modo de Execução</Label>
                  <select
                    value={command.executionMode}
                    onChange={(e) => update({ executionMode: e.target.value as ExecutionMode })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="sequential">Sequencial</option>
                    <option value="parallel">Paralelo</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  {command.triggerType === 'mention' ? 'Filtros (opcional — texto adicional junto com @menção)' : 'Triggers'}
                </p>
                <div className="space-y-1">
                  {command.trigger.map((t, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <FloatingLabelInput
                        label={`Trigger #${i + 1}`}
                        value={t}
                        onChange={(e) => updateTrigger(i, e.target.value)}
                        className="text-xs font-mono flex-1"
                      />
                      {command.trigger.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => removeTrigger(i)} className="h-8 w-8 shrink-0 mt-1">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button variant="ghost" size="sm" onClick={addTriggerInput} className="h-7 text-xs gap-1">
                  <Plus className="h-3 w-3" /> Adicionar {command.triggerType === 'mention' ? 'Filtro' : 'Trigger'}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FloatingLabelInput
                  label="Cooldown (segundos)"
                  type="number"
                  min={0}
                  value={command.cooldown}
                  onChange={(e) => update({ cooldown: parseInt(e.target.value) || 0 })}
                  className="text-xs"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Permissões</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Cargos Permitidos</p>
                {connected && selectedGuild ? (
                  <select
                    multiple
                    value={command.allowedRoles}
                    onChange={(e) => update({ allowedRoles: Array.from(e.target.selectedOptions, (o) => o.value) })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[80px]"
                  >
                    <option value="">Todos os cargos</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                ) : (
                  <FloatingLabelInput
                    label="role_id_1, role_id_2"
                    value={command.allowedRoles.join(', ')}
                    onChange={(e) => update({ allowedRoles: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                    className="text-xs"
                  />
                )}
                <p className="text-[10px] text-muted-foreground mt-1">Vazio = todos os cargos podem usar.</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Canais Permitidos</p>
                {connected && selectedGuild ? (
                  <select
                    multiple
                    value={command.allowedChannels}
                    onChange={(e) => update({ allowedChannels: Array.from(e.target.selectedOptions, (o) => o.value) })}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[80px]"
                  >
                    {channels.filter((c) => c.type === 0).map((ch) => (
                      <option key={ch.id} value={ch.id}># {ch.name}</option>
                    ))}
                  </select>
                ) : (
                  <FloatingLabelInput
                    label="channel_id_1, channel_id_2"
                    value={command.allowedChannels.join(', ')}
                    onChange={(e) => update({ allowedChannels: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                    className="text-xs"
                  />
                )}
                <p className="text-[10px] text-muted-foreground mt-1">Vazio = todos os canais.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Ações ({command.actions.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddAction(!showAddAction)}
                className="w-full text-xs gap-1"
              >
                <Plus className="h-3 w-3" /> Adicionar Ação
              </Button>
              {showAddAction && (
                <div className="rounded-lg border p-3 bg-muted/30">
                  <AddActionDropdown onAdd={addAction} />
                </div>
              )}
              {command.actions.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">Nenhuma ação. Adicione ao menos uma ação.</p>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {command.actions.map((action, i) => (
                    <ActionListItem
                      key={action.id}
                      action={action}
                      index={i}
                      total={command.actions.length}
                      onChange={(a) => updateAction(i, a)}
                      onRemove={() => removeAction(i)}
                      onMoveUp={() => moveAction(i, -1)}
                      onMoveDown={() => moveAction(i, 1)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {firstSendMessageAction && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Embeds da Ação &quot;{firstSendMessageAction.type === 'send_message' ? 'Enviar Mensagem' : 'Editar Mensagem'}&quot;</CardTitle>
              </CardHeader>
              <CardContent>
                <EmbedBuilder
                  value={firstSendMessageAction.payload.embeds ?? []}
                  onChange={(embeds) => {
                    const actions = command.actions.map((a) =>
                      a.id === firstSendMessageAction.id
                        ? { ...a, payload: { ...a.payload, embeds } }
                        : a
                    );
                    update({ actions });
                  }}
                />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card className="xl:sticky xl:top-4">
            <CardHeader>
              <CardTitle className="text-sm">Preview do Embed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-[#1e1f22] rounded-lg p-4 min-h-[200px] flex items-center justify-center">
                <EmbedPreview embed={previewEmbed} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Conexão Discord</CardTitle>
            </CardHeader>
            <CardContent>
              <DiscordLoginGate />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function CommandBuilderPage() {
  return (
    <GuildDataProvider>
      <CommandBuilderInner />
    </GuildDataProvider>
  );
}
