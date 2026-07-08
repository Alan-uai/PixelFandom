'use client';

import type { ReactNode } from 'react';
import { z } from 'zod';
import { sanitizeUrl } from '@/lib/content-utils';
import {
  Type,
  Hash,
  Calculator,
  ToggleLeft,
  Code,
  Variable,
  ArrowUpDown,
  Upload,
  Binary,
  ImageIcon,
  FileIcon,
  Music,
  Video,
  Palette,
  Star,
  SlidersHorizontal,
  ListChecks,
  Tags,
  Link2,
  Smile,
  Grid3X3,
  CalendarIcon,
  Timer,
  GripVertical,
  Sparkles,
  MessageSquareMore,
} from 'lucide-react';

export const RENDER_TYPES = [
  // text
  'text', 'link', 'tags', 'entity-link', 'jsonb',
  // numeric
  'integer', 'bigint', 'real', 'double', 'numeric',
  'rating', 'slider', 'duration', 'boolean',
  // media
  'image', 'file', 'icon', 'video', 'audio',
  // select
  'select', 'multi-select', 'toggle-group',
  // visual
  'color', 'color-palette', 'emoji', 'icon-set',
  // interactive
  'popover',
  // datetime
  'date', 'time',
] as const;

export type RenderType = typeof RENDER_TYPES[number];

export type CategoryId = 'text' | 'numeric' | 'media' | 'select' | 'visual' | 'interactive' | 'datetime';

export interface CategoryDef {
  id: CategoryId;
  label: string;
  icon: ReactNode;
  description: string;
}

export const CATEGORIES: CategoryDef[] = [
  { id: 'text', label: 'Texto', icon: <Type className="h-4 w-4" />, description: 'Campos de texto livre' },
  { id: 'numeric', label: 'Número', icon: <Hash className="h-4 w-4" />, description: 'Valores numéricos e métricas' },
  { id: 'media', label: 'Upload / Mídia', icon: <Upload className="h-4 w-4" />, description: 'Imagens, ícones, vídeos e arquivos' },
  { id: 'select', label: 'Seleção', icon: <ListChecks className="h-4 w-4" />, description: 'Opções pré-definidas' },
  { id: 'visual', label: 'Visual', icon: <Palette className="h-4 w-4" />, description: 'Cores, emojis e elementos visuais' },
  { id: 'interactive', label: 'Interativo', icon: <MessageSquareMore className="h-4 w-4" />, description: 'Popovers, tooltips e abas flutuantes' },
  { id: 'datetime', label: 'Data / Hora', icon: <CalendarIcon className="h-4 w-4" />, description: 'Datas, horários e durações' },
];

export interface NameOption {
  label: string;
  value: string;
  defaultColumn: string;
}

export interface ColumnTypeDefinition {
  id: RenderType;
  label: string;
  category: CategoryId;
  dbType: string;
  icon: ReactNode;
  nameMode: 'free' | 'selector';
  nameOptions?: NameOption[];
  defaultColumn?: string;
  valueSchema: z.ZodTypeAny;
  validateValue: (value: string) => string | null;
  sanitize: (value: string) => string;
}

const urlOrEmpty = z.string().max(2048).optional().default('');
const textOrEmpty = z.string().max(10000).optional().default('');
const numericStr = z.string().max(100).optional().default('');
const jsonStr = z.string().max(50000).optional().default('');

function sanitizeJson(value: string): string {
  if (!value) return '';
  try {
    const parsed = JSON.parse(value);
    return JSON.stringify(parsed);
  } catch {
    return value.replace(/[<>]/g, '');
  }
}

function limitLength(max: number) {
  return (value: string) => value.slice(0, max);
}

