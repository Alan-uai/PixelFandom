'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export function SearchConfig({
  config,
  columns = [],
  onChange,
}: {
  config: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
  columns?: string[];
  slug?: string;
}) {
  const c: Record<string, any> = config || {};

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Switch
          id="search-enabled"
          checked={c.enabled !== false}
          onCheckedChange={(v) => onChange({ ...c, enabled: v })}
        />
        <Label htmlFor="search-enabled" className="text-xs">Barra de busca habilitada</Label>
      </div>

      {c.enabled !== false && (
        <>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Placeholder</Label>
            <Input
              value={c.placeholder || 'Buscar...'}
              onChange={(e) => onChange({ ...c, placeholder: e.target.value })}
              className="h-8 text-sm"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Colunas buscáveis</Label>
            <div className="flex flex-wrap gap-1">
              {(columns as string[]).map((col) => {
                const selected = ((c.searchableColumns as string[]) || []).includes(col);
                return (
                  <button
                    key={col}
                    type="button"
                    onClick={() => {
                      const cols = selected
                        ? ((c.searchableColumns as string[]) || []).filter((sc) => sc !== col)
                        : [...((c.searchableColumns as string[]) || []), col];
                      onChange({ ...c, searchableColumns: cols });
                    }}
                    className={`px-2 py-0.5 rounded text-xs border transition-colors ${
                      selected
                        ? 'bg-primary/10 border-primary/30 text-primary'
                        : 'bg-card border-border/50 text-muted-foreground hover:border-muted-foreground/30'
                    }`}
                  >
                    {col}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Debounce: {c.debounceMs || 300}ms</Label>
            <input
              type="range"
              min={150}
              max={1000}
              step={50}
              value={c.debounceMs || 300}
              onChange={(e) => onChange({ ...c, debounceMs: Number(e.target.value) })}
              className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>150ms</span><span>1000ms</span>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Mínimo de caracteres: {c.minChars || 1}</Label>
            <input
              type="range"
              min={0}
              max={5}
              value={c.minChars || 1}
              onChange={(e) => onChange({ ...c, minChars: Number(e.target.value) })}
              className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>0</span><span>5</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
