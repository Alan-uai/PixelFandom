'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectEditorProps {
  value: string;
  onChange: (value: string) => void;
  options?: string[];
}

export function SelectEditor({ value, onChange, options }: SelectEditorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const items = options?.length ? options : ['Opção 1', 'Opção 2', 'Opção 3'];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full h-8 rounded-lg border bg-background px-2.5 text-sm hover:border-muted-foreground/30 transition-colors"
      >
        <span className={cn('flex-1 text-left', !value && 'text-muted-foreground')}>
          {value || 'Selecionar...'}
        </span>
        <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border bg-popover shadow-lg overflow-hidden">
          {items.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => { onChange(item === value ? '' : item); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted transition-colors"
            >
              <Check className={cn('h-3.5 w-3.5', value === item ? 'opacity-100 text-primary' : 'opacity-0')} />
              <span>{item}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
