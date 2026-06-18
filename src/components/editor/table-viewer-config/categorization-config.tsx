'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SelectField } from '@/components/page-builder/config-panels/shared/fields';
import { Plus, Trash2, GripVertical } from 'lucide-react';

export function CategorizationConfig({
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
          id="cat-enabled"
          checked={c.enabled !== false}
          onCheckedChange={(v) => onChange({ ...c, enabled: v })}
        />
        <Label htmlFor="cat-enabled" className="text-xs">Categorização habilitada</Label>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Coluna de categoria</Label>
        <select
          value={c.column || 'none'}
          onChange={(e) => onChange({ ...c, column: e.target.value === 'none' ? null : e.target.value })}
          className="w-full h-8 rounded-md border bg-background px-2 text-sm"
        >
          <option value="none">Auto-detect</option>
          {(columns as string[]).map((col) => (
            <option key={col} value={col}>{col}</option>
          ))}
        </select>
      </div>

      <SelectField
        label="Estilo das categorias"
        value={c.style || 'headings'}
        options={[
          { label: 'Títulos', value: 'headings' },
          { label: 'Abas', value: 'tabs' },
          { label: 'Acordeão', value: 'accordion' },
          { label: 'Badges', value: 'badges' },
          { label: 'Nenhum', value: 'none' },
        ]}
        onChange={(v) => onChange({ ...c, style: v })}
      />

      <div className="flex items-center gap-2">
        <Switch
          id="group-empty"
          checked={c.groupEmpty !== false}
          onCheckedChange={(v) => onChange({ ...c, groupEmpty: v })}
        />
        <Label htmlFor="group-empty" className="text-xs">Agrupar itens sem categoria (&quot;Outros&quot;)</Label>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="show-empty-cats"
          checked={c.showEmptyCategories || false}
          onCheckedChange={(v) => onChange({ ...c, showEmptyCategories: v })}
        />
        <Label htmlFor="show-empty-cats" className="text-xs">Mostrar categorias vazias</Label>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="default-expanded"
          checked={c.defaultExpanded !== false}
          onCheckedChange={(v) => onChange({ ...c, defaultExpanded: v })}
        />
        <Label htmlFor="default-expanded" className="text-xs">Expandido por padrão (acordeão)</Label>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Coluna de categoria secundária</Label>
        <select
          value={c.secondaryColumn || 'none'}
          onChange={(e) => onChange({ ...c, secondaryColumn: e.target.value === 'none' ? null : e.target.value })}
          className="w-full h-8 rounded-md border bg-background px-2 text-sm"
        >
          <option value="none">Nenhuma</option>
          {(columns as string[]).filter((col) => col !== c.column).map((col) => (
            <option key={col} value={col}>{col}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2 border-t pt-3">
        <Label className="text-xs text-muted-foreground">Ordem das categorias</Label>
        <p className="text-[10px] text-muted-foreground">Deixe vazio para ordem alfabética.</p>
        <div className="flex flex-wrap gap-1">
          {((c.order as string[]) || []).map((cat, i) => (
            <div key={i} className="flex items-center gap-1 bg-muted rounded px-2 py-0.5">
              <GripVertical className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs">{cat}</span>
              <button
                type="button"
                onClick={() => {
                  const order = ((c.order as string[]) || []).filter((_, j) => j !== i);
                  onChange({ ...c, order });
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-1">
          <Input
            value=""
            placeholder="Nome da categoria"
            className="h-7 text-xs flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                onChange({ ...c, order: [...((c.order as string[]) || []), e.currentTarget.value.trim()] });
                e.currentTarget.value = '';
              }
            }}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              const input = document.activeElement as HTMLInputElement;
              if (input?.value?.trim()) {
                onChange({ ...c, order: [...((c.order as string[]) || []), input.value.trim()] });
                input.value = '';
              }
            }}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="space-y-2 border-t pt-3">
        <Label className="text-xs text-muted-foreground">Grupos manuais</Label>
        {((c.manualGroups as any[]) || []).map((mg: any, i: number) => (
          <div key={i} className="space-y-1 rounded border p-2">
            <Input
              value={mg.label}
              onChange={(e) => {
                const groups = [...((c.manualGroups as any[]) || [])];
                groups[i] = { ...groups[i], label: e.target.value };
                onChange({ ...c, manualGroups: groups });
              }}
              placeholder="Label do grupo"
              className="h-7 text-xs"
            />
            <Input
              value={mg.values.join(', ')}
              onChange={(e) => {
                const groups = [...((c.manualGroups as any[]) || [])];
                groups[i] = { ...groups[i], values: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) };
                onChange({ ...c, manualGroups: groups });
              }}
              placeholder="valores separados por vírgula"
              className="h-7 text-xs"
            />
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-6"
              onClick={() => {
                const groups = ((c.manualGroups as any[]) || []).filter((_: any, j: number) => j !== i);
                onChange({ ...c, manualGroups: groups });
              }}
            >
              <Trash2 className="h-3 w-3 mr-1" /> Remover
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-7"
          onClick={() => onChange({
            ...c,
            manualGroups: [...((c.manualGroups as any[]) || []), { label: '', values: [] }],
          })}
        >
          <Plus className="h-3 w-3 mr-1" /> Adicionar grupo
        </Button>
      </div>
    </div>
  );
}
