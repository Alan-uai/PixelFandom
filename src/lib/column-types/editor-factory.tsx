'use client';

import type { ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { DateTimePicker3D } from '@/components/ui/date-time-picker-3d';
import { COLUMN_TYPES, type RenderType } from './registry';
import {
  RatingEditor, ColorEditor, SliderEditor, DurationEditor,
  TagsEditor, EntityLinkEditor, EmojiEditor, MediaEditor,
  SelectEditor, ColorPaletteEditor, IconSetEditor, ToggleGroupEditor,
  PopoverEditor, JsonbEditor,
} from './editors';

export interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  column: string;
  renderType: string;
  tenantId?: string;
  slug?: string;
  table?: string;
  rowId?: string;
  maxValue?: number;
  columnConfig?: Record<string, unknown>;
  onColumnConfigChange?: (cfg: Record<string, unknown>) => void;
}

export function ColumnEditor({ value, onChange, column, renderType, tenantId, slug, table, rowId, maxValue, columnConfig, onColumnConfigChange }: EditorProps) {
  const def = COLUMN_TYPES[renderType as RenderType];

  if (!def) {
    return (
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 text-sm"
      />
    );
  }

  const editor = renderEditor(renderType, value, onChange, { tenantId, slug, table, rowId }, maxValue, columnConfig, onColumnConfigChange, column);
  if (editor) return editor;

  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 text-sm"
    />
  );
}

function renderEditor(
  renderType: string,
  value: string,
  onChange: (v: string) => void,
  ctx: { tenantId?: string; slug?: string; table?: string; rowId?: string },
  maxValue?: number,
  columnConfig?: Record<string, unknown>,
  onColumnConfigChange?: (cfg: Record<string, unknown>) => void,
  column?: string,
): ReactNode | null {
  switch (renderType) {
    case 'text':
    case 'link':
      return (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 text-sm"
          placeholder={renderType === 'link' ? 'https://...' : ''}
        />
      );

    case 'tags':
      return <TagsEditor value={value} onChange={onChange} />;

    case 'entity-link':
      return (
        <EntityLinkEditor
          value={value}
          onChange={onChange}
          table={ctx.table}
          tenantId={ctx.tenantId}
        />
      );

    case 'jsonb':
      return (
        <JsonbEditor
          value={value}
          onChange={onChange}
          columnConfig={columnConfig as { maxValue?: number; jsonbKeyTypes?: Record<string, { type: 'number' | 'text' | 'boolean'; suffix?: string }>; jsonbKeyColors?: Record<string, string> } | undefined}
          onColumnConfigChange={onColumnConfigChange as ((cfg: { jsonbKeyTypes?: Record<string, { type: 'number' | 'text' | 'boolean'; suffix?: string }>; jsonbKeyColors?: Record<string, string> }) => void) | undefined}
          table={ctx.table}
          slug={ctx.slug}
          tenantId={ctx.tenantId}
          columnName={column || ''}
        />
      );

    case 'integer':
    case 'bigint':
      return (
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 text-sm"
        />
      );

    case 'real':
    case 'double':
    case 'numeric':
      return (
        <Input
          type="number"
          step="any"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 text-sm"
        />
      );

    case 'rating':
      return <RatingEditor value={value} onChange={onChange} max={maxValue ?? 5} />;

    case 'slider':
      return <SliderEditor value={value} onChange={onChange} max={maxValue ?? 100} />;

    case 'duration':
      return <DurationEditor value={value} onChange={onChange} />;

    case 'boolean':
      return (
        <Switch
          checked={value === 'true'}
          onCheckedChange={(checked) => onChange(String(checked))}
        />
      );

    case 'image':
    case 'file':
    case 'video':
    case 'audio':
      return (
        <MediaEditor
          value={value}
          onChange={onChange}
          mediaType={renderType as 'image' | 'file' | 'video' | 'audio'}
          bucket="game-items"
          pathPrefix={`${ctx.slug || 'unknown'}/${ctx.table || 'unknown'}/${ctx.rowId || 'new'}`}
          tenantId={ctx.tenantId}
        />
      );

    case 'icon':
      return <IconInlineEditor value={value} onChange={onChange} />;

    case 'select':
      return <SelectEditor value={value} onChange={onChange} />;

    case 'multi-select':
      return <TagsEditor value={value} onChange={onChange} placeholder="Digite e pressione Enter" />;

    case 'toggle-group':
      return <ToggleGroupEditor value={value} onChange={onChange} />;

    case 'color':
      return <ColorEditor value={value} onChange={onChange} />;

    case 'color-palette':
      return <ColorPaletteEditor value={value} onChange={onChange} />;

    case 'emoji':
      return <EmojiEditor value={value} onChange={onChange} />;

    case 'icon-set':
      return <IconSetEditor value={value} onChange={onChange} />;

    case 'popover':
      return <PopoverEditor value={value} onChange={onChange} />;

    case 'date':
      return <DateEditor value={value} onChange={onChange} />;

    case 'time':
      return (
        <DateTimePicker3D
          mode="time"
          value={value}
          onChange={onChange}
          className="h-8 text-sm"
        />
      );

    default:
      return null;
  }
}

function DateEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <DateTimePicker3D
      mode="date"
      value={value}
      onChange={onChange}
    />
  );
}

function IconInlineEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      {value && value.includes(':') ? (
        <span className="text-xs text-muted-foreground font-mono">{value}</span>
      ) : null}
      <button
        type="button"
        onClick={async () => {
          onChange(value ? '' : 'mdi:sword');
        }}
        className="text-xs text-primary hover:text-primary/80"
      >
        {value ? 'Remover' : 'Adicionar'}
      </button>
    </div>
  );
}
