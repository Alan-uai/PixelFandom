'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select3D } from '@/components/ui/select3d';
import { IconPickerTrigger } from '@/components/ui/icon-picker';
import { IconRenderer } from '@/components/ui/icon-renderer';
import { ImageUpload } from '@/components/ui/image-upload';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Trash2, GripVertical, ImageIcon, Loader2, Tag } from 'lucide-react';
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

      <Select3D label="Categorização secundária" value={c.secondaryColumn || 'none'} options={[{label: 'Nenhuma', value: 'none'}, ...(columns as string[]).filter((col) => col !== c.column).map((col) => ({label: col, value: col}))]} onChange={(v) => onChange({ ...c, secondaryColumn: v === 'none' ? null : v })} />

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
