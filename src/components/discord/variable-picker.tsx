'use client';

import { useState, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Search, Code2, Copy } from 'lucide-react';
import { getVariablesByCategory, VARIABLE_CATEGORY_LABELS, type CommandVariableCategory } from './types';

interface Props {
  onInsert?: (syntax: string) => void;
  onClose?: () => void;
  mode?: 'insert' | 'copy';
}

export function VariablePicker({ onInsert, onClose, mode: _mode = 'insert' }: Props) {
  const [search, setSearch] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const grouped = useMemo(() => getVariablesByCategory(), []);

  const handleSelect = useCallback((syntax: string, key: string) => {
    if (onInsert) {
      onInsert(syntax);
    } else {
      navigator.clipboard.writeText(syntax).then(() => {
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
      });
    }
  }, [onInsert]);

  const categories = useMemo(() => {
    const entries = Object.entries(grouped) as [CommandVariableCategory, typeof grouped[keyof typeof grouped]][];
    if (!search) return entries;
    const q = search.toLowerCase();
    return entries.filter(([, vars]) =>
      vars.some((v) =>
        v.label.toLowerCase().includes(q) ||
        v.key.toLowerCase().includes(q) ||
        v.description.toLowerCase().includes(q)
      )
    );
  }, [search, grouped]);

  const filteredVars = useMemo(() => {
    if (!search) return null;
    const q = search.toLowerCase();
    return Object.values(grouped).flat().filter((v) =>
      v.label.toLowerCase().includes(q) ||
      v.key.toLowerCase().includes(q) ||
      v.description.toLowerCase().includes(q)
    );
  }, [search, grouped]);

  return (
    <div className="rounded-lg border bg-popover p-3 space-y-3 max-h-80 overflow-y-auto">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar variável..."
            className="h-8 pl-7 text-xs"
          />
        </div>
        {onClose && (
          <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">
            Fechar
          </button>
        )}
      </div>

      {search && filteredVars ? (
        <div className="space-y-1">
          {filteredVars.length === 0 ? (
            <p className="text-[10px] text-muted-foreground">Nenhuma variável encontrada.</p>
          ) : (
            filteredVars.map((v) => (
              <VariableRow key={v.key} variable={v} onSelect={() => handleSelect(v.syntax, v.key)} copied={copiedKey === v.key} />
            ))
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map(([cat, vars]) => (
            <div key={cat}>
              <p className="text-[10px] font-medium text-muted-foreground uppercase mb-1">
                {VARIABLE_CATEGORY_LABELS[cat]}
              </p>
              <div className="space-y-0.5">
                {vars.map((v) => (
                  <VariableRow key={v.key} variable={v} onSelect={() => handleSelect(v.syntax, v.key)} copied={copiedKey === v.key} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VariableRow({ variable: v, onSelect, copied }: { variable: { key: string; label: string; description: string; syntax: string }; onSelect: () => void; copied: boolean }) {
  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-accent transition-colors group"
    >
      {copied ? (
        <Copy className="h-3 w-3 shrink-0 text-primary" />
      ) : (
        <Code2 className="h-3 w-3 shrink-0 text-muted-foreground group-hover:text-foreground" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium truncate">{copied ? 'Copiado!' : v.label}</p>
        <p className="text-[10px] text-muted-foreground truncate">{v.syntax}</p>
      </div>
    </button>
  );
}
