'use client';

export type BotActionType =
  | 'send_message'
  | 'edit_message'
  | 'delete_message'
  | 'add_reaction'
  | 'remove_reaction'
  | 'clear_reactions'
  | 'crosspost_message'
  | 'pin_message'
  | 'unpin_message'
  | 'create_channel'
  | 'delete_channel'
  | 'edit_channel'
  | 'kick_member'
  | 'ban_member'
  | 'unban_member'
  | 'timeout_member'
  | 'move_member'
  | 'add_role'
  | 'remove_role'
  | 'create_role'
  | 'delete_role'
  | 'edit_role'
  | 'create_webhook'
  | 'execute_webhook'
  | 'delete_webhook'
  | 'send_dm'
  | 'create_invite'
  | 'set_bot_status';

export const ACTION_TYPE_CATEGORIES: Record<string, { label: string; types: BotActionType[] }> = {
  messages: {
    label: 'Mensagens',
    types: ['send_message', 'edit_message', 'delete_message', 'crosspost_message', 'pin_message', 'unpin_message'],
  },
  reactions: {
    label: 'Reações',
    types: ['add_reaction', 'remove_reaction', 'clear_reactions'],
  },
  channels: {
    label: 'Canais',
    types: ['create_channel', 'delete_channel', 'edit_channel'],
  },
  members: {
    label: 'Membros',
    types: ['kick_member', 'ban_member', 'unban_member', 'timeout_member', 'move_member', 'add_role', 'remove_role'],
  },
  roles: {
    label: 'Cargos',
    types: ['create_role', 'delete_role', 'edit_role'],
  },
  webhooks: {
    label: 'Webhooks',
    types: ['create_webhook', 'execute_webhook', 'delete_webhook'],
  },
  misc: {
    label: 'Outros',
    types: ['send_dm', 'create_invite', 'set_bot_status'],
  },
};

export const ACTION_LABELS: Record<BotActionType, string> = {
  send_message: 'Enviar Mensagem',
  edit_message: 'Editar Mensagem',
  delete_message: 'Excluir Mensagem',
  add_reaction: 'Adicionar Reação',
  remove_reaction: 'Remover Reação',
  clear_reactions: 'Limpar Reações',
  crosspost_message: 'Publicar em Anúncios',
  pin_message: 'Fixar Mensagem',
  unpin_message: 'Desafixar Mensagem',
  create_channel: 'Criar Canal',
  delete_channel: 'Excluir Canal',
  edit_channel: 'Editar Canal',
  kick_member: 'Expulsar Membro',
  ban_member: 'Banir Membro',
  unban_member: 'Desbanir Usuário',
  timeout_member: 'Silenciar Membro',
  move_member: 'Mover Membro',
  add_role: 'Atribuir Cargo',
  remove_role: 'Remover Cargo',
  create_role: 'Criar Cargo',
  delete_role: 'Excluir Cargo',
  edit_role: 'Editar Cargo',
  create_webhook: 'Criar Webhook',
  execute_webhook: 'Executar Webhook',
  delete_webhook: 'Excluir Webhook',
  send_dm: 'Enviar DM',
  create_invite: 'Criar Convite',
  set_bot_status: 'Alterar Status do Bot',
};

export const ACTION_ICONS: Record<BotActionType, string> = {
  send_message: 'MessageSquare',
  edit_message: 'MessageSquare',
  delete_message: 'Trash2',
  add_reaction: 'SmilePlus',
  remove_reaction: 'SmilePlus',
  clear_reactions: 'Eraser',
  crosspost_message: 'Megaphone',
  pin_message: 'Pin',
  unpin_message: 'PinOff',
  create_channel: 'Hash',
  delete_channel: 'Trash2',
  edit_channel: 'Settings2',
  kick_member: 'DoorOpen',
  ban_member: 'Ban',
  unban_member: 'Undo2',
  timeout_member: 'Clock',
  move_member: 'ArrowRight',
  add_role: 'ShieldPlus',
  remove_role: 'ShieldX',
  create_role: 'ShieldPlus',
  delete_role: 'ShieldX',
  edit_role: 'Shield',
  create_webhook: 'Webhook',
  execute_webhook: 'Webhook',
  delete_webhook: 'Trash2',
  send_dm: 'Mail',
  create_invite: 'Link',
  set_bot_status: 'Power',
};

