'use client';
import { useCallback, useState } from 'react';
import { Plus, X, Palette } from 'lucide-react';
import { SmartValueInput } from './smart-value-input';
import { cn } from '@/lib/utils';

interface JsonbKeyEntry {
  type: 'number' | 'text' | 'boolean';
  suffix?: string;
}

const KEY_COLOR_PRESETS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
];

export function SimpleObjectEditor({
  entries,
  onEntriesChange,
  keyTypes,
  onKeyTypesChange,
  jsonbKeyColors,
  onKeyColorsChange,
}: {
  entries: [string, string][];
  onEntriesChange: (entries: [string, string][]) => void;
  keyTypes: Record<string, JsonbKeyEntry>;
  onKeyTypesChange: (types: Record<string, JsonbKeyEntry>) => void;
  jsonbKeyColors?: Record<string, string>;
  onKeyColorsChange?: (colors: Record<string, string>) => void;
}) {
  const [openColorKey, setOpenColorKey] = useState<string | null>(null);

  const updateEntry = useCallback((index: number, key: string, val: string) => {
    const next = [...entries];
    next[index] = [key, val];
    onEntriesChange(next);
  }, [entries, onEntriesChange]);

  const removeEntry = useCallback((index: number) => {
    const removed = entries[index][0];
    const next = entries.filter((_, i) => i !== index);
    onEntriesChange(next);
    if (removed && keyTypes[removed]) {
      const kt = { ...keyTypes };
      delete kt[removed];
      onKeyTypesChange(kt);
    }
    if (removed && jsonbKeyColors?.[removed] && onKeyColorsChange) {
      const kc = { ...jsonbKeyColors };
      delete kc[removed];
      onKeyColorsChange(kc);
    }
  }, [entries, keyTypes, jsonbKeyColors, onEntriesChange, onKeyTypesChange, onKeyColorsChange]);

  const addEntry = useCallback(() => {
    onEntriesChange([...entries, ['', '']]);
  }, [entries, onEntriesChange]);

  const handleKeyChange = useCallback((index: number, newKey: string) => {
    const oldKey = entries[index][0];
    const next = [...entries];
    next[index] = [newKey, entries[index][1]];
    onEntriesChange(next);
    if (oldKey !== newKey) {
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
  }, [entries, keyTypes, jsonbKeyColors, onEntriesChange, onKeyTypesChange, onKeyColorsChange]);

  const handleTypeChange = useCallback((key: string, type: 'number' | 'text' | 'boolean') => {
    onKeyTypesChange({ ...keyTypes, [key]: { ...keyTypes[key], type } });
  }, [keyTypes, onKeyTypesChange]);

  const handleSuffixChange = useCallback((key: string, suffix: string) => {
    onKeyTypesChange({ ...keyTypes, [key]: { ...keyTypes[key], type: 'number', suffix } });
  }, [keyTypes, onKeyTypesChange]);

  const setKeyColor = useCallback((key: string, color: string) => {
    if (onKeyColorsChange) {
      onKeyColorsChange({ ...(jsonbKeyColors || {}), [key]: color });
    }
    setOpenColorKey(null);
  }, [jsonbKeyColors, onKeyColorsChange]);

  const removeKeyColor = useCallback((key: string) => {
    if (jsonbKeyColors?.[key] && onKeyColorsChange) {
      const kc = { ...jsonbKeyColors };
      delete kc[key];
      onKeyColorsChange(kc);
    }
    setOpenColorKey(null);
  }, [jsonbKeyColors, onKeyColorsChange]);

  return (
    <div className="space-y-1">
      {entries.map(([key, val], i) => (
        <div key={i} className="grid grid-cols-[auto_1fr_1fr_auto] gap-1.5 items-center">
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenColorKey(openColorKey === key ? null : key)}
              className={cn(
                'h-7 w-7 rounded-md border flex items-center justify-center transition-all hover:scale-105',
                jsonbKeyColors?.[key]
                  ? 'border-transparent'
                  : 'border-dashed border-muted-foreground/40 hover:border-foreground',
              )}
              style={{ backgroundColor: jsonbKeyColors?.[key] || 'transparent' }}
              title="Cor do label"
            >
              {!jsonbKeyColors?.[key] && <Palette className="h-3 w-3 text-muted-foreground" />}
            </button>
            {openColorKey === key && (
              <div className="absolute top-full left-0 mt-1 z-50 bg-card border rounded-lg p-2 shadow-xl min-w-[160px]">
                <div className="flex flex-wrap gap-1">
                  {KEY_COLOR_PRESETS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setKeyColor(key, c)}
                      className={cn(
                        'h-5 w-5 rounded-full border transition-all hover:scale-110',
                        jsonbKeyColors?.[key] === c ? 'border-foreground ring-2 ring-foreground/30' : 'border-border',
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <input
                    type="text"
                    value={jsonbKeyColors?.[key] || ''}
                    onChange={(e) => setKeyColor(key, e.target.value)}
                    placeholder="#ff6600"
                    className="flex-1 h-6 rounded border bg-background px-1.5 text-[10px] font-mono focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                  <div className="h-5 w-5 rounded border shrink-0" style={{ backgroundColor: jsonbKeyColors?.[key] || 'transparent' }} />
                </div>
                {jsonbKeyColors?.[key] && (
                  <button
                    type="button"
                    onClick={() => removeKeyColor(key)}
                    className="mt-1 text-[10px] text-muted-foreground hover:text-destructive transition-colors w-full text-left"
                  >
                    Remover cor
                  </button>
                )}
              </div>
            )}
          </div>
          <input
            value={key}
            onChange={(e) => handleKeyChange(i, e.target.value)}
            className="h-8 rounded-lg border bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="Label"
          />
          <SmartValueInput
            value={val}
            onChange={(v) => updateEntry(i, entries[i][0], v)}
            persistedType={keyTypes[key]?.type}
            persistedSuffix={keyTypes[key]?.suffix}
            onTypeChange={(t) => handleTypeChange(key, t)}
            onSuffixChange={(s) => handleSuffixChange(key, s)}
          />
          <button
            type="button"
            onClick={() => removeEntry(i)}
            className="p-1 text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
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
