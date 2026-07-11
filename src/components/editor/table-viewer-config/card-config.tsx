'use client';

import { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select3D } from '@/components/ui/select3d';
import { Input } from '@/components/ui/input';
import { ColorSelect3D } from '@/components/ui/color-select-3d';
import { isColorString, hexToStyle } from '@/lib/color';
import { getCompatibleFormats, getDefaultFormat } from '@/lib/column-types/format-compatibility';

const BADGE_DEFAULTS = ['rarity', 'tier', 'element'];

const DEFAULT_BADGE_COLORS: Record<string, string> = {
  rarity: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  tier: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
  element: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
};

const LABEL_COLS = new Set(['name', 'title', 'description', 'summary', 'slug']);
const BADGE_COLS = new Set(['rarity', 'tier', 'element']);
const SYSTEM_COLS = new Set(['id', 'tenant_id', 'created_at', 'updated_at', 'embedding', 'icon', 'icon_url', 'image', 'image_url']);

function inferFormat(col: string): string {
  const lower = col.toLowerCase();
  if (lower.endsWith('_url') || lower.endsWith('_link') || lower === 'url' || lower === 'link') return 'link';
  if (lower === 'rarity' || lower === 'tier') return 'badge';
  if (lower === 'element') return 'badge';
  if (lower.startsWith('is_') || lower.startsWith('has_')) return 'badge';
  return 'text';
}

