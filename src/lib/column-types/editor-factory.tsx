'use client';

import type { ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format, parse } from 'date-fns';
import { cn } from '@/lib/utils';
import { COLUMN_TYPES, type RenderType } from './registry';
import {
  RatingEditor, ColorEditor, SliderEditor, DurationEditor,
  TagsEditor, EntityLinkEditor, EmojiEditor, MediaEditor,
  SelectEditor, ColorPaletteEditor, IconSetEditor, ToggleGroupEditor,
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
}

export function ColumnEditor({ value, onChange, column, renderType, tenantId, slug, table, rowId }: EditorProps) {
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

  const editor = renderEditor(renderType, value, onChange, { tenantId, slug, table, rowId });
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
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-xs"
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
      return <RatingEditor value={value} onChange={onChange} />;

    case 'slider':
      return <SliderEditor value={value} onChange={onChange} />;

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

    case 'date':
      return <DateEditor value={value} onChange={onChange} />;

    case 'time':
      return (
        <input
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 h-8"
        />
      );

    default:
      return null;
  }
}

function DateEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const date = value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn('w-full justify-start text-left font-normal h-8 text-sm', !date && 'text-muted-foreground')}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, 'dd/MM/yyyy') : <span>Selecionar data</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(selectedDate) => {
            onChange(selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '');
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
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
          const { IconPicker } = await import('@/components/ui/icon-picker');
          // Simplified: just toggle between empty and a default icon for inline editing
          onChange(value ? '' : 'mdi:sword');
        }}
        className="text-xs text-primary hover:text-primary/80"
      >
        {value ? 'Remover' : 'Adicionar'}
      </button>
    </div>
  );
}
