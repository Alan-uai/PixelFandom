'use client';

import { useState, useRef, useCallback } from 'react';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';
import { FloatingLabelTextarea } from '@/components/ui/floating-label-textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Trash2, GripVertical, ChevronUp, ChevronDown, Code2 } from 'lucide-react';
import { EmbedBuilder } from './embed-builder';
import type { BotAction, BotActionType } from './types';
import { ACTION_LABELS, ACTION_TYPE_CATEGORIES } from './types';
import { Select3D } from '@/components/ui/select3d';
import { VariablePicker } from './variable-picker';

function insertAtCursor(textarea: HTMLTextAreaElement | null, text: string): string {
  if (!textarea) return text;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const before = textarea.value.substring(0, start);
  const after = textarea.value.substring(end);
  const newValue = before + text + after;
  requestAnimationFrame(() => {
    textarea.selectionStart = textarea.selectionEnd = start + text.length;
    textarea.focus();
  });
  return newValue;
}

function MessagePayloadForm({ payload, onChange }: { payload: Record<string, any>; onChange: (p: Record<string, any>) => void }) {
  const [showVars, setShowVars] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const handleInsertVariable = useCallback((syntax: string) => {
    const newContent = insertAtCursor(contentRef.current, syntax);
    if (newContent) onChange({ ...payload, content: newContent });
    else onChange({ ...payload, content: (payload.content ?? '') + syntax });
  }, [payload, onChange]);

  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-muted-foreground">Conteúdo da Mensagem</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowVars(!showVars)}
            className="h-6 text-[10px] gap-1"
          >
            <Code2 className="h-3 w-3" />
            {'{ }'}
          </Button>
        </div>
        <FloatingLabelTextarea
          ref={contentRef}
          label="Texto da mensagem (markdown suportado)"
          value={payload.content ?? ''}
          onChange={(e) => onChange({ ...payload, content: e.target.value })}
          className="text-xs min-h-[80px]"
        />
        {showVars && (
          <VariablePicker onInsert={handleInsertVariable} onClose={() => setShowVars(false)} />
        )}
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
    <div>
      <FloatingLabelInput
        label="Emoji"
        value={payload.emoji ?? ''}
        onChange={(e) => onChange({ ...payload, emoji: e.target.value })}
        className="text-xs"
      />
      <p className="text-[10px] text-muted-foreground mt-1">Use o emoji diretamente, ID do emoji customizado, ou URL.</p>
    </div>
  );
}

function DeleteMessagePayloadForm({ payload, onChange }: { payload: Record<string, any>; onChange: (p: Record<string, any>) => void }) {
  return (
    <div>
      <FloatingLabelInput
        label="ID da Mensagem"
        value={payload.messageId ?? ''}
        onChange={(e) => onChange({ ...payload, messageId: e.target.value })}
        className="text-xs"
      />
      <p className="text-[10px] text-muted-foreground mt-1">Deixe vazio para usar a mensagem do comando.</p>
    </div>
  );
}

function CreateChannelPayloadForm({ payload, onChange }: { payload: Record<string, any>; onChange: (p: Record<string, any>) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <FloatingLabelInput
        label="Nome do Canal"
        value={payload.name ?? ''}
        onChange={(e) => onChange({ ...payload, name: e.target.value })}
        className="text-xs"
      />
      <div className="space-y-1">
        <Select3D label="Tipo" value={payload.type ?? 'text'} options={[
          {value: 'text', label: 'Texto'},
          {value: 'voice', label: 'Voz'},
          {value: 'forum', label: 'Fórum'},
          {value: 'announcement', label: 'Anúncios'},
        ]} onChange={(v) => onChange({ ...payload, type: v })} />
      </div>
      <div className="col-span-2">
        <FloatingLabelInput
          label="Categoria (ID)"
          value={payload.parentId ?? ''}
          onChange={(e) => onChange({ ...payload, parentId: e.target.value })}
          className="text-xs"
        />
      </div>
    </div>
  );
}

