'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Trash2, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { EmbedBuilder } from './embed-builder';
import type { BotAction, BotActionType } from './types';
import { ACTION_LABELS, ACTION_TYPE_CATEGORIES } from './types';

function MessagePayloadForm({ payload, onChange }: { payload: Record<string, any>; onChange: (p: Record<string, any>) => void }) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">Conteúdo da Mensagem</Label>
        <textarea
          value={payload.content ?? ''}
          onChange={(e) => onChange({ ...payload, content: e.target.value })}
          rows={3}
          className="w-full rounded-lg border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder="Texto da mensagem (markdown suportado)..."
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Embeds</Label>
        <EmbedBuilder
          value={payload.embeds ?? []}
          onChange={(embeds) => onChange({ ...payload, embeds })}
        />
      </div>
    </div>
  );
}

function ReactionPayloadForm({ payload, onChange }: { payload: Record<string, any>; onChange: (p: Record<string, any>) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">Emoji</Label>
      <Input
        value={payload.emoji ?? ''}
        onChange={(e) => onChange({ ...payload, emoji: e.target.value })}
        placeholder="🔥 ou :fire: ou https://cdn.discord.com/emojis/..."
        className="h-8 text-xs"
      />
      <p className="text-[10px] text-muted-foreground">Use o emoji diretamente, ID do emoji customizado, ou URL.</p>
    </div>
  );
}

function DeleteMessagePayloadForm({ payload, onChange }: { payload: Record<string, any>; onChange: (p: Record<string, any>) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">ID da Mensagem</Label>
      <Input
        value={payload.messageId ?? ''}
        onChange={(e) => onChange({ ...payload, messageId: e.target.value })}
        placeholder="ID da mensagem a ser excluída"
        className="h-8 text-xs"
      />
      <p className="text-[10px] text-muted-foreground">Deixe vazio para usar a mensagem do comando.</p>
    </div>
  );
}

function CreateChannelPayloadForm({ payload, onChange }: { payload: Record<string, any>; onChange: (p: Record<string, any>) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <Label className="text-xs">Nome do Canal</Label>
        <Input
          value={payload.name ?? ''}
          onChange={(e) => onChange({ ...payload, name: e.target.value })}
          placeholder="nome-do-canal"
          className="h-8 text-xs"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Tipo</Label>
        <select
          value={payload.type ?? 'text'}
          onChange={(e) => onChange({ ...payload, type: e.target.value })}
          className="w-full rounded-lg border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="text">Texto</option>
          <option value="voice">Voz</option>
          <option value="forum">Fórum</option>
          <option value="announcement">Anúncios</option>
        </select>
      </div>
      <div className="space-y-1 col-span-2">
        <Label className="text-xs">Categoria (ID)</Label>
        <Input
          value={payload.parentId ?? ''}
          onChange={(e) => onChange({ ...payload, parentId: e.target.value })}
          placeholder="ID da categoria (opcional)"
          className="h-8 text-xs"
        />
      </div>
    </div>
  );
}

function EditChannelPayloadForm({ payload, onChange }: { payload: Record<string, any>; onChange: (p: Record<string, any>) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1 col-span-2">
        <Label className="text-xs">ID do Canal</Label>
        <Input
          value={payload.channelId ?? ''}
          onChange={(e) => onChange({ ...payload, channelId: e.target.value })}
          placeholder="ID do canal a ser editado"
          className="h-8 text-xs"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Novo Nome</Label>
        <Input
          value={payload.name ?? ''}
          onChange={(e) => onChange({ ...payload, name: e.target.value })}
          placeholder="novo-nome"
          className="h-8 text-xs"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Tópico</Label>
        <Input
          value={payload.topic ?? ''}
          onChange={(e) => onChange({ ...payload, topic: e.target.value })}
          placeholder="Tópico do canal"
          className="h-8 text-xs"
        />
      </div>
    </div>
  );
}

function KickMemberPayloadForm({ payload, onChange }: { payload: Record<string, any>; onChange: (p: Record<string, any>) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">Motivo (opcional)</Label>
      <Input
        value={payload.reason ?? ''}
        onChange={(e) => onChange({ ...payload, reason: e.target.value })}
        placeholder="Motivo da expulsão"
        className="h-8 text-xs"
      />
    </div>
  );
}

