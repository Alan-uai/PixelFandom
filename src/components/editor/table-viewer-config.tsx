'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/supabase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, Save, Check } from 'lucide-react';
import type { ViewerConfig } from '@/lib/viewer-config';
import { ViewerConfigSchema } from '@/lib/viewer-config';
import { invalidateDataCache, updateCachedCatalogEntry } from '@/lib/data-access';
import { HeaderConfig } from './table-viewer-config/header-config';
import { DisplayConfig } from './table-viewer-config/display-config';
import { FilterConfig } from './table-viewer-config/filter-config';
import { CategorizationConfig } from './table-viewer-config/categorization-config';
import { CardConfig } from './table-viewer-config/card-config';
import { DetailConfig } from './table-viewer-config/detail-config';
import { SearchConfig } from './table-viewer-config/search-config';
import { EmptyConfig } from './table-viewer-config/empty-config';
import { LoadingConfig } from './table-viewer-config/loading-config';

export default function TableViewerConfig({
  slug,
  table,
  displayLabel,
}: {
  slug: string;
  table: string;
  displayLabel?: string;
}) {
  const { toast } = useToast();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [config, setConfig] = useState<ViewerConfig>({});
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('header');
  const [globalDefaults, setGlobalDefaults] = useState<Record<string, any>>({});
  const [tableIcon, setTableIcon] = useState<string | null>(null);
  const configCache = useRef<ViewerConfig | null>(null);

  const mergeWithGlobalDefaults = (local: ViewerConfig, global: Record<string, any>): ViewerConfig => {
    const merged: Record<string, any> = { ...local };
    if (!merged.display) merged.display = {};
    if (!merged.display.format && global.default_format) merged.display.format = global.default_format;
    if (!merged.display.columnsCount && global.default_columns) merged.display.columnsCount = global.default_columns;
    if (!merged.display.itemsPerPage && global.items_per_page) merged.display.itemsPerPage = global.items_per_page;
    if (!merged.display.pagination && global.pagination) merged.display.pagination = global.pagination;
    if (!merged.card) merged.card = {};
    if (!merged.card.hoverEffect && global.hover_effect) merged.card.hoverEffect = global.hover_effect;
    if (!merged.card.compactMode && global.card_style === 'compact') merged.card.compactMode = true;
    if (!merged.search) merged.search = {};
    if (merged.search.enabled === undefined && global.show_search !== undefined) merged.search.enabled = global.show_search;
    if (!merged.filters) merged.filters = {};
    if (merged.filters.enabled === undefined && global.show_filters !== undefined) merged.filters.enabled = global.show_filters;
    return merged as ViewerConfig;
  };

  const fetchConfig = useCallback(async (tid: string) => {
    if (configCache.current) {
      setConfig(configCache.current);
      setLoading(false);
      return;
    }
    const [{ data: tableData }, { data: tenant }] = await Promise.all([
      supabase
        .from('tenant_game_tables')
        .select('viewer_config, icon')
        .eq('tenant_id', tid)
        .eq('table_name', table)
        .maybeSingle(),
      supabase
        .from('tenants')
        .select('theme')
        .eq('id', tid)
        .single(),
    ]);

    const globalListing = ((tenant?.theme as Record<string, any>)?.game_table_listing_display as Record<string, any>) || {};
    setGlobalDefaults(globalListing);

    if (tableData?.icon) setTableIcon(tableData.icon);

    if (tableData?.viewer_config) {
      const parsed = ViewerConfigSchema.safeParse(tableData.viewer_config);
      if (parsed.success) {
        const merged = mergeWithGlobalDefaults(parsed.data, globalListing);
        configCache.current = merged;
        setConfig(merged);
        setLoading(false);
        return;
      }
    }
    setLoading(false);
  }, [table]);

  const fetchColumns = useCallback(async (_tid: string) => {
    const { data } = await supabase.rpc('get_table_columns', { p_table: table });
    if (data && (data as any).ok) {
      const cols = (data as any).columns
        .map((c: any) => c.column_name)
        .filter((c: string) => !['id', 'tenant_id', 'created_at', 'updated_at', 'embedding', 'slug'].includes(c));
      setColumns(cols);
    }
  }, [table]);

  useEffect(() => {
    setLoading(true);
    configCache.current = null;
    setConfig({});

    supabase
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()
      .then(({ data: tenant }) => {
        if (tenant) {
          setTenantId(tenant.id);
          fetchConfig(tenant.id);
          fetchColumns(tenant.id);
        } else {
          setLoading(false);
        }
      });
  }, [slug, table, fetchConfig, fetchColumns]);

  const handleSave = async () => {
    if (!tenantId) return;
    setSaving(true);

    const parsed = ViewerConfigSchema.safeParse(config);
    if (!parsed.success) {
      toast({ variant: 'destructive', title: 'Erro de validação', description: 'Configuração inválida.' });
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from('tenant_game_tables')
      .update({ viewer_config: parsed.data })
      .eq('tenant_id', tenantId)
      .eq('table_name', table);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } else {
      configCache.current = parsed.data;
      invalidateDataCache(slug);
      updateCachedCatalogEntry(slug, table, { viewer_config: parsed.data });
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2000);
      toast({ title: 'Configuração salva!' });
    }
    setSaving(false);
  };

  const sections = [
    { id: 'header', label: 'Header', component: HeaderConfig },
    { id: 'display', label: 'Exibição', component: DisplayConfig },
    { id: 'filters', label: 'Filtros', component: FilterConfig },
    { id: 'categorization', label: 'Categorização', component: CategorizationConfig },
    { id: 'card', label: 'Cards', component: CardConfig },
    { id: 'detail', label: 'Detalhes', component: DetailConfig },
    { id: 'search', label: 'Busca', component: SearchConfig },
    { id: 'emptyState', label: 'Estado Vazio', component: EmptyConfig },
    { id: 'loading', label: 'Carregamento', component: LoadingConfig },
  ] as const;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{displayLabel || table} — Exibição</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Personalize como esta tabela é exibida na wiki.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {savedFeedback && (
            <span className="flex items-center gap-1 text-sm text-green-500 font-medium">
              <Check className="h-4 w-4" /> Salvo!
            </span>
          )}
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            Salvar
          </Button>
        </div>
      </div>

      <div className="flex gap-1 border-b pb-1 overflow-x-auto">
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActiveSection(s.id)}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeSection === s.id
                ? 'bg-primary/10 text-primary border border-primary/30'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {Object.keys(globalDefaults).length > 0 && (
        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 bg-muted/30 rounded-md px-3 py-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
          Valores não configurados usam os padrões globais definidos nas configurações da wiki. Salve valores específicos aqui para sobrescrever.
        </div>
      )}
      <div className="rounded-lg border p-4">
        {sections.map((s) => {
          if (s.id !== activeSection) return null;
          const Comp = s.component;
          return (
            <Comp
              key={s.id}
              config={(config as any)[s.id]}
              columns={columns}
              slug={slug}
              tableIcon={s.id === 'header' ? tableIcon : undefined}
              onChange={(v: any) => setConfig((prev) => ({ ...prev, [s.id]: v }))}
            />
          );
        })}
      </div>
    </div>
  );
}
