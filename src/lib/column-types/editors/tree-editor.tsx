'use client';
import { useCallback, useState } from 'react';
import { Plus, X, Palette, Type, Braces, Brackets } from 'lucide-react';
import { SmartValueInput } from './smart-value-input';
import { cn } from '@/lib/utils';

interface JsonbKeyEntry {
  type: 'number' | 'text' | 'boolean';
  suffix?: string;
}

export interface TreeEntry {
  key: string;
  kind: 'scalar' | 'object' | 'array';
  scalarValue: string;
  children: TreeEntry[];
}

const KEY_COLOR_PRESETS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
];

// ── Serialization ──

function serializeEntry(entry: TreeEntry): unknown {
  switch (entry.kind) {
    case 'scalar': {
      const s = entry.scalarValue.trim();
      if (s === '') return '';
      if (s === 'true') return true;
      if (s === 'false') return false;
      if (s === 'null') return null;
      const n = Number(s);
      if (!isNaN(n) && s !== '') return n;
      return s;
    }
    case 'object': {
      const obj: Record<string, unknown> = {};
      for (const child of entry.children) {
        obj[child.key] = serializeEntry(child);
      }
      return obj;
    }
    case 'array': {
      return entry.children.map((child) => serializeEntry(child));
    }
  }
}

export function treeEntriesToJson(
  entries: TreeEntry[],
  rootKind: 'object' | 'array',
): unknown {
  if (rootKind === 'array') {
    return entries.map((e) => serializeEntry(e));
  }
  const obj: Record<string, unknown> = {};
  for (const entry of entries) {
    obj[entry.key] = serializeEntry(entry);
  }
  return obj;
}

// ── Deserialization ──

function jsonToEntry(key: string, val: unknown): TreeEntry {
  if (typeof val === 'object' && val !== null) {
    if (Array.isArray(val)) {
      return {
        key,
        kind: 'array',
        scalarValue: '',
        children: val.map((item, i) => jsonToEntry(String(i), item)),
      };
    }
    return {
      key,
      kind: 'object',
      scalarValue: '',
      children: Object.entries(val).map(([k, v]) => jsonToEntry(k, v)),
    };
  }
  return {
    key,
    kind: 'scalar',
    scalarValue: val === null ? '' : String(val),
    children: [],
  };
}

export function jsonToTreeEntries(
  value: unknown,
  fallbackKind: 'object' | 'array' = 'object',
): { rootKind: 'object' | 'array'; entries: TreeEntry[] } {
  if (typeof value === 'object' && value !== null) {
    if (Array.isArray(value)) {
      return {
        rootKind: 'array',
        entries: value.map((item, i) => jsonToEntry(String(i), item)),
      };
    }
    return {
      rootKind: 'object',
      entries: Object.entries(value).map(([k, v]) => jsonToEntry(k, v)),
    };
  }
  return { rootKind: fallbackKind, entries: [] };
}

// ── Kind toggle ──

const KIND_LABEL: Record<string, string> = {
  scalar: 'Texto',
  object: 'Objeto',
  array: 'Lista',
};

function KindToggle({
  kind,
  onChange,
}: {
  kind: 'scalar' | 'object' | 'array';
  onChange: (kind: 'scalar' | 'object' | 'array') => void;
}) {
  const Icon = kind === 'scalar' ? Type : kind === 'object' ? Braces : Brackets;
  return (
    <button
      type="button"
      onClick={() => {
        const order: ('scalar' | 'object' | 'array')[] = ['scalar', 'object', 'array'];
        const idx = order.indexOf(kind);
        onChange(order[(idx + 1) % 3]);
      }}
      className={cn(
        'h-7 w-7 shrink-0 rounded-md border flex items-center justify-center transition-all',
        kind === 'scalar' &&
          'border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/60',
        kind === 'object' &&
          'border-amber-500/40 bg-amber-500/10 text-amber-400 hover:border-amber-500/60',
        kind === 'array' &&
          'border-sky-500/40 bg-sky-500/10 text-sky-400 hover:border-sky-500/60',
      )}
      title={KIND_LABEL[kind]}
    >
      <Icon className="h-3 w-3" />
    </button>
  );
}

// ── Color swatch ──

