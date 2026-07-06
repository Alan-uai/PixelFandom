'use client';

import { cn } from '@/lib/utils';

interface ToggleGroupEditorProps {
  value: string;
  onChange: (value: string) => void;
  options?: string[];
}

export function ToggleGroupEditor({ value, onChange, options }: ToggleGroupEditorProps) {
  const items = options?.length ? options : ['Baixo', 'Médio', 'Alto'];

  return (
    <div className="flex gap-1">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(value === item ? '' : item)}
          className={cn(
            'flex-1 h-8 rounded-lg border text-sm font-medium transition-all',
            value === item
              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
              : 'bg-background text-muted-foreground border-input hover:border-muted-foreground/30 hover:text-foreground',
          )}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