function EditChannelPayloadForm({ payload, onChange }: { payload: Record<string, any>; onChange: (p: Record<string, any>) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2">
        <FloatingLabelInput
          label="ID do Canal"
          value={payload.channelId ?? ''}
          onChange={(e) => onChange({ ...payload, channelId: e.target.value })}
          className="text-xs"
        />
      </div>
      <FloatingLabelInput
        label="Novo Nome"
        value={payload.name ?? ''}
        onChange={(e) => onChange({ ...payload, name: e.target.value })}
        className="text-xs"
      />
      <FloatingLabelInput
        label="Tópico"
        value={payload.topic ?? ''}
        onChange={(e) => onChange({ ...payload, topic: e.target.value })}
        className="text-xs"
      />
    </div>
  );
}

function KickMemberPayloadForm({ payload, onChange }: { payload: Record<string, any>; onChange: (p: Record<string, any>) => void }) {
  return (
    <FloatingLabelInput
      label="Motivo (opcional)"
      value={payload.reason ?? ''}
      onChange={(e) => onChange({ ...payload, reason: e.target.value })}
      className="text-xs"
    />
  );
}

function BanMemberPayloadForm({ payload, onChange }: { payload: Record<string, any>; onChange: (p: Record<string, any>) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <FloatingLabelInput
        label="Motivo (opcional)"
        value={payload.reason ?? ''}
        onChange={(e) => onChange({ ...payload, reason: e.target.value })}
        className="text-xs"
      />
      <FloatingLabelInput
        label="Apagar mensagens (dias)"
        type="number"
        min={0}
        max={7}
        value={payload.deleteMessageDays ?? 0}
        onChange={(e) => onChange({ ...payload, deleteMessageDays: parseInt(e.target.value) || 0 })}
        className="text-xs"
      />
    </div>
  );
}

function TimeoutMemberPayloadForm({ payload, onChange }: { payload: Record<string, any>; onChange: (p: Record<string, any>) => void }) {
  return (
    <div>
      <FloatingLabelInput
        label="Duração (segundos)"
        type="number"
        min={0}
        value={payload.duration ?? 60}
        onChange={(e) => onChange({ ...payload, duration: parseInt(e.target.value) || 60 })}
        className="text-xs"
      />
      <p className="text-[10px] text-muted-foreground mt-1">Máximo de 28 dias (2419200s).</p>
    </div>
  );
}

function MoveMemberPayloadForm({ payload, onChange }: { payload: Record<string, any>; onChange: (p: Record<string, any>) => void }) {
  return (
    <FloatingLabelInput
      label="ID do Canal de Voz"
      value={payload.channelId ?? ''}
      onChange={(e) => onChange({ ...payload, channelId: e.target.value })}
      className="text-xs"
    />
  );
}

function SingleRolePayloadForm({ payload, onChange, label }: { payload: Record<string, any>; onChange: (p: Record<string, any>) => void; label: string }) {
  return (
    <FloatingLabelInput
      label={label}
      value={payload.roleId ?? ''}
      onChange={(e) => onChange({ ...payload, roleId: e.target.value })}
      className="text-xs"
    />
  );
}

