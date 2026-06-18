'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SelectField } from '@/components/page-builder/config-panels/shared/fields';

export function CardConfig({
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
      <SelectField
        label="Tamanho do card"
        value={c.size || 'md'}
        options={[
          { label: 'Pequeno', value: 'sm' },
          { label: 'Médio', value: 'md' },
          { label: 'Grande', value: 'lg' },
        ]}
        onChange={(v) => onChange({ ...c, size: v })}
      />

      <SelectField
        label="Efeito hover"
        value={c.hoverEffect || 'scale'}
        options={[
          { label: 'Escala', value: 'scale' },
          { label: 'Brilho', value: 'glow' },
          { label: 'Sombra', value: 'shadow' },
          { label: 'Nenhum', value: 'none' },
        ]}
        onChange={(v) => onChange({ ...c, hoverEffect: v })}
      />

      <div className="flex items-center gap-2">
        <Switch
          id="show-icon"
          checked={c.showIcon !== false}
          onCheckedChange={(v) => onChange({ ...c, showIcon: v })}
        />
        <Label htmlFor="show-icon" className="text-xs">Mostrar ícone</Label>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="show-image"
          checked={c.showImage !== false}
          onCheckedChange={(v) => onChange({ ...c, showImage: v })}
        />
        <Label htmlFor="show-image" className="text-xs">Mostrar imagem</Label>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="show-label"
          checked={c.showLabel !== false}
          onCheckedChange={(v) => onChange({ ...c, showLabel: v })}
        />
        <Label htmlFor="show-label" className="text-xs">Mostrar label no card</Label>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="compact-mode"
          checked={c.compactMode || false}
          onCheckedChange={(v) => onChange({ ...c, compactMode: v })}
        />
        <Label htmlFor="compact-mode" className="text-xs">Modo compacto (só nome + ícone)</Label>
      </div>

      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Badges visíveis</Label>
        <div className="flex flex-wrap gap-1">
          {(columns as string[]).map((col) => {
            const isSelected = ((c.badges as string[]) || []).includes(col);
            return (
              <button
                key={col}
                type="button"
                onClick={() => {
                  const badges = isSelected
                    ? ((c.badges as string[]) || []).filter((b) => b !== col)
                    : [...((c.badges as string[]) || []), col];
                  onChange({ ...c, badges });
                }}
                className={`px-2 py-0.5 rounded text-xs border transition-colors ${
                  isSelected
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
    </div>
  );
}