export const COLUMN_TYPES: Record<RenderType, ColumnTypeDefinition> = {
  // ── Text ──────────────────────────────────────────
  text: {
    id: 'text', label: 'Texto Livre', category: 'text', dbType: 'text',
    icon: <Type className="h-3.5 w-3.5" />,
    nameMode: 'free',
    valueSchema: textOrEmpty,
    validateValue: (v) => v.length > 10000 ? 'Texto muito longo (máx 10000 caracteres)' : null,
    sanitize: limitLength(10000),
  },
  link: {
    id: 'link', label: 'Link', category: 'text', dbType: 'text',
    icon: <Link2 className="h-3.5 w-3.5" />,
    nameMode: 'free',
    valueSchema: urlOrEmpty,
    validateValue: (v) => {
      if (!v) return null;
      try { new URL(v); return null; } catch { return 'URL inválida'; }
    },
    sanitize: (v) => sanitizeUrl(v).slice(0, 2048),
  },
  tags: {
    id: 'tags', label: 'Tags', category: 'text', dbType: 'jsonb',
    icon: <Tags className="h-3.5 w-3.5" />,
    nameMode: 'free',
    valueSchema: jsonStr,
    validateValue: (v) => {
      if (!v) return null;
      try { const p = JSON.parse(v); if (!Array.isArray(p)) return 'Formato inválido: array esperado'; return null; }
      catch { return 'JSON inválido'; }
    },
    sanitize: (v) => sanitizeJson(v).slice(0, 50000),
  },
  'entity-link': {
    id: 'entity-link', label: 'Referência a Entidade', category: 'text', dbType: 'text',
    icon: <GripVertical className="h-3.5 w-3.5" />,
    nameMode: 'free',
    valueSchema: textOrEmpty,
    validateValue: (v) => v.length > 500 ? 'Valor muito longo' : null,
    sanitize: limitLength(500),
  },
  jsonb: {
    id: 'jsonb', label: 'JSON', category: 'text', dbType: 'jsonb',
    icon: <Code className="h-3.5 w-3.5" />,
    nameMode: 'free',
    valueSchema: jsonStr,
    validateValue: (v) => {
      if (!v) return null;
      try { JSON.parse(v); return null; }
      catch { return 'JSON inválido'; }
    },
    sanitize: (v) => sanitizeJson(v).slice(0, 50000),
  },

  // ── Numeric ──────────────────────────────────────
  integer: {
    id: 'integer', label: 'Inteiro', category: 'numeric', dbType: 'integer',
    icon: <Hash className="h-3.5 w-3.5" />,
    nameMode: 'free',
    valueSchema: numericStr,
    validateValue: (v) => { if (!v) return null; return Number.isInteger(Number(v)) ? null : 'Valor inteiro esperado'; },
    sanitize: (v) => v.replace(/[^0-9-]/g, '').slice(0, 20),
  },
  bigint: {
    id: 'bigint', label: 'Inteiro Grande', category: 'numeric', dbType: 'bigint',
    icon: <ArrowUpDown className="h-3.5 w-3.5" />,
    nameMode: 'free',
    valueSchema: numericStr,
    validateValue: (v) => { if (!v) return null; return Number.isInteger(Number(v)) ? null : 'Valor inteiro esperado'; },
    sanitize: (v) => v.replace(/[^0-9-]/g, '').slice(0, 20),
  },
  real: {
    id: 'real', label: 'Real', category: 'numeric', dbType: 'real',
    icon: <Binary className="h-3.5 w-3.5" />,
    nameMode: 'free',
    valueSchema: numericStr,
    validateValue: (v) => { if (!v) return null; return !isNaN(Number(v)) ? null : 'Valor numérico esperado'; },
    sanitize: (v) => v.replace(/[^0-9-.e]/g, '').slice(0, 30),
  },
  double: {
    id: 'double', label: 'Precisão Dupla', category: 'numeric', dbType: 'double precision',
    icon: <Variable className="h-3.5 w-3.5" />,
    nameMode: 'free',
    valueSchema: numericStr,
    validateValue: (v) => { if (!v) return null; return !isNaN(Number(v)) ? null : 'Valor numérico esperado'; },
    sanitize: (v) => v.replace(/[^0-9-.e]/g, '').slice(0, 30),
  },
  numeric: {
    id: 'numeric', label: 'Numérico', category: 'numeric', dbType: 'numeric',
    icon: <Calculator className="h-3.5 w-3.5" />,
    nameMode: 'free',
    valueSchema: numericStr,
    validateValue: (v) => { if (!v) return null; return !isNaN(Number(v)) ? null : 'Valor numérico esperado'; },
    sanitize: (v) => v.replace(/[^0-9-.e]/g, '').slice(0, 30),
  },
  rating: {
    id: 'rating', label: 'Avaliação (Estrelas)', category: 'numeric', dbType: 'integer',
    icon: <Star className="h-3.5 w-3.5" />,
    nameMode: 'free',
    valueSchema: numericStr,
    validateValue: (v) => {
      if (!v) return null;
      const n = Number(v);
      if (!Number.isInteger(n)) return 'Valor inteiro esperado';
      if (n < 0 || n > 10) return 'Valor entre 0 e 10';
      return null;
    },
    sanitize: (v) => v.replace(/[^0-9]/g, '').slice(0, 2),
  },
  slider: {
    id: 'slider', label: 'Slider', category: 'numeric', dbType: 'real',
    icon: <SlidersHorizontal className="h-3.5 w-3.5" />,
    nameMode: 'free',
    valueSchema: numericStr,
    validateValue: (v) => { if (!v) return null; return !isNaN(Number(v)) ? null : 'Valor numérico esperado'; },
    sanitize: (v) => v.replace(/[^0-9-.e]/g, '').slice(0, 30),
  },
  duration: {
    id: 'duration', label: 'Duração', category: 'numeric', dbType: 'text',
    icon: <Timer className="h-3.5 w-3.5" />,
    nameMode: 'free',
    valueSchema: textOrEmpty,
    validateValue: (v) => {
      if (!v) return null;
      return /^\d{1,4}:\d{2}(:\d{2})?$/.test(v) ? null : 'Formato: mm:ss ou hh:mm:ss';
    },
    sanitize: (v) => v.replace(/[^0-9:]/g, '').slice(0, 9),
  },
  boolean: {
    id: 'boolean', label: 'Sim/Não', category: 'numeric', dbType: 'boolean',
    icon: <ToggleLeft className="h-3.5 w-3.5" />,
    nameMode: 'free',
    valueSchema: z.enum(['true', 'false', '']).optional().default(''),
    validateValue: (v) => {
      if (!v || v === 'true' || v === 'false') return null;
      return 'Valor deve ser Sim ou Não';
    },
    sanitize: (v) => v === 'true' ? 'true' : 'false',
  },

  // ── Media ────────────────────────────────────────
  image: {
    id: 'image', label: 'Imagem', category: 'media', dbType: 'text',
    icon: <ImageIcon className="h-3.5 w-3.5" />,
    nameMode: 'selector',
    nameOptions: [
      { label: 'Imagem Principal', value: 'image', defaultColumn: 'image_url' },
      { label: 'Imagem de Capa', value: 'cover', defaultColumn: 'cover_url' },
      { label: 'Logo', value: 'logo', defaultColumn: 'logo_url' },
      { label: 'Banner', value: 'banner', defaultColumn: 'banner_url' },
      { label: 'Screenshot', value: 'screenshot', defaultColumn: 'screenshot_url' },
      { label: 'Thumbnail', value: 'thumbnail', defaultColumn: 'thumbnail_url' },
    ],
    defaultColumn: 'image_url',
    valueSchema: urlOrEmpty,
    validateValue: (v) => v && v.length > 2048 ? 'URL muito longa' : null,
    sanitize: (v) => sanitizeUrl(v).slice(0, 2048),
  },
  file: {
    id: 'file', label: 'Arquivo', category: 'media', dbType: 'text',
    icon: <FileIcon className="h-3.5 w-3.5" />,
    nameMode: 'selector',
    nameOptions: [
      { label: 'Arquivo', value: 'file', defaultColumn: 'file_url' },
      { label: 'PDF', value: 'pdf', defaultColumn: 'pdf_url' },
      { label: 'Planilha', value: 'spreadsheet', defaultColumn: 'spreadsheet_url' },
      { label: 'Documento', value: 'document', defaultColumn: 'document_url' },
    ],
    defaultColumn: 'file_url',
    valueSchema: urlOrEmpty,
    validateValue: (v) => v && v.length > 2048 ? 'URL muito longa' : null,
    sanitize: (v) => sanitizeUrl(v).slice(0, 2048),
  },
  icon: {
    id: 'icon', label: 'Ícone', category: 'media', dbType: 'text',
    icon: <Sparkles className="h-3.5 w-3.5" />,
    nameMode: 'selector',
    nameOptions: [
      { label: 'Ícone', value: 'icon', defaultColumn: 'icon_id' },
      { label: 'Ícone Pequeno', value: 'icon_small', defaultColumn: 'icon_small_id' },
      { label: 'Ícone Grande', value: 'icon_large', defaultColumn: 'icon_large_id' },
    ],
    defaultColumn: 'icon_id',
    valueSchema: textOrEmpty,
    validateValue: (v) => v && !v.includes(':') && v.length > 0 ? 'Formato: coleção:ícone (ex: mdi:sword)' : null,
    sanitize: (v) => v.replace(/[^a-zA-Z0-9:_-]/g, '').slice(0, 200),
  },
  video: {
    id: 'video', label: 'Vídeo', category: 'media', dbType: 'text',
    icon: <Video className="h-3.5 w-3.5" />,
    nameMode: 'selector',
    nameOptions: [
      { label: 'Vídeo', value: 'video', defaultColumn: 'video_url' },
      { label: 'Trailer', value: 'trailer', defaultColumn: 'trailer_url' },
      { label: 'Gameplay', value: 'gameplay', defaultColumn: 'gameplay_url' },
      { label: 'Clip', value: 'clip', defaultColumn: 'clip_url' },
    ],
    defaultColumn: 'video_url',
    valueSchema: urlOrEmpty,
    validateValue: (v) => v && v.length > 2048 ? 'URL muito longa' : null,
    sanitize: (v) => sanitizeUrl(v).slice(0, 2048),
  },
  audio: {
    id: 'audio', label: 'Áudio', category: 'media', dbType: 'text',
    icon: <Music className="h-3.5 w-3.5" />,
    nameMode: 'selector',
    nameOptions: [
      { label: 'Áudio', value: 'audio', defaultColumn: 'audio_url' },
      { label: 'Trilha Sonora', value: 'soundtrack', defaultColumn: 'soundtrack_url' },
      { label: 'Efeito Sonoro', value: 'sfx', defaultColumn: 'sfx_url' },
      { label: 'Dublagem', value: 'voice', defaultColumn: 'voice_url' },
    ],
    defaultColumn: 'audio_url',
    valueSchema: urlOrEmpty,
    validateValue: (v) => v && v.length > 2048 ? 'URL muito longa' : null,
    sanitize: (v) => sanitizeUrl(v).slice(0, 2048),
  },

  // ── Select ────────────────────────────────────────
  select: {
    id: 'select', label: 'Lista (Dropdown)', category: 'select', dbType: 'text',
    icon: <ListChecks className="h-3.5 w-3.5" />,
    nameMode: 'free',
    valueSchema: textOrEmpty,
    validateValue: (v) => v.length > 500 ? 'Valor muito longo' : null,
    sanitize: limitLength(500),
  },
  'multi-select': {
    id: 'multi-select', label: 'Multi-Seleção', category: 'select', dbType: 'jsonb',
    icon: <Tags className="h-3.5 w-3.5" />,
    nameMode: 'free',
    valueSchema: jsonStr,
    validateValue: (v) => {
      if (!v) return null;
      try { const p = JSON.parse(v); if (!Array.isArray(p)) return 'Array esperado'; return null; }
      catch { return 'JSON inválido'; }
    },
    sanitize: (v) => sanitizeJson(v).slice(0, 50000),
  },
  'toggle-group': {
    id: 'toggle-group', label: 'Grupo de Botões', category: 'select', dbType: 'text',
    icon: <GripVertical className="h-3.5 w-3.5" />,
    nameMode: 'free',
    valueSchema: textOrEmpty,
    validateValue: (v) => v.length > 200 ? 'Valor muito longo' : null,
    sanitize: limitLength(200),
  },

  // ── Visual ────────────────────────────────────────
  color: {
    id: 'color', label: 'Cor', category: 'visual', dbType: 'text',
    icon: <Palette className="h-3.5 w-3.5" />,
    nameMode: 'free',
    valueSchema: textOrEmpty,
    validateValue: (v) => {
      if (!v) return null;
      const isHsl = /^hsl\(\s*\d{1,3}\s+\d{1,3}%\s+\d{1,3}%\s*\)$/.test(v);
      const isHex = /^#[0-9a-fA-F]{6}$/.test(v) || /^#[0-9a-fA-F]{3}$/.test(v);
      return isHsl || isHex ? null : 'Formato: hsl(200 50% 50%) ou #ff6600';
    },
    sanitize: (v) => v.replace(/[^a-zA-Z0-9#%,()\s]/g, '').slice(0, 50),
  },
  'color-palette': {
    id: 'color-palette', label: 'Paleta de Cores', category: 'visual', dbType: 'jsonb',
    icon: <Palette className="h-3.5 w-3.5" />,
    nameMode: 'free',
    valueSchema: jsonStr,
    validateValue: (v) => {
      if (!v) return null;
      try { const p = JSON.parse(v); if (!Array.isArray(p)) return 'Array de cores esperado'; return null; }
      catch { return 'JSON inválido'; }
    },
    sanitize: (v) => sanitizeJson(v).slice(0, 50000),
  },
  emoji: {
    id: 'emoji', label: 'Emoji', category: 'visual', dbType: 'text',
    icon: <Smile className="h-3.5 w-3.5" />,
    nameMode: 'free',
    valueSchema: textOrEmpty,
    validateValue: (v) => v.length > 10 ? 'Apenas um emoji' : null,
    sanitize: (v) => {
      const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
      const match = v.match(emojiRegex);
      return match?.[0] || '';
    },
  },
  'icon-set': {
    id: 'icon-set', label: 'Conjunto de Ícones', category: 'visual', dbType: 'jsonb',
    icon: <Grid3X3 className="h-3.5 w-3.5" />,
    nameMode: 'free',
    valueSchema: jsonStr,
    validateValue: (v) => {
      if (!v) return null;
      try { const p = JSON.parse(v); if (!Array.isArray(p)) return 'Array de ícones esperado'; return null; }
      catch { return 'JSON inválido'; }
    },
    sanitize: (v) => sanitizeJson(v).slice(0, 50000),
  },

  // ── Date / Time ───────────────────────────────────
  date: {
    id: 'date', label: 'Data', category: 'datetime', dbType: 'date',
    icon: <CalendarIcon className="h-3.5 w-3.5" />,
    nameMode: 'free',
    valueSchema: textOrEmpty,
    validateValue: (v) => {
      if (!v) return null;
      return /^\d{4}-\d{2}-\d{2}$/.test(v) ? null : 'Formato: YYYY-MM-DD';
    },
    sanitize: (v) => v.replace(/[^0-9-]/g, '').slice(0, 10),
  },
  time: {
    id: 'time', label: 'Hora', category: 'datetime', dbType: 'time without time zone',
    icon: <Timer className="h-3.5 w-3.5" />,
    nameMode: 'free',
    valueSchema: textOrEmpty,
    validateValue: (v) => {
      if (!v) return null;
      return /^\d{2}:\d{2}(:\d{2})?$/.test(v) ? null : 'Formato: HH:MM ou HH:MM:SS';
    },
    sanitize: (v) => v.replace(/[^0-9:]/g, '').slice(0, 8),
  },

  // ── Interactive ────────────────────────────────
  popover: {
    id: 'popover', label: 'Popover / Tooltip', category: 'interactive', dbType: 'jsonb',
    icon: <MessageSquareMore className="h-3.5 w-3.5" />,
    nameMode: 'selector',
    nameOptions: [
      { label: 'Popover', value: 'popover', defaultColumn: 'popover_config' },
      { label: 'Tooltip', value: 'tooltip', defaultColumn: 'tooltip_config' },
      { label: 'Aba Flutuante', value: 'floating_tab', defaultColumn: 'floating_tab_config' },
    ],
    defaultColumn: 'popover_config',
    valueSchema: jsonStr,
    validateValue: (v) => {
      if (!v) return null;
      try { const p = JSON.parse(v); if (!p.content && !p.title) return 'Conteúdo ou título obrigatório'; return null; }
      catch { return 'JSON inválido'; }
    },
    sanitize: (v) => sanitizeJson(v).slice(0, 50000),
  },
};

export function getTypeDef(type: string): ColumnTypeDefinition | undefined {
  return COLUMN_TYPES[type as RenderType];
}

export function getTypesByCategory(category: CategoryId): ColumnTypeDefinition[] {
  return Object.values(COLUMN_TYPES).filter((t) => t.category === category);
}

export function getCategoryForType(type: string): CategoryId | undefined {
  return COLUMN_TYPES[type as RenderType]?.category;
}

export function getDbType(type: string): string {
  return COLUMN_TYPES[type as RenderType]?.dbType ?? 'text';
}

export function getDefaultColumn(type: string): string {
  return COLUMN_TYPES[type as RenderType]?.defaultColumn ?? '';
}

export function getTypeLabel(type: string): string {
  return COLUMN_TYPES[type as RenderType]?.label ?? type;
}

export const FIELD_TYPE_NAMES = RENDER_TYPES.filter(
  (t) => !['double', 'bigint', 'real', 'numeric'].includes(t)
);
