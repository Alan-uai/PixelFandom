'use client';

import { Plus, Trash2 } from 'lucide-react';

interface StringListEditorProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  maxItems?: number;
  placeholder?: string;
}

export function StringListEditor({ label, values, onChange, maxItems = 100, placeholder = '' }: StringListEditorProps) {
  const addItem = () => {
    if (values.length >= maxItems) return;
    onChange([...values, '']);
  };

  const updateItem = (index: number, value: string) => {
    const next = values.map((v, i) => (i === index ? value : v));
    onChange(next);
  };

  const removeItem = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[10px] text-muted-foreground font-medium">{label}</label>
        <span className="text-[10px] text-muted-foreground">{values.length}/{maxItems}</span>
      </div>
      <div className="space-y-1">
        {values.map((v, i) => (
          <div key={i} className="flex items-center gap-1">
            <input
              type="text"
              value={v}
              onChange={(e) => updateItem(i, e.target.value)}
              placeholder={placeholder}
              className="flex-1 rounded-md border bg-background px-2 py-1 text-xs"
            />
            <button onClick={() => removeItem(i)} className="p-1 text-muted-foreground hover:text-destructive transition-colors shrink-0">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
      {values.length < maxItems && (
        <button onClick={addItem} className="flex items-center gap-1 rounded-md border border-dashed px-2.5 py-1.5 text-[10px] text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors w-full justify-center">
          <Plus className="w-3 h-3" />
          Adicionar
        </button>
      )}
    </div>
  );
}
