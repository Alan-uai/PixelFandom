'use client';

import { useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select3D } from '@/components/ui/select3d';
import { ElasticSlider3D } from '@/components/ui/elastic-slider-3d';
import { IconPickerTrigger } from '@/components/ui/icon-picker';
import { IconRenderer } from '@/components/ui/icon-renderer';
import { MediaLibrary } from '@/components/ui/media-library';
import { Plus, Trash2, ImageIcon, Loader2, Tag, ArrowUpDown, ArrowDownUp, Palette } from 'lucide-react';
import { Icon } from '@iconify/react';
import { getCategorizableColumns, getSortableColumns, getColumnSortLabel, analyzeColumnValues, getHexHue } from '@/lib/categorizable-columns';
import { ColumnDisplay } from '@/lib/column-types/display-factory';

export function CategorizationConfig({
  config,
  columns = [],
  onChange,
  slug,
  items,
  itemsLoading,
  tenantId,
  columnTypes,
}: {
  config: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
  columns?: string[];
  slug?: string;
  items?: Record<string, unknown>[];
  itemsLoading?: boolean;
  tenantId?: string;
  columnTypes?: Record<string, string>;
}) {
  const c: Record<string, any> = config || {};
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [catDirActive, setCatDirActive] = useState(false);
  const [subDirActive, setSubDirActive] = useState(false);
  const [catItemDirActive, setCatItemDirActive] = useState(false);
  const [subCatItemDirActive, setSubCatItemDirActive] = useState(false);
  const [mediaLib, setMediaLib] = useState<{ open: boolean; pathPrefix: string; onChange: (url: string) => void }>({ open: false, pathPrefix: '', onChange: () => {} });

  const categorizableColumns = useMemo(
    () => getCategorizableColumns(columns as string[], {
      columnTypes: columnTypes as Record<string, string> | undefined,
      items: items as Record<string, unknown>[] | undefined,
    }),
    [columns, columnTypes, items],
  );

  const sortableColumns = useMemo(
    () => getSortableColumns(columns as string[], {
      columnTypes: columnTypes as Record<string, string> | undefined,
      items: items as Record<string, unknown>[] | undefined,
    }),
    [columns, columnTypes, items],
  );

  const detectedColumn = useMemo(() => {
    if (c.column && c.column !== 'none') return c.column;
    const tier1 = columns.filter(col => {
      const lower = col.toLowerCase();
      return lower === 'type' || lower === 'category' || lower.endsWith('_type');
    });
    const tier2 = columns.filter(col => {
      const lower = col.toLowerCase();
      return lower === 'rarity' || lower.endsWith('_rarity');
    });
    const tier3 = columns.filter(col => {
      const lower = col.toLowerCase();
      return lower === 'element' || lower.endsWith('_element') || lower === 'tier' || lower.endsWith('_tier') || lower === 'class' || lower.endsWith('_class');
    });
    return tier1[0] || tier2[0] || tier3[0] || columns[0] || null;
  }, [c.column, columns]);

  const categoryValues = useMemo(() => {
    if (!detectedColumn || !items || items.length === 0) return [];
    const values = new Set<string>();
    for (const item of items) {
      const v = item[detectedColumn];
      if (v != null && v !== '' && v !== 'none') {
        values.add(String(v));
      }
    }
    return Array.from(values).sort();
  }, [detectedColumn, items]);

  const catColumnAnalysis = useMemo(
    () => detectedColumn && items && items.length > 0
      ? analyzeColumnValues(items as Record<string, unknown>[], detectedColumn)
      : undefined,
    [detectedColumn, items],
  );

  const isAutoDetect = !c.column || c.column === 'none';
  const categoryIcons: Record<string, string> = c.categoryIcons || {};
  const isUrl = (val: string) => val.startsWith('http://') || val.startsWith('https://') || val.startsWith('data:');

  const handleIconSelect = (cat: string, iconId: string) => {
    onChange({ ...c, categoryIcons: { ...categoryIcons, [cat]: iconId } });
  };

  const handleImageChange = (cat: string, url: string) => {
    if (url) {
      onChange({ ...c, categoryIcons: { ...categoryIcons, [cat]: url } });
    } else {
      const updated = { ...categoryIcons };
      delete updated[cat];
      onChange({ ...c, categoryIcons: updated });
    }
  };

  // sub-category icons
  const secondaryIcons: Record<string, Record<string, string>> = c.secondaryIcons || {};
  const secondaryColumn = c.secondaryColumn;

  const secondaryValuesByCategory = useMemo(() => {
    if (!secondaryColumn || !items || !detectedColumn) return {};
    const map: Record<string, Set<string>> = {};
    for (const item of items) {
      const cat = String(item[detectedColumn] ?? '');
      const sub = String(item[secondaryColumn] ?? '');
      if (!cat || !sub || sub === 'none') continue;
      if (!map[cat]) map[cat] = new Set();
      map[cat].add(sub);
    }
    return Object.fromEntries(
      Object.entries(map).map(([k, v]) => [k, Array.from(v).sort()]),
    );
  }, [secondaryColumn, items, detectedColumn]);

  const flatSubValues = useMemo(() => {
    const vals: string[] = [];
    for (const subs of Object.values(secondaryValuesByCategory)) vals.push(...subs);
    return vals;
  }, [secondaryValuesByCategory]);

  const subColumnAnalysis = useMemo(
    () => secondaryColumn && items && items.length > 0
      ? analyzeColumnValues(items as Record<string, unknown>[], secondaryColumn)
      : undefined,
    [secondaryColumn, items],
  );

  const catSortLabel = getColumnSortLabel(categoryValues, catColumnAnalysis);
  const subSortLabel = getColumnSortLabel(flatSubValues, subColumnAnalysis);

  const catSortColumnValues = useMemo(() => {
    const sortCol = c.categorySortColumn;
    if (!sortCol || !items || items.length === 0) return [];
    const values = new Set<string>();
    for (const item of items) {
      const v = item[sortCol];
      if (v != null && v !== '' && v !== 'none') values.add(String(v));
    }
    return Array.from(values);
  }, [c.categorySortColumn, items]);

  const catSortColumnAnalysis = useMemo(
    () => c.categorySortColumn && items && items.length > 0
      ? analyzeColumnValues(items as Record<string, unknown>[], c.categorySortColumn)
      : undefined,
    [c.categorySortColumn, items],
  );

  const catSortColumnLabel = getColumnSortLabel(catSortColumnValues, catSortColumnAnalysis);

  const catItemSortValues = useMemo(() => {
    const sortCol = c.categoryItemSortColumn;
    if (!sortCol || !items || items.length === 0) return [];
    const values = new Set<string>();
    for (const item of items) {
      const v = item[sortCol];
      if (v != null && v !== '' && v !== 'none') values.add(String(v));
    }
    return Array.from(values);
  }, [c.categoryItemSortColumn, items]);

  const catItemSortAnalysis = useMemo(
    () => c.categoryItemSortColumn && items && items.length > 0
      ? analyzeColumnValues(items as Record<string, unknown>[], c.categoryItemSortColumn)
      : undefined,
    [c.categoryItemSortColumn, items],
  );

  const sortedCatItemChips = useMemo(() => {
    const order = (c.categoryItemOrder as string[]) || [];
    const dir = c.categoryItemSortDirection || 'asc';
    const colorMode = c.colorSortMode || 'value';
    const isColor = catItemSortAnalysis?.type === 'color';
    const ordered = order.filter((v) => catItemSortValues.includes(v));
    const remaining = catItemSortValues.filter((v) => !ordered.includes(v));
    if (dir === 'desc') ordered.reverse();
    if (isColor && colorMode === 'value') {
      remaining.sort((a, b) => getHexHue(a) - getHexHue(b));
    } else {
      remaining.sort((a, b) => (dir === 'desc' ? b.localeCompare(a) : a.localeCompare(b)));
    }
    return [...ordered, ...remaining];
  }, [catItemSortValues, c.categoryItemOrder, c.categoryItemSortDirection, c.colorSortMode, catItemSortAnalysis]);

  const subCatItemSortValues = useMemo(() => {
    const sortCol = c.subCategoryItemSortColumn;
    if (!sortCol || !items || items.length === 0) return [];
    const values = new Set<string>();
    for (const item of items) {
      const v = item[sortCol];
      if (v != null && v !== '' && v !== 'none') values.add(String(v));
    }
    return Array.from(values);
  }, [c.subCategoryItemSortColumn, items]);

  const subCatItemSortAnalysis = useMemo(
    () => c.subCategoryItemSortColumn && items && items.length > 0
      ? analyzeColumnValues(items as Record<string, unknown>[], c.subCategoryItemSortColumn)
      : undefined,
    [c.subCategoryItemSortColumn, items],
  );

  const sortedSubCatItemChips = useMemo(() => {
    const order = (c.subCategoryItemOrder as string[]) || [];
    const dir = c.subCategoryItemSortDirection || 'asc';
    const colorMode = c.colorSortMode || 'value';
    const isColor = subCatItemSortAnalysis?.type === 'color';
    const ordered = order.filter((v) => subCatItemSortValues.includes(v));
    const remaining = subCatItemSortValues.filter((v) => !ordered.includes(v));
    if (dir === 'desc') ordered.reverse();
    if (isColor && colorMode === 'value') {
      remaining.sort((a, b) => getHexHue(a) - getHexHue(b));
    } else {
      remaining.sort((a, b) => (dir === 'desc' ? b.localeCompare(a) : a.localeCompare(b)));
    }
    return [...ordered, ...remaining];
  }, [subCatItemSortValues, c.subCategoryItemOrder, c.subCategoryItemSortDirection, c.colorSortMode, subCatItemSortAnalysis]);

  const catItemSortLabel = getColumnSortLabel(catItemSortValues, catItemSortAnalysis);
  const subCatItemSortLabel = getColumnSortLabel(subCatItemSortValues, subCatItemSortAnalysis);

  const sortedCategoryChips = useMemo(() => {
    const order = (c.order as string[]) || [];
    const dir = c.categorySortDirection || 'asc';
    const sortCol = c.categorySortColumn;

    if (sortCol && items && items.length > 0 && detectedColumn) {
      const catToSortVal: Record<string, string> = {};
      for (const item of items) {
        const cat = String(item[detectedColumn] ?? '');
        if (!cat || cat === 'none') continue;
        if (!(cat in catToSortVal)) {
          catToSortVal[cat] = String(item[sortCol] ?? '');
        }
      }
      const ordered = order.filter((v) => categoryValues.includes(v));
      const remaining = categoryValues.filter((v) => !ordered.includes(v));
      remaining.sort((a, b) => {
        const va = catToSortVal[a] || '';
        const vb = catToSortVal[b] || '';
        return dir === 'desc' ? vb.localeCompare(va) : va.localeCompare(vb);
      });
      return [...ordered, ...remaining];
    }

    const colorMode = c.colorSortMode || 'value';
    const isColor = catColumnAnalysis?.type === 'color';
    const ordered = order.filter((v) => categoryValues.includes(v));
    const remaining = categoryValues.filter((v) => !ordered.includes(v));
    if (dir === 'desc') ordered.reverse();
    if (isColor && colorMode === 'value') {
      remaining.sort((a, b) => getHexHue(a) - getHexHue(b));
    } else {
      remaining.sort((a, b) => (dir === 'desc' ? b.localeCompare(a) : a.localeCompare(b)));
    }
    return [...ordered, ...remaining];
  }, [categoryValues, c.order, c.categorySortDirection, c.categorySortColumn, c.colorSortMode, catColumnAnalysis, detectedColumn, items]);

  const flatSubEntries = useMemo(() => {
    const entries: { key: string; cat: string; sub: string }[] = [];
    for (const [cat, subs] of Object.entries(secondaryValuesByCategory)) {
      for (const sub of subs) entries.push({ key: `${cat}::${sub}`, cat, sub });
    }
    return entries;
  }, [secondaryValuesByCategory]);

  const sortedSubChips = useMemo(() => {
    const order = (c.subOrder as string[]) || [];
    const dir = c.categorySortDirection || 'asc';
    const colorMode = c.colorSortMode || 'value';
    const isColor = subColumnAnalysis?.type === 'color';
    const ordered = order.filter((k) => flatSubEntries.some((e) => e.key === k));
    const remaining = flatSubEntries.filter((e) => !ordered.includes(e.key));
    if (dir === 'desc') ordered.reverse();
    if (isColor && colorMode === 'value') {
      remaining.sort((a, b) => getHexHue(a.sub) - getHexHue(b.sub));
    } else {
      remaining.sort((a, b) => (dir === 'desc' ? b.key.localeCompare(a.key) : a.key.localeCompare(b.key)));
    }
    return [...ordered.map((k) => flatSubEntries.find((e) => e.key === k)!), ...remaining];
  }, [flatSubEntries, c.subOrder, c.categorySortDirection, c.colorSortMode, subColumnAnalysis]);

  // Manual group icon/image helpers
  const manualGroups: any[] = c.manualGroups || [];
  const subManualGroups: any[] = c.subManualGroups || [];

  const updateManualGroup = (i: number, patch: Record<string, any>) => {
    const groups = [...manualGroups];
    groups[i] = { ...groups[i], ...patch };
    onChange({ ...c, manualGroups: groups });
  };

  const removeManualGroup = (i: number) => {
    onChange({ ...c, manualGroups: manualGroups.filter((_: any, j: number) => j !== i) });
  };

  const updateSubManualGroup = (i: number, patch: Record<string, any>) => {
    const groups = [...subManualGroups];
    groups[i] = { ...groups[i], ...patch };
    onChange({ ...c, subManualGroups: groups });
  };

  const removeSubManualGroup = (i: number) => {
    onChange({ ...c, subManualGroups: subManualGroups.filter((_: any, j: number) => j !== i) });
  };

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

      <Select3D label="Coluna de categoria" value={c.column || 'none'} options={[{label: 'Auto-detect', value: 'none'}, ...categorizableColumns.map((col) => ({label: col, value: col}))]} onChange={(v) => onChange({ ...c, column: v === 'none' ? null : v })} />

      {detectedColumn && (
        <div className="space-y-2 rounded-md border bg-muted/20 p-3">
          <div className="flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium">Categorias Detectadas</span>
          </div>

          {itemsLoading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Carregando dados...
            </div>
          ) : items && items.length > 0 ? (
            <>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                {isAutoDetect ? (
                  <>Auto-detecção ativa — coluna: <span className="font-semibold text-foreground">{detectedColumn}</span></>
                ) : (
                  <>Coluna: <span className="font-semibold text-foreground">{detectedColumn}</span></>
                )}
                <span className="ml-auto text-[10px]">{categoryValues.length} {categoryValues.length === 1 ? 'categoria' : 'categorias'}</span>
              </div>

              {categoryValues.length > 0 ? (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {categoryValues.map((cat) => {
                    const currentIcon = categoryIcons[cat];
                    const isImg = currentIcon ? isUrl(currentIcon) : false;

                    return (
                      <div key={cat} className="flex items-center gap-2 rounded-md border bg-background px-2 py-1.5">
                        <div className="w-7 h-7 shrink-0 rounded border flex items-center justify-center bg-muted/20 overflow-hidden">
                          {currentIcon ? (
                            isImg ? (
                              <Image src={currentIcon} alt="" width={16} height={16} className="object-contain" />
                            ) : (
                              <IconRenderer icon={currentIcon} size="sm" />
                            )
                          ) : (
                            <Icon icon="lucide:help-circle" width={14} height={14} className="text-muted-foreground/50" />
                          )}
                        </div>

                        <span className="text-xs font-medium flex-1 truncate">{cat}</span>

                        <IconPickerTrigger
                          value={currentIcon && !isImg ? currentIcon : undefined}
                          onChange={(iconId) => handleIconSelect(cat, iconId)}
                          size="sm"
                        />

                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" title="Upload de imagem"
                          onClick={() => setMediaLib({ open: true, pathPrefix: `wiki-categories/${slug}/${cat}`, onChange: (url) => handleImageChange(cat, url) })}
                        >
                          <ImageIcon className="h-3 w-3" />
                        </Button>

                        {currentIcon && (
                          <button
                            type="button"
                            onClick={() => handleImageChange(cat, '')}
                            className="text-muted-foreground hover:text-destructive shrink-0 p-0.5"
                            title="Remover ícone"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground py-0.5">Nenhuma categoria encontrada nos dados desta tabela.</p>
              )}
            </>
          ) : (
            <p className="text-[10px] text-muted-foreground py-0.5">Adicione dados à tabela para visualizar as categorias.</p>
          )}
        </div>
      )}

      <ElasticSlider3D
        label="Tamanho do ícone"
        defaultValue={c.iconSize ?? 16}
        startingValue={12}
        maxValue={64}
        showValue
        valueSuffix="px"
        onValueChange={(v) => onChange({ ...c, iconSize: Math.round(v) })}
      />

      <ElasticSlider3D
        label="Tamanho do label"
        defaultValue={c.labelSize ?? 12}
        startingValue={10}
        maxValue={32}
        showValue
        valueSuffix="px"
        onValueChange={(v) => onChange({ ...c, labelSize: Math.round(v) })}
      />

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Estilo das categorias</Label>
        <div className="flex gap-1">
          {(['headings', 'tabs', 'accordion'] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange({ ...c, style: opt })}
              className={`flex-1 rounded-md px-2.5 py-1.5 text-xs font-medium border transition-colors ${
                (c.style || 'headings') === opt
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-card border-border/50 text-muted-foreground hover:border-muted-foreground/30'
              }`}
            >
              {opt === 'headings' ? 'Títulos' : opt === 'tabs' ? 'Abas' : 'Acordeão'}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {(c.style || 'headings') === 'tabs' && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="space-y-1 pb-1">
              <ElasticSlider3D
                label="Exibição das abas"
                defaultValue={c.tabLabelDisplay === 'name' ? 0 : c.tabLabelDisplay === 'icon' ? 2 : 1}
                startingValue={0}
                maxValue={2}
                isStepped
                stepSize={1}
                showValue={false}
                onValueChange={(v) => {
                  const map = ['name', 'both', 'icon'] as const;
                  onChange({ ...c, tabLabelDisplay: map[Math.round(v)] });
                }}
              />
              <div className="flex justify-between px-1">
                {['Nome', 'Ambos', 'Ícone'].map((l) => (
                  <span key={l} className="text-[10px] text-muted-foreground">{l}</span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {c.style === 'accordion' && (
        <div className="flex items-center gap-2">
          <Switch
            id="default-expanded"
            checked={c.defaultExpanded !== false}
            onCheckedChange={(v) => onChange({ ...c, defaultExpanded: v })}
          />
          <Label htmlFor="default-expanded" className="text-xs">Expandido por padrão</Label>
        </div>
      )}

      {c.style !== 'tabs' && (
        <>
          {/* === Espaçamento entre categorias === */}
          <div className="space-y-3 border-t pt-3">
            <div className="flex items-center gap-2">
              <Switch
                id="spacing-enabled"
                checked={c.spacingEnabled !== false}
                onCheckedChange={(v) => onChange({ ...c, spacingEnabled: v })}
              />
              <Label htmlFor="spacing-enabled" className="text-xs">Espaçamento entre categorias</Label>
            </div>

            {c.spacingEnabled !== false && (
              <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                <Select3D
                  label="Estilo do espaçamento"
                  value={c.spacingStyle || 'none'}
                  options={[
                    { label: 'Padrão (sem linha)', value: 'none' },
                    { label: '--- (linha simples)', value: 'single-line' },
                    { label: '=== (linhas duplas)', value: 'double-line' },
                    { label: '- - - (tracejada)', value: 'dashed' },
                  ]}
                  onChange={(v) => onChange({ ...c, spacingStyle: v })}
                />
                {c.spacingStyle && c.spacingStyle !== 'none' && (
                  <ElasticSlider3D
                    label="Espaçamento entre linha e conteúdo"
                    defaultValue={c.spacingValue || 16}
                    startingValue={2}
                    maxValue={64}
                    showValue
                    valueSuffix="px"
                    onValueChange={(v) => onChange({ ...c, spacingValue: Math.round(v) })}
                  />
                )}
                {c.spacingStyle && c.spacingStyle !== 'none' && (
                  <ElasticSlider3D
                    label="Espessura da linha"
                    defaultValue={c.separatorWidth ?? 2}
                    startingValue={0}
                    maxValue={16}
                    showValue
                    valueSuffix="px"
                    onValueChange={(v) => onChange({ ...c, separatorWidth: v })}
                  />
                )}
              </div>
            )}
          </div>
        </>
      )}

      <Select3D label="Categorização secundária" value={c.secondaryColumn || 'none'} options={[{label: 'Nenhuma', value: 'none'}, ...categorizableColumns.filter((col) => col !== detectedColumn).map((col) => ({label: col, value: col}))]} onChange={(v) => onChange({ ...c, secondaryColumn: v === 'none' ? null : v })} />

      {/* Sub-category icons per category */}
      {secondaryColumn && Object.keys(secondaryValuesByCategory).length > 0 && (
        <div className="space-y-2 rounded-md border bg-muted/20 p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Tag className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium">Ícones de Sub-categorias</span>
          </div>
          {Object.entries(secondaryValuesByCategory).map(([cat, subs]) => (
            <div key={cat} className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground capitalize block">{cat}</span>
              <div className="flex flex-wrap gap-1 pl-2">
                {subs.map((sub) => {
                  const currentIcon = secondaryIcons?.[cat]?.[sub];
                  const isImg = currentIcon ? isUrl(currentIcon) : false;
                  return (
                    <div key={sub} className="flex items-center gap-1 rounded-md border bg-background px-1.5 py-0.5">
                      <div className="w-5 h-5 shrink-0 rounded border flex items-center justify-center bg-muted/20 overflow-hidden">
                        {currentIcon ? (
                          isImg ? (
                            <Image src={currentIcon} alt="" width={12} height={12} className="object-contain" />
                          ) : (
                            <IconRenderer icon={currentIcon} size="sm" />
                          )
                        ) : (
                          <Icon icon="lucide:help-circle" width={10} height={10} className="text-muted-foreground/50" />
                        )}
                      </div>
                      <span className="text-[10px]">{sub}</span>
                      <IconPickerTrigger
                        value={currentIcon && !isImg ? currentIcon : undefined}
                        onChange={(iconId) => {
                          onChange({
                            ...c,
                            secondaryIcons: {
                              ...secondaryIcons,
                              [cat]: { ...(secondaryIcons[cat] || {}), [sub]: iconId },
                            },
                          });
                        }}
                        size="sm"
                      />
                      <Button variant="ghost" size="icon" className="h-4 w-4 shrink-0" title="Upload de imagem"
                        onClick={() => setMediaLib({ open: true, pathPrefix: `wiki-subcategories/${slug}/${cat}/${sub}`, onChange: (url) => {
                          onChange({
                            ...c,
                            secondaryIcons: {
                              ...secondaryIcons,
                              [cat]: { ...(secondaryIcons[cat] || {}), [sub]: url },
                            },
                          });
                        }})}
                      >
                        <ImageIcon className="h-2.5 w-2.5" />
                      </Button>
                      {currentIcon && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = { ...secondaryIcons };
                            if (updated[cat]) delete updated[cat][sub];
                            if (Object.keys(updated[cat]).length === 0) delete updated[cat];
                            onChange({ ...c, secondaryIcons: updated });
                          }}
                          className="text-muted-foreground hover:text-destructive shrink-0 p-0.5"
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* === Ordem das categorias === */}
      <div className="space-y-2 border-t pt-3">
        <Label className="text-xs text-muted-foreground">Ordem das categorias</Label>
        <Select3D
          label="Ordenar por coluna"
          value={c.categorySortColumn || 'none'}
          options={[
            { label: 'Nome da categoria', value: 'none' },
            ...sortableColumns.map((col) => ({ label: col, value: col })),
          ]}
          onChange={(v) => onChange({ ...c, categorySortColumn: v === 'none' ? null : v })}
        />
        {categoryValues.length > 0 && (
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] text-muted-foreground">Clique para definir posição. Vazias seguem ordem definida.</p>
            <button
              type="button"
              onClick={() => {
                const analysis = c.categorySortColumn ? catSortColumnAnalysis : catColumnAnalysis;
                if (analysis?.type === 'color') {
                  if (clickTimer.current) {
                    clearTimeout(clickTimer.current);
                    clickTimer.current = null;
                    setCatDirActive(!catDirActive);
                  } else {
                    clickTimer.current = setTimeout(() => {
                      clickTimer.current = null;
                      if (catDirActive) {
                        const dir = c.categorySortDirection === 'asc' ? 'desc' : 'asc';
                        onChange({ ...c, categorySortDirection: dir });
                      } else {
                        onChange({ ...c, colorSortMode: c.colorSortMode === 'value' ? 'name' : 'value' });
                      }
                    }, 250);
                  }
                } else {
                  const dir = c.categorySortDirection === 'asc' ? 'desc' : 'asc';
                  onChange({ ...c, categorySortDirection: dir });
                }
              }}
              className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              title={catColumnAnalysis?.type === 'color' ? 'Clique simples: alternar modo/direção. Clique duplo: alternar entre modo e direção.' : 'Alternar direção da ordenação'}
            >
              {(() => {
                const analysis = c.categorySortColumn ? catSortColumnAnalysis : catColumnAnalysis;
                const label = c.categorySortColumn ? catSortColumnLabel : catSortLabel;
                if (analysis?.type === 'color') {
                  return !catDirActive
                    ? (c.colorSortMode === 'value' ? <><Palette className="h-3 w-3" /> hex→A</> : <><Palette className="h-3 w-3" /> A→hex</>)
                    : (c.colorSortMode === 'value'
                      ? (c.categorySortDirection === 'asc' ? <><Palette className="h-3 w-3" /> hex1→hexN</> : <><Palette className="h-3 w-3" /> hexN→hex1</>)
                      : (c.categorySortDirection === 'asc' ? <><Palette className="h-3 w-3" /> A→Z</> : <><Palette className="h-3 w-3" /> Z→A</>));
                }
                if (label.mode === 'boolean') {
                  return c.categorySortDirection === 'asc' ? (
                    <><ArrowUpDown className="h-3 w-3" /> {label.label}</>
                  ) : (
                    <><ArrowDownUp className="h-3 w-3" /> {label.label.replace(/^(.+)→(.+)$/, '$2→$1')}</>
                  );
                }
                return c.categorySortDirection === 'asc' ? (
                  <><ArrowUpDown className="h-3 w-3" /> {label.label}</>
                ) : (
                  <><ArrowDownUp className="h-3 w-3" /> {label.isNumeric ? '1→0' : 'Z→A'}</>
                );
              })()}
            </button>
          </div>
        )}
        {categoryValues.length > 0 ? (
          <div className="flex flex-wrap gap-1 max-h-48 overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {sortedCategoryChips.map((cat) => {
                const orderIndex = ((c.order as string[]) || []).indexOf(cat);
                const isOrdered = orderIndex >= 0;
                return (
                  <motion.button
                    key={cat}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    type="button"
                    onClick={() => {
                      const currentOrder = (c.order as string[]) || [];
                      if (isOrdered) {
                        onChange({ ...c, order: currentOrder.filter((v) => v !== cat) });
                      } else {
                        onChange({ ...c, order: [...currentOrder, cat] });
                      }
                    }}
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border transition-colors ${
                      isOrdered
                        ? 'bg-primary/10 border-primary/30 text-primary'
                        : 'bg-card border-border/50 text-muted-foreground hover:border-muted-foreground/30'
                    }`}
                  >
                    {isOrdered && <span className="text-[10px] font-mono opacity-60">{orderIndex + 1}.</span>}
                    <ColumnDisplay value={cat} column={detectedColumn} renderType={columnTypes?.[detectedColumn] || 'auto'} hideLabel plain />
                    {isOrdered && <Trash2 className="h-2.5 w-2.5 shrink-0" />}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <p className="text-[10px] text-muted-foreground py-0.5">Nenhuma categoria disponível.</p>
        )}

        <div className="border-t border-border/30 pt-2 mt-2">
          <Label className="text-[10px] text-muted-foreground">Ordenação dos itens para categorias</Label>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1">
              <Select3D
                label="Coluna"
                value={c.categoryItemSortColumn || 'none'}
                options={[
                  { label: 'Ordem padrão', value: 'none' },
                  ...sortableColumns.map((col) => ({ label: col, value: col })),
                ]}
                onChange={(v) => onChange({ ...c, categoryItemSortColumn: v === 'none' ? null : v })}
              />
            </div>
            {c.categoryItemSortColumn && (
              <button
                type="button"
                onClick={() => {
                  if (catItemSortAnalysis?.type === 'color') {
                    if (clickTimer.current) {
                      clearTimeout(clickTimer.current);
                      clickTimer.current = null;
                      setCatItemDirActive(!catItemDirActive);
                    } else {
                      clickTimer.current = setTimeout(() => {
                        clickTimer.current = null;
                        if (catItemDirActive) {
                          const dir = c.categoryItemSortDirection === 'asc' ? 'desc' : 'asc';
                          onChange({ ...c, categoryItemSortDirection: dir });
                        } else {
                          onChange({ ...c, colorSortMode: c.colorSortMode === 'value' ? 'name' : 'value' });
                        }
                      }, 250);
                    }
                  } else {
                    const dir = c.categoryItemSortDirection === 'asc' ? 'desc' : 'asc';
                    onChange({ ...c, categoryItemSortDirection: dir });
                  }
                }}
                className="flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-4"
              >
                {catItemSortAnalysis?.type === 'color' ? (
                  !catItemDirActive
                    ? (c.colorSortMode === 'value' ? <><Palette className="h-3 w-3" /> hex→A</> : <><Palette className="h-3 w-3" /> A→hex</>)
                    : (c.colorSortMode === 'value'
                      ? (c.categoryItemSortDirection === 'asc' ? <><Palette className="h-3 w-3" /> hex1→hexN</> : <><Palette className="h-3 w-3" /> hexN→hex1</>)
                      : (c.categoryItemSortDirection === 'asc' ? <><Palette className="h-3 w-3" /> A→Z</> : <><Palette className="h-3 w-3" /> Z→A</>))
                ) : catItemSortLabel.mode === 'boolean' ? (
                  c.categoryItemSortDirection === 'asc' ? (
                    <><ArrowUpDown className="h-3 w-3" /> {catItemSortLabel.label}</>
                  ) : (
                    <><ArrowDownUp className="h-3 w-3" /> {catItemSortLabel.label.replace(/^(.+)→(.+)$/, '$2→$1')}</>
                  )
                ) : (
                  c.categoryItemSortDirection === 'asc' ? (
                    <><ArrowUpDown className="h-3 w-3" /> {catItemSortLabel.label}</>
                  ) : (
                    <><ArrowDownUp className="h-3 w-3" /> {catItemSortLabel.isNumeric ? '1→0' : 'Z→A'}</>
                  )
                )}
              </button>
            )}
          </div>

          {c.categoryItemSortColumn && (
            <div className="mt-2 space-y-1">
              <p className="text-[10px] text-muted-foreground">Clique para definir ordem dos valores.</p>
              <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                <AnimatePresence mode="popLayout">
                  {sortedCatItemChips.map((val) => {
                    const orderIndex = ((c.categoryItemOrder as string[]) || []).indexOf(val);
                    const isOrdered = orderIndex >= 0;
                    return (
                      <motion.button
                        key={val}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        type="button"
                        onClick={() => {
                          const currentOrder = (c.categoryItemOrder as string[]) || [];
                          if (isOrdered) {
                            onChange({ ...c, categoryItemOrder: currentOrder.filter((v) => v !== val) });
                          } else {
                            onChange({ ...c, categoryItemOrder: [...currentOrder, val] });
                          }
                        }}
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border transition-colors ${
                          isOrdered
                            ? 'bg-primary/10 border-primary/30 text-primary'
                            : 'bg-card border-border/50 text-muted-foreground hover:border-muted-foreground/30'
                        }`}
                      >
                        {isOrdered && <span className="text-[10px] font-mono opacity-60">{orderIndex + 1}.</span>}
                        <ColumnDisplay value={val} column={c.categoryItemSortColumn} renderType={columnTypes?.[c.categoryItemSortColumn] || 'auto'} plain />
                        {isOrdered && <Trash2 className="h-2.5 w-2.5 shrink-0" />}
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* === Ordem das sub-categorias === */}
      {secondaryColumn && Object.keys(secondaryValuesByCategory).length > 0 && (
        <div className="space-y-2 border-t pt-3">
          <Label className="text-xs text-muted-foreground">Ordem das sub-categorias</Label>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] text-muted-foreground">Clique para definir posição.</p>
            <button
              type="button"
              onClick={() => {
                if (subColumnAnalysis?.type === 'color') {
                  if (clickTimer.current) {
                    clearTimeout(clickTimer.current);
                    clickTimer.current = null;
                    setSubDirActive(!subDirActive);
                  } else {
                    clickTimer.current = setTimeout(() => {
                      clickTimer.current = null;
                      if (subDirActive) {
                        const dir = c.categorySortDirection === 'asc' ? 'desc' : 'asc';
                        onChange({ ...c, categorySortDirection: dir });
                      } else {
                        onChange({ ...c, colorSortMode: c.colorSortMode === 'value' ? 'name' : 'value' });
                      }
                    }, 250);
                  }
                } else {
                  const dir = c.categorySortDirection === 'asc' ? 'desc' : 'asc';
                  onChange({ ...c, categorySortDirection: dir });
                }
              }}
              className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {subColumnAnalysis?.type === 'color' ? (
                !subDirActive
                  ? (c.colorSortMode === 'value' ? <><Palette className="h-3 w-3" /> hex→A</> : <><Palette className="h-3 w-3" /> A→hex</>)
                  : (c.colorSortMode === 'value'
                    ? (c.categorySortDirection === 'asc' ? <><Palette className="h-3 w-3" /> hex1→hexN</> : <><Palette className="h-3 w-3" /> hexN→hex1</>)
                    : (c.categorySortDirection === 'asc' ? <><Palette className="h-3 w-3" /> A→Z</> : <><Palette className="h-3 w-3" /> Z→A</>))
              ) : subSortLabel.mode === 'boolean' ? (
                c.categorySortDirection === 'asc' ? (
                  <><ArrowUpDown className="h-3 w-3" /> {subSortLabel.label}</>
                ) : (
                  <><ArrowDownUp className="h-3 w-3" /> {subSortLabel.label.replace(/^(.+)→(.+)$/, '$2→$1')}</>
                )
              ) : (
                c.categorySortDirection === 'asc' ? (
                  <><ArrowUpDown className="h-3 w-3" /> {subSortLabel.label}</>
                ) : (
                  <><ArrowDownUp className="h-3 w-3" /> {subSortLabel.isNumeric ? '1→0' : 'Z→A'}</>
                )
              )}
            </button>
          </div>
          <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {sortedSubChips.map(({ key, cat, sub }) => {
                const orderIndex = ((c.subOrder as string[]) || []).indexOf(key);
                const isOrdered = orderIndex >= 0;
                return (
                  <motion.button
                    key={key}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    type="button"
                    onClick={() => {
                      const currentOrder = (c.subOrder as string[]) || [];
                      if (isOrdered) {
                        onChange({ ...c, subOrder: currentOrder.filter((v) => v !== key) });
                      } else {
                        onChange({ ...c, subOrder: [...currentOrder, key] });
                      }
                    }}
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border transition-colors ${
                      isOrdered
                        ? 'bg-primary/10 border-primary/30 text-primary'
                        : 'bg-card border-border/50 text-muted-foreground hover:border-muted-foreground/30'
                    }`}
                  >
                    {isOrdered && <span className="text-[10px] font-mono opacity-60">{orderIndex + 1}.</span>}
                    <span className="text-[10px] opacity-60">{cat}:</span>
                    <ColumnDisplay value={sub} column={secondaryColumn} renderType={columnTypes?.[secondaryColumn] || 'auto'} plain />
                    {isOrdered && <Trash2 className="h-2.5 w-2.5 shrink-0" />}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>

          <div className="border-t border-border/30 pt-2 mt-2">
            <Label className="text-[10px] text-muted-foreground">Ordenação dos itens para sub-categorias</Label>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1">
              <Select3D
                label="Coluna"
                value={c.subCategoryItemSortColumn || 'none'}
                options={[
                  { label: 'Ordem padrão', value: 'none' },
                  ...sortableColumns.map((col) => ({ label: col, value: col })),
                ]}
                onChange={(v) => onChange({ ...c, subCategoryItemSortColumn: v === 'none' ? null : v })}
              />
              </div>
              {c.subCategoryItemSortColumn && (
                <button
                  type="button"
                  onClick={() => {
                    if (subCatItemSortAnalysis?.type === 'color') {
                      if (clickTimer.current) {
                        clearTimeout(clickTimer.current);
                        clickTimer.current = null;
                        setSubCatItemDirActive(!subCatItemDirActive);
                      } else {
                        clickTimer.current = setTimeout(() => {
                          clickTimer.current = null;
                          if (subCatItemDirActive) {
                            const dir = c.subCategoryItemSortDirection === 'asc' ? 'desc' : 'asc';
                            onChange({ ...c, subCategoryItemSortDirection: dir });
                          } else {
                            onChange({ ...c, colorSortMode: c.colorSortMode === 'value' ? 'name' : 'value' });
                          }
                        }, 250);
                      }
                    } else {
                      const dir = c.subCategoryItemSortDirection === 'asc' ? 'desc' : 'asc';
                      onChange({ ...c, subCategoryItemSortDirection: dir });
                    }
                  }}
                  className="flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-4"
                >
                  {subCatItemSortAnalysis?.type === 'color' ? (
                    !subCatItemDirActive
                      ? (c.colorSortMode === 'value' ? <><Palette className="h-3 w-3" /> hex→A</> : <><Palette className="h-3 w-3" /> A→hex</>)
                      : (c.colorSortMode === 'value'
                        ? (c.subCategoryItemSortDirection === 'asc' ? <><Palette className="h-3 w-3" /> hex1→hexN</> : <><Palette className="h-3 w-3" /> hexN→hex1</>)
                        : (c.subCategoryItemSortDirection === 'asc' ? <><Palette className="h-3 w-3" /> A→Z</> : <><Palette className="h-3 w-3" /> Z→A</>))
                  ) : subCatItemSortLabel.mode === 'boolean' ? (
                    c.subCategoryItemSortDirection === 'asc' ? (
                      <><ArrowUpDown className="h-3 w-3" /> {subCatItemSortLabel.label}</>
                    ) : (
                      <><ArrowDownUp className="h-3 w-3" /> {subCatItemSortLabel.label.replace(/^(.+)→(.+)$/, '$2→$1')}</>
                    )
                  ) : (
                    c.subCategoryItemSortDirection === 'asc' ? (
                      <><ArrowUpDown className="h-3 w-3" /> {subCatItemSortLabel.label}</>
                    ) : (
                      <><ArrowDownUp className="h-3 w-3" /> {subCatItemSortLabel.isNumeric ? '1→0' : 'Z→A'}</>
                    )
                  )}
                </button>
              )}
            </div>

            {c.subCategoryItemSortColumn && (
              <div className="mt-2 space-y-1">
                <p className="text-[10px] text-muted-foreground">Clique para definir ordem dos valores.</p>
                <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                  <AnimatePresence mode="popLayout">
                    {sortedSubCatItemChips.map((val) => {
                      const orderIndex = ((c.subCategoryItemOrder as string[]) || []).indexOf(val);
                      const isOrdered = orderIndex >= 0;
                      return (
                        <motion.button
                          key={val}
                          layout
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                          type="button"
                          onClick={() => {
                            const currentOrder = (c.subCategoryItemOrder as string[]) || [];
                            if (isOrdered) {
                              onChange({ ...c, subCategoryItemOrder: currentOrder.filter((v) => v !== val) });
                            } else {
                              onChange({ ...c, subCategoryItemOrder: [...currentOrder, val] });
                            }
                          }}
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border transition-colors ${
                            isOrdered
                              ? 'bg-primary/10 border-primary/30 text-primary'
                              : 'bg-card border-border/50 text-muted-foreground hover:border-muted-foreground/30'
                          }`}
                        >
                          {isOrdered && <span className="text-[10px] font-mono opacity-60">{orderIndex + 1}.</span>}
                          <ColumnDisplay value={val} column={c.subCategoryItemSortColumn} renderType={columnTypes?.[c.subCategoryItemSortColumn] || 'auto'} plain />
                          {isOrdered && <Trash2 className="h-2.5 w-2.5 shrink-0" />}
                        </motion.button>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* === Grupos manuais (categorias personalizadas) === */}
      <div className="space-y-2 border-t pt-3">
        <Label className="text-xs text-muted-foreground">Grupos manuais</Label>
        <p className="text-[10px] text-muted-foreground">Agrupe valores existentes sob um novo nome.</p>
        {manualGroups.map((mg: any, i: number) => {
          const currentIcon = mg.icon || (mg.imageUrl ? mg.imageUrl : undefined);
          const isImg = mg.imageUrl ? true : false;
          return (
            <div key={i} className="space-y-1 rounded border p-2">
              <div className="flex items-center gap-2">
                {currentIcon && (
                  <div className="w-6 h-6 shrink-0 rounded border flex items-center justify-center bg-muted/20 overflow-hidden">
                    {isImg ? (
                      <Image src={mg.imageUrl} alt="" width={14} height={14} className="object-contain" />
                    ) : (
                      <IconRenderer icon={mg.icon} size="sm" />
                    )}
                  </div>
                )}
                <Input
                  value={mg.label}
                  onChange={(e) => updateManualGroup(i, { label: e.target.value })}
                  placeholder="Nome do grupo"
                  className="h-7 text-xs flex-1"
                />
              </div>
              <div className="flex items-center gap-1 pl-8">
                <IconPickerTrigger
                  value={mg.icon && !isImg ? mg.icon : undefined}
                  onChange={(iconId) => updateManualGroup(i, { icon: iconId, imageUrl: undefined })}
                  size="sm"
                />
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" title="Upload de imagem"
                  onClick={() => setMediaLib({ open: true, pathPrefix: `wiki-manual-groups/${slug}/${i}`, onChange: (url) => updateManualGroup(i, { imageUrl: url, icon: undefined }) })}
                >
                  <ImageIcon className="h-3 w-3" />
                </Button>
                {currentIcon && (
                  <button
                    type="button"
                    onClick={() => updateManualGroup(i, { icon: undefined, imageUrl: undefined })}
                    className="text-muted-foreground hover:text-destructive shrink-0 p-0.5"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1 pl-8">
                {categoryValues.map((val) => {
                  const selected = ((mg.values as string[]) || []).includes(val);
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        const vals = (mg.values as string[]) || [];
                        updateManualGroup(i, {
                          values: selected
                            ? vals.filter((v: string) => v !== val)
                            : [...vals, val],
                        });
                      }}
                      className={`px-1.5 py-0.5 rounded text-[10px] border transition-colors ${
                        selected
                          ? 'bg-primary/10 border-primary/30 text-primary'
                          : 'bg-card border-border/50 text-muted-foreground hover:border-muted-foreground/30'
                      }`}
                    >
                      {val}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between pl-8">
                <span className="text-[10px] text-muted-foreground">
                  Ordem: <span className="font-medium">{(c.order as string[])?.indexOf?.(mg.label) >= 0 ? ((c.order as string[])?.indexOf?.(mg.label) + 1) : 'não definida'}</span>
                  {((c.order as string[])?.indexOf?.(mg.label) >= 0) && (
                    <button
                      type="button"
                      onClick={() => {
                        const currentOrder = (c.order as string[]) || [];
                        onChange({ ...c, order: currentOrder.filter((v) => v !== mg.label) });
                      }}
                      className="ml-1 text-destructive hover:underline"
                    >
                      remover
                    </button>
                  )}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-6"
                  onClick={() => removeManualGroup(i)}
                >
                  <Trash2 className="h-3 w-3 mr-1" /> Remover
                </Button>
              </div>
            </div>
          );
        })}
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-7"
          onClick={() => onChange({
            ...c,
            manualGroups: [...manualGroups, { label: '', values: [] }],
          })}
        >
          <Plus className="h-3 w-3 mr-1" /> Adicionar grupo
        </Button>
      </div>

      {/* === Sub-grupos manuais === */}
      {secondaryColumn && (
        <div className="space-y-2 border-t pt-3">
          <Label className="text-xs text-muted-foreground">Sub-grupos manuais</Label>
          <p className="text-[10px] text-muted-foreground">Agrupe valores de sub-categorias sob um novo nome.</p>
          {subManualGroups.map((mg: any, i: number) => {
            const currentIcon = mg.icon || (mg.imageUrl ? mg.imageUrl : undefined);
            const isImg = mg.imageUrl ? true : false;
            return (
              <div key={i} className="space-y-1 rounded border p-2">
                <div className="flex items-center gap-2">
                  {currentIcon && (
                    <div className="w-6 h-6 shrink-0 rounded border flex items-center justify-center bg-muted/20 overflow-hidden">
                      {isImg ? (
                        <Image src={mg.imageUrl} alt="" width={14} height={14} className="object-contain" />
                      ) : (
                        <IconRenderer icon={mg.icon} size="sm" />
                      )}
                    </div>
                  )}
                  <Input
                    value={mg.label}
                    onChange={(e) => updateSubManualGroup(i, { label: e.target.value })}
                    placeholder="Nome do sub-grupo"
                    className="h-7 text-xs flex-1"
                  />
                </div>
                <div className="flex items-center gap-1 pl-8">
                  <IconPickerTrigger
                    value={mg.icon && !isImg ? mg.icon : undefined}
                    onChange={(iconId) => updateSubManualGroup(i, { icon: iconId, imageUrl: undefined })}
                    size="sm"
                  />
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" title="Upload de imagem"
                    onClick={() => setMediaLib({ open: true, pathPrefix: `wiki-sub-manual-groups/${slug}/${i}`, onChange: (url) => updateSubManualGroup(i, { imageUrl: url, icon: undefined }) })}
                  >
                    <ImageIcon className="h-3 w-3" />
                  </Button>
                  {currentIcon && (
                    <button
                      type="button"
                      onClick={() => updateSubManualGroup(i, { icon: undefined, imageUrl: undefined })}
                      className="text-muted-foreground hover:text-destructive shrink-0 p-0.5"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 pl-8">
                  {Object.entries(secondaryValuesByCategory).flatMap(([cat, subs]) =>
                    subs.map((sub) => {
                      const key = `${cat}::${sub}`;
                      const selected = ((mg.values as string[]) || []).includes(key);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            const vals = (mg.values as string[]) || [];
                            updateSubManualGroup(i, {
                              values: selected
                                ? vals.filter((v: string) => v !== key)
                                : [...vals, key],
                            });
                          }}
                          className={`px-1.5 py-0.5 rounded text-[10px] border transition-colors ${
                            selected
                              ? 'bg-primary/10 border-primary/30 text-primary'
                              : 'bg-card border-border/50 text-muted-foreground hover:border-muted-foreground/30'
                          }`}
                        >
                          <span className="text-[10px] opacity-60">{cat}:</span> {sub}
                        </button>
                      );
                    })
                  )}
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-6"
                    onClick={() => removeSubManualGroup(i)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" /> Remover
                  </Button>
                </div>
              </div>
            );
          })}
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7"
            onClick={() => onChange({
              ...c,
              subManualGroups: [...subManualGroups, { label: '', values: [] }],
            })}
          >
            <Plus className="h-3 w-3 mr-1" /> Adicionar sub-grupo
          </Button>
        </div>
      )}

      <MediaLibrary
        open={mediaLib.open}
        onOpenChange={(open) => setMediaLib(p => ({ ...p, open }))}
        tenantId={tenantId!}
        onSelect={(url) => { mediaLib.onChange(url); setMediaLib(p => ({ ...p, open: false })); }}
        bucket="game-items"
        pathPrefix={mediaLib.pathPrefix}
      />
    </div>
  );
}
