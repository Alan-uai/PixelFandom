'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface EntityLinkEditorProps {
  value: string;
  onChange: (value: string) => void;
  table?: string;
  tenantId?: string;
}

export function EntityLinkEditor({ value, onChange, table, tenantId }: EntityLinkEditorProps) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!search.trim() || !tenantId) { setResults([]); return; }
    setLoading(true);
    const timer = setTimeout(async () => {
      const { supabase } = await import('@/supabase');
      const { data } = await supabase
        .from(table || '_none_')
        .select('id, name')
        .eq('tenant_id', tenantId)
        .ilike('name', `%${search}%`)
        .limit(10);
      setResults((data as { id: string; name: string }[]) || []);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, table, tenantId]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-2 rounded-lg border bg-background px-2.5 h-8 text-sm">
        <Search className="h-3.5 w-3.5 text-muted-foreground" />
        {value ? (
          <span className="flex-1 text-sm font-mono">{value}</span>
        ) : (
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Buscar entidade..."
            className="flex-1 bg-transparent outline-none text-sm"
          />
        )}
        {value && (
          <button type="button" onClick={() => onChange('')} className="text-xs text-muted-foreground hover:text-foreground">×</button>
        )}
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border bg-popover shadow-lg overflow-hidden">
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => { onChange(r.name); setOpen(false); setSearch(''); }}
              className="w-full px-3 py-2 text-sm text-left hover:bg-muted transition-colors"
            >
              {r.name}
            </button>
          ))}
        </div>
      )}
      {loading && <Loader2 className="h-3 w-3 animate-spin absolute right-2 top-2.5 text-muted-foreground" />}
    </div>
  );
}
