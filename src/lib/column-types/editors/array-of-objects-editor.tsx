'use client';
import { useCallback } from 'react';
import { Plus, X } from 'lucide-react';
import { SimpleObjectEditor } from './simple-object-editor';

interface JsonbKeyEntry {
  type: 'number' | 'text' | 'boolean';
  suffix?: string;
}

export function ArrayOfObjectsEditor({
  value,
  onChange,
  keyTypes,
  onKeyTypesChange,
}: {
  value: string;
  onChange: (v: string) => void;
  keyTypes: Record<string, JsonbKeyEntry>;
  onKeyTypesChange: (types: Record<string, JsonbKeyEntry>) => void;
}) {
  const arr: Record<string, string>[] = (() => {
    try { const p = JSON.parse(value); return Array.isArray(p) ? p : []; } catch { return []; }
  })();

  const updateArray = useCallback((newArr: Record<string, string>[]) => {
    onChange(JSON.stringify(newArr));
  }, [onChange]);

  const updateItem = useCallback((index: number, entries: [string, string][]) => {
    const next = [...arr];
    next[index] = Object.fromEntries(entries);
    updateArray(next);
  }, [arr, updateArray]);

  const removeItem = useCallback((index: number) => {
    updateArray(arr.filter((_, i) => i !== index));
  }, [arr, updateArray]);

  const addItem = useCallback(() => {
    const keys = Object.keys(keyTypes);
    if (keys.length > 0) {
      const obj: Record<string, string> = {};
      keys.forEach((k) => { obj[k] = ''; });
      updateArray([...arr, obj]);
    } else {
      updateArray([...arr, { '': '' }]);
    }
  }, [arr, keyTypes, updateArray]);

  if (arr.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground italic">Nenhum item</p>
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
        >
          <Plus className="h-3 w-3" /> Adicionar item
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {arr.map((obj, i) => {
        const entries = Object.entries(obj);
        return (
          <div key={i} className="rounded-lg border bg-card p-2 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-muted-foreground uppercase">Item {i + 1}</span>
              <button
                type="button"
                onClick={() => removeItem(i)}
                className="p-0.5 text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <SimpleObjectEditor
              entries={entries}
              onEntriesChange={(e) => updateItem(i, e)}
              keyTypes={keyTypes}
              onKeyTypesChange={onKeyTypesChange}
            />
          </div>
        );
      })}
      <button
        type="button"
        onClick={addItem}
        className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
      >
        <Plus className="h-3 w-3" /> Adicionar item
      </button>
    </div>
  );
}
