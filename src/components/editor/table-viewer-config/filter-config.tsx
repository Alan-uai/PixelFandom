'use client';

import { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select3D } from '@/components/ui/select3d';
import { Loader2, Filter } from 'lucide-react';

const SYSTEM_COLS = new Set(['id', 'tenant_id', 'created_at', 'updated_at', 'slug', 'embedding']);
const LONG_TEXT_COLS = new Set([
  'description', 'effects', 'weakness', 'notes', 'strategy', 'tips',
  'content', 'details', 'items_dropped', 'notable_loot',
]);

const CATEGORY_LABELS: Record<string, string> = {
  world: 'Mundo', tier: 'Tier', rarity: 'Raridade', mark: 'Marca',
  weapon: 'Arma', enemy: 'Inimigo', boss: 'Chefe', element: 'Elemento',
  difficulty: 'Dificuldade', type: 'Tipo', category: 'Categoria',
};

function deriveLabel(col: string): string {
  const base = col.replace(/^(is_|has_)/, '').replace(/_type$/, '');
  return CATEGORY_LABELS[base] ?? CATEGORY_LABELS[col] ?? col.replace(/_/g, ' ');
}

export function FilterConfig({
  config,
  columns = [],
  onChange,
  items,
  itemsLoading,
}: {
  config: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
  columns?: string[];
  slug?: string;
  items?: Record<string, unknown>[];
  itemsLoading?: boolean;
}) {
  const c: Record<string, any> = config || {};

  const detectedColumns = useMemo(() => {
    if (!items || items.length === 0) return [];

    const result: { column: string; values: string[]; defaultMode: 'single' | 'multiple' }[] = [];

    for (const col of columns) {
      if (SYSTEM_COLS.has(col) || LONG_TEXT_COLS.has(col)) continue;
      if (col.endsWith('_id') || col.endsWith('_url')) continue;

      const values = new Set<string>();
      for (const item of items) {
        const v = item[col];
        if (v != null && v !== '' && v !== 'none') values.add(String(v));
      }

      if (values.size >= 2) {
        result.push({
          column: col,
          values: Array.from(values).sort(),
          defaultMode: values.size > 2 ? 'multiple' : 'single',
        });
      }
    }
    return result;
  }, [items, columns]);

  const savedColumns = (c.columns as any[]) || [];

  const getState = (col: string) => {
    const saved = savedColumns.find((fc: any) => fc.column === col);
    const detected = detectedColumns.find((dc) => dc.column === col);
    return {
      enabled: saved !== undefined ? saved.enabled !== false : true,
      mode: saved?.mode || detected?.defaultMode || 'multiple',
    };
  };

  const updateColumn = (col: string, updates: Record<string, unknown>) => {
    const existing = [...savedColumns];
    const idx = existing.findIndex((fc: any) => fc.column === col);
    if (idx >= 0) {
      existing[idx] = { ...existing[idx], ...updates };
    } else {
      existing.push({ column: col, ...updates });
    }
    onChange({ ...c, columns: existing, autoDetect: true });
  };

  const enabledCount = detectedColumns.filter((dc) => getState(dc.column).enabled).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Switch
          id="filters-enabled"
          checked={c.enabled !== false}
          onCheckedChange={(v) => onChange({ ...c, enabled: v })}
        />
        <Label htmlFor="filters-enabled" className="text-xs">Filtros habilitados</Label>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-primary" />
          <Label className="text-xs font-medium">Filtros detectados automaticamente</Label>
          {!itemsLoading && (
            <span className="text-[10px] text-muted-foreground ml-auto">
              {enabledCount} de {detectedColumns.length} ativo{detectedColumns.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {itemsLoading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Carregando dados...
          </div>
        ) : items && items.length > 0 ? (
          detectedColumns.length > 0 ? (
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {detectedColumns.map(({ column, values, defaultMode: _defaultMode }) => {
                const { enabled, mode } = getState(column);
                return (
                  <div
                    key={column}
                    className={`flex items-center gap-2 rounded-md border px-3 py-1.5 transition-colors ${
                      enabled ? 'bg-background' : 'bg-muted/30 opacity-60'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => updateColumn(column, { enabled: !enabled })}
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium border transition-colors ${
                        enabled
                          ? 'bg-primary/10 border-primary/30 text-primary'
                          : 'bg-card border-border/50 text-muted-foreground'
                      }`}
                    >
                      {enabled ? 'ON' : 'OFF'}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium">{deriveLabel(column)}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {values.length} {values.length === 1 ? 'valor' : 'valores'}
                        </span>
                      </div>
                      {enabled && (
                        <div className="flex flex-wrap gap-0.5 mt-0.5">
                          {values.slice(0, 5).map((v) => (
                            <span key={v} className="text-[10px] text-muted-foreground/60 bg-muted/40 rounded px-1 py-0 truncate max-w-[80px]">
                              {v}
                            </span>
                          ))}
                          {values.length > 5 && (
                            <span className="text-[10px] text-muted-foreground/40">+{values.length - 5}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {enabled && (
                      <Select3D label="Modo de seleção" value={mode} options={[{label: 'Único', value: 'single'}, {label: 'Múltiplo', value: 'multiple'}]} onChange={(v) => updateColumn(column, { mode: v })} className="w-32" />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground py-0.5">
              Nenhuma coluna com valores suficientes para filtro encontrada.
            </p>
          )
        ) : (
          <p className="text-[10px] text-muted-foreground py-0.5">
            Adicione dados à tabela para detectar automaticamente os filtros.
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 pt-2 border-t">
        <Switch
          id="show-clear"
          checked={c.showClearButton !== false}
          onCheckedChange={(v) => onChange({ ...c, showClearButton: v })}
        />
        <Label htmlFor="show-clear" className="text-xs">Exibir botão &quot;Limpar filtros&quot;</Label>
      </div>
    </div>
  );
}
