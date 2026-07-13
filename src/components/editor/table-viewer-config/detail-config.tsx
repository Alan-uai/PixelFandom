'use client';

import { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select3D } from '@/components/ui/select3d';
import { getCompatibleFormats, getDefaultFormat } from '@/lib/column-types/format-compatibility';

const LABEL_COLS = new Set(['name', 'title', 'description', 'summary', 'slug']);
const BADGE_COLS = new Set(['rarity', 'tier', 'element']);
const SYSTEM_COLS = new Set(['id', 'tenant_id', 'created_at', 'updated_at', 'embedding', 'icon', 'icon_url', 'image', 'image_url']);

function inferFormat(col: string): string {
  const lower = col.toLowerCase();
  if (lower.endsWith('_url') || lower.endsWith('_link') || lower === 'url' || lower === 'link') return 'link';
  if (lower === 'rarity' || lower === 'tier') return 'badge';
  if (lower === 'element') return 'badge';
  if (lower.startsWith('is_') || lower.startsWith('has_')) return 'badge';
  return 'text';
}

export function DetailConfig({
  config,
  columns = [],
  columnTypes = {},
  onChange,
}: {
  config: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
  columns?: string[];
  columnTypes?: Record<string, string>;
  slug?: string;
}) {
  const c: Record<string, any> = config || {};
  const columnFormats: Record<string, string> = c.columnFormats || {};
  const formatVariants: Record<string, number> = c.columnFormatVariants || {};

  // When visibleColumns is empty (first access), treat all eligible columns as visible
  const effectiveVisible = useMemo(() => {
    const visibleColumns: string[] = c.visibleColumns || [];
    if (visibleColumns.length > 0) return visibleColumns;
    return columns.filter(col => !SYSTEM_COLS.has(col) && !LABEL_COLS.has(col) && !BADGE_COLS.has(col));
  }, [c.visibleColumns, columns]);

  const toggleColumn = (col: string) => {
    const next = effectiveVisible.includes(col)
      ? effectiveVisible.filter(c => c !== col)
      : [...effectiveVisible, col];
    onChange({ ...c, visibleColumns: next });
  };

  const setFormat = (col: string, fmt: string) => {
    onChange({ ...c, columnFormats: { ...columnFormats, [col]: fmt } });
  };

  const getFormat = (col: string): string => {
    const saved = columnFormats[col];
    if (saved) {
      const compatible = getCompatibleFormats(columnTypes[col]);
      if (compatible.some((f) => f.value === saved)) return saved;
    }
    const inferred = inferFormat(col);
    const defCompatible = getCompatibleFormats(columnTypes[col]);
    if (defCompatible.some((f) => f.value === inferred)) return inferred;
    return getDefaultFormat(columnTypes[col]);
  };

  const getVariant = (col: string): number => formatVariants[col] || 1;

  const cycleVariant = (col: string) => {
    const current = getVariant(col);
    const next = current >= 5 ? 1 : current + 1;
    onChange({ ...c, columnFormatVariants: { ...formatVariants, [col]: next } });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Switch
          id="show-comparison"
          checked={c.showComparison !== false}
          onCheckedChange={(v) => onChange({ ...c, showComparison: v })}
        />
        <Label htmlFor="show-comparison" className="text-xs">Exibir botão de comparação</Label>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">colunas visíveis</Label>
        <p className="text-[10px] text-muted-foreground">Marque as colunas que aparecem no detalhe.</p>
        <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
          {(columns as string[]).map((col) => {
            if (SYSTEM_COLS.has(col)) return null;
            const isVisible = effectiveVisible.includes(col);
            return (
              <div key={col} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`detail-vis-${col}`}
                  checked={isVisible}
                  onChange={() => toggleColumn(col)}
                  className="h-3.5 w-3.5 rounded border-gray-300"
                />
                <label htmlFor={`detail-vis-${col}`} className="text-xs flex-1">{col}</label>
                {isVisible && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => cycleVariant(col)}
                      className="flex items-center gap-0.5 h-5 rounded px-1 text-[10px] font-bold leading-none bg-muted hover:bg-muted/80 text-muted-foreground border border-border/50 transition-colors"
                      title="Variante de estilo"
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span key={n} className={`${n === getVariant(col) ? 'text-foreground' : 'text-muted-foreground/30'}`}>
                          {n === getVariant(col) ? '●' : '○'}
                        </span>
                      ))}
                      <span className="ml-0.5 text-[10px] text-muted-foreground">{getVariant(col)}</span>
                    </button>
                    <Select3D value={getFormat(col)} options={getCompatibleFormats(columnTypes[col]).map(f => ({value: f.value, label: f.label}))} onChange={(v) => setFormat(col, v)} className="w-32" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
