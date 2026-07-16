'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/ui/image-upload';
import { TableIconPicker } from '@/components/ui/table-icon-picker';
import { cn } from '@/lib/utils';

const LABEL_COLOR_PRESETS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#78716c', '#a3a3a3',
];

export function HeaderConfig({
  config,
  onChange,
  slug,
  tableIcon,
  tenantId,
}: {
  config: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
  columns?: string[];
  slug?: string;
  tableIcon?: string | null;
  tenantId?: string;
}) {
  const c: Record<string, any> = config || {};
  const [showLabelColor, setShowLabelColor] = useState(!!c.labelColor);
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Título</Label>
        <Input
          value={c.title || ''}
          onChange={(e) => onChange({ ...c, title: e.target.value })}
          placeholder="Label da tabela ou custom"
          className="h-8 text-sm"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Subtítulo</Label>
        <Input
          value={c.subtitle || ''}
          onChange={(e) => onChange({ ...c, subtitle: e.target.value })}
          placeholder="Opcional"
          className="h-8 text-sm"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Ícone</Label>
        <TableIconPicker value={c.icon || tableIcon || 'Database'} onChange={(v) => onChange({ ...c, icon: v })} slug={slug || ''} tenantId={tenantId} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Imagem de fundo</Label>
        <ImageUpload
          bucket="game-items"
          pathPrefix={`wiki-covers/${slug}`}
          value={c.backgroundImage || ''}
          onChange={(url) => onChange({ ...c, backgroundImage: url })}
          label="Fundo do header"
          previewSize="w-full h-20"
          tenantId={tenantId ?? undefined}
        />
      </div>
      <div className="flex items-center gap-2">
        <Switch
          id="show-breadcrumb"
          checked={c.showBreadcrumb !== false}
          onCheckedChange={(v) => onChange({ ...c, showBreadcrumb: v })}
        />
        <Label htmlFor="show-breadcrumb" className="text-xs">Exibir breadcrumb (Voltar para home)</Label>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Cor dos labels da tabela</Label>
          {c.labelColor && (
            <button
              type="button"
              onClick={() => { const next = { ...c }; delete next.labelColor; onChange(next); setShowLabelColor(false); }}
              className="text-[10px] text-muted-foreground hover:text-destructive transition-colors"
            >
              Remover
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {LABEL_COLOR_PRESETS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onChange({ ...c, labelColor: color })}
              className={cn(
                'h-6 w-6 rounded-full border-2 transition-all hover:scale-110',
                c.labelColor === color ? 'border-foreground scale-110 ring-2 ring-foreground/30' : 'border-border',
              )}
              style={{ backgroundColor: color }}
            />
          ))}
          <button
            type="button"
            onClick={() => setShowLabelColor(!showLabelColor)}
            className={cn(
              'h-6 w-6 rounded-full border-2 border-dashed border-muted-foreground/40 flex items-center justify-center text-xs text-muted-foreground hover:border-foreground transition-colors',
              showLabelColor && !LABEL_COLOR_PRESETS.includes(c.labelColor || '') && 'border-primary',
            )}
            title="Personalizado"
          >
            +
          </button>
        </div>
        {showLabelColor && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={c.labelColor || ''}
              onChange={(e) => onChange({ ...c, labelColor: e.target.value })}
              placeholder="#ff6600 ou #ef4444"
              className="flex-1 h-8 rounded-lg border bg-background px-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <div
              className="h-6 w-6 rounded border shrink-0"
              style={{ backgroundColor: c.labelColor || 'transparent' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
