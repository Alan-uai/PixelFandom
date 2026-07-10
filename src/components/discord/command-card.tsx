'use client';

import { useState } from 'react';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';
import { FloatingLabelTextarea } from '@/components/ui/floating-label-textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, ChevronDown, ChevronRight, Code2 } from 'lucide-react';
import { Select3D } from '@/components/ui/select3d';
import { Checkbox3D } from '@/components/ui/checkbox-3d';
import { createDefaultAction, type CustomCommand, type BotActionType, type BotAction, type TriggerType, type ExecutionMode } from './types';
import { ActionListItem, AddActionDropdown } from './action-configs';
import { VariablePicker } from './variable-picker';

interface Props {
  command: CustomCommand;
  onChange: (cmd: CustomCommand) => void;
  onRemove: () => void;
}

export function CommandCard({ command, onChange, onRemove }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [showAddAction, setShowAddAction] = useState(false);
  const [showVariables, setShowVariables] = useState(false);

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
        <div className="flex items-center shrink-0" onClick={(e) => e.stopPropagation()}>
          <Checkbox3D
            checked={command.enabled}
            onChange={(v) => update({ enabled: v })}
            size="md"
          />
        </div>
        <div className="flex-1 min-w-0">
          {command.name ? (
            <p className="text-sm font-medium truncate">{command.name}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">Comando sem nome</p>
          )}
          {command.description && (
            <p className="text-[11px] text-muted-foreground truncate">{command.description}</p>
          )}
          <p className="text-[10px] text-muted-foreground truncate">
            {command.triggerType === 'mention' ? '@menção' : command.trigger.filter(Boolean).join(', ') || 'sem trigger'}
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
          <FloatingLabelInput
            label="Nome do Comando"
            value={command.name}
            onChange={(e) => update({ name: e.target.value })}
            className="text-xs"
          />

          <FloatingLabelTextarea
            label="Descrição (opcional)"
            value={command.description}
            onChange={(e) => update({ description: e.target.value })}
            className="text-xs min-h-[60px]"
          />

          <div className="space-y-1">
            <Select3D label="Tipo de Trigger" value={command.triggerType} options={[
              {value: 'exact', label: 'Exato'},
              {value: 'startsWith', label: 'Começa com'},
              {value: 'includes', label: 'Contém'},
              {value: 'regex', label: 'Regex'},
              {value: 'mention', label: '@Menção'},
            ]} onChange={(v) => update({ triggerType: v as TriggerType })} />
          </div>

          {command.triggerType === 'mention' ? (
            <div className="space-y-2">
              <p className="text-[10px] text-muted-foreground">
                Este comando ativa quando o bot é mencionado. Os triggers abaixo são opcionais — se preenchidos, o comando só responde quando a mensagem contiver o texto do trigger <strong>junto com</strong> a @menção.
              </p>
              <div className="space-y-1">
                {command.trigger.map((t, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <FloatingLabelInput
                      label={`Filtro #${i + 1} (opcional)`}
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
                <Plus className="h-3 w-3" /> Adicionar Filtro
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[10px] text-muted-foreground">Palavras/frases que ativam o comando.</p>
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
                <Plus className="h-3 w-3" /> Adicionar Trigger
              </Button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <FloatingLabelInput
              label="Cooldown (segundos)"
              type="number"
              min={0}
              value={command.cooldown}
              onChange={(e) => update({ cooldown: parseInt(e.target.value) || 0 })}
              className="text-xs"
            />
            <div className="space-y-1">
              <Select3D label="Modo de Execução" value={command.executionMode} options={[
                {value: 'sequential', label: 'Sequencial (um após o outro)'},
                {value: 'parallel', label: 'Paralelo (todos de uma vez)'},
              ]} onChange={(v) => update({ executionMode: v as ExecutionMode })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FloatingLabelInput
                label="Cargos Permitidos (IDs)"
                value={command.allowedRoles.join(', ')}
                onChange={(e) => update({ allowedRoles: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                className="text-xs"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Separados por vírgula. Vazio = todos.</p>
            </div>
            <div>
              <FloatingLabelInput
                label="Canais Permitidos (IDs)"
                value={command.allowedChannels.join(', ')}
                onChange={(e) => update({ allowedChannels: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                className="text-xs"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Separados por vírgula. Vazio = todos.</p>
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

          <div className="border-t pt-3">
            <button
              onClick={() => setShowVariables(!showVariables)}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Code2 className="h-3 w-3" />
              {showVariables ? 'Ocultar' : 'Ver'} variáveis disponíveis
              <ChevronRight className={`h-3 w-3 transition-transform ${showVariables ? 'rotate-90' : ''}`} />
            </button>
            {showVariables && (
              <div className="mt-2">
                <VariablePicker
                  mode="copy"
                  onClose={() => setShowVariables(false)}
                />
                <p className="text-[10px] text-muted-foreground mt-2">
                  Clique em uma variável para copiar. Use <code className="bg-muted px-1 rounded">{'{{var.name}}'}</code> nas mensagens e embeds.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
