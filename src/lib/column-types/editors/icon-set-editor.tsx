'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Plus, Search } from 'lucide-react';
import { IconRenderer } from '@/components/ui/icon-renderer';
import { searchIcons } from '@/data/icons';

interface IconSetEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function IconSetEditor({ value, onChange }: IconSetEditorProps) {
  const icons: string[] = (() => {
    try { const p = JSON.parse(value || '[]'); return Array.isArray(p) ? p : []; }
    catch { return []; }
  })();

  const [search, setSearch] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (search.trim()) {
      setResults(searchIcons(search).map((r) => r.iconId).slice(0, 20));
    } else {
      setResults([]);
    }
  }, [search]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const addIcon = (iconId: string) => {
    if (icons.includes(iconId) || icons.length >= 12) return;
    onChange(JSON.stringify([...icons, iconId]));
    setSearch('');
    setOpen(false);
  };

  const removeIcon = (iconId: string) => {
    onChange(JSON.stringify(icons.filter((i) => i !== iconId)));
  };

  return (
    <div ref={ref} className="space-y-2">
      <div className="flex flex-wrap gap-1.5 min-h-8">
        {icons.map((iconId) => (
          <div key={iconId} className="relative group">
            <div className="h-7 w-7 rounded-md border bg-background flex items-center justify-center">
              <IconRenderer icon={iconId} size="sm" />
            </div>
            <button
              type="button"
              onClick={() => removeIcon(iconId)}
              className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-background border shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-2.5 w-2.5 text-destructive" />
            </button>
          </div>
        ))}
        {icons.length < 12 && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="h-7 w-7 rounded-md border border-dashed border-muted-foreground/40 flex items-center justify-center hover:border-foreground transition-colors"
          >
            <Plus className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        )}
      </div>
      {open && (
        <div className="rounded-lg border bg-popover shadow-lg p-2">
          <div className="flex items-center gap-2 border-b pb-2 mb-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar ícone..."
              className="flex-1 bg-transparent text-sm outline-none"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-8 gap-1 max-h-40 overflow-y-auto">
            {results.map((iconId) => (
              <button
                key={iconId}
                type="button"
                onClick={() => addIcon(iconId)}
                className="h-8 w-8 flex items-center justify-center rounded hover:bg-muted transition-colors"
                title={iconId}
              >
                <IconRenderer icon={iconId} size="sm" />
              </button>
            ))}
            {results.length === 0 && search && (
              <p className="col-span-full text-xs text-muted-foreground text-center py-4">Nenhum ícone encontrado</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
