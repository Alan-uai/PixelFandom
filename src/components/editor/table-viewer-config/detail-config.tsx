'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select3D } from '@/components/ui/select3d';

export function DetailConfig({
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
          id="show-comparison"
          checked={c.showComparison !== false}
          onCheckedChange={(v) => onChange({ ...c, showComparison: v })}
        />
        <Label htmlFor="show-comparison" className="text-xs">Exibir botão de comparação</Label>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="show-detail-header"
          checked={c.showHeader || false}
          onCheckedChange={(v) => onChange({ ...c, showHeader: v })}
        />
        <Label htmlFor="show-detail-header" className="text-xs">Mostrar header no expandido</Label>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Colunas visíveis ao expandir</Label>
        <p className="text-[10px] text-muted-foreground">Marque as colunas que aparecem no detalhe.</p>
        <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
          {(columns as string[]).map((col) => {
            const isVisible = ((c.visibleColumns as string[]) || []).includes(col);
            return (
              <div key={col} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`detail-vis-${col}`}
                  checked={isVisible}
                  onChange={() => {
                    const visible = isVisible
                      ? ((c.visibleColumns as string[]) || []).filter((v) => v !== col)
                      : [...((c.visibleColumns as string[]) || []), col];
                    onChange({ ...c, visibleColumns: visible });
                  }}
                  className="h-3.5 w-3.5 rounded border-gray-300"
                />
                <label htmlFor={`detail-vis-${col}`} className="text-xs flex-1">{col}</label>
                {isVisible && (
                  <Select3D value={((c.columnFormats as Record<string, string>) || {})[col] || 'text'} options={[
                    {value: 'text', label: 'Texto'},
                    {value: 'badge', label: 'Badge'},
                    {value: 'color', label: 'Cor'},
                    {value: 'icon', label: 'Ícone'},
                    {value: 'link', label: 'Link'},
                    {value: 'image', label: 'Imagem'},
                    {value: 'rating', label: 'Avaliação'},
                    {value: 'progress', label: 'Progresso'},
                  ]} onChange={(v) => onChange({ ...c, columnFormats: { ...((c.columnFormats as Record<string, string>) || {}), [col]: v } })} className="w-32" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
