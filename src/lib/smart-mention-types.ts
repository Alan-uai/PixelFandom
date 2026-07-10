export type MentionType = 'table' | 'item' | 'article' | 'user' | 'link';

export interface MentionTrigger {
  trigger: string;
  type: MentionType;
  label: string;
  icon: string;
  placeholder: string;
  allowCreate: boolean;
}

export const MENTION_TRIGGERS: Record<string, MentionTrigger> = {
  t: {
    trigger: '$t<',
    type: 'table',
    label: 'Tabela',
    icon: 'Database',
    placeholder: 'Buscar tabela...',
    allowCreate: true,
  },
  i: {
    trigger: '$i<',
    type: 'item',
    label: 'Item',
    icon: 'Package',
    placeholder: 'Buscar item...',
    allowCreate: true,
  },
  a: {
    trigger: '$a<',
    type: 'article',
    label: 'Artigo',
    icon: 'FileText',
    placeholder: 'Buscar artigo...',
    allowCreate: true,
  },
  '@': {
    trigger: '$@<',
    type: 'user',
    label: 'Usuário',
    icon: 'User',
    placeholder: 'Buscar usuário...',
    allowCreate: false,
  },
  l: {
    trigger: '$l<',
    type: 'link',
    label: 'Link',
    icon: 'Link',
    placeholder: 'Colar URL...',
    allowCreate: false,
  },
};

export interface MentionResult {
  id: string;
  label: string;
  description: string;
  slug?: string;
  imageUrl?: string;
  avatarUrl?: string;
}

export interface PendingLink {
  type: 'table' | 'item' | 'article';
  slug: string;
  created_at: string;
}
