export const ALL_FORMATS = [
  'text',
  'badge',
  'color',
  'icon',
  'link',
  'image',
  'rating',
  'progress',
  'tags',
  'boolean',
  'date',
  'duration',
  'file',
  'video',
  'audio',
  'emoji',
  'jsonb-structured',
  'icon-set',
  'color-palette',
  'multi-select',
] as const;

export type DisplayFormat = typeof ALL_FORMATS[number];

export interface FormatDef {
  value: DisplayFormat;
  label: string;
  description: string;
}

export const FORMAT_DEFS: Record<DisplayFormat, FormatDef> = {
  text:     { value: 'text',     label: 'Texto',     description: 'Texto padrão' },
  badge:    { value: 'badge',    label: 'Badge',     description: 'Etiqueta estilizada' },
  color:    { value: 'color',    label: 'Cor',       description: 'Amostra de cor' },
  icon:     { value: 'icon',     label: 'Ícone',     description: 'Ícone decorativo' },
  link:     { value: 'link',     label: 'Link',      description: 'Link clicável' },
  image:    { value: 'image',    label: 'Imagem',    description: 'Miniatura de imagem' },
  rating:   { value: 'rating',   label: 'Avaliação', description: 'Estrelas de 0-5' },
  progress: { value: 'progress', label: 'Progresso', description: 'Barra de progresso' },
  tags:     { value: 'tags',     label: 'Tags',      description: 'Pílulas/tags' },
  boolean:  { value: 'boolean',  label: 'Sim/Não',   description: 'Checkmark ou X' },
  date:     { value: 'date',     label: 'Data',      description: 'Data formatada' },
  duration: { value: 'duration', label: 'Duração',   description: 'Duração legível' },
  file:     { value: 'file',     label: 'Arquivo',   description: 'Link de download' },
  video:    { value: 'video',    label: 'Vídeo',     description: 'Player de vídeo' },
  audio:    { value: 'audio',    label: 'Áudio',     description: 'Player de áudio' },
  emoji:    { value: 'emoji',    label: 'Emoji',     description: 'Emoji ampliado' },
  'jsonb-structured': { value: 'jsonb-structured', label: 'JSONB Estruturado', description: 'Detecção automática de formato JSONB' },
  'icon-set':        { value: 'icon-set',        label: 'Conjunto de Ícones', description: 'Múltiplos ícones' },
  'color-palette':   { value: 'color-palette',   label: 'Paleta de Cores',   description: 'Múltiplas cores' },
  'multi-select':    { value: 'multi-select',    label: 'Multi-seleção',     description: 'Múltiplos valores selecionados' },
};

const COMPAT: Record<string, DisplayFormat[]> = {
  text:          ['text', 'badge', 'link', 'image', 'color', 'icon', 'date', 'duration', 'emoji', 'tags', 'file'],
  link:          ['link', 'text', 'badge'],
  tags:          ['tags', 'text', 'badge'],
  'entity-link': ['link', 'text', 'badge'],
  jsonb:         ['jsonb-structured', 'tags', 'text'],

  integer:  ['text', 'badge', 'rating', 'progress', 'duration'],
  bigint:   ['text', 'badge', 'rating', 'progress', 'duration'],
  real:     ['text', 'badge', 'rating', 'progress'],
  double:   ['text', 'badge', 'rating', 'progress'],
  numeric:  ['text', 'badge', 'rating', 'progress'],
  rating:   ['rating', 'text', 'badge', 'progress'],
  slider:   ['progress', 'rating', 'text', 'badge'],
  duration: ['duration', 'text', 'badge'],
  boolean:  ['boolean', 'text', 'badge'],

  image: ['image', 'link', 'file', 'text'],
  file:  ['file', 'link', 'image', 'text'],
  icon:  ['icon', 'text', 'badge'],
  video: ['video', 'link', 'text'],
  audio: ['audio', 'link', 'text'],

  select:        ['badge', 'text'],
  'multi-select': ['tags', 'badge', 'text'],
  'toggle-group': ['badge', 'text'],

  color:         ['color', 'text', 'badge'],
  'color-palette': ['tags', 'text'],
  emoji:         ['emoji', 'icon', 'text', 'badge'],
  'icon-set':    ['tags', 'text'],

  popover: ['text'],

  date: ['date', 'text', 'badge'],
  time: ['badge', 'text'],
};

export function getCompatibleFormats(renderType?: string): FormatDef[] {
  if (!renderType) return ALL_FORMATS.map((f) => FORMAT_DEFS[f]);
  const compatible = COMPAT[renderType];
  if (!compatible) return [FORMAT_DEFS.text];
  return compatible.map((f) => FORMAT_DEFS[f]).filter(Boolean);
}

export function getDefaultFormat(renderType?: string): DisplayFormat {
  if (!renderType) return 'text';
  const compat = COMPAT[renderType];
  if (!compat) return 'text';
  return compat[0];
}
