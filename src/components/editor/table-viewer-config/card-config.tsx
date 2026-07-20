'use client';

import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select3D } from '@/components/ui/select3d';
import { Input } from '@/components/ui/input';
import { ColorSelect3D } from '@/components/ui/color-select-3d';
import { Checkbox3D } from '@/components/ui/checkbox-3d';
import { IconRenderer } from '@/components/ui/icon-renderer';
import { TableIconPicker } from '@/components/ui/table-icon-picker';
import { isColorString, hexToStyle } from '@/lib/color';
import { getCompatibleFormats, getDefaultFormat } from '@/lib/column-types/format-compatibility';
import { SYSTEM_COLS, WIKI_MGMT_COLS } from '@/lib/categorizable-columns';

const DEFAULT_BADGE_COLORS: Record<string, string> = {
  rarity: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  tier: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
  element: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
};

const DEFAULT_BADGE_HEX_COLORS: Record<string, string> = {
  rarity: '#F59E0B',
  tier: '#06B6D4',
  element: '#10B981',
};

const LABEL_COLS = new Set(['name', 'title', 'description', 'summary', 'slug']);
const SYSTEM_COLS_EXT = new Set([...SYSTEM_COLS, ...WIKI_MGMT_COLS]);

function SizeStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(6, value - 2))}
        className="h-5 w-5 rounded border border-border/50 bg-muted hover:bg-muted/80 flex items-center justify-center text-[10px] leading-none"
      >
        −
      </button>
      <span className="w-7 text-center text-[10px] font-mono">{value}px</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(32, value + 2))}
        className="h-5 w-5 rounded border border-border/50 bg-muted hover:bg-muted/80 flex items-center justify-center text-[10px] leading-none"
      >
        +
      </button>
    </div>
  );
}

