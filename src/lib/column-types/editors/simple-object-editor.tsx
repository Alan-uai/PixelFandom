'use client';
import { useCallback } from 'react';
import { Plus, X } from 'lucide-react';
import { SmartValueInput } from './smart-value-input';

interface JsonbKeyEntry {
  type: 'number' | 'text' | 'boolean';
  suffix?: string;
}

export function SimpleObjectEditor({
  entries,
  onEntriesChange,
  keyTypes,
  onKeyTypesChange,
}: {
  entries: [string, string][];
  onEntriesChange: (entries: [string, string][]) => void;
  keyTypes: Record<string, JsonbKeyEntry>;
  onKeyTypesChange: (types: Record<string, JsonbKeyEntry>) => void;
}) {
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
  }, [entries, keyTypes, onEntriesChange, onKeyTypesChange]);

  const addEntry = useCallback(() => {
    onEntriesChange([...entries, ['', '']]);
  }, [entries, onEntriesChange]);

  const handleKeyChange = useCallback((index: number, newKey: string) => {
    const oldKey = entries[index][0];
    const next = [...entries];
    next[index] = [newKey, entries[index][1]];
    onEntriesChange(next);
    if (oldKey !== newKey && keyTypes[oldKey]) {
      const kt = { ...keyTypes };
      kt[newKey] = kt[oldKey];
      delete kt[oldKey];
      onKeyTypesChange(kt);
    }
  }, [entries, keyTypes, onEntriesChange, onKeyTypesChange]);

  const handleTypeChange = useCallback((key: string, type: 'number' | 'text' | 'boolean') => {
    onKeyTypesChange({ ...keyTypes, [key]: { ...keyTypes[key], type } });
  }, [keyTypes, onKeyTypesChange]);

  const handleSuffixChange = useCallback((key: string, suffix: string) => {
    onKeyTypesChange({ ...keyTypes, [key]: { ...keyTypes[key], type: 'number', suffix } });
  }, [keyTypes, onKeyTypesChange]);

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-[1fr_1fr_auto] gap-1.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wider px-1">
        <span>Label</span>
        <span>Valor</span>
        <span />
      </div>
      {entries.map(([key, val], i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-1.5 items-center">
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
