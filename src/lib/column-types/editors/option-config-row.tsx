'use client';

import { useState } from 'react';
import { Trash2, Palette, Pencil, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconRenderer } from '@/components/ui/icon-renderer';

export interface AllowedValue {
  value: string;
  label?: string;
  color?: string;
  icon?: string;
  imageUrl?: string;
  linkedEntity?: string;
  autoFill?: Record<string, string>;
}

const COLOR_PRESETS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
  '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#64748b', '#ffffff',
];

interface OptionConfigRowProps {
  option: AllowedValue;
  selected: boolean;
  expanded: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
  onChange: (patch: Partial<AllowedValue>) => void;
  onRemove: () => void;
  dependentField?: string;
  /** Visual variant of the selectable chip/button */
  variant?: 'row' | 'chip' | 'toggle';
}

export function OptionConfigRow({
  option,
  selected,
  expanded,
  onSelect,
  onToggleExpand,
  onChange,
  onRemove,
  dependentField,
  variant = 'row',
}: OptionConfigRowProps) {
  const [showColors, setShowColors] = useState(false);
  const label = option.label || option.value;

  const trigger =
    variant === 'chip' ? (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border pl-2.5 pr-1 py-1 text-xs transition-colors',
          selected
            ? 'border-primary/40 bg-primary/10 text-primary'
            : 'border-border/60 bg-card text-muted-foreground hover:border-primary/30',
        )}
        style={selected && option.color ? { borderColor: option.color, color: option.color, backgroundColor: option.color + '18' } : undefined}
      >
        <button type="button" onClick={onSelect} className="flex items-center gap-1.5">
          {option.icon && <IconRenderer icon={option.icon} size="sm" />}
          {option.color && !option.icon && (
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: option.color }} />
          )}
          <span className="font-medium">{label}</span>
        </button>
        <button
          type="button"
          onClick={onToggleExpand}
          className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          title="Configurar opção"
        >
          <Pencil className="h-2.5 w-2.5" />
        </button>
      </div>
    ) : variant === 'toggle' ? (
      <div
        className={cn(
          'relative flex items-center gap-1.5 rounded-lg border px-3 h-8 text-sm font-medium transition-all',
          selected
            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
            : 'bg-background text-muted-foreground border-input hover:border-muted-foreground/30 hover:text-foreground',
        )}
        style={selected && option.color ? { backgroundColor: option.color, borderColor: option.color } : undefined}
      >
        <button type="button" onClick={onSelect} className="flex items-center gap-1.5">
          {option.icon && <IconRenderer icon={option.icon} size="sm" />}
          {label}
        </button>
        <button
          type="button"
          onClick={onToggleExpand}
          className={cn(
            'flex h-4 w-4 items-center justify-center rounded-full transition-colors',
            selected ? 'text-primary-foreground/70 hover:text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
          title="Configurar opção"
        >
          <Pencil className="h-2.5 w-2.5" />
        </button>
      </div>
    ) : (
      <div
        className={cn(
          'flex items-center gap-2 rounded-md border px-2.5 py-2 text-sm transition-colors',
          selected ? 'border-primary/40 bg-primary/5' : 'border-border/60 bg-background/50 hover:border-primary/30',
        )}
      >
        <button type="button" onClick={onSelect} className="flex flex-1 items-center gap-2 text-left">
          {option.icon && <IconRenderer icon={option.icon} size="sm" />}
          {option.color && (
            <span className="inline-block h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: option.color }} />
          )}
          <span className="font-medium">{label}</span>
          <span className="text-[10px] text-muted-foreground">({option.value})</span>
          {option.linkedEntity && <span className="ml-auto text-[10px] text-primary">🔗 {option.linkedEntity}</span>}
        </button>
        <button
          type="button"
          onClick={onToggleExpand}
          className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          title="Configurar opção"
        >
          {expanded ? <ChevronDown className="h-3 w-3" /> : <Pencil className="h-3 w-3" />}
        </button>
      </div>
    );

  return (
    <div className={variant === 'row' ? 'space-y-0' : ''}>
      {trigger}
      {expanded && (
        <div className="mt-1.5 space-y-2 rounded-md border bg-muted/20 p-2.5">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground">Valor (slug)</label>
              <input
                type="text"
                value={option.value}
                onChange={(e) => onChange({ value: e.target.value })}
                className="h-7 w-full rounded border bg-background px-1.5 text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Label (exibição)</label>
              <input
                type="text"
                value={option.label || ''}
                onChange={(e) => onChange({ label: e.target.value })}
                className="h-7 w-full rounded border bg-background px-1.5 text-xs"
              />
            </div>
            <div className="relative">
              <label className="text-[10px] text-muted-foreground">Cor</label>
              <button
                type="button"
                onClick={() => setShowColors((s) => !s)}
                className={cn(
                  'flex h-7 w-full items-center gap-1.5 rounded border bg-background px-1.5 text-xs',
                  !option.color && 'text-muted-foreground',
                )}
              >
                {option.color ? (
                  <span className="h-3.5 w-3.5 rounded-full border" style={{ backgroundColor: option.color }} />
                ) : (
                  <Palette className="h-3 w-3" />
                )}
                <span className="truncate">{option.color || 'Definir cor'}</span>
              </button>
              {showColors && (
                <div className="absolute top-full left-0 z-50 mt-1 min-w-[168px] rounded-lg border bg-card p-2 shadow-xl">
                  <div className="flex flex-wrap gap-1">
                    {COLOR_PRESETS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => { onChange({ color: c }); setShowColors(false); }}
                        className={cn(
                          'h-5 w-5 rounded-full border transition-all hover:scale-110',
                          option.color === c ? 'border-foreground ring-2 ring-foreground/30' : 'border-border',
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <input
                      type="text"
                      value={option.color || ''}
                      onChange={(e) => onChange({ color: e.target.value || undefined })}
                      placeholder="#ff6600"
                      className="h-6 flex-1 rounded border bg-background px-1.5 text-[10px] font-mono focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                    {option.color && (
                      <button
                        type="button"
                        onClick={() => { onChange({ color: undefined }); setShowColors(false); }}
                        className="text-[10px] text-muted-foreground hover:text-destructive"
                      >
                        Limpar
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground">Ícone</label>
              <input
                type="text"
                value={option.icon || ''}
                onChange={(e) => onChange({ icon: e.target.value || undefined })}
                className="h-7 w-full rounded border bg-background px-1.5 text-xs font-mono"
                placeholder="mdi:sword"
              />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] text-muted-foreground">Entidade linkada (slug do item)</label>
              <input
                type="text"
                value={option.linkedEntity || ''}
                onChange={(e) => onChange({ linkedEntity: e.target.value || undefined })}
                className="h-7 w-full rounded border bg-background px-1.5 text-xs font-mono"
                placeholder="espada-de-fogo-legendary"
              />
            </div>
          </div>

          {dependentField && (
            <div>
              <label className="text-[10px] text-muted-foreground">{`AutoFill para "${dependentField}"`}</label>
              <input
                type="text"
                value={option.autoFill?.[dependentField] || ''}
                onChange={(e) => onChange({ autoFill: { ...(option.autoFill || {}), [dependentField]: e.target.value } })}
                className="h-7 w-full rounded border bg-background px-1.5 text-xs font-mono"
                placeholder="Valor a preencher automaticamente"
              />
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onRemove}
              className="flex items-center gap-1 text-[10px] text-destructive hover:text-destructive/80"
            >
              <Trash2 className="h-3 w-3" /> Remover opção
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