export function CardConfig({
  config,
  columns = [],
  columnTypes = {},
  onChange,
  slug,
  tenantId,
}: {
  config: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
  columns?: string[];
  columnTypes?: Record<string, string>;
  slug?: string;
  tenantId?: string;
}) {
  const c: Record<string, any> = config || {};
  const layout = c.layout || 'card';
  const isVisualLayout = layout === 'card' || layout === 'accordion';

  // Badge state
  const badgeConfig: Record<string, any> = c.badgeConfig || {};
  const badgeColors: Record<string, string> = c.badgeColors || {};

  const availableColSet = useMemo(() => new Set(columns), [columns]);

  const effectiveBadges = useMemo(() => {
    const raw = c.badges !== undefined ? (c.badges as string[]) : [];
    const filtered = raw.filter(col => availableColSet.has(col));
    if (filtered.length > 0) return filtered;
    const candidates = columns.filter(col => !SYSTEM_COLS_EXT.has(col) && !LABEL_COLS.has(col));
    return candidates.slice(0, 1);
  }, [c.badges, columns, availableColSet]);

  const toggleBadge = (col: string) => {
    const wasSelected = effectiveBadges.includes(col);
    const next = wasSelected
      ? effectiveBadges.filter(b => b !== col)
      : [...effectiveBadges, col];
    const nextConfig = { ...badgeConfig };
    const nextColors = { ...badgeColors };
    if (wasSelected) {
      delete nextConfig[col];
      delete nextColors[col];
    }
    onChange({ ...c, badges: next, badgeConfig: nextConfig, badgeColors: nextColors });
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

  const badgeDisplayMode = c.badgeDisplayMode || 'inline';

  const setBadgeDisplayMode = (mode: string) => {
    onChange({ ...c, badgeDisplayMode: mode });
  };

  // Detail state
  const columnFormats: Record<string, string> = c.columnFormats || {};
  const formatVariants: Record<string, number> = c.columnFormatVariants || {};
  const columnOpEnabled: Record<string, boolean> = c.columnOpEnabled || {};

  const isOpEnabled = (col: string): boolean => columnOpEnabled[col] !== false;

  const toggleOp = (col: string) => {
    onChange({
      ...c,
      columnOpEnabled: { ...columnOpEnabled, [col]: !isOpEnabled(col) },
    });
  };

  const effectiveVisible = useMemo(() => {
    const visibleColumns: string[] = c.visibleColumns || [];
    if (visibleColumns.length > 0) return visibleColumns;
    const badgeSet = new Set(effectiveBadges);
    return columns.filter(col => !SYSTEM_COLS_EXT.has(col) && !LABEL_COLS.has(col) && !badgeSet.has(col));
  }, [c.visibleColumns, columns, effectiveBadges]);

  const toggleColumn = (col: string) => {
    const wasVisible = effectiveVisible.includes(col);
    if (wasVisible) {
      onChange({ ...c, visibleColumns: effectiveVisible.filter(c => c !== col) });
    } else {
      const next = [...effectiveVisible, col];
      const fmt = getDefaultFormat(columnTypes[col]);
      const formats = { ...columnFormats, [col]: fmt };
      onChange({ ...c, visibleColumns: next, columnFormats: formats });
    }
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
    return getDefaultFormat(columnTypes[col]);
  };

  const getVariant = (col: string): number => formatVariants[col] || 1;

  const cycleVariant = (col: string) => {
    const current = getVariant(col);
    const next = current >= 5 ? 1 : current + 1;
    onChange({ ...c, columnFormatVariants: { ...formatVariants, [col]: next } });
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

          <AnimatePresence>
            {layout === 'accordion' && (
              <motion.div
                initial={{ opacity: 0, rotateX: -90, height: 0 }}
                animate={{ opacity: 1, rotateX: 0, height: 'auto' }}
                exit={{ opacity: 0, rotateX: 90, height: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                style={{ transformStyle: 'preserve-3d', perspective: '800px', transformOrigin: 'top center' }}
              >
                <div className="flex items-center gap-2 pt-1 pb-2">
                  <Switch
                    id="default-expanded"
                    checked={c.defaultExpanded === true}
                    onCheckedChange={(v) => onChange({ ...c, defaultExpanded: v })}
                  />
                  <Label htmlFor="default-expanded" className="text-xs">Expandido por padrão</Label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
              <>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Modo dos badges</Label>
                  <div className="flex gap-1">
                    {(['lista', 'inline', 'footer-heading'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setBadgeDisplayMode(mode)}
                        className={`px-2 py-0.5 rounded text-xs border transition-colors ${
                          badgeDisplayMode === mode
                            ? 'bg-primary/10 border-primary/30 text-primary'
                            : 'bg-card border-border/50 text-muted-foreground hover:border-muted-foreground/30'
                        }`}
                      >
                        {mode === 'lista' ? 'Lista' : mode === 'inline' ? 'Inline' : 'Footer'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 rounded-md border bg-muted/20 p-3">
                <span className="text-xs font-medium text-muted-foreground">Configurar badges</span>
                {effectiveBadges.map((col) => {
                  const bc = badgeConfig[col] || {};
                  const iconSize = bc.iconSize ?? 10;
                  const labelSize = bc.labelSize ?? 10;
                  return (
                    <div key={col} className="space-y-1.5 rounded border bg-background p-2">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold">{col}</span>
                        <div className="flex items-center gap-1">
                          <span
                            className={`inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-medium${!isColorString(badgeColors[col] || '') ? ` ${badgeColors[col] || DEFAULT_BADGE_COLORS[col] || 'bg-background/80 backdrop-blur-sm border-border'}` : ''}`}
                            style={isColorString(badgeColors[col] || '') ? hexToStyle(badgeColors[col]) || {} : undefined}
                          >
                            {bc.icon && <IconRenderer icon={bc.icon} size={labelSize} />}
                            {col}
                          </span>
                          <TableIconPicker
                            value={bc.icon || ''}
                            onChange={(icon) => updateBadgeConfig(col, 'icon', icon)}
                            slug={slug || ''}
                            tenantId={tenantId}
                            size="sm"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Label className="text-[10px] text-muted-foreground">Cor</Label>
                        <ColorSelect3D
                          value={isColorString(badgeColors[col] || '') ? badgeColors[col] : (DEFAULT_BADGE_HEX_COLORS[col] || '#888888')}
                          onChange={(v) => updateBadgeColor(col, v)}
                          className="flex-1"
                          placeholder="Selecionar cor..."
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Label className="text-[10px] text-muted-foreground shrink-0">Label</Label>
                          <SizeStepper value={labelSize} onChange={(v) => updateBadgeConfig(col, 'labelSize', v)} />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Label className="text-[10px] text-muted-foreground shrink-0">Icon</Label>
                          <SizeStepper value={iconSize} onChange={(v) => updateBadgeConfig(col, 'iconSize', v)} />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Switch
                            id={`badge-hover-${col}`}
                            checked={bc.hover === true}
                            onCheckedChange={(v) => updateBadgeConfig(col, 'hover', v)}
                          />
                          <Label htmlFor={`badge-hover-${col}`} className="text-[10px]">Hover</Label>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Switch
                            id={`badge-action-${col}`}
                            checked={(bc.clickAction || 'none') !== 'none'}
                            onCheckedChange={(v) => updateBadgeConfig(col, 'clickAction', v ? 'comparison' : 'none')}
                          />
                          <Label htmlFor={`badge-action-${col}`} className="text-[10px]">Ação</Label>
                        </div>
                      </div>

                      {(bc.clickAction || 'none') !== 'none' && (
                        <div className="space-y-1.5">
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
            </>
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
          <Label className="text-xs text-muted-foreground">colunas visíveis</Label>
          <p className="text-[10px] text-muted-foreground">Marque as colunas que aparecem no detalhe.</p>
          <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
            {(columns as string[]).map((col) => {
              if (SYSTEM_COLS_EXT.has(col) || LABEL_COLS.has(col)) return null;
              const isVisible = effectiveVisible.includes(col);
              return (
                <div key={col} className="flex items-center gap-2">
                  <Checkbox3D
                    checked={isVisible}
                    onChange={() => toggleColumn(col)}
                    size="sm"
                    showParticles={false}
                    id={`detail-vis-${col}`}
                  />
                  <label htmlFor={`detail-vis-${col}`} className="text-xs flex-1">{col}</label>
                  {isVisible && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => toggleOp(col)}
                        className={`h-5 rounded px-1.5 text-[10px] font-bold leading-none border transition-colors ${
                          isOpEnabled(col)
                            ? 'bg-primary/10 border-primary/30 text-primary'
                            : 'bg-muted hover:bg-muted/80 text-muted-foreground border-border/50'
                        }`}
                        title="Converter operadores textuais em símbolos (×, −, +, ², etc.)"
                      >
                        OP
                      </button>
                      <button
                        type="button"
                        onClick={() => cycleVariant(col)}
                        className="flex items-center gap-0.5 h-5 rounded px-1 text-[10px] font-bold leading-none bg-muted hover:bg-muted/80 text-muted-foreground border border-border/50 transition-colors"
                        title="Variante de estilo"
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <span key={n} className={`${n === getVariant(col) ? 'text-foreground' : 'text-muted-foreground/30'}`}>
                            {n === getVariant(col) ? '●' : '○'}
                          </span>
                        ))}
                        <span className="ml-0.5 text-[10px] text-muted-foreground">{getVariant(col)}</span>
                      </button>
                      <Select3D value={getFormat(col)} options={getCompatibleFormats(columnTypes[col]).map(f => ({value: f.value, label: f.label}))} onChange={(v) => setFormat(col, v)} className="w-32" />
                    </div>
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