export function CardConfig({
  config,
  columns = [],
  columnTypes = {},
  onChange,
}: {
  config: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
  columns?: string[];
  columnTypes?: Record<string, string>;
  slug?: string;
}) {
  const c: Record<string, any> = config || {};
  const layout = c.layout || 'card';
  const isVisualLayout = layout === 'card' || layout === 'accordion';

  // Badge state
  const badgeConfig: Record<string, any> = c.badgeConfig || {};
  const badgeColors: Record<string, string> = c.badgeColors || {};

  const effectiveBadges = useMemo(() => {
    const badges: string[] = c.badges || [];
    if (badges.length > 0) return badges;
    return BADGE_DEFAULTS.filter(col => columns.includes(col));
  }, [c.badges, columns]);

  const toggleBadge = (col: string) => {
    const next = effectiveBadges.includes(col)
      ? effectiveBadges.filter(b => b !== col)
      : [...effectiveBadges, col];
    onChange({ ...c, badges: next });
  };

  const updateBadgeConfig = (col: string, key: string, val: any) => {
    onChange({
      ...c,
      badgeConfig: {
        ...badgeConfig,
        [col]: { ...(badgeConfig[col] || {}), [key]: val },
      },
    });
  };

  const updateBadgeColor = (col: string, val: string) => {
    onChange({
      ...c,
      badgeColors: { ...badgeColors, [col]: val },
    });
  };

  // Detail state
  const columnFormats: Record<string, string> = c.columnFormats || {};

  const effectiveVisible = useMemo(() => {
    const visibleColumns: string[] = c.visibleColumns || [];
    if (visibleColumns.length > 0) return visibleColumns;
    return columns.filter(col => !SYSTEM_COLS.has(col) && !LABEL_COLS.has(col) && !BADGE_COLS.has(col));
  }, [c.visibleColumns, columns]);

  const toggleColumn = (col: string) => {
    const next = effectiveVisible.includes(col)
      ? effectiveVisible.filter(c => c !== col)
      : [...effectiveVisible, col];
    onChange({ ...c, visibleColumns: next });
  };

  const setFormat = (col: string, fmt: string) => {
    onChange({ ...c, columnFormats: { ...columnFormats, [col]: fmt } });
  };

  const getFormat = (col: string): string => {
    const saved = columnFormats[col];
    if (saved) {
      const compatible = getCompatibleFormats(columnTypes[col]);
      if (compatible.some((f) => f.value === saved)) return saved;
    }
    const inferred = inferFormat(col);
    const defCompatible = getCompatibleFormats(columnTypes[col]);
    if (defCompatible.some((f) => f.value === inferred)) return inferred;
    return getDefaultFormat(columnTypes[col]);
  };

  return (
    <div className="space-y-4">
      <Select3D
        label="Layout dos cards"
        value={layout}
        options={[
          { label: 'Card', value: 'card' },
          { label: 'Acordeão', value: 'accordion' },
          { label: 'Lista', value: 'list' },
          { label: 'Tabela', value: 'table' },
        ]}
        onChange={(v) => onChange({ ...c, layout: v })}
      />

      {isVisualLayout && (
        <>
          <Select3D
            label="Tamanho do card"
            value={c.size || 'md'}
            options={[
              { label: 'Pequeno', value: 'sm' },
              { label: 'Médio', value: 'md' },
              { label: 'Grande', value: 'lg' },
            ]}
            onChange={(v) => onChange({ ...c, size: v })}
          />

          <Select3D
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

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Badges visíveis</Label>
            <div className="flex flex-wrap gap-1 mb-2">
              {(columns as string[]).map((col) => {
                const isSelected = effectiveBadges.includes(col);
                return (
                  <button
                    key={col}
                    type="button"
                    onClick={() => toggleBadge(col)}
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

            {effectiveBadges.length > 0 && (
              <div className="space-y-2 rounded-md border bg-muted/20 p-3">
                <span className="text-xs font-medium text-muted-foreground">Configurar badges</span>
                {effectiveBadges.map((col) => {
                  const bc = badgeConfig[col] || {};
                  return (
                    <div key={col} className="space-y-1.5 rounded border bg-background p-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">{col}</span>
                        <span
                          className={`inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-medium${!isColorString(badgeColors[col] || '') ? ` ${badgeColors[col] || DEFAULT_BADGE_COLORS[col] || 'bg-background/80 backdrop-blur-sm border-border'}` : ''}`}
                          style={isColorString(badgeColors[col] || '') ? hexToStyle(badgeColors[col]) || {} : undefined}
                        >
                          {col}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Label className="text-[10px] text-muted-foreground">Cor</Label>
                        <ColorSelect3D
                          value={isColorString(badgeColors[col] || '') ? badgeColors[col] : undefined}
                          onChange={(v) => updateBadgeColor(col, v)}
                          className="flex-1"
                          placeholder="Selecionar cor..."
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          id={`badge-hover-${col}`}
                          checked={bc.hover === true}
                          onCheckedChange={(v) => updateBadgeConfig(col, 'hover', v)}
                        />
                        <Label htmlFor={`badge-hover-${col}`} className="text-[10px]">Efeito hover</Label>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          id={`badge-action-${col}`}
                          checked={(bc.clickAction || 'none') !== 'none'}
                          onCheckedChange={(v) => updateBadgeConfig(col, 'clickAction', v ? 'comparison' : 'none')}
                        />
                        <Label htmlFor={`badge-action-${col}`} className="text-[10px]">Ação ao clicar</Label>
                      </div>

                      {(bc.clickAction || 'none') !== 'none' && (
                        <div className="space-y-1.5 pl-4">
                          <Select3D
                            value={bc.clickAction || 'comparison'}
                            options={[
                              { label: 'Comparação', value: 'comparison' },
                              { label: 'Link externo', value: 'external-link' },
                            ]}
                            onChange={(v) => updateBadgeConfig(col, 'clickAction', v)}
                          />
                          {bc.clickAction === 'external-link' && (
                            <Input
                              value={bc.clickUrl || ''}
                              onChange={(e) => updateBadgeConfig(col, 'clickUrl', e.target.value)}
                              placeholder="https://..."
                              className="h-6 text-[10px]"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      <div className="space-y-3 border-t pt-3">
        <div className="flex items-center gap-2">
          <Switch
            id="show-comparison"
            checked={c.showComparison !== false}
            onCheckedChange={(v) => onChange({ ...c, showComparison: v })}
          />
          <Label htmlFor="show-comparison" className="text-xs">Exibir botão de comparação</Label>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Colunas visíveis ao expandir</Label>
          <p className="text-[10px] text-muted-foreground">Marque as colunas que aparecem no detalhe.</p>
          <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
            {(columns as string[]).map((col) => {
              if (SYSTEM_COLS.has(col)) return null;
              const isVisible = effectiveVisible.includes(col);
              return (
                <div key={col} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`detail-vis-${col}`}
                    checked={isVisible}
                    onChange={() => toggleColumn(col)}
                    className="h-3.5 w-3.5 rounded border-gray-300"
                  />
                  <label htmlFor={`detail-vis-${col}`} className="text-xs flex-1">{col}</label>
                  {isVisible && (
                    <Select3D value={getFormat(col)} options={getCompatibleFormats(columnTypes[col]).map(f => ({value: f.value, label: f.label}))} onChange={(v) => setFormat(col, v)} className="w-32" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
