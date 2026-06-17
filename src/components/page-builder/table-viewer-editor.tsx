'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/supabase';
import { useCachedData } from '@/hooks/use-cached-data';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

import { TableIconDisplay } from '@/lib/table-icons';
import {
  Loader2, Save, Check, Database, Eye, Search, LayoutGrid, List,
  Layers, PanelTop, Filter, FolderTree, CreditCard, Plus, Trash2,
  GripVertical, FileText, Image,
} from 'lucide-react';
import type { ViewerConfig } from '@/lib/viewer-config';

interface TenantTable {
  table_name: string;
  display_label: string;
  viewer_config: Record<string, unknown>;
  icon?: string;
}

export function TableViewerEditor({ tenantId, slug }: { tenantId: string; slug?: string }) {
  const { toast } = useToast();
  const [tables, setTables] = useState<TenantTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [config, setConfig] = useState<ViewerConfig>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('tenant_game_tables')
        .select('table_name, display_label, viewer_config, icon')
        .eq('tenant_id', tenantId)
        .order('created_at');
      if (data) {
        setTables(data as TenantTable[]);
        if (data.length > 0 && !selectedTable) {
          setSelectedTable(data[0].table_name);
        }
      }
      setLoading(false);
    })();
  }, [tenantId]);

  useEffect(() => {
    if (!selectedTable) return;
    const table = tables.find(t => t.table_name === selectedTable);
    if (table?.viewer_config) {
      try {
        const parsed = typeof table.viewer_config === 'string'
          ? JSON.parse(table.viewer_config)
          : table.viewer_config;
        setConfig(parsed as ViewerConfig);
      } catch {
        setConfig({});
      }
    } else {
      setConfig({});
    }
  }, [selectedTable, tables]);

  const handleSave = useCallback(async () => {
    if (!tenantId || !selectedTable) return;
    setSaving(true);
    setSaved(false);
    const { error } = await supabase
      .from('tenant_game_tables')
      .update({ viewer_config: config as any })
      .eq('tenant_id', tenantId)
      .eq('table_name', selectedTable);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: error.message });
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast({ title: 'Configuração salva!' });
    }
    setSaving(false);
  }, [tenantId, selectedTable, config, toast]);

  const updateConfig = useCallback((path: string, value: unknown) => {
    setConfig(prev => {
      const next = { ...prev };
      const keys = path.split('.');
      let obj: Record<string, unknown> = next as any;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) obj[keys[i]] = {};
        obj = obj[keys[i]] as Record<string, unknown>;
      }
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (tables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Database className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Nenhuma tabela encontrada</h3>
        <p className="text-sm text-muted-foreground">Crie tabelas no editor de conteúdo primeiro.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Left sidebar: table list */}
      <div className="w-56 shrink-0 border-r bg-muted/30 p-3 overflow-y-auto">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Tabelas</h3>
        <div className="space-y-1">
          {tables.map(t => (
            <button
              key={t.table_name}
              onClick={() => setSelectedTable(t.table_name)}
              className={`w-full flex items-center gap-2 rounded-md px-2.5 py-2 text-xs text-left transition-colors ${
                selectedTable === t.table_name
                  ? 'bg-primary/10 text-primary border border-primary/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent'
              }`}
            >
              <TableIconDisplay icon={t.icon || t.table_name} className="h-4 w-4 shrink-0" />
              <span className="truncate">{t.display_label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Right: config form */}
      <div className="flex-1 overflow-y-auto p-6">
        {selectedTable ? (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  {tables.find(t => t.table_name === selectedTable)?.display_label || selectedTable}
                </h2>
                <p className="text-sm text-muted-foreground">Personalize a visualização desta tabela</p>
              </div>
              <Button onClick={handleSave} disabled={saving} size="sm">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : saved ? <Check className="h-4 w-4 mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar'}
              </Button>
            </div>

            {/* Header Config */}
            <ConfigSection icon={PanelTop} title="Header da Página">
              <ConfigField label="Título" hint="Deixe vazio para usar o nome da tabela">
                <Input value={config.header?.title || ''} onChange={e => updateConfig('header.title', e.target.value || undefined)} placeholder="Ex: Armas Poderosas" />
              </ConfigField>
              <ConfigField label="Subtítulo">
                <Input value={config.header?.subtitle || ''} onChange={e => updateConfig('header.subtitle', e.target.value || undefined)} placeholder="Descrição opcional" />
              </ConfigField>
              <ConfigField label="Imagem de fundo">
                <Input value={config.header?.backgroundImage || ''} onChange={e => updateConfig('header.backgroundImage', e.target.value || undefined)} placeholder="URL da imagem" />
              </ConfigField>
              <ConfigField label="Ícone">
                <Input value={config.header?.icon || ''} onChange={e => updateConfig('header.icon', e.target.value || undefined)} placeholder="Nome do ícone" />
              </ConfigField>
              <SwitchField label="Mostrar breadcrumb" checked={config.header?.showBreadcrumb ?? true} onChange={v => updateConfig('header.showBreadcrumb', v)} />
            </ConfigSection>

            {/* Display Config */}
            <ConfigSection icon={LayoutGrid} title="Display & Layout">
              <ConfigField label="Formato de exibição">
                <select
                  value={config.display?.format || ''}
                  onChange={e => updateConfig('display.format', e.target.value || undefined)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-xs"
                >
                  <option value="">Padrão (config. global)</option>
                  <option value="grid">Grid</option>
                  <option value="list">Lista</option>
                  <option value="carousel">Carrossel</option>
                  <option value="carousel_infinite">Carrossel Infinito</option>
                </select>
              </ConfigField>
              <ConfigField label="Colunas no grid">
                <select
                  value={config.display?.columnsCount || ''}
                  onChange={e => updateConfig('display.columnsCount', e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-xs"
                >
                  <option value="">Padrão</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                </select>
              </ConfigField>
              <ConfigField label="Items por página">
                <Input type="number" min={1} max={200}
                  value={config.display?.itemsPerPage || ''}
                  onChange={e => updateConfig('display.itemsPerPage', e.target.value ? Number(e.target.value) : undefined)}
                />
              </ConfigField>
              <ConfigField label="Paginação">
                <Select
                  value={config.display?.pagination || ''}
                  onChange={e => updateConfig('display.pagination', e.target.value || undefined)}
                  options={[
                    { value: '', label: 'Padrão' },
                    { value: 'paginated', label: 'Paginada' },
                    { value: 'infinite-scroll', label: 'Scroll infinito' },
                    { value: 'none', label: 'Todos de uma vez' },
                  ]}
                />
              </ConfigField>
              <ConfigField label="Ordenar por">
                <Input value={config.display?.sortColumn || ''} onChange={e => updateConfig('display.sortColumn', e.target.value || null)} placeholder="Nome da coluna" />
              </ConfigField>
              <ConfigField label="Direção">
                <Select
                  value={config.display?.sortDirection || 'asc'}
                  onChange={e => updateConfig('display.sortDirection', e.target.value)}
                  options={[
                    { value: 'asc', label: 'Ascendente' },
                    { value: 'desc', label: 'Descendente' },
                  ]}
                />
              </ConfigField>
              <SwitchField label="Sobrescrever config global" checked={config.display?.overrideGlobal || false} onChange={v => updateConfig('display.overrideGlobal', v)} />
            </ConfigSection>

            {/* Filters Config */}
            <ConfigSection icon={Filter} title="Chips / Filtros">
              <SwitchField label="Habilitar filtros" checked={config.filters?.enabled ?? true} onChange={v => updateConfig('filters.enabled', v)} />
              <SwitchField label="Auto-detecção" checked={config.filters?.autoDetect ?? true} onChange={v => updateConfig('filters.autoDetect', v)} hint="Detectar automaticamente colunas de filtro" />
              <SwitchField label="Limpar filtros" checked={config.filters?.showClearButton ?? true} onChange={v => updateConfig('filters.showClearButton', v)} />
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Colunas de filtro</Label>
                  <Button variant="ghost" size="sm" className="h-6 text-xs"
                    onClick={() => {
                      const cols = config.filters?.columns || [];
                      updateConfig('filters.columns', [...cols, { column: '', mode: 'multiple' }]);
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Adicionar
                  </Button>
                </div>
                {(config.filters?.columns || []).map((fc, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={fc.column}
                      onChange={e => {
                        const cols = [...(config.filters?.columns || [])];
                        cols[i] = { ...cols[i], column: e.target.value };
                        updateConfig('filters.columns', cols);
                      }}
                      placeholder="Nome da coluna"
                      className="flex-1"
                    />
                    <Select
                      value={fc.mode || 'multiple'}
                      onChange={e => {
                        const cols = [...(config.filters?.columns || [])];
                        cols[i] = { ...cols[i], mode: e.target.value as 'single' | 'multiple' };
                        updateConfig('filters.columns', cols);
                      }}
                      options={[
                        { value: 'multiple', label: 'Multi' },
                        { value: 'single', label: 'Único' },
                      ]}
                      className="w-20"
                    />
                    <button onClick={() => {
                      const cols = (config.filters?.columns || []).filter((_, j) => j !== i);
                      updateConfig('filters.columns', cols);
                    }} className="text-destructive hover:text-destructive/80 p-1">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </ConfigSection>

            {/* Categorization Config */}
            <ConfigSection icon={FolderTree} title="Categorização">
              <SwitchField label="Habilitar categorização" checked={config.categorization?.enabled ?? true} onChange={v => updateConfig('categorization.enabled', v)} />
              <SwitchField label="Auto-detecção" checked={config.categorization?.autoDetect ?? true} onChange={v => updateConfig('categorization.autoDetect', v)} />
              <ConfigField label="Coluna de categoria">
                <Input value={config.categorization?.column || ''} onChange={e => updateConfig('categorization.column', e.target.value || null)} placeholder="Deixe vazio para auto-detectar" />
              </ConfigField>
              <ConfigField label="Coluna secundária">
                <Input value={config.categorization?.secondaryColumn || ''} onChange={e => updateConfig('categorization.secondaryColumn', e.target.value || null)} placeholder="Categorização adicional" />
              </ConfigField>
              <ConfigField label="Estilo">
                <Select
                  value={config.categorization?.style || 'headings'}
                  onChange={e => updateConfig('categorization.style', e.target.value)}
                  options={[
                    { value: 'headings', label: 'Títulos' },
                    { value: 'tabs', label: 'Abas' },
                    { value: 'accordion', label: 'Accordion' },
                    { value: 'badges', label: 'Badges' },
                    { value: 'none', label: 'Sem categorização' },
                  ]}
                />
              </ConfigField>
              <SwitchField label="Agrupar itens sem categoria" checked={config.categorization?.groupEmpty ?? true} onChange={v => updateConfig('categorization.groupEmpty', v)} />
              <SwitchField label="Mostrar categorias vazias" checked={config.categorization?.showEmptyCategories ?? false} onChange={v => updateConfig('categorization.showEmptyCategories', v)} />
              <SwitchField label="Expandido por padrão" checked={config.categorization?.defaultExpanded ?? true} onChange={v => updateConfig('categorization.defaultExpanded', v)} />

              {/* Manual groups */}
              <div className="space-y-2 pt-2 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Grupos manuais</Label>
                  <Button variant="ghost" size="sm" className="h-6 text-xs"
                    onClick={() => {
                      const groups = config.categorization?.manualGroups || [];
                      updateConfig('categorization.manualGroups', [...groups, { label: '', values: [] }]);
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Adicionar grupo
                  </Button>
                </div>
                {(config.categorization?.manualGroups || []).map((mg, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-md bg-muted/30">
                    <div className="flex-1 space-y-1">
                      <Input
                        value={mg.label}
                        onChange={e => {
                          const groups = [...(config.categorization?.manualGroups || [])];
                          groups[i] = { ...groups[i], label: e.target.value };
                          updateConfig('categorization.manualGroups', groups);
                        }}
                        placeholder="Nome do grupo"
                      />
                      <Input
                        value={mg.values.join(', ')}
                        onChange={e => {
                          const groups = [...(config.categorization?.manualGroups || [])];
                          groups[i] = { ...groups[i], values: e.target.value.split(',').map(s => s.trim()).filter(Boolean) };
                          updateConfig('categorization.manualGroups', groups);
                        }}
                        placeholder="Valores (separados por vírgula)"
                      />
                    </div>
                    <button onClick={() => {
                      const groups = (config.categorization?.manualGroups || []).filter((_, j) => j !== i);
                      updateConfig('categorization.manualGroups', groups);
                    }} className="text-destructive hover:text-destructive/80 p-1 mt-1">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </ConfigSection>

            {/* Card Design Config */}
            <ConfigSection icon={CreditCard} title="Design do Card">
              <ConfigField label="Tamanho">
                <Select
                  value={config.card?.size || 'md'}
                  onChange={e => updateConfig('card.size', e.target.value)}
                  options={[
                    { value: 'sm', label: 'Pequeno' },
                    { value: 'md', label: 'Médio' },
                    { value: 'lg', label: 'Grande' },
                  ]}
                />
              </ConfigField>
              <SwitchField label="Mostrar ícone" checked={config.card?.showIcon ?? true} onChange={v => updateConfig('card.showIcon', v)} />
              <SwitchField label="Mostrar imagem" checked={config.card?.showImage ?? true} onChange={v => updateConfig('card.showImage', v)} />
              <SwitchField label="Mostrar label" checked={config.card?.showLabel ?? true} onChange={v => updateConfig('card.showLabel', v)} />
              <SwitchField label="Modo compacto" checked={config.card?.compactMode || false} onChange={v => updateConfig('card.compactMode', v)} />
              <ConfigField label="Efeito hover">
                <Select
                  value={config.card?.hoverEffect || 'scale'}
                  onChange={e => updateConfig('card.hoverEffect', e.target.value)}
                  options={[
                    { value: 'scale', label: 'Escala' },
                    { value: 'glow', label: 'Brilho' },
                    { value: 'shadow', label: 'Sombra' },
                    { value: 'none', label: 'Nenhum' },
                  ]}
                />
              </ConfigField>
            </ConfigSection>

            {/* Item Detail Config */}
            <ConfigSection icon={Eye} title="Detalhe do Item (Expandido)">
              <SwitchField label="Mostrar comparação" checked={config.detail?.showComparison ?? true} onChange={v => updateConfig('detail.showComparison', v)} />
              <SwitchField label="Mostrar header" checked={config.detail?.showHeader || false} onChange={v => updateConfig('detail.showHeader', v)} />
            </ConfigSection>

            {/* Search Config */}
            <ConfigSection icon={Search} title="Busca">
              <SwitchField label="Habilitar busca" checked={config.search?.enabled ?? true} onChange={v => updateConfig('search.enabled', v)} />
              <ConfigField label="Placeholder">
                <Input value={config.search?.placeholder || 'Buscar...'} onChange={e => updateConfig('search.placeholder', e.target.value)} />
              </ConfigField>
              <ConfigField label="Mínimo de caracteres">
                <Input type="number" min={0} max={5}
                  value={config.search?.minChars ?? 1}
                  onChange={e => updateConfig('search.minChars', Number(e.target.value))}
                />
              </ConfigField>
            </ConfigSection>

            {/* Empty State & Loading Config */}
            <ConfigSection icon={FileText} title="Estado Vazio & Loading">
              <ConfigField label="Mensagem vazia">
                <Input value={config.emptyState?.message || 'Nenhum item encontrado'} onChange={e => updateConfig('emptyState.message', e.target.value)} />
              </ConfigField>
              <ConfigField label="Imagem (vazio)">
                <Input value={config.emptyState?.imageUrl || ''} onChange={e => updateConfig('emptyState.imageUrl', e.target.value || undefined)} placeholder="URL da imagem" />
              </ConfigField>
              <ConfigField label="CTA texto">
                <Input value={config.emptyState?.ctaText || ''} onChange={e => updateConfig('emptyState.ctaText', e.target.value || undefined)} placeholder="Texto do botão" />
              </ConfigField>
              <ConfigField label="CTA URL">
                <Input value={config.emptyState?.ctaUrl || ''} onChange={e => updateConfig('emptyState.ctaUrl', e.target.value || undefined)} placeholder="URL do link" />
              </ConfigField>
              <ConfigField label="Skeleton">
                <Select
                  value={config.loading?.skeleton || 'shimmer'}
                  onChange={e => updateConfig('loading.skeleton', e.target.value)}
                  options={[
                    { value: 'shimmer', label: 'Shimmer' },
                    { value: 'pulse', label: 'Pulse' },
                    { value: 'spinner', label: 'Spinner' },
                    { value: 'none', label: 'Nenhum' },
                  ]}
                />
              </ConfigField>
              <ConfigField label="Qtd skeletons">
                <Input type="number" min={1} max={12}
                  value={config.loading?.skeletonCount || 6}
                  onChange={e => updateConfig('loading.skeletonCount', Number(e.target.value))}
                />
              </ConfigField>
            </ConfigSection>

            <div className="h-16" />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Database className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Selecione uma tabela ao lado</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ConfigSection({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-4">
      <div className="flex items-center gap-2 border-b pb-2 mb-2">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function ConfigField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground flex items-center gap-1">{label}{hint && <span className="text-[10px] text-muted-foreground/60">({hint})</span>}</Label>
      {children}
    </div>
  );
}

function SwitchField({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex-1">
        <Label className="text-xs">{label}</Label>
        {hint && <p className="text-[10px] text-muted-foreground/60">{hint}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
