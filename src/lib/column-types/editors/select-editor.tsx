'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconRenderer } from '@/components/ui/icon-renderer';

interface AllowedValue {
  value: string;
  label?: string;
  color?: string;
  icon?: string;
  imageUrl?: string;
  linkedEntity?: string;
}

interface SelectEditorProps {
  value: string;
  onChange: (value: string) => void;
  options?: string[];
  allowedValues?: AllowedValue[];
  onEntityLink?: (entitySlug: string) => void;
}

export function SelectEditor({ value, onChange, options, allowedValues, onEntityLink }: SelectEditorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
    else setSearch('');
  }, [open]);

  interface DisplayItem {
    key: string;
    label: string;
    color?: string;
    icon?: string;
    linkedEntity?: string;
  }

  const items = useMemo(() => {
    if (allowedValues?.length) {
      const filtered = search.trim()
        ? allowedValues.filter(
            (av) =>
              av.value.toLowerCase().includes(search.toLowerCase()) ||
              (av.label || '').toLowerCase().includes(search.toLowerCase()),
          )
        : allowedValues;
      return filtered.map((av) => ({
        key: av.value,
        label: av.label || av.value,
        color: av.color,
        icon: av.icon,
        linkedEntity: av.linkedEntity,
      }));
    }
    const base = options?.length ? options : ['Opção 1', 'Opção 2', 'Opção 3'];
    const filtered = search.trim()
      ? base.filter((item) => item.toLowerCase().includes(search.toLowerCase()))
      : base;
    return filtered.map((item) => ({ key: item, label: item } as DisplayItem));
  }, [allowedValues, options, search]);

  const selectedItem = useMemo(() => {
    if (!value) return null;
    if (allowedValues?.length) {
      const av = allowedValues.find((a) => a.value === value);
      if (av) return { key: av.value, label: av.label || av.value, color: av.color, icon: av.icon, linkedEntity: av.linkedEntity } as DisplayItem;
    }
    return { key: value, label: value } as DisplayItem;
  }, [value, allowedValues]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full h-8 rounded-lg border bg-background px-2.5 text-sm hover:border-muted-foreground/30 transition-colors"
      >
        {selectedItem?.icon && <IconRenderer icon={selectedItem.icon} size={"sm"} />}
        {selectedItem?.color && (
          <span className="inline-block h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: selectedItem.color }} />
        )}
        <span className={cn('flex-1 text-left truncate', !value && 'text-muted-foreground')}>
          {selectedItem?.label || 'Selecionar...'}
        </span>
        {selectedItem?.linkedEntity && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEntityLink?.(selectedItem.linkedEntity!);
            }}
            className="text-[10px] text-primary hover:text-primary/80 underline underline-offset-2"
            title="Abrir entidade linkada"
          >
            🔗
          </button>
        )}
        <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border bg-popover shadow-lg overflow-hidden">
          {items.length > 8 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b bg-muted/30">
              <Search className="h-3 w-3 text-muted-foreground shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/50"
              />
            </div>
          )}
          <div className="max-h-48 overflow-y-auto">
            {items.length === 0 && (
              <div className="px-3 py-4 text-xs text-muted-foreground text-center">
                Nenhum resultado encontrado
              </div>
            )}
            {items.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  onChange(item.key === value ? '' : item.key);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted transition-colors"
              >
                <Check className={cn('h-3.5 w-3.5 shrink-0', value === item.key ? 'opacity-100 text-primary' : 'opacity-0')} />
                {item.icon && <IconRenderer icon={item.icon} size={"sm"} />}
                {item.color && (
                  <span className="inline-block h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                )}
                <span className="truncate">{item.label}</span>
                {item.linkedEntity && <span className="text-[10px] text-muted-foreground ml-auto">🔗</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