function ColorSwatch({
  color,
  onChange,
  onRemove,
}: {
  color?: string;
  onChange: (c: string) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'h-7 w-7 rounded-md border flex items-center justify-center transition-all hover:scale-105',
          color
            ? 'border-transparent'
            : 'border-dashed border-muted-foreground/40 hover:border-foreground',
        )}
        style={{ backgroundColor: color || 'transparent' }}
        title="Cor do label"
      >
        {!color && <Palette className="h-3 w-3 text-muted-foreground" />}
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-card border rounded-lg p-2 shadow-xl min-w-[160px]">
          <div className="flex flex-wrap gap-1">
            {KEY_COLOR_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  onChange(c);
                  setOpen(false);
                }}
                className={cn(
                  'h-5 w-5 rounded-full border transition-all hover:scale-110',
                  color === c
                    ? 'border-foreground ring-2 ring-foreground/30'
                    : 'border-border',
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <input
              type="text"
              value={color || ''}
              onChange={(e) => {
                onChange(e.target.value);
              }}
              placeholder="#ff6600"
              className="flex-1 h-6 rounded border bg-background px-1.5 text-[10px] font-mono focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            <div
              className="h-5 w-5 rounded border shrink-0"
              style={{ backgroundColor: color || 'transparent' }}
            />
          </div>
          {color && (
            <button
              type="button"
              onClick={() => {
                onRemove();
                setOpen(false);
              }}
              className="mt-1 text-[10px] text-muted-foreground hover:text-destructive transition-colors w-full text-left"
            >
              Remover cor
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── TreeEditor ──

export function TreeEditor({
  entries,
  onEntriesChange,
  keyTypes,
  onKeyTypesChange,
  jsonbKeyColors,
  onKeyColorsChange,
  depth = 0,
}: {
  entries: TreeEntry[];
  onEntriesChange: (entries: TreeEntry[]) => void;
  keyTypes: Record<string, JsonbKeyEntry>;
  onKeyTypesChange: (types: Record<string, JsonbKeyEntry>) => void;
  jsonbKeyColors?: Record<string, string>;
  onKeyColorsChange?: (colors: Record<string, string>) => void;
  depth?: number;
}) {
  const addEntry = useCallback(() => {
    onEntriesChange([
      ...entries,
      { key: '', kind: 'scalar', scalarValue: '', children: [] },
    ]);
  }, [entries, onEntriesChange]);

  const updateEntry = useCallback(
    (index: number, updated: TreeEntry) => {
      const next = [...entries];
      next[index] = updated;
      onEntriesChange(next);
    },
    [entries, onEntriesChange],
  );

  const removeEntry = useCallback(
    (index: number) => {
      const removed = entries[index];
      if (depth === 0 && removed.key) {
        if (keyTypes[removed.key]) {
          const kt = { ...keyTypes };
          delete kt[removed.key];
          onKeyTypesChange(kt);
        }
        if (jsonbKeyColors?.[removed.key] && onKeyColorsChange) {
          const kc = { ...jsonbKeyColors };
          delete kc[removed.key];
          onKeyColorsChange(kc);
        }
      }
      onEntriesChange(entries.filter((_, i) => i !== index));
    },
    [entries, depth, keyTypes, jsonbKeyColors, onEntriesChange, onKeyTypesChange, onKeyColorsChange],
  );

  const handleKeyChange = useCallback(
    (index: number, newKey: string) => {
      const entry = entries[index];
      const oldKey = entry.key;
      if (oldKey === newKey) return;
      const next = [...entries];
      next[index] = { ...entry, key: newKey };
      onEntriesChange(next);
      if (depth === 0) {
        if (keyTypes[oldKey]) {
          const kt = { ...keyTypes };
          kt[newKey] = kt[oldKey];
          delete kt[oldKey];
          onKeyTypesChange(kt);
        }
        if (jsonbKeyColors?.[oldKey] && onKeyColorsChange) {
          const kc = { ...jsonbKeyColors };
          kc[newKey] = kc[oldKey];
          delete kc[oldKey];
          onKeyColorsChange(kc);
        }
      }
    },
    [entries, depth, keyTypes, jsonbKeyColors, onEntriesChange, onKeyTypesChange, onKeyColorsChange],
  );

  const setKind = useCallback(
    (index: number, kind: 'scalar' | 'object' | 'array') => {
      const entry = entries[index];
      if (entry.kind === kind) return;
      if (kind === 'scalar') {
        updateEntry(index, { ...entry, kind, children: [] });
      } else {
        updateEntry(index, { ...entry, kind, scalarValue: '', children: [] });
      }
    },
    [entries, updateEntry],
  );

  const handleTypeChange = useCallback(
    (key: string, type: 'number' | 'text' | 'boolean') => {
      if (depth > 0) return;
      onKeyTypesChange({ ...keyTypes, [key]: { ...keyTypes[key], type } });
    },
    [depth, keyTypes, onKeyTypesChange],
  );

  const handleSuffixChange = useCallback(
    (key: string, suffix: string) => {
      if (depth > 0) return;
      onKeyTypesChange({
        ...keyTypes,
        [key]: { ...keyTypes[key], type: 'number', suffix },
      });
    },
    [depth, keyTypes, onKeyTypesChange],
  );

  const setKeyColor = useCallback(
    (key: string, color: string) => {
      if (depth > 0 || !onKeyColorsChange) return;
      onKeyColorsChange({ ...(jsonbKeyColors || {}), [key]: color });
    },
    [depth, jsonbKeyColors, onKeyColorsChange],
  );

  const removeKeyColor = useCallback(
    (key: string) => {
      if (depth > 0 || !jsonbKeyColors?.[key] || !onKeyColorsChange) return;
      const kc = { ...jsonbKeyColors };
      delete kc[key];
      onKeyColorsChange(kc);
    },
    [depth, jsonbKeyColors, onKeyColorsChange],
  );

  const handleScalarChange = useCallback(
    (index: number, val: string) => {
      const entry = entries[index];
      updateEntry(index, { ...entry, scalarValue: val });
    },
    [entries, updateEntry],
  );

  const handleChildrenChange = useCallback(
    (index: number, children: TreeEntry[]) => {
      const entry = entries[index];
      updateEntry(index, { ...entry, children });
    },
    [entries, updateEntry],
  );

  return (
    <div className={cn(depth > 0 && 'ml-3 pl-3 border-l border-border/30')}>
      <div className="space-y-1">
        {entries.map((entry, i) => (
          <div key={i} className="grid grid-cols-[auto_1fr_auto_1fr_auto] gap-1.5 items-start">
            {depth === 0 ? (
              <ColorSwatch
                color={jsonbKeyColors?.[entry.key]}
                onChange={(c) => setKeyColor(entry.key, c)}
                onRemove={() => removeKeyColor(entry.key)}
              />
            ) : (
              <div className="h-7 w-7 shrink-0" />
            )}

            <input
              value={entry.key}
              onChange={(e) => handleKeyChange(i, e.target.value)}
              className="h-8 rounded-lg border bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Label"
            />

            <KindToggle kind={entry.kind} onChange={(k) => setKind(i, k)} />

            {entry.kind === 'scalar' ? (
              <SmartValueInput
                value={entry.scalarValue}
                onChange={(v) => handleScalarChange(i, v)}
                persistedType={depth === 0 ? keyTypes[entry.key]?.type : undefined}
                persistedSuffix={depth === 0 ? keyTypes[entry.key]?.suffix : undefined}
                onTypeChange={
                  depth === 0 ? (t) => handleTypeChange(entry.key, t) : undefined
                }
                onSuffixChange={
                  depth === 0 ? (s) => handleSuffixChange(entry.key, s) : undefined
                }
              />
            ) : (
              <div className="col-span-1">
                <TreeEditor
                  entries={entry.children}
                  onEntriesChange={(c) => handleChildrenChange(i, c)}
                  keyTypes={{}}
                  onKeyTypesChange={() => {}}
                  jsonbKeyColors={{}}
                  onKeyColorsChange={() => {}}
                  depth={depth + 1}
                />
                <button
                  type="button"
                  onClick={() => {
                    handleChildrenChange(i, [
                      ...entry.children,
                      { key: '', kind: 'scalar', scalarValue: '', children: [] },
                    ]);
                  }}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors mt-1"
                >
                  <Plus className="h-3 w-3" /> Adicionar
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => removeEntry(i)}
              className="p-1 text-muted-foreground hover:text-destructive transition-colors shrink-0 self-start mt-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addEntry}
        className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors pt-1"
      >
        <Plus className="h-3 w-3" /> Adicionar
      </button>
    </div>
  );
}
