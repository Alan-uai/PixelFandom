'use client';

import { Plus, Trash2, GripVertical } from 'lucide-react';

interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'url' | 'number' | 'color' | 'textarea' | 'select';
  options?: { label: string; value: string }[];
  placeholder?: string;
}

interface ItemsListEditorProps {
  label: string;
  fields: FieldDef[];
  items: Record<string, unknown>[];
  onChange: (items: Record<string, unknown>[]) => void;
  maxItems?: number;
}

function ItemField({ field, value, onChange }: { field: FieldDef; value: unknown; onChange: (v: unknown) => void }) {
  const baseClass = 'w-full rounded-md border bg-background px-2 py-1 text-xs';

  if (field.type === 'color') {
    return (
      <div className="flex items-center gap-2">
        <input type="color" value={(value as string) || '#000000'} onChange={(e) => onChange(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
        <input type="text" value={(value as string) || ''} onChange={(e) => onChange(e.target.value)} className={`${baseClass} flex-1`} />
      </div>
    );
  }

  if (field.type === 'select' && field.options) {
    return (
      <select value={(value as string) || ''} onChange={(e) => onChange(e.target.value)} className={baseClass}>
        {field.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  }

  if (field.type === 'textarea') {
    return <textarea value={(value as string) || ''} onChange={(e) => onChange(e.target.value)} rows={3} className={`${baseClass} resize-none`} placeholder={field.placeholder} />;
  }

  if (field.type === 'number') {
    return <input type="number" value={(value as number) ?? ''} onChange={(e) => onChange(Number(e.target.value))} className={baseClass} placeholder={field.placeholder} />;
  }

  return (
    <input
      type={field.type === 'url' ? 'url' : 'text'}
      value={(value as string) || ''}
      onChange={(e) => onChange(e.target.value)}
      className={baseClass}
      placeholder={field.placeholder}
    />
  );
}

export function ItemsListEditor({ label, fields, items, onChange, maxItems = 100 }: ItemsListEditorProps) {
  const addItem = () => {
    if (items.length >= maxItems) return;
    const empty: Record<string, unknown> = {};
    fields.forEach((f) => { empty[f.key] = ''; });
    onChange([...items, empty]);
  };

  const updateItem = (index: number, key: string, value: unknown) => {
    const next = items.map((item, i) => (i === index ? { ...item, [key]: value } : item));
    onChange(next);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-[10px] text-muted-foreground font-medium">{label}</label>
        <span className="text-[10px] text-muted-foreground">{items.length}/{maxItems}</span>
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="rounded-md border bg-muted/30 p-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <GripVertical className="w-3 h-3 text-muted-foreground/50" />
              <span className="text-[10px] text-muted-foreground">#{index + 1}</span>
              <button onClick={() => removeItem(index)} className="p-0.5 text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            {fields.map((field) => (
              <div key={field.key} className="space-y-0.5">
                <label className="text-[10px] text-muted-foreground block">{field.label}</label>
                <ItemField field={field} value={item[field.key]} onChange={(v) => updateItem(index, field.key, v)} />
              </div>
            ))}
          </div>
        ))}
      </div>
      {items.length < maxItems && (
        <button onClick={addItem} className="flex items-center gap-1 rounded-md border border-dashed px-2.5 py-1.5 text-[10px] text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors w-full justify-center">
          <Plus className="w-3 h-3" />
          Adicionar {label.toLowerCase()}
        </button>
      )}
    </div>
  );
}
