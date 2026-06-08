'use client';

import { useState, useRef, useEffect } from 'react';
import { TABLE_ICONS, resolveTableIcon, isCustomIcon } from '@/lib/table-icons';
import { ImageUpload } from '@/components/ui/image-upload';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface TableIconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  slug: string;
}

export function TableIconPicker({ value, onChange, slug }: TableIconPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const CurrentIcon = resolveTableIcon(value);

  const filtered = search.trim()
    ? TABLE_ICONS.filter((name) => name.toLowerCase().includes(search.toLowerCase()))
    : TABLE_ICONS;

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start gap-2 h-10"
        >
          {isCustomIcon(value) ? (
            <img src={value} className="h-4 w-4 shrink-0 rounded object-cover" />
          ) : (
            <CurrentIcon className="h-4 w-4 shrink-0" />
          )}
          <span className="text-sm truncate">
            {isCustomIcon(value) ? 'Imagem personalizada' : (value || 'Selecionar ícone')}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-3">
        <ImageUpload
          bucket="game-items"
          pathPrefix={`${slug}/table-icons/`}
          value={isCustomIcon(value) ? value : ''}
          onChange={(url) => onChange(url || 'Database')}
          previewSize="w-full h-20"
        />
        <div className="flex items-center gap-2 my-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[11px] text-muted-foreground font-medium uppercase">ou escolha um ícone</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar ícone..."
            className="pl-8 h-8 text-xs"
          />
        </div>
        <div className="max-h-40 overflow-y-auto">
          <div className="grid grid-cols-8 gap-1">
            {filtered.map((name) => {
              const Icon = resolveTableIcon(name);
              const selected = value === name;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => { onChange(name); setOpen(false); }}
                  title={name}
                  className={`flex items-center justify-center rounded-md p-1.5 transition-all text-muted-foreground hover:text-foreground hover:bg-muted ${
                    selected ? 'ring-2 ring-primary bg-primary/10 text-primary' : ''
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Nenhum ícone encontrado
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
