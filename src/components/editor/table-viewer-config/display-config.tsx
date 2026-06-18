'use client';

import { SelectField } from '@/components/page-builder/config-panels/shared/fields';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export function DisplayConfig({
  config,
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
      <SelectField
        label="Formato"
        value={c.format || 'grid'}
        options={[
          { label: 'Grid', value: 'grid' },
          { label: 'Lista', value: 'list' },
          { label: 'Carrossel', value: 'carousel' },
          { label: 'Carrossel Infinito', value: 'carousel_infinite' },
        ]}
        onChange={(v) => onChange({ ...c, format: v })}
      />
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Colunas no grid ({c.columnsCount || 4})</Label>
        <input
          type="range"
          min={1}
          max={6}
          value={c.columnsCount || 4}
          onChange={(e) => onChange({ ...c, columnsCount: Number(e.target.value) })}
          className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>1</span><span>6</span>
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Items por página ({c.itemsPerPage || 50})</Label>
        <input
          type="range"
          min={6}
          max={200}
          value={c.itemsPerPage || 50}
          onChange={(e) => onChange({ ...c, itemsPerPage: Number(e.target.value) })}
          className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>6</span><span>200</span>
        </div>
      </div>
      <SelectField
        label="Paginação"
        value={c.pagination || 'paginated'}
        options={[
          { label: 'Paginação', value: 'paginated' },
          { label: 'Scroll infinito', value: 'infinite-scroll' },
          { label: 'Nenhum', value: 'none' },
        ]}
        onChange={(v) => onChange({ ...c, pagination: v })}
      />
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Espaçamento (gap: {c.gap || 12}px)</Label>
        <input
          type="range"
          min={2}
          max={16}
          value={c.gap || 12}
          onChange={(e) => onChange({ ...c, gap: Number(e.target.value) })}
          className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>2px</span><span>16px</span>
        </div>
      </div>
      {c.sortColumn && (
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Direção da ordenação</Label>
          <select
            value={c.sortDirection || 'asc'}
            onChange={(e) => onChange({ ...c, sortDirection: e.target.value as 'asc' | 'desc' })}
            className="h-7 rounded-md border bg-background px-2 text-xs"
          >
            <option value="asc">Ascendente</option>
            <option value="desc">Descendente</option>
          </select>
        </div>
      )}
      <div className="flex items-center gap-2">
        <Switch
          id="override-global"
          checked={c.overrideGlobal || false}
          onCheckedChange={(v) => onChange({ ...c, overrideGlobal: v })}
        />
        <Label htmlFor="override-global" className="text-xs">Sobrescrever configuração global</Label>
      </div>
    </div>
  );
}
