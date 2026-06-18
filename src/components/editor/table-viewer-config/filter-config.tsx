'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, GripVertical } from 'lucide-react';

export function FilterConfig({
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
  const [mode, setMode] = useState<'auto' | 'manual'>(c.autoDetect !== false ? 'auto' : 'manual');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Switch
          id="filters-enabled"
          checked={c.enabled !== false}
          onCheckedChange={(v) => onChange({ ...c, enabled: v })}
        />
        <Label htmlFor="filters-enabled" className="text-xs">Filtros habilitados</Label>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === 'auto' ? 'default' : 'outline'}
          size="sm"
          className="text-xs h-7"
          onClick={() => {
            setMode('auto');
            onChange({ ...c, autoDetect: true });
          }}
        >
          Auto-detect
        </Button>
        <Button
          type="button"
          variant={mode === 'manual' ? 'default' : 'outline'}
          size="sm"
          className="text-xs h-7"
          onClick={() => {
            setMode('manual');
            onChange({ ...c, autoDetect: false });
          }}
        >
          Manual
        </Button>
      </div>

      {mode === 'manual' && (
        <>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Colunas de filtro</Label>
            {((c.columns as any[]) || []).map((fc: any, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <select
                  value={fc.column}
                  onChange={(e) => {
                    const cols = [...((c.columns as any[]) || [])];
                    cols[i] = { ...cols[i], column: e.target.value };
                    onChange({ ...c, columns: cols });
                  }}
                  className="flex-1 h-7 rounded-md border bg-background px-2 text-xs"
                >
                  <option value="">Selecionar coluna</option>
                  {(columns as string[]).filter((col) => col === fc.column || !((c.columns as any[]) || []).find((f: any) => f.column === col)).map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
                <Input
                  value={fc.label || ''}
                  onChange={(e) => {
                    const cols = [...((c.columns as any[]) || [])];
                    cols[i] = { ...cols[i], label: e.target.value };
                    onChange({ ...c, columns: cols });
                  }}
                  placeholder="Label"
                  className="h-7 text-xs flex-1"
                />
                <select
                  value={fc.mode || 'multiple'}
                  onChange={(e) => {
                    const cols = [...((c.columns as any[]) || [])];
                    cols[i] = { ...cols[i], mode: e.target.value };
                    onChange({ ...c, columns: cols });
                  }}
                  className="h-7 rounded-md border bg-background px-2 text-xs"
                >
                  <option value="single">Único</option>
                  <option value="multiple">Múltiplo</option>
                </select>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => {
                    const cols = ((c.columns as any[]) || []).filter((_: any, j: number) => j !== i);
                    onChange({ ...c, columns: cols });
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => {
                const unused = (columns as string[]).find((col) => !((c.columns as any[]) || []).find((f: any) => f.column === col));
                onChange({
                  ...c,
                  columns: [...((c.columns as any[]) || []), { column: unused || '', label: '', mode: 'multiple' }],
                });
              }}
              disabled={!columns.length}
            >
              <Plus className="h-3 w-3 mr-1" /> Adicionar
            </Button>
          </div>

          <div className="space-y-2 pt-2 border-t">
            <Label className="text-xs text-muted-foreground">Colunas ordenáveis</Label>
            {((c.sortableColumns as any[]) || []).map((sc: any, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <select
                  value={sc.column}
                  onChange={(e) => {
                    const cols = [...((c.sortableColumns as any[]) || [])];
                    cols[i] = { ...cols[i], column: e.target.value };
                    onChange({ ...c, sortableColumns: cols });
                  }}
                  className="flex-1 h-7 rounded-md border bg-background px-2 text-xs"
                >
                  <option value="">Selecionar coluna</option>
                  {(columns as string[]).map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
                <Input
                  value={sc.label || ''}
                  onChange={(e) => {
                    const cols = [...((c.sortableColumns as any[]) || [])];
                    cols[i] = { ...cols[i], label: e.target.value };
                    onChange({ ...c, sortableColumns: cols });
                  }}
                  placeholder="Label"
                  className="h-7 text-xs flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    const cols = ((c.sortableColumns as any[]) || []).filter((_: any, j: number) => j !== i);
                    onChange({ ...c, sortableColumns: cols });
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => onChange({
                ...c,
                sortableColumns: [...((c.sortableColumns as any[]) || []), { column: (columns as string[])[0] || '', label: '' }],
              })}
            >
              <Plus className="h-3 w-3 mr-1" /> Adicionar
            </Button>
          </div>
        </>
      )}

      <div className="flex items-center gap-2">
        <Switch
          id="show-clear"
          checked={c.showClearButton !== false}
          onCheckedChange={(v) => onChange({ ...c, showClearButton: v })}
        />
        <Label htmlFor="show-clear" className="text-xs">Exibir botão &quot;Limpar filtros&quot;</Label>
      </div>
    </div>
  );
}
