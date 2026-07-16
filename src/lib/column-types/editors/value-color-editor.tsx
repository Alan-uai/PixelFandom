'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Plus, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

const VALUE_COLOR_PRESETS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#78716c', '#a3a3a3',
];

interface ValueColorEditorProps {
  valueColors: Record<string, string>;
  onChange: (colors: Record<string, string>) => void;
  table?: string;
  columnName?: string;
  slug?: string;
  tenantId?: string;
}

export function ValueColorEditor({
  valueColors,
  onChange,
  table,
  columnName,
  slug,
  tenantId,
}: ValueColorEditorProps) {
  const [distinctValues, setDistinctValues] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [openColorFor, setOpenColorFor] = useState<string | null>(null);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current || !table || !columnName || !slug || !tenantId) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const { supabase } = await import('@/supabase/client');
        const { data: rows } = await supabase
          .from(table)
          .select(columnName);
        if (cancelled || !rows) return;
        const vals = new Set<string>();
        for (const row of rows) {
          const raw = (row as unknown as Record<string, unknown>)[columnName];
          if (raw === null || raw === undefined) continue;
          const str = String(raw);
          if (str.trim()) vals.add(str);
        }
        if (!cancelled) {
          setDistinctValues(Array.from(vals).sort());
          fetched.current = true;
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [table, columnName, slug, tenantId]);

  const setColor = useCallback((value: string, color: string) => {
    onChange({ ...valueColors, [value]: color });
    setOpenColorFor(null);
  }, [valueColors, onChange]);

  const removeColor = useCallback((value: string) => {
    if (!valueColors[value]) return;
    const next = { ...valueColors };
    delete next[value];
    onChange(next);
    setOpenColorFor(null);
  }, [valueColors, onChange]);

  const addCustomValue = useCallback(() => {
    const v = customValue.trim();
    if (!v) return;
    setDistinctValues((prev) => prev.includes(v) ? prev : [...prev, v].sort());
    setCustomValue('');
    setOpenColorFor(v);
  }, [customValue]);

  const allValues = [...distinctValues, ...Object.keys(valueColors).filter(k => !distinctValues.includes(k))];

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Atribua cores aos valores desta coluna. As cores são aplicadas ao texto dos valores na Wiki.
      </p>

      {loading ? (
        <p className="text-xs text-muted-foreground italic">Carregando valores...</p>
      ) : allValues.length === 0 && !customValue ? (
        <p className="text-xs text-muted-foreground italic">Nenhum valor encontrado. Adicione um valor manualmente abaixo.</p>
      ) : (
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {allValues.map((val) => {
            const color = valueColors[val];
            return (
              <div key={val} className="grid grid-cols-[1fr_auto] gap-2 items-center">
                <span className="text-xs text-foreground truncate">{val}</span>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenColorFor(openColorFor === val ? null : val)}
                    className={cn(
                      'h-6 w-6 rounded-md border flex items-center justify-center transition-all hover:scale-105',
                      color ? 'border-transparent' : 'border-dashed border-muted-foreground/40 hover:border-foreground',
                    )}
                    style={{ backgroundColor: color || 'transparent' }}
                    title={color ? `Cor: ${color}` : 'Definir cor'}
                  >
                    {!color && <Palette className="h-3 w-3 text-muted-foreground" />}
                  </button>
                  {openColorFor === val && (
                    <div className="absolute top-full right-0 mt-1 z-50 bg-card border rounded-lg p-2 shadow-xl min-w-[180px]">
                      <div className="flex flex-wrap gap-1">
                        {VALUE_COLOR_PRESETS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setColor(val, c)}
                            className={cn(
                              'h-5 w-5 rounded-full border transition-all hover:scale-110',
                              color === c ? 'border-foreground ring-2 ring-foreground/30' : 'border-border',
                            )}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <input
                          type="text"
                          value={color || ''}
                          onChange={(e) => setColor(val, e.target.value)}
                          placeholder="#ff6600"
                          className="flex-1 h-6 rounded border bg-background px-1.5 text-[10px] font-mono focus:outline-none focus:ring-1 focus:ring-primary/50"
                        />
                        <div className="h-5 w-5 rounded border shrink-0" style={{ backgroundColor: color || 'transparent' }} />
                      </div>
                      {color && (
                        <button
                          type="button"
                          onClick={() => removeColor(val)}
                          className="mt-1 text-[10px] text-muted-foreground hover:text-destructive transition-colors w-full text-left"
                        >
                          Remover cor
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <input
          type="text"
          value={customValue}
          onChange={(e) => setCustomValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomValue(); } }}
          placeholder="Adicionar valor manual..."
          className="flex-1 h-7 rounded-lg border bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <button
          type="button"
          onClick={addCustomValue}
          disabled={!customValue.trim()}
          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors disabled:opacity-30"
        >
          <Plus className="h-3 w-3" /> Adicionar
        </button>
      </div>
    </div>
  );
}
