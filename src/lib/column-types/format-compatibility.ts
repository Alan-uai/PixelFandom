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
};

const COMPAT: Record<string, DisplayFormat[]> = {
  text:          ['text', 'badge', 'link', 'image', 'color', 'icon', 'date', 'duration', 'emoji', 'tags', 'file'],
  link:          ['text', 'badge', 'link'],
  tags:          ['text', 'badge', 'tags'],
  'entity-link': ['text', 'badge', 'link'],
  jsonb:         ['text', 'tags'],

  integer:  ['text', 'badge', 'rating', 'progress', 'duration'],
  bigint:   ['text', 'badge', 'rating', 'progress', 'duration'],
  real:     ['text', 'badge', 'rating', 'progress'],
  double:   ['text', 'badge', 'rating', 'progress'],
  numeric:  ['text', 'badge', 'rating', 'progress'],
  rating:   ['text', 'badge', 'rating', 'progress'],
  slider:   ['text', 'badge', 'rating', 'progress'],
  duration: ['text', 'badge', 'duration'],
  boolean:  ['text', 'badge', 'boolean'],

  image: ['text', 'image', 'link', 'file'],
  file:  ['text', 'image', 'link', 'file'],
  icon:  ['text', 'badge', 'icon'],
  video: ['text', 'video', 'link'],
  audio: ['text', 'audio', 'link'],

  select:        ['text', 'badge'],
  'multi-select': ['text', 'badge', 'tags'],
  'toggle-group': ['text', 'badge'],

  color:         ['text', 'badge', 'color'],
  'color-palette': ['text', 'tags'],
  emoji:         ['text', 'badge', 'icon', 'emoji'],
  'icon-set':    ['text', 'tags'],

  popover: ['text'],

  date: ['text', 'badge', 'date'],
  time: ['text', 'badge'],
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
