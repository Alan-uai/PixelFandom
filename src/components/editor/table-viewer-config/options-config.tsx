'use client';

import { useMemo, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { SYSTEM_COLS } from '@/lib/categorizable-columns';
import {
  Plus, Trash2, GripVertical, ChevronDown, ChevronRight,
} from 'lucide-react';

const isSystemCol = (col: string) =>
  SYSTEM_COLS.has(col) || SYSTEM_COLS.has(col.toLowerCase());

interface AllowedValue {
  value: string;
  label?: string;
  color?: string;
  icon?: string;
  imageUrl?: string;
  linkedEntity?: string;
  autoFill?: Record<string, string>;
}

export function OptionsConfig({
  config,
  onChange,
  columns,
  columnTypes = {},
  items,
}: {
  config: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
  columns?: string[];
  columnTypes?: Record<string, string>;
  slug?: string;
  tenantId?: string;
  table?: string;
  items?: Record<string, unknown>[];
}) {
  const [selectedCol, setSelectedCol] = useState<string>('');
  const [expandedValue, setExpandedValue] = useState<string | null>(null);

  const selectColumns = useMemo(() => {
    return (columns || []).filter(
      (col) => !isSystemCol(col) && ['select', 'multi-select', 'toggle-group'].includes(columnTypes[col] || ''),
    );
  }, [columns, columnTypes]);

  const columnConfig = (config.columnConfig as Record<string, any> | undefined) || {};

  const cc = selectedCol ? (columnConfig[selectedCol] || {}) : {};
  const allowedValues: AllowedValue[] = cc.allowedValues || [];
  const restrictToValues = cc.restrictToValues ?? false;
  const maxSelect = cc.maxSelect ?? 0;
  const dependentField = cc.dependentField || '';

  const handleUpdate = (patch: Record<string, unknown>) => {
    const next = { ...config };
    const cc2 = { ...(next.columnConfig as Record<string, unknown> || {}) };
    cc2[selectedCol] = { ...(cc2[selectedCol] as Record<string, unknown> || {}), ...patch };
    next.columnConfig = cc2;
    onChange(next);
  };

  const addValue = () => {
    const n = `opcao_${allowedValues.length + 1}`;
    handleUpdate({ allowedValues: [...allowedValues, { value: n, label: n }] });
    setExpandedValue(n);
  };

  const updateValue = (idx: number, patch: Partial<AllowedValue>) => {
    const next = allowedValues.map((v, i) => (i === idx ? { ...v, ...patch } : v));
    handleUpdate({ allowedValues: next });
  };

  const removeValue = (idx: number) => {
    const next = allowedValues.filter((_, i) => i !== idx);
    handleUpdate({ allowedValues: next.length > 0 ? next : undefined });
  };

  const otherColumns = useMemo(
    () => (columns || []).filter((c) => c !== selectedCol && !isSystemCol(c)),
    [columns, selectedCol],
  );

  const existingValues = useMemo(() => {
    if (!selectedCol || !items) return [];
    const vals = new Set<string>();
    items.forEach((item) => {
      const raw = item[selectedCol];
      if (typeof raw === 'string') {
        try { JSON.parse(raw).forEach((v: string) => vals.add(v)); }
        catch { if (raw) vals.add(raw); }
      }
    });
    return Array.from(vals).sort();
  }, [selectedCol, items]);

  const unlistedExisting = existingValues.filter(
    (ev) => !allowedValues.some((av) => av.value === ev),
  );

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Configure opções para colunas do tipo select, multi-select e toggle-group.
      </p>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Coluna</Label>
        <div className="flex flex-wrap gap-1.5">
          {selectColumns.map((col) => (
            <button
              key={col}
              type="button"
              onClick={() => { setSelectedCol(col); setExpandedValue(null); }}
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

      {selectedCol ? (
        <div className="space-y-4 rounded-lg border bg-card p-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">{'Opções de "' + selectedCol + '"'}</Label>
            <button
              type="button"
              onClick={addValue}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              <Plus className="h-3 w-3" /> Adicionar
            </button>
          </div>

          <div className="flex items-center gap-3">
            <Label className="flex items-center gap-2 text-xs">
              <Switch
                checked={restrictToValues}
                onCheckedChange={(v) => handleUpdate({ restrictToValues: v })}
              />
              Restrito a opções
            </Label>
            {columnTypes[selectedCol] === 'multi-select' && (
              <Label className="flex items-center gap-2 text-xs">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={maxSelect || ''}
                  onChange={(e) => handleUpdate({ maxSelect: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-14 h-7 rounded border bg-background px-1.5 text-xs text-center"
                  placeholder="0"
                />
                Máx. seleções (0 = ilimitado)
              </Label>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Campo dependente (autoFill)</Label>
            <select
              value={dependentField}
              onChange={(e) => handleUpdate({ dependentField: e.target.value || undefined })}
              className="w-full h-8 rounded-lg border bg-background px-2 text-xs"
            >
              <option value="">Nenhum</option>
              {otherColumns.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {dependentField && (
              <p className="text-[10px] text-muted-foreground mt-1">
                {'Ao selecionar uma opção, o campo "' + dependentField + '" será preenchido automaticamente conforme o autoFill configurado.'}
              </p>
            )}
          </div>

          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {allowedValues.length === 0 && (
              <p className="text-xs text-muted-foreground italic py-2">
                {'Nenhuma opção configurada. Clique em "Adicionar" para começar.'}
              </p>
            )}
            {allowedValues.map((av, idx) => (
              <div key={idx} className="rounded-md border bg-background/50">
                <button
                  type="button"
                  onClick={() => setExpandedValue(expandedValue === av.value ? null : av.value)}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-xs"
                >
                  <GripVertical className="h-3 w-3 text-muted-foreground shrink-0 cursor-grab" />
                  {expandedValue === av.value ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  {av.color && (
                    <span className="inline-block h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: av.color }} />
                  )}
                  <span className="font-medium">{av.label || av.value}</span>
                  <span className="text-muted-foreground">({av.value})</span>
                  {av.linkedEntity && <span className="text-primary ml-auto text-[10px]">🔗 {av.linkedEntity}</span>}
                </button>

                {expandedValue === av.value && (
                  <div className="space-y-2 px-2.5 pb-3 border-t pt-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Valor (slug)</Label>
                        <input
                          type="text"
                          value={av.value}
                          onChange={(e) => updateValue(idx, { value: e.target.value })}
                          className="w-full h-7 rounded border bg-background px-1.5 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Label (exibição)</Label>
                        <input
                          type="text"
                          value={av.label || ''}
                          onChange={(e) => updateValue(idx, { label: e.target.value })}
                          className="w-full h-7 rounded border bg-background px-1.5 text-xs"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Cor</Label>
                        <input
                          type="color"
                          value={av.color || '#ffffff'}
                          onChange={(e) => updateValue(idx, { color: e.target.value === '#ffffff' ? undefined : e.target.value })}
                          className="w-full h-7 rounded border bg-background cursor-pointer"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-muted-foreground">Ícone (ex: mdi:sword)</Label>
                        <input
                          type="text"
                          value={av.icon || ''}
                          onChange={(e) => updateValue(idx, { icon: e.target.value })}
                          className="w-full h-7 rounded border bg-background px-1.5 text-xs"
                          placeholder="mdi:sword"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-[10px] text-muted-foreground">Entidade linkada (slug do item)</Label>
                        <input
                          type="text"
                          value={av.linkedEntity || ''}
                          onChange={(e) => updateValue(idx, { linkedEntity: e.target.value })}
                          className="w-full h-7 rounded border bg-background px-1.5 text-xs font-mono"
                          placeholder="espada-de-fogo-legendary"
                        />
                      </div>
                    </div>

                    {dependentField && (
                      <div>
                        <Label className="text-[10px] text-muted-foreground">
                          {'AutoFill para "' + dependentField + '"'}
                        </Label>
                        <input
                          type="text"
                          value={av.autoFill?.[dependentField] || ''}
                          onChange={(e) => {
                            const af = { ...(av.autoFill || {}), [dependentField]: e.target.value };
                            updateValue(idx, { autoFill: af });
                          }}
                          className="w-full h-7 rounded border bg-background px-1.5 text-xs font-mono"
                          placeholder="Valor a preencher automaticamente"
                        />
                      </div>
                    )}

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => removeValue(idx)}
                        className="flex items-center gap-1 text-[10px] text-destructive hover:text-destructive/80 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" /> Remover
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {unlistedExisting.length > 0 && (
            <div className="border-t pt-3 mt-2">
              <Label className="text-xs text-muted-foreground mb-1 block">
                Valores existentes não listados ({unlistedExisting.length})
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {unlistedExisting.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleUpdate({ allowedValues: [...allowedValues, { value: val, label: val }] })}
                    className="text-[10px] px-2 py-0.5 rounded-full border border-dashed border-primary/30 text-primary hover:bg-primary/5 transition-colors"
                  >
                    + {val}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">
          Selecione uma coluna do tipo select, multi-select ou toggle-group para configurar suas opções.
        </p>
      )}
    </div>
  );
}