function CreateRolePayloadForm({ payload, onChange }: { payload: Record<string, any>; onChange: (p: Record<string, any>) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <FloatingLabelInput
        label="Nome"
        value={payload.name ?? ''}
        onChange={(e) => onChange({ ...payload, name: e.target.value })}
        className="text-xs"
      />
      <div>
        <p className="text-xs text-muted-foreground mb-1">Cor</p>
        <div className="flex gap-1">
          <input
            type="color"
            value={payload.color ?? '#000000'}
            onChange={(e) => onChange({ ...payload, color: e.target.value })}
            className="mt-2 h-8 w-8 shrink-0 cursor-pointer rounded border bg-transparent"
          />
          <FloatingLabelInput
            label="Cor (hex)"
            value={payload.color ?? ''}
            onChange={(e) => onChange({ ...payload, color: e.target.value })}
            className="text-xs flex-1"
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
  const [showVars, setShowVars] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const handleInsertVariable = useCallback((syntax: string) => {
    const newContent = insertAtCursor(contentRef.current, syntax);
    if (newContent) onChange({ ...payload, content: newContent });
    else onChange({ ...payload, content: (payload.content ?? '') + syntax });
  }, [payload, onChange]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <FloatingLabelInput
          label="ID do Webhook"
          value={payload.webhookId ?? ''}
          onChange={(e) => onChange({ ...payload, webhookId: e.target.value })}
          className="text-xs"
        />
        <FloatingLabelInput
          label="Token do Webhook"
          value={payload.webhookToken ?? ''}
          onChange={(e) => onChange({ ...payload, webhookToken: e.target.value })}
          className="text-xs font-mono"
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-muted-foreground">Conteúdo</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowVars(!showVars)}
            className="h-6 text-[10px] gap-1"
          >
            <Code2 className="h-3 w-3" />
            {'{ }'}
          </Button>
        </div>
        <FloatingLabelTextarea
          ref={contentRef}
          label="Conteúdo da mensagem via webhook..."
          value={payload.content ?? ''}
          onChange={(e) => onChange({ ...payload, content: e.target.value })}
          className="text-xs min-h-[60px]"
        />
        {showVars && (
          <VariablePicker onInsert={handleInsertVariable} onClose={() => setShowVars(false)} />
        )}
      </div>
    </div>
  );
}

function CreateInvitePayloadForm({ payload, onChange }: { payload: Record<string, any>; onChange: (p: Record<string, any>) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2">
        <FloatingLabelInput
          label="ID do Canal"
          value={payload.channelId ?? ''}
          onChange={(e) => onChange({ ...payload, channelId: e.target.value })}
          className="text-xs"
        />
      </div>
      <div>
        <FloatingLabelInput
          label="Expira em (segundos)"
          type="number"
          min={0}
          value={payload.maxAge ?? 86400}
          onChange={(e) => onChange({ ...payload, maxAge: parseInt(e.target.value) || 0 })}
          className="text-xs"
        />
        <p className="text-[10px] text-muted-foreground mt-1">0 = nunca expira</p>
      </div>
      <div>
        <FloatingLabelInput
          label="Máx de usos"
          type="number"
          min={0}
          value={payload.maxUses ?? 0}
          onChange={(e) => onChange({ ...payload, maxUses: parseInt(e.target.value) || 0 })}
          className="text-xs"
        />
        <p className="text-[10px] text-muted-foreground mt-1">0 = ilimitado</p>
      </div>
    </div>
  );
}

function SetBotStatusPayloadForm({ payload, onChange }: { payload: Record<string, any>; onChange: (p: Record<string, any>) => void }) {
  return (
    <div className="space-y-1">
      <Select3D label="Status" value={payload.status ?? 'online'} options={[
        {value: 'online', label: 'Online'},
        {value: 'idle', label: 'Ausente'},
        {value: 'dnd', label: 'Não Perturbe'},
        {value: 'invisible', label: 'Invisível'},
      ]} onChange={(v) => onChange({ ...payload, status: v })} />
    </div>
  );
}

function CreateThreadPayloadForm({ payload, onChange }: { payload: Record<string, any>; onChange: (p: Record<string, any>) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2">
        <FloatingLabelInput
          label="Nome da Thread"
          value={payload.name ?? ''}
          onChange={(e) => onChange({ ...payload, name: e.target.value })}
          className="text-xs"
        />
      </div>
      <FloatingLabelInput
        label="ID do Canal"
        value={payload.channelId ?? ''}
        onChange={(e) => onChange({ ...payload, channelId: e.target.value })}
        className="text-xs"
      />
      <div className="space-y-1">
        <Select3D label="Tipo" value={payload.type ?? 'public_thread'} options={[
          {value: 'public_thread', label: 'Thread Pública'},
          {value: 'private_thread', label: 'Thread Privada'},
        ]} onChange={(v) => onChange({ ...payload, type: v })} />
      </div>
    </div>
  );
}

function ChannelIdPayloadForm({ payload, onChange, label }: { payload: Record<string, any>; onChange: (p: Record<string, any>) => void; label: string }) {
  return (
    <FloatingLabelInput
      label={label}
      value={payload.channelId ?? ''}
      onChange={(e) => onChange({ ...payload, channelId: e.target.value })}
      className="text-xs"
    />
  );
}

function ThreadMemberPayloadForm({ payload, onChange }: { payload: Record<string, any>; onChange: (p: Record<string, any>) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <FloatingLabelInput
        label="ID do Canal (Thread)"
        value={payload.channelId ?? ''}
        onChange={(e) => onChange({ ...payload, channelId: e.target.value })}
        className="text-xs"
      />
      <FloatingLabelInput
        label="ID do Usuário"
        value={payload.userId ?? ''}
        onChange={(e) => onChange({ ...payload, userId: e.target.value })}
        className="text-xs"
      />
    </div>
  );
}

function CreateEmojiPayloadForm({ payload, onChange }: { payload: Record<string, any>; onChange: (p: Record<string, any>) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <FloatingLabelInput
        label="Nome"
        value={payload.name ?? ''}
        onChange={(e) => onChange({ ...payload, name: e.target.value })}
        className="text-xs"
      />
      <FloatingLabelInput
        label="URL da Imagem"
        value={payload.imageUrl ?? ''}
        onChange={(e) => onChange({ ...payload, imageUrl: e.target.value })}
        className="text-xs"
      />
    </div>
  );
}

function CreateStickerPayloadForm({ payload, onChange }: { payload: Record<string, any>; onChange: (p: Record<string, any>) => void }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <FloatingLabelInput
          label="Nome"
          value={payload.name ?? ''}
          onChange={(e) => onChange({ ...payload, name: e.target.value })}
          className="text-xs"
        />
        <FloatingLabelInput
          label="Tags"
          value={payload.tags ?? ''}
          onChange={(e) => onChange({ ...payload, tags: e.target.value })}
          className="text-xs"
        />
      </div>
      <FloatingLabelInput
        label="Descrição"
        value={payload.description ?? ''}
        onChange={(e) => onChange({ ...payload, description: e.target.value })}
        className="text-xs"
      />
      <FloatingLabelInput
        label="URL da Imagem"
        value={payload.imageUrl ?? ''}
        onChange={(e) => onChange({ ...payload, imageUrl: e.target.value })}
        className="text-xs"
      />
    </div>
  );
}