function BanMemberPayloadForm({ payload, onChange }: { payload: Record<string, any>; onChange: (p: Record<string, any>) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <Label className="text-xs">Motivo (opcional)</Label>
        <Input
          value={payload.reason ?? ''}
          onChange={(e) => onChange({ ...payload, reason: e.target.value })}
          placeholder="Motivo do ban"
          className="h-8 text-xs"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Apagar mensagens (dias)</Label>
        <Input
          type="number"
          min={0}
          max={7}
          value={payload.deleteMessageDays ?? 0}
          onChange={(e) => onChange({ ...payload, deleteMessageDays: parseInt(e.target.value) || 0 })}
          className="h-8 text-xs"
        />
      </div>
    </div>
  );
}

function TimeoutMemberPayloadForm({ payload, onChange }: { payload: Record<string, any>; onChange: (p: Record<string, any>) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">Duração (segundos)</Label>
      <Input
        type="number"
        min={0}
        value={payload.duration ?? 60}
        onChange={(e) => onChange({ ...payload, duration: parseInt(e.target.value) || 60 })}
        className="h-8 text-xs"
      />
      <p className="text-[10px] text-muted-foreground">Máximo de 28 dias (2419200s).</p>
    </div>
  );
}

function MoveMemberPayloadForm({ payload, onChange }: { payload: Record<string, any>; onChange: (p: Record<string, any>) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">ID do Canal de Voz</Label>
      <Input
        value={payload.channelId ?? ''}
        onChange={(e) => onChange({ ...payload, channelId: e.target.value })}
        placeholder="ID do canal de voz"
        className="h-8 text-xs"
      />
    </div>
  );
}

function SingleRolePayloadForm({ payload, onChange, label }: { payload: Record<string, any>; onChange: (p: Record<string, any>) => void; label: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input
        value={payload.roleId ?? ''}
        onChange={(e) => onChange({ ...payload, roleId: e.target.value })}
        placeholder="ID do cargo"
        className="h-8 text-xs"
      />
    </div>
  );
}

function CreateRolePayloadForm({ payload, onChange }: { payload: Record<string, any>; onChange: (p: Record<string, any>) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <Label className="text-xs">Nome</Label>
        <Input
          value={payload.name ?? ''}
          onChange={(e) => onChange({ ...payload, name: e.target.value })}
          placeholder="Nome do cargo"
          className="h-8 text-xs"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Cor</Label>
        <div className="flex gap-1">
          <input
            type="color"
            value={payload.color ?? '#000000'}
            onChange={(e) => onChange({ ...payload, color: e.target.value })}
            className="h-8 w-8 cursor-pointer rounded border bg-transparent"
          />
          <Input
            value={payload.color ?? ''}
            onChange={(e) => onChange({ ...payload, color: e.target.value })}
            className="h-8 text-xs flex-1"
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={payload.hoist ?? false}
          onChange={(e) => onChange({ ...payload, hoist: e.target.checked })}
          className="h-3 w-3"
        />
        Exibir separadamente
      </label>
      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          checked={payload.mentionable ?? false}
          onChange={(e) => onChange({ ...payload, mentionable: e.target.checked })}
          className="h-3 w-3"
        />
          Mencionável
      </label>
    </div>
  );
}

function ExecuteWebhookPayloadForm({ payload, onChange }: { payload: Record<string, any>; onChange: (p: Record<string, any>) => void }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">ID do Webhook</Label>
          <Input
            value={payload.webhookId ?? ''}
            onChange={(e) => onChange({ ...payload, webhookId: e.target.value })}
            placeholder="ID do webhook"
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Token do Webhook</Label>
          <Input
            value={payload.webhookToken ?? ''}
            onChange={(e) => onChange({ ...payload, webhookToken: e.target.value })}
            placeholder="Token do webhook"
            className="h-8 text-xs font-mono"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Conteúdo</Label>
        <textarea
          value={payload.content ?? ''}
          onChange={(e) => onChange({ ...payload, content: e.target.value })}
          rows={2}
          className="w-full rounded-lg border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder="Conteúdo da mensagem via webhook..."
        />
      </div>
    </div>
  );
}

function CreateInvitePayloadForm({ payload, onChange }: { payload: Record<string, any>; onChange: (p: Record<string, any>) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1 col-span-2">
        <Label className="text-xs">ID do Canal</Label>
        <Input
          value={payload.channelId ?? ''}
          onChange={(e) => onChange({ ...payload, channelId: e.target.value })}
          placeholder="ID do canal para o convite"
          className="h-8 text-xs"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Expira em (segundos)</Label>
        <Input
          type="number"
          min={0}
          value={payload.maxAge ?? 86400}
          onChange={(e) => onChange({ ...payload, maxAge: parseInt(e.target.value) || 0 })}
          className="h-8 text-xs"
        />
        <p className="text-[10px] text-muted-foreground">0 = nunca expira</p>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Máx de usos</Label>
        <Input
          type="number"
          min={0}
          value={payload.maxUses ?? 0}
          onChange={(e) => onChange({ ...payload, maxUses: parseInt(e.target.value) || 0 })}
          className="h-8 text-xs"
        />
        <p className="text-[10px] text-muted-foreground">0 = ilimitado</p>
      </div>
    </div>
  );
}

