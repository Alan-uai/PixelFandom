'use client';

import { useMemo } from 'react';
import { Plus, X } from 'lucide-react';
import type { ScalingCurve } from '@/lib/scaling-engine';

const CURVES: { value: ScalingCurve; label: string }[] = [
  { value: 'linear', label: 'Linear' },
  { value: 'diminishing', label: 'Diminuindo (log)' },
  { value: 'exponential', label: 'Exponencial' },
  { value: 'step', label: 'Por degraus' },
];

interface StatRange {
  base: number;
  max: number;
  curve?: ScalingCurve;
  axis?: string;
}

function parseValue(value: string): Record<string, StatRange> {
  if (!value) return {};
  try {
    const p = JSON.parse(value);
    if (typeof p === 'object' && p !== null && !Array.isArray(p)) {
      const out: Record<string, StatRange> = {};
      for (const [k, v] of Object.entries(p)) {
        const obj = v as Record<string, unknown>;
        if (typeof obj !== 'object' || obj === null) continue;
        const base = Number(obj.base ?? obj.min);
        const max = Number(obj.max ?? obj.maxtier);
        if (!isFinite(base) || !isFinite(max)) continue;
        const r: StatRange = { base, max };
        if (obj.curve === 'linear' || obj.curve === 'diminishing' || obj.curve === 'exponential' || obj.curve === 'step') {
          r.curve = obj.curve;
        }
        if (typeof obj.axis === 'string') r.axis = obj.axis;
        out[k] = r;
      }
      return out;
    }
  } catch { /* fall through */ }
  return {};
}

export function BaseMaxEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const stats = useMemo(() => parseValue(value), [value]);
  const entries = Object.entries(stats);

  const emit = (next: Record<string, StatRange>) => {
    onChange(JSON.stringify(next, null, 2));
  };

  const updateKey = (oldKey: string, newKey: string) => {
    if (oldKey === newKey) return;
    const next: Record<string, StatRange> = {};
    for (const [k, v] of Object.entries(stats)) {
      next[k === oldKey ? newKey : k] = v;
    }
    emit(next);
  };

  const updateRange = (key: string, patch: Partial<StatRange>) => {
    emit({ ...stats, [key]: { ...stats[key], ...patch } });
  };

  const addStat = () => {
    const baseName = 'Novo Stat';
    let name = baseName;
    let i = 1;
    while (stats[name]) name = `${baseName} ${i++}`;
    emit({ ...stats, [name]: { base: 0, max: 100, curve: 'linear' } });
  };

  const removeStat = (key: string) => {
    const next = { ...stats };
    delete next[key];
    emit(next);
  };

  return (
    <div className="space-y-2">
      {entries.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Nenhum stat. Adicione um stat base→máx (ex: {`{ "Fogo Elemental": { "base": 25, "max": 75 } }`}).
        </p>
      )}

      {entries.map(([key, range]) => (
        <div key={key} className="rounded-lg border bg-background p-2 space-y-2">
          <div className="flex items-center gap-2">
            <input
              value={key}
              onChange={(e) => updateKey(key, e.target.value)}
              placeholder="Nome do stat (qualquer idioma)"
              className="flex-1 h-8 rounded-lg border bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <button
              type="button"
              onClick={() => removeStat(key)}
              className="p-1 text-muted-foreground hover:text-destructive transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Base</span>
              <input
                type="number"
                value={range.base}
                onChange={(e) => updateRange(key, { base: Number(e.target.value) })}
                className="h-8 rounded-lg border bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </label>
            <label className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Máx</span>
              <input
                type="number"
                value={range.max}
                onChange={(e) => updateRange(key, { max: Number(e.target.value) })}
                className="h-8 rounded-lg border bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Curva</span>
              <select
                value={range.curve ?? 'linear'}
                onChange={(e) => updateRange(key, { curve: e.target.value as ScalingCurve })}
                className="h-8 rounded-lg border bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                {CURVES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Eixo (opc.)</span>
              <input
                value={range.axis ?? ''}
                onChange={(e) => updateRange(key, { axis: e.target.value || undefined })}
                placeholder="ex: Nível"
                className="h-8 rounded-lg border bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </label>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addStat}
        className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
      >
        <Plus className="h-3 w-3" /> Adicionar stat
      </button>
    </div>
  );
}
