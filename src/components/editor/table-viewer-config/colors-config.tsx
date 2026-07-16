'use client';

import { useState, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { ValueColorEditor } from '@/lib/column-types/editors/value-color-editor';
import { cn } from '@/lib/utils';
import { SYSTEM_COLS } from '@/lib/categorizable-columns';

const isSystemCol = (col: string) => {
  if (SYSTEM_COLS.has(col)) return true;
  if (SYSTEM_COLS.has(col.toLowerCase())) return true;
  return false;
};

export function ColorsConfig({
  config,
  onChange,
  columns,
  slug,
  tenantId,
  table,
}: {
  config: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
  columns?: string[];
  slug?: string;
  tenantId?: string;
  table?: string;
}) {
  const [selectedCol, setSelectedCol] = useState<string>('');

  const valueColumns = useMemo(() => {
    return (columns || []).filter(col => !isSystemCol(col));
  }, [columns]);

  const columnConfig = (config.columnConfig as Record<string, { valueColors?: Record<string, string> }> | undefined) || {};

  const currentValueColors = selectedCol ? columnConfig[selectedCol]?.valueColors || {} : {};

  const handleValueColorsChange = (colors: Record<string, string>) => {
    const next = { ...config };
    const cc = { ...(next.columnConfig as Record<string, unknown> || {}) };
    cc[selectedCol] = { ...(cc[selectedCol] as Record<string, unknown> || {}), valueColors: colors };
    next.columnConfig = cc;
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Configure cores para valores específicos de colunas. A cor é aplicada ao texto do valor na Wiki.
      </p>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Coluna</Label>
        <div className="flex flex-wrap gap-1.5">
          {valueColumns.map((col) => (
            <button
              key={col}
              type="button"
              onClick={() => setSelectedCol(col)}
              className={cn(
                'text-xs px-2.5 py-1 rounded-lg border transition-colors',
                selectedCol === col
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-card border-border/50 text-muted-foreground hover:border-primary/30',
              )}
            >
              {col}
            </button>
          ))}
        </div>
      </div>

      {selectedCol && (
        <div className="rounded-lg border bg-card p-3">
          <Label className="text-xs text-muted-foreground mb-2 block">
            Cores para &ldquo;{selectedCol}&rdquo;
          </Label>
          <ValueColorEditor
            valueColors={currentValueColors}
            onChange={handleValueColorsChange}
            table={table}
            columnName={selectedCol}
            slug={slug}
            tenantId={tenantId}
          />
        </div>
      )}

      {!selectedCol && (
        <p className="text-xs text-muted-foreground italic">Selecione uma coluna acima para configurar suas cores.</p>
      )}
    </div>
  );
}