function SetBotStatusPayloadForm({ payload, onChange }: { payload: Record<string, any>; onChange: (p: Record<string, any>) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">Status</Label>
      <select
        value={payload.status ?? 'online'}
        onChange={(e) => onChange({ ...payload, status: e.target.value })}
        className="w-full rounded-lg border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
      >
        <option value="online">Online</option>
        <option value="idle">Ausente</option>
        <option value="dnd">Não Perturbe</option>
        <option value="invisible">Invisível</option>
      </select>
    </div>
  );
}

export function ActionConfigForm({ action, onChange }: { action: BotAction; onChange: (a: BotAction) => void }) {
  const updatePayload = (payload: Record<string, any>) => onChange({ ...action, payload });

  switch (action.type) {
    case 'send_message':
    case 'edit_message':
    case 'send_dm':
      return <MessagePayloadForm payload={action.payload} onChange={updatePayload} />;

    case 'add_reaction':
    case 'remove_reaction':
      return <ReactionPayloadForm payload={action.payload} onChange={updatePayload} />;

    case 'delete_message':
    case 'unpin_message':
      return <DeleteMessagePayloadForm payload={action.payload} onChange={updatePayload} />;

    case 'create_channel':
      return <CreateChannelPayloadForm payload={action.payload} onChange={updatePayload} />;

    case 'edit_channel':
      return <EditChannelPayloadForm payload={action.payload} onChange={updatePayload} />;

    case 'delete_channel':
      return (
        <div className="space-y-1">
          <Label className="text-xs">ID do Canal</Label>
          <Input
            value={action.payload.channelId ?? ''}
            onChange={(e) => updatePayload({ ...action.payload, channelId: e.target.value })}
            placeholder="ID do canal a ser excluído"
            className="h-8 text-xs"
          />
        </div>
      );

    case 'kick_member':
      return <KickMemberPayloadForm payload={action.payload} onChange={updatePayload} />;

    case 'ban_member':
      return <BanMemberPayloadForm payload={action.payload} onChange={updatePayload} />;

    case 'unban_member':
      return (
        <div className="space-y-1">
          <Label className="text-xs">ID do Usuário</Label>
          <Input
            value={action.payload.userId ?? ''}
            onChange={(e) => updatePayload({ ...action.payload, userId: e.target.value })}
            placeholder="ID do usuário para desbanir"
            className="h-8 text-xs"
          />
        </div>
      );

    case 'timeout_member':
      return <TimeoutMemberPayloadForm payload={action.payload} onChange={updatePayload} />;

    case 'move_member':
      return <MoveMemberPayloadForm payload={action.payload} onChange={updatePayload} />;

    case 'add_role':
      return <SingleRolePayloadForm payload={action.payload} onChange={updatePayload} label="ID do Cargo" />;

    case 'remove_role':
      return <SingleRolePayloadForm payload={action.payload} onChange={updatePayload} label="ID do Cargo" />;

    case 'create_role':
      return <CreateRolePayloadForm payload={action.payload} onChange={updatePayload} />;

    case 'delete_role':
      return (
        <div className="space-y-1">
          <Label className="text-xs">ID do Cargo</Label>
          <Input
            value={action.payload.roleId ?? ''}
            onChange={(e) => updatePayload({ ...action.payload, roleId: e.target.value })}
            placeholder="ID do cargo a ser excluído"
            className="h-8 text-xs"
          />
        </div>
      );

    case 'edit_role':
      return (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1 col-span-2">
            <Label className="text-xs">ID do Cargo</Label>
            <Input
              value={action.payload.roleId ?? ''}
              onChange={(e) => updatePayload({ ...action.payload, roleId: e.target.value })}
              placeholder="ID do cargo a ser editado"
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Novo Nome</Label>
            <Input
              value={action.payload.name ?? ''}
              onChange={(e) => updatePayload({ ...action.payload, name: e.target.value })}
              placeholder="Novo nome"
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Nova Cor</Label>
            <div className="flex gap-1">
              <input
                type="color"
                value={action.payload.color ?? '#000000'}
                onChange={(e) => updatePayload({ ...action.payload, color: e.target.value })}
                className="h-8 w-8 cursor-pointer rounded border bg-transparent"
              />
              <Input
                value={action.payload.color ?? ''}
                onChange={(e) => updatePayload({ ...action.payload, color: e.target.value })}
                className="h-8 text-xs flex-1"
              />
            </div>
          </div>
        </div>
      );

    case 'create_webhook':
      return (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Nome do Webhook</Label>
            <Input
              value={action.payload.name ?? ''}
              onChange={(e) => updatePayload({ ...action.payload, name: e.target.value })}
              placeholder="Nome do webhook"
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">ID do Canal</Label>
            <Input
              value={action.payload.channelId ?? ''}
              onChange={(e) => updatePayload({ ...action.payload, channelId: e.target.value })}
              placeholder="ID do canal"
              className="h-8 text-xs"
            />
          </div>
        </div>
      );

    case 'execute_webhook':
      return <ExecuteWebhookPayloadForm payload={action.payload} onChange={updatePayload} />;

    case 'delete_webhook':
      return (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">ID do Webhook</Label>
            <Input
              value={action.payload.webhookId ?? ''}
              onChange={(e) => updatePayload({ ...action.payload, webhookId: e.target.value })}
              placeholder="ID do webhook"
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Token (opcional)</Label>
            <Input
              value={action.payload.webhookToken ?? ''}
              onChange={(e) => updatePayload({ ...action.payload, webhookToken: e.target.value })}
              placeholder="Token do webhook"
              className="h-8 text-xs font-mono"
            />
          </div>
        </div>
      );

    case 'crosspost_message':
      return (
        <div className="space-y-1">
          <Label className="text-xs">ID da Mensagem</Label>
          <Input
            value={action.payload.messageId ?? ''}
            onChange={(e) => updatePayload({ ...action.payload, messageId: e.target.value })}
            placeholder="ID da mensagem para publicar"
            className="h-8 text-xs"
          />
        </div>
      );

    case 'pin_message':
      return (
        <div className="space-y-1">
          <Label className="text-xs">ID da Mensagem</Label>
          <Input
            value={action.payload.messageId ?? ''}
            onChange={(e) => updatePayload({ ...action.payload, messageId: e.target.value })}
            placeholder="ID da mensagem para fixar"
            className="h-8 text-xs"
          />
        </div>
      );

    case 'clear_reactions':
      return (
        <div className="space-y-1">
          <Label className="text-xs">Emoji (opcional)</Label>
          <Input
            value={action.payload.emoji ?? ''}
            onChange={(e) => updatePayload({ ...action.payload, emoji: e.target.value })}
            placeholder="Deixe vazio para limpar todas"
            className="h-8 text-xs"
          />
          <p className="text-[10px] text-muted-foreground">Se especificado, remove apenas reações deste emoji.</p>
        </div>
      );

    case 'create_invite':
      return <CreateInvitePayloadForm payload={action.payload} onChange={updatePayload} />;

    case 'set_bot_status':
      return <SetBotStatusPayloadForm payload={action.payload} onChange={updatePayload} />;

    default:
      return <p className="text-xs text-muted-foreground">Configuração não disponível para {action.type}.</p>;
  }
}

