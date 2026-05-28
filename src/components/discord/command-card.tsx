'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { createDefaultAction, type CustomCommand, type BotActionType, type BotAction, type TriggerType, type ExecutionMode } from './types';
import { ActionListItem, AddActionDropdown } from './action-configs';

interface Props {
  command: CustomCommand;
  onChange: (cmd: CustomCommand) => void;
  onRemove: () => void;
}

export function CommandCard({ command, onChange, onRemove }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [showAddAction, setShowAddAction] = useState(false);

  const update = (partial: Partial<CustomCommand>) => onChange({ ...command, ...partial });

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

  return (
    <div className="rounded-lg border">
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <button className="shrink-0 text-muted-foreground">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <label className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={command.enabled}
            onChange={(e) => update({ enabled: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300"
          />
        </label>
        <div className="flex-1 min-w-0">
          {command.name ? (
            <p className="text-sm font-medium truncate">{command.name}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">Comando sem nome</p>
          )}
          <p className="text-[11px] text-muted-foreground truncate">
            {command.trigger.filter(Boolean).join(', ') || 'sem trigger'}
            {' · '}
            {command.actions.length} aç{command.actions.length === 1 ? 'ão' : 'ões'}
            {' · '}
            {command.executionMode === 'sequential' ? 'sequencial' : 'paralelo'}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="h-7 w-7 text-destructive shrink-0"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {expanded && (
        <div className="border-t p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Nome do Comando</Label>
              <Input
                value={command.name}
                onChange={(e) => update({ name: e.target.value })}
                placeholder="Ex: boas-vindas"
                className="h-8 text-xs"
              />
            </div>
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
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Triggers (palavras/frases que ativam o comando)</Label>
            <div className="space-y-1">
              {command.trigger.map((t, i) => (
                <div key={i} className="flex items-center gap-1">
                  <Input
                    value={t}
                    onChange={(e) => updateTrigger(i, e.target.value)}
                    placeholder={`Trigger #${i + 1}`}
                    className="h-8 text-xs flex-1 font-mono"
                  />
                  {command.trigger.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeTrigger(i)} className="h-8 w-8">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={addTriggerInput} className="h-7 text-xs gap-1">
              <Plus className="h-3 w-3" /> Adicionar Trigger
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Cooldown (segundos)</Label>
              <Input
                type="number"
                min={0}
                value={command.cooldown}
                onChange={(e) => update({ cooldown: parseInt(e.target.value) || 0 })}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Modo de Execução</Label>
              <select
                value={command.executionMode}
                onChange={(e) => update({ executionMode: e.target.value as ExecutionMode })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="sequential">Sequencial (um após o outro)</option>
                <option value="parallel">Paralelo (todos de uma vez)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Cargos Permitidos (IDs)</Label>
              <Input
                value={command.allowedRoles.join(', ')}
                onChange={(e) => update({ allowedRoles: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                placeholder="role_id_1, role_id_2"
                className="h-8 text-xs"
              />
              <p className="text-[10px] text-muted-foreground">Separados por vírgula. Vazio = todos.</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Canais Permitidos (IDs)</Label>
              <Input
                value={command.allowedChannels.join(', ')}
                onChange={(e) => update({ allowedChannels: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                placeholder="channel_id_1, channel_id_2"
                className="h-8 text-xs"
              />
              <p className="text-[10px] text-muted-foreground">Separados por vírgula. Vazio = todos.</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Ações ({command.actions.length})</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddAction(!showAddAction)}
                className="h-7 text-xs gap-1"
              >
                <Plus className="h-3 w-3" /> Adicionar Ação
              </Button>
            </div>

            {showAddAction && (
              <div className="rounded-lg border p-3 bg-muted/30">
                <AddActionDropdown onAdd={addAction} />
              </div>
            )}

            {command.actions.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">Nenhuma ação. Adicione ao menos uma ação para o comando fazer algo.</p>
            ) : (
              <div className="space-y-2">
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
          </div>
        </div>
      )}
    </div>
  );
}