function CreateEventPayloadForm({ payload, onChange }: { payload: Record<string, any>; onChange: (p: Record<string, any>) => void }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <FloatingLabelInput
          label="Nome do Evento"
          value={payload.name ?? ''}
          onChange={(e) => onChange({ ...payload, name: e.target.value })}
          className="text-xs"
        />
        <FloatingLabelInput
          label="ID do Canal"
          value={payload.channelId ?? ''}
          onChange={(e) => onChange({ ...payload, channelId: e.target.value })}
          className="text-xs"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FloatingLabelInput
          label="Início (ISO)"
          value={payload.scheduledStart ?? ''}
          onChange={(e) => onChange({ ...payload, scheduledStart: e.target.value })}
          className="text-xs font-mono"
        />
        <FloatingLabelInput
          label="Fim (ISO)"
          value={payload.scheduledEnd ?? ''}
          onChange={(e) => onChange({ ...payload, scheduledEnd: e.target.value })}
          className="text-xs font-mono"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Select3D label="Tipo" value={payload.entityType ?? 'voice'} options={[
            {value: 'voice', label: 'Voz'},
            {value: 'stage', label: 'Stage'},
            {value: 'external', label: 'Externo'},
          ]} onChange={(v) => onChange({ ...payload, entityType: v })} />
        </div>
        <div className="space-y-1">
          <Select3D label="Privacidade" value={payload.privacyLevel ?? 'guild_only'} options={[
            {value: 'guild_only', label: 'Apenas servidor'},
          ]} onChange={(v) => onChange({ ...payload, privacyLevel: v })} />
        </div>
      </div>
      <FloatingLabelTextarea
        label="Descrição"
        value={payload.description ?? ''}
        onChange={(e) => onChange({ ...payload, description: e.target.value })}
        className="text-xs min-h-[60px]"
      />
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
        <FloatingLabelInput
          label="ID do Canal"
          value={action.payload.channelId ?? ''}
          onChange={(e) => updatePayload({ ...action.payload, channelId: e.target.value })}
          className="text-xs"
        />
      );

    case 'kick_member':
      return <KickMemberPayloadForm payload={action.payload} onChange={updatePayload} />;

    case 'ban_member':
      return <BanMemberPayloadForm payload={action.payload} onChange={updatePayload} />;

    case 'unban_member':
      return (
        <FloatingLabelInput
          label="ID do Usuário"
          value={action.payload.userId ?? ''}
          onChange={(e) => updatePayload({ ...action.payload, userId: e.target.value })}
          className="text-xs"
        />
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
        <FloatingLabelInput
          label="ID do Cargo"
          value={action.payload.roleId ?? ''}
          onChange={(e) => updatePayload({ ...action.payload, roleId: e.target.value })}
          className="text-xs"
        />
      );

    case 'edit_role':
      return (
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <FloatingLabelInput
              label="ID do Cargo"
              value={action.payload.roleId ?? ''}
              onChange={(e) => updatePayload({ ...action.payload, roleId: e.target.value })}
              className="text-xs"
            />
          </div>
          <FloatingLabelInput
            label="Novo Nome"
            value={action.payload.name ?? ''}
            onChange={(e) => updatePayload({ ...action.payload, name: e.target.value })}
            className="text-xs"
          />
          <div>
            <p className="text-xs text-muted-foreground mb-1">Nova Cor</p>
            <div className="flex gap-1">
              <input
                type="color"
                value={action.payload.color ?? '#000000'}
                onChange={(e) => updatePayload({ ...action.payload, color: e.target.value })}
                className="mt-2 h-8 w-8 shrink-0 cursor-pointer rounded border bg-transparent"
              />
              <FloatingLabelInput
                label="Cor (hex)"
                value={action.payload.color ?? ''}
                onChange={(e) => updatePayload({ ...action.payload, color: e.target.value })}
                className="text-xs flex-1"
              />
            </div>
          </div>
        </div>
      );

    case 'create_webhook':
      return (
        <div className="grid grid-cols-2 gap-3">
          <FloatingLabelInput
            label="Nome do Webhook"
            value={action.payload.name ?? ''}
            onChange={(e) => updatePayload({ ...action.payload, name: e.target.value })}
            className="text-xs"
          />
          <FloatingLabelInput
            label="ID do Canal"
            value={action.payload.channelId ?? ''}
            onChange={(e) => updatePayload({ ...action.payload, channelId: e.target.value })}
            className="text-xs"
          />
        </div>
      );

    case 'execute_webhook':
      return <ExecuteWebhookPayloadForm payload={action.payload} onChange={updatePayload} />;

    case 'delete_webhook':
      return (
        <div className="grid grid-cols-2 gap-3">
          <FloatingLabelInput
            label="ID do Webhook"
            value={action.payload.webhookId ?? ''}
            onChange={(e) => updatePayload({ ...action.payload, webhookId: e.target.value })}
            className="text-xs"
          />
          <FloatingLabelInput
            label="Token (opcional)"
            value={action.payload.webhookToken ?? ''}
            onChange={(e) => updatePayload({ ...action.payload, webhookToken: e.target.value })}
            className="text-xs font-mono"
          />
        </div>
      );

    case 'crosspost_message':
      return (
        <FloatingLabelInput
          label="ID da Mensagem"
          value={action.payload.messageId ?? ''}
          onChange={(e) => updatePayload({ ...action.payload, messageId: e.target.value })}
          className="text-xs"
        />
      );

    case 'pin_message':
      return (
        <FloatingLabelInput
          label="ID da Mensagem"
          value={action.payload.messageId ?? ''}
          onChange={(e) => updatePayload({ ...action.payload, messageId: e.target.value })}
          className="text-xs"
        />
      );

    case 'clear_reactions':
      return (
        <div>
          <FloatingLabelInput
            label="Emoji (opcional)"
            value={action.payload.emoji ?? ''}
            onChange={(e) => updatePayload({ ...action.payload, emoji: e.target.value })}
            className="text-xs"
          />
          <p className="text-[10px] text-muted-foreground mt-1">Se especificado, remove apenas reações deste emoji.</p>
        </div>
      );

    case 'create_invite':
      return <CreateInvitePayloadForm payload={action.payload} onChange={updatePayload} />;

    case 'set_bot_status':
      return <SetBotStatusPayloadForm payload={action.payload} onChange={updatePayload} />;

    case 'mute_member':
      return (
        <div className="grid grid-cols-2 gap-3">
          <FloatingLabelInput
            label="ID do Usuário"
            value={action.payload.userId ?? ''}
            onChange={(e) => updatePayload({ ...action.payload, userId: e.target.value })}
            className="text-xs"
          />
          <div className="space-y-1">
            <Select3D label="Mutado" value={action.payload.mute ? 'true' : 'false'} options={[
              {value: 'true', label: 'Sim'},
              {value: 'false', label: 'Não'},
            ]} onChange={(v) => updatePayload({ ...action.payload, mute: v === 'true' })} />
          </div>
        </div>
      );

    case 'deafen_member':
      return (
        <div className="grid grid-cols-2 gap-3">
          <FloatingLabelInput
            label="ID do Usuário"
            value={action.payload.userId ?? ''}
            onChange={(e) => updatePayload({ ...action.payload, userId: e.target.value })}
            className="text-xs"
          />
          <div className="space-y-1">
            <Select3D label="Ensurdecer" value={action.payload.deafen ? 'true' : 'false'} options={[
              {value: 'true', label: 'Sim'},
              {value: 'false', label: 'Não'},
            ]} onChange={(v) => updatePayload({ ...action.payload, deafen: v === 'true' })} />
          </div>
        </div>
      );

    case 'disconnect_member':
      return (
        <FloatingLabelInput
          label="ID do Usuário"
          value={action.payload.userId ?? ''}
          onChange={(e) => updatePayload({ ...action.payload, userId: e.target.value })}
          className="text-xs"
        />
      );

    case 'create_thread':
      return <CreateThreadPayloadForm payload={action.payload} onChange={updatePayload} />;

    case 'delete_thread':
    case 'archive_thread':
    case 'unarchive_thread':
    case 'lock_thread':
    case 'unlock_thread':
      return <ChannelIdPayloadForm payload={action.payload} onChange={updatePayload} label={ACTION_LABELS[action.type]} />;

    case 'add_thread_member':
    case 'remove_thread_member':
      return <ThreadMemberPayloadForm payload={action.payload} onChange={updatePayload} />;

    case 'create_emoji':
      return <CreateEmojiPayloadForm payload={action.payload} onChange={updatePayload} />;

    case 'delete_emoji':
      return (
        <FloatingLabelInput
          label="ID do Emoji"
          value={action.payload.emojiId ?? ''}
          onChange={(e) => updatePayload({ ...action.payload, emojiId: e.target.value })}
          className="text-xs"
        />
      );

    case 'create_sticker':
      return <CreateStickerPayloadForm payload={action.payload} onChange={updatePayload} />;

    case 'delete_sticker':
      return (
        <FloatingLabelInput
          label="ID do Sticker"
          value={action.payload.stickerId ?? ''}
          onChange={(e) => updatePayload({ ...action.payload, stickerId: e.target.value })}
          className="text-xs"
        />
      );

    case 'create_event':
      return <CreateEventPayloadForm payload={action.payload} onChange={updatePayload} />;

    case 'edit_event':
      return (
        <div className="grid grid-cols-2 gap-3">
          <FloatingLabelInput
            label="ID do Evento"
            value={action.payload.eventId ?? ''}
            onChange={(e) => updatePayload({ ...action.payload, eventId: e.target.value })}
            className="text-xs"
          />
          <div className="col-span-2">
            <FloatingLabelInput
              label="Novo Nome"
              value={action.payload.name ?? ''}
              onChange={(e) => updatePayload({ ...action.payload, name: e.target.value })}
              className="text-xs"
            />
          </div>
          <FloatingLabelInput
            label="Início (ISO)"
            value={action.payload.scheduledStart ?? ''}
            onChange={(e) => updatePayload({ ...action.payload, scheduledStart: e.target.value })}
            className="text-xs font-mono"
          />
          <FloatingLabelInput
            label="Fim (ISO)"
            value={action.payload.scheduledEnd ?? ''}
            onChange={(e) => updatePayload({ ...action.payload, scheduledEnd: e.target.value })}
            className="text-xs font-mono"
          />
        </div>
      );

    case 'delete_event':
      return (
        <FloatingLabelInput
          label="ID do Evento"
          value={action.payload.eventId ?? ''}
          onChange={(e) => updatePayload({ ...action.payload, eventId: e.target.value })}
          className="text-xs"
        />
      );

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

      <FloatingLabelInput
        label="Delay (ms)"
        type="number"
        min={0}
        value={action.delay ?? 0}
        onChange={(e) => onChange({ ...action, delay: parseInt(e.target.value) || 0 })}
        className="text-xs w-32"
      />
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