export interface EmbedField {
  name: string;
  value: string;
  inline: boolean;
}

export interface EmbedPayload {
  title?: string;
  description?: string;
  color?: string;
  url?: string;
  timestamp?: boolean;
  footer?: { text: string; icon_url?: string };
  image?: { url: string };
  thumbnail?: { url: string };
  author?: { name: string; icon_url?: string; url?: string };
  fields?: EmbedField[];
}

export interface BotAction {
  id: string;
  type: BotActionType;
  payload: Record<string, any>;
  delay: number;
}

export type TriggerType = 'exact' | 'startsWith' | 'includes' | 'regex';

export type ExecutionMode = 'sequential' | 'parallel';

export interface CustomCommand {
  id: string;
  name: string;
  enabled: boolean;
  trigger: string[];
  triggerType: TriggerType;
  executionMode: ExecutionMode;
  cooldown: number;
  allowedRoles: string[];
  allowedChannels: string[];
  actions: BotAction[];
}

export interface DiscordConfig {
  bot_name?: string;
  bot_avatar?: string | null;
  prefix?: string;
  status?: 'online' | 'idle' | 'dnd' | 'invisible';
  welcome_message?: string;
  custom_commands?: CustomCommand[];
  enabled?: boolean;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function createDefaultAction(type: BotActionType = 'send_message'): BotAction {
  const base: BotAction = { id: generateId(), type, payload: {}, delay: 0 };
  switch (type) {
    case 'send_message':
    case 'edit_message':
    case 'send_dm':
      base.payload = { content: '' };
      break;
    case 'add_reaction':
    case 'remove_reaction':
      base.payload = { emoji: '' };
      break;
    case 'create_channel':
      base.payload = { name: '', type: 'text' };
      break;
    case 'delete_message':
      base.payload = { messageId: '' };
      break;
    case 'kick_member':
      base.payload = { reason: '' };
      break;
    case 'ban_member':
      base.payload = { reason: '', deleteMessageDays: 0 };
      break;
    case 'timeout_member':
      base.payload = { duration: 60 };
      break;
    case 'move_member':
      base.payload = { channelId: '' };
      break;
    case 'add_role':
    case 'remove_role':
      base.payload = { roleId: '' };
      break;
    case 'create_role':
      base.payload = { name: '', color: '#000000', hoist: false, mentionable: false };
      break;
    case 'delete_role':
      base.payload = { roleId: '' };
      break;
    case 'edit_role':
      base.payload = { roleId: '', name: '', color: '#000000' };
      break;
    case 'create_invite':
      base.payload = { channelId: '', maxAge: 86400, maxUses: 0 };
      break;
    case 'execute_webhook':
      base.payload = { webhookId: '', webhookToken: '', content: '' };
      break;
    case 'set_bot_status':
      base.payload = { status: 'online' };
      break;
    default:
      base.payload = {};
  }
  return base;
}

export function createDefaultCommand(): CustomCommand {
  return {
    id: generateId(),
    name: '',
    enabled: true,
    trigger: [],
    triggerType: 'exact',
    executionMode: 'sequential',
    cooldown: 0,
    allowedRoles: [],
    allowedChannels: [],
    actions: [createDefaultAction('send_message')],
  };
}

export function migrateOldCommand(old: { trigger: string; response: string }): CustomCommand {
  return {
    id: generateId(),
    name: old.trigger.replace('/', ''),
    enabled: true,
    trigger: [old.trigger],
    triggerType: 'exact',
    executionMode: 'sequential',
    cooldown: 0,
    allowedRoles: [],
    allowedChannels: [],
    actions: [
      {
        id: generateId(),
        type: 'send_message',
        payload: { content: old.response },
        delay: 0,
      },
    ],
  };
}
