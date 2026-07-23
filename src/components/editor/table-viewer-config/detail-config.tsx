'use client';

import { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select3D } from '@/components/ui/select3d';
import { getCompatibleFormats, getDefaultFormat } from '@/lib/column-types/format-compatibility';
import { SYSTEM_COLS, WIKI_MGMT_COLS } from '@/lib/categorizable-columns';

const LABEL_COLS = new Set(['name', 'title', 'description', 'summary', 'slug']);
const BADGE_COLS = new Set(['rarity', 'tier', 'element']);
const SYSTEM_COLS_EXT = new Set([...SYSTEM_COLS, ...WIKI_MGMT_COLS]);

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
  const columnOpEnabled: Record<string, boolean> = c.columnOpEnabled || {};
  const columnOpFlipped: Record<string, boolean> = c.columnOpFlipped || {};

  const getOpState = (col: string): 'off' | 'on' | 'flipped' => {
    if (columnOpEnabled[col] === false) return 'off';
    return columnOpFlipped[col] === true ? 'flipped' : 'on';
  };

  const cycleOp = (col: string) => {
    const state = getOpState(col);
    switch (state) {
      case 'off':
        onChange({ ...c, columnOpEnabled: { ...columnOpEnabled, [col]: true }, columnOpFlipped: { ...columnOpFlipped, [col]: false } });
        break;
      case 'on':
        onChange({ ...c, columnOpFlipped: { ...columnOpFlipped, [col]: true } });
        break;
      case 'flipped':
        onChange({ ...c, columnOpEnabled: { ...columnOpEnabled, [col]: false }, columnOpFlipped: { ...columnOpFlipped, [col]: false } });
        break;
    }
  };

  // When visibleColumns is empty (first access), treat all eligible columns as visible
  const effectiveVisible = useMemo(() => {
    const visibleColumns: string[] = c.visibleColumns || [];
    if (visibleColumns.length > 0) return visibleColumns;
    return columns.filter(col => !SYSTEM_COLS_EXT.has(col) && !LABEL_COLS.has(col) && !BADGE_COLS.has(col));
  }, [c.visibleColumns, columns]);

  const toggleColumn = (col: string) => {
    const wasVisible = effectiveVisible.includes(col);
    if (wasVisible) {
      onChange({ ...c, visibleColumns: effectiveVisible.filter(c => c !== col) });
    } else {
      const next = [...effectiveVisible, col];
      const fmt = getDefaultFormat(columnTypes[col]);
      const formats = { ...columnFormats, [col]: fmt };
      onChange({ ...c, visibleColumns: next, columnFormats: formats });
    }
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
            if (SYSTEM_COLS_EXT.has(col) || LABEL_COLS.has(col)) return null;
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
                      onClick={() => cycleOp(col)}
                      className={`h-5 rounded px-1.5 text-[10px] font-bold leading-none border transition-colors ${
                        getOpState(col) === 'off'
                          ? 'bg-muted hover:bg-muted/80 text-muted-foreground border-border/50'
                          : getOpState(col) === 'flipped'
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                          : 'bg-primary/10 border-primary/30 text-primary'
                      }`}
                      title={getOpState(col) === 'off' ? 'Ativar operadores (×, −, +)' : getOpState(col) === 'flipped' ? 'Ordem invertida: valor antes do label' : 'Clique para inverter ordem'}
                    >
                      {getOpState(col) === 'off' ? 'OP' : getOpState(col) === 'flipped' ? 'OP↔' : 'OP→'}
                    </button>
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
