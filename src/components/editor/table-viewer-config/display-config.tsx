'use client';

import { Select3D } from '@/components/ui/select3d';
import { ElasticSlider3D } from '@/components/ui/elastic-slider-3d';
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
      <Select3D
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
      <ElasticSlider3D
        label="Colunas no grid"
        defaultValue={c.columnsCount || 4}
        startingValue={1}
        maxValue={6}
        showValue
        onValueChange={(v) => onChange({ ...c, columnsCount: v })}
      />
      <ElasticSlider3D
        label="Items por página"
        defaultValue={c.itemsPerPage || 50}
        startingValue={6}
        maxValue={200}
        showValue
        onValueChange={(v) => onChange({ ...c, itemsPerPage: v })}
      />
      <Select3D
        label="Paginação"
        value={c.pagination || 'none'}
        options={[
          { label: 'Nenhum', value: 'none' },
          { label: 'Paginação', value: 'paginated' },
          { label: 'Scroll infinito', value: 'infinite-scroll' },
        ]}
        onChange={(v) => onChange({ ...c, pagination: v })}
      />
      <ElasticSlider3D
        label="Espaçamento"
        defaultValue={c.gap || 12}
        startingValue={2}
        maxValue={16}
        showValue
        valueSuffix="px"
        onValueChange={(v) => onChange({ ...c, gap: v })}
      />
      {c.sortColumn && (
        <Select3D label="Direção da ordenação" value={c.sortDirection || 'asc'} options={[{label: 'Ascendente', value: 'asc'}, {label: 'Descendente', value: 'desc'}]} onChange={(v) => onChange({ ...c, sortDirection: v as 'asc' | 'desc' })} />
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
