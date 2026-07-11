'use client';

import { Select3D } from '@/components/ui/select3d';
import { ElasticSlider3D } from '@/components/ui/elastic-slider-3d';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

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
  const paginationOn = c.pagination === true;

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
        onChange={(v) => {
          if (v !== (c.format || 'grid')) {
            const isList = v === 'list';
            const defaultCols = isList ? 1 : 2;
            onChange({ ...c, format: v, columnsCount: defaultCols });
          }
        }}
      />
      {(() => {
        const isList = c.format === 'list';
        const minCols = isList ? 1 : 2;
        const maxCols = isList ? 2 : 5;
        const defaultCols = isList ? 1 : 2;
        return (
          <ElasticSlider3D
            label={isList ? 'Colunas' : 'Colunas no grid'}
            defaultValue={c.columnsCount ?? defaultCols}
            startingValue={minCols}
            maxValue={maxCols}
            showValue
            onValueChange={(v) => {
              const n = Math.round(Number(v));
              if (!isNaN(n) && n >= minCols && n <= maxCols) {
                onChange({ ...c, columnsCount: n });
              }
            }}
          />
        );
      })()}
      <ElasticSlider3D
        label="Espaçamento"
        defaultValue={c.gap || 16}
        startingValue={2}
        maxValue={32}
        showValue
        valueSuffix="px"
        onValueChange={(v) => onChange({ ...c, gap: v })}
      />
      <ElasticSlider3D
        label="Espessura do separador"
        defaultValue={c.separatorWidth ?? 2}
        startingValue={0}
        maxValue={8}
        showValue
        valueSuffix="px"
        onValueChange={(v) => onChange({ ...c, separatorWidth: v })}
      />

      <div className="space-y-3 border-t pt-3">
        <div className="flex items-center gap-2">
          <Switch
            id="pagination-enabled"
            checked={paginationOn}
            onCheckedChange={(v) => onChange({ ...c, pagination: v })}
          />
          <Label htmlFor="pagination-enabled" className="text-xs">Paginação</Label>
        </div>

        {paginationOn && (
          <div className="space-y-3 pl-4 border-l-2 border-primary/20">
            <Select3D
              label="Estilo da paginação"
              value={c.paginationStyle || 'arrows'}
              options={[
                { label: 'Setas', value: 'arrows' },
                { label: 'Números', value: 'numbers' },
                { label: 'Emojis', value: 'emoji' },
              ]}
              onChange={(v) => onChange({ ...c, paginationStyle: v })}
            />
            <ElasticSlider3D
              label="Items por página"
              defaultValue={c.itemsPerPage || 50}
              startingValue={6}
              maxValue={200}
              showValue
              isStepped
              stepSize={5}
              onValueChange={(v) => onChange({ ...c, itemsPerPage: Math.round(v) })}
            />
          </div>
        )}
      </div>

      {c.sortColumn && (
        <Select3D label="Direção da ordenação" value={c.sortDirection || 'asc'} options={[{label: 'Ascendente', value: 'asc'}, {label: 'Descendente', value: 'desc'}]} onChange={(v) => onChange({ ...c, sortDirection: v as 'asc' | 'desc' })} />
      )}
    </div>
  );
}
