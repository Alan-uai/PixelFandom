'use client';

import { Input } from '@/components/ui/input';
import { ElasticSlider3D } from '@/components/ui/elastic-slider-3d';
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

          <ElasticSlider3D
            label="Debounce"
            defaultValue={c.debounceMs || 300}
            startingValue={150}
            maxValue={1000}
            isStepped
            stepSize={50}
            showValue
            valueSuffix="ms"
            onValueChange={(v) => onChange({ ...c, debounceMs: v })}
          />

          <ElasticSlider3D
            label="Mínimo de caracteres"
            defaultValue={c.minChars || 1}
            startingValue={0}
            maxValue={5}
            showValue
            onValueChange={(v) => onChange({ ...c, minChars: v })}
          />
        </>
      )}
    </div>
  );
}