export function ActionListItem({ action, index, total, onChange, onRemove, onMoveUp, onMoveDown }: {
  action: BotAction;
  index: number;
  total: number;
  onChange: (a: BotAction) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div className="rounded-lg border p-3 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <GripVertical className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{ACTION_LABELS[action.type]}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <div className="flex flex-col">
            <button
              onClick={onMoveUp}
              disabled={index === 0}
              className="h-4 w-4 text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <button
              onClick={onMoveDown}
              disabled={index === total - 1}
              className="h-4 w-4 text-muted-foreground hover:text-foreground disabled:opacity-30"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
          <Button variant="ghost" size="icon" onClick={onRemove} className="h-7 w-7 text-destructive">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <ActionConfigForm action={action} onChange={onChange} />

      <div className="space-y-1">
        <Label className="text-xs">Delay (ms)</Label>
        <Input
          type="number"
          min={0}
          value={action.delay ?? 0}
          onChange={(e) => onChange({ ...action, delay: parseInt(e.target.value) || 0 })}
          className="h-8 text-xs w-32"
        />
      </div>
    </div>
  );
}

export function AddActionDropdown({ onAdd }: { onAdd: (type: BotActionType) => void }) {
  return (
    <div className="space-y-2">
      {Object.entries(ACTION_TYPE_CATEGORIES).map(([key, cat]) => (
        <div key={key}>
          <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">{cat.label}</p>
          <div className="flex flex-wrap gap-1">
            {cat.types.map((type) => (
              <button
                key={type}
                onClick={() => onAdd(type)}
                className="rounded-md border px-2 py-1 text-[11px] hover:bg-accent transition-colors"
              >
                {ACTION_LABELS[type]}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
