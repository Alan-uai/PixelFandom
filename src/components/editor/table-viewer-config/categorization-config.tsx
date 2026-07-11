'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select3D } from '@/components/ui/select3d';
import { ElasticSlider3D } from '@/components/ui/elastic-slider-3d';
import { IconPickerTrigger } from '@/components/ui/icon-picker';
import { IconRenderer } from '@/components/ui/icon-renderer';
import { ImageUpload } from '@/components/ui/image-upload';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Trash2, ImageIcon, Loader2, Tag, ArrowUpDown, ArrowDownUp } from 'lucide-react';
import { Icon } from '@iconify/react';

export function CategorizationConfig({
  config,
  columns = [],
  onChange,
  slug,
  items,
  itemsLoading,
  tenantId,
}: {
  config: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
  columns?: string[];
  slug?: string;
  items?: Record<string, unknown>[];
  itemsLoading?: boolean;
  tenantId?: string;
}) {
  const c: Record<string, any> = config || {};

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

      <Select3D label="Coluna de categoria" value={c.column || 'none'} options={[{label: 'Auto-detect', value: 'none'}, ...(columns as string[]).map((col) => ({label: col, value: col}))]} onChange={(v) => onChange({ ...c, column: v === 'none' ? null : v })} />

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

                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" title="Upload de imagem">
                              <ImageIcon className="h-3 w-3" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent align="end" className="w-56 p-2" side="bottom">
                            <ImageUpload
                              bucket="game-items"
                              pathPrefix={`wiki-categories/${slug}/${cat}`}
                              value={isImg ? currentIcon : ''}
                              onChange={(url) => handleImageChange(cat, url)}
                              label="Ícone da categoria"
                              previewSize="w-full h-14"
                              tenantId={tenantId}
                            />
                          </PopoverContent>
                        </Popover>

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

      <Select3D
        label="Estilo das categorias"
        value={c.style || 'headings'}
        options={[
          { label: 'Títulos', value: 'headings' },
          { label: 'Abas', value: 'tabs' },
          { label: 'Acordeão', value: 'accordion' },
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
                maxValue={32}
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
                maxValue={8}
                showValue
                valueSuffix="px"
                onValueChange={(v) => onChange({ ...c, separatorWidth: v })}
              />
            )}
          </div>
        )}
      </div>

      <Select3D label="Categorização secundária" value={c.secondaryColumn || 'none'} options={[{label: 'Nenhuma', value: 'none'}, ...(columns as string[]).filter((col) => col !== c.column).map((col) => ({label: col, value: col}))]} onChange={(v) => onChange({ ...c, secondaryColumn: v === 'none' ? null : v })} />

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
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-4 w-4 shrink-0" title="Upload de imagem">
                            <ImageIcon className="h-2.5 w-2.5" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-48 p-2" side="bottom">
                          <ImageUpload
                            bucket="game-items"
                            pathPrefix={`wiki-subcategories/${slug}/${cat}/${sub}`}
                            value={isImg ? currentIcon : ''}
                            onChange={(url) => {
                              onChange({
                                ...c,
                                secondaryIcons: {
                                  ...secondaryIcons,
                                  [cat]: { ...(secondaryIcons[cat] || {}), [sub]: url },
                                },
                              });
                            }}
                            label="Ícone"
                            previewSize="w-full h-12"
                            tenantId={tenantId}
                          />
                        </PopoverContent>
                      </Popover>
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

      {/* === Ordem das sub-categorias === */}
      {secondaryColumn && Object.keys(secondaryValuesByCategory).length > 0 && (
        <div className="space-y-2 border-t pt-3">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs text-muted-foreground">Ordem das sub-categorias</Label>
            <button
              type="button"
              onClick={() => {
                const dir = c.categorySortDirection === 'asc' ? 'desc' : 'asc';
                onChange({ ...c, categorySortDirection: dir });
              }}
              className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {c.categorySortDirection === 'asc' ? (
                <><ArrowUpDown className="h-3 w-3" /> A→Z</>
              ) : (
                <><ArrowDownUp className="h-3 w-3" /> Z→A</>
              )}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground">Clique para definir posição.</p>
          <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
            {Object.entries(secondaryValuesByCategory).flatMap(([cat, subs]) =>
              subs.map((sub) => {
                const key = `${cat}::${sub}`;
                const orderIndex = ((c.subOrder as string[]) || []).indexOf(key);
                const isOrdered = orderIndex >= 0;
                return (
                  <button
                    key={key}
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
                    <span className="text-[10px] opacity-60">{cat}:</span> {sub}
                    {isOrdered && <Trash2 className="h-2.5 w-2.5 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* === Ordem das categorias === */}
      <div className="space-y-2 border-t pt-3">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-xs text-muted-foreground">Ordem das categorias</Label>
          {categoryValues.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const dir = c.categorySortDirection === 'asc' ? 'desc' : 'asc';
                onChange({ ...c, categorySortDirection: dir });
              }}
              className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              title="Alternar direção da ordenação"
            >
              {c.categorySortDirection === 'asc' ? (
                <><ArrowUpDown className="h-3 w-3" /> A→Z</>
              ) : (
                <><ArrowDownUp className="h-3 w-3" /> Z→A</>
              )}
            </button>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground">Clique para definir posição. Vazias seguem ordem definida.</p>
        {categoryValues.length > 0 ? (
          <div className="flex flex-wrap gap-1 max-h-48 overflow-y-auto">
            {categoryValues.map((cat) => {
              const orderIndex = ((c.order as string[]) || []).indexOf(cat);
              const isOrdered = orderIndex >= 0;
              return (
                <button
                  key={cat}
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
                  {cat}
                  {isOrdered && <Trash2 className="h-2.5 w-2.5 shrink-0" />}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-[10px] text-muted-foreground py-0.5">Nenhuma categoria disponível.</p>
        )}
      </div>

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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" title="Upload de imagem">
                      <ImageIcon className="h-3 w-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-48 p-2" side="bottom">
                    <ImageUpload
                      bucket="game-items"
                      pathPrefix={`wiki-manual-groups/${slug}/${i}`}
                      value={mg.imageUrl || ''}
                      onChange={(url) => updateManualGroup(i, { imageUrl: url, icon: undefined })}
                      label="Ícone do grupo"
                      previewSize="w-full h-12"
                      tenantId={tenantId}
                    />
                  </PopoverContent>
                </Popover>
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
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" title="Upload de imagem">
                        <ImageIcon className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-48 p-2" side="bottom">
                      <ImageUpload
                        bucket="game-items"
                        pathPrefix={`wiki-sub-manual-groups/${slug}/${i}`}
                        value={mg.imageUrl || ''}
                        onChange={(url) => updateSubManualGroup(i, { imageUrl: url, icon: undefined })}
                        label="Ícone do sub-grupo"
                        previewSize="w-full h-12"
                        tenantId={tenantId}
                      />
                    </PopoverContent>
                  </Popover>
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
    </div>
  );
}
