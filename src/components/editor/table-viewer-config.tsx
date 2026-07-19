'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/supabase';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Globe, Laptop } from 'lucide-react';
import type { ViewerConfig } from '@/lib/viewer-config';
import { parseViewerConfig } from '@/lib/viewer-config';
import { updateCachedCatalogEntry } from '@/lib/data-access';
import { useRegisterUnsavedChanges } from '@/components/unsaved-changes';
import { SYSTEM_COLS } from '@/lib/categorizable-columns';
import { HeaderConfig } from './table-viewer-config/header-config';
import { DisplayConfig } from './table-viewer-config/display-config';
import { FilterConfig } from './table-viewer-config/filter-config';
import { CategorizationConfig } from './table-viewer-config/categorization-config';
import { CardConfig } from './table-viewer-config/card-config';
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
  const [savedConfig, setSavedConfig] = useState<ViewerConfig>({});
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlSection = searchParams.get('section');
  const [activeSection, setActiveSection] = useState<string>(urlSection || 'header');
  const [source, setSource] = useState<'global' | 'local'>('local');

  const [globalDefaults, setGlobalDefaults] = useState<Record<string, any>>({});
  const [tableIcon, setTableIcon] = useState<string | null>(null);
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const itemsCache = useRef<Record<string, unknown>[] | null>(null);
  const configCache = useRef<ViewerConfig | null>(null);

  const isDirty = useMemo(() => JSON.stringify(config) !== JSON.stringify(savedConfig), [config, savedConfig]);

  const handleDiscard = useCallback(() => {
    setConfig(savedConfig);
  }, [savedConfig]);

  const categorizationColumn = useMemo(() => {
    const catConfig = config.categorization;
    if (catConfig?.column && catConfig.column !== 'none') return catConfig.column;
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
  }, [config.categorization, columns]);

  const categorizationSecondaryColumn = useMemo(() => {
    return config.categorization?.secondaryColumn || null;
  }, [config.categorization]);

  const mergeWithGlobalDefaults = (local: ViewerConfig, global: Record<string, any>): ViewerConfig => {
    const merged: Record<string, any> = { ...local };
    if (!merged.display) merged.display = {};
    if (!merged.display.format && global.default_format) merged.display.format = global.default_format;
    if (!merged.display.columnsCount && global.default_columns) {
      const minForFormat = merged.display.format === 'list' ? 1 : 2;
      merged.display.columnsCount = Math.max(global.default_columns, minForFormat);
    }
    if (!merged.display.itemsPerPage && global.items_per_page) merged.display.itemsPerPage = global.items_per_page;
    if (merged.display.pagination === undefined && global.pagination) merged.display.pagination = global.pagination === 'paginated';
    if (!merged.card) merged.card = {};
    if (!merged.card.hoverEffect && global.hover_effect) merged.card.hoverEffect = global.hover_effect;
    if (!merged.card.layout && global.card_layout) merged.card.layout = global.card_layout;
    if (!merged.search) merged.search = {};
    if (merged.search.enabled === undefined && global.show_search !== undefined) merged.search.enabled = global.show_search;
    if (!merged.filters) merged.filters = {};
    if (merged.filters.enabled === undefined && global.show_filters !== undefined) merged.filters.enabled = global.show_filters;
    return merged as ViewerConfig;
  };

  const fetchConfig = useCallback(async (tid: string) => {
    if (configCache.current) {
      setSavedConfig(configCache.current);
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
      const migrated = parseViewerConfig(tableData.viewer_config);
      const merged = mergeWithGlobalDefaults(migrated, globalListing);
      configCache.current = merged;
      setSavedConfig(merged);
      setConfig(merged);
      setSource(merged.source || 'local');
      setLoading(false);
      return;
    }
    setSavedConfig({});
    setLoading(false);
  }, [table]);

  const fetchColumns = useCallback(async (_tid: string) => {
    const { data } = await supabase.rpc('get_table_columns', { p_table: table });
    if (data && (data as any).ok) {
      const cols = (data as any).columns
        .map((c: any) => c.column_name)
        .filter((c: string) => !SYSTEM_COLS.has(c));
      setColumns(cols);
    }
  }, [table]);

  const fetchItems = useCallback(async (tid: string) => {
    if (itemsCache.current) { setItems(itemsCache.current); return; }
    setItemsLoading(true);
    const { data } = await supabase.from(table).select('*').eq('tenant_id', tid);
    if (data) {
      itemsCache.current = data as Record<string, unknown>[];
      setItems(data as Record<string, unknown>[]);
    }
    setItemsLoading(false);
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
          fetchItems(tenant.id);
        } else {
          setLoading(false);
        }
      });
  }, [slug, table, fetchConfig, fetchColumns, fetchItems]);

  const handleSave = async () => {
    if (!tenantId) return false;

    const parsed = parseViewerConfig(config);

    const hasConfig = Object.keys(parsed).length > 0;
    if (!hasConfig) {
      toast({ variant: 'destructive', title: 'Erro de validação', description: 'Não foi possível validar as configurações. Verifique os campos e tente novamente.' });
      return false;
    }

    const updatePayload: Record<string, unknown> = { viewer_config: parsed };
    const iconValue = parsed?.header?.icon;
    if (parsed?.header) {
      updatePayload.icon = iconValue || null;
    }

    const { error: updateError } = await supabase
      .from('tenant_game_tables')
      .update(updatePayload as any)
      .eq('tenant_id', tenantId)
      .eq('table_name', table);

    if (updateError) {
      toast({ variant: 'destructive', title: 'Erro', description: updateError.message });
      return false;
    }

    configCache.current = parsed;
    setSavedConfig(parsed);
    updateCachedCatalogEntry(slug, table, updatePayload);
  };

  useRegisterUnsavedChanges({
    isDirty,
    onSave: handleSave,
    onDiscard: handleDiscard,
  });

  const sections = [
    { id: 'header', label: 'Header', component: HeaderConfig },
    { id: 'display', label: 'Exibição', component: DisplayConfig },
    { id: 'filters', label: 'Filtros', component: FilterConfig },
    { id: 'categorization', label: 'Categorização', component: CategorizationConfig },
    { id: 'card', label: 'Cards', component: CardConfig },
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">{displayLabel || table} — Exibição</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Personalize como esta tabela é exibida na wiki.
          </p>
        </div>
      </div>

      <div className="flex gap-1 border-b pb-1 overflow-x-auto">
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => {
              setActiveSection(s.id);
              const params = new URLSearchParams(searchParams.toString());
              params.set('section', s.id);
              router.replace(`?${params.toString()}`, { scroll: false });
            }}
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

      {Object.keys(globalDefaults).length > 0 && (activeSection === 'display' || activeSection === 'card') && (
        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 bg-muted/30 rounded-md px-3 py-1.5">
          <span className={`inline-block h-1.5 w-1.5 rounded-full shrink-0 ${source === 'global' ? 'bg-blue-500' : 'bg-amber-500'}`} />
          {source === 'global'
            ? 'Usando configurações globais do Dashboard. Alternar para Local para personalizar esta tabela.'
            : 'Usando configurações locais. Valores não configurados usam os padrões globais da wiki.'
          }
        </div>
      )}
      <div
        className="rounded-lg border p-4"
        style={activeSection === 'display' || activeSection === 'card' ? {
          clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
          position: 'relative',
        } as React.CSSProperties : undefined}
      >
        {(activeSection === 'display' || activeSection === 'card') && (
          <div className="absolute top-0 right-0 z-10">
            <div className="flex items-center gap-0.5 rounded-full border bg-muted/30 shadow-sm pt-1.5 pb-0 px-0.5">
              <button
                type="button"
                onClick={() => {
                  setSource('global');
                  setConfig((prev) => ({ ...prev, source: 'global' }));
                }}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  source === 'global'
                    ? 'bg-background shadow-sm text-foreground border'
                    : 'text-muted-foreground hover:text-foreground border border-transparent'
                }`}
              >
                <Globe className="h-3 w-3" />
                Global
              </button>
              <button
                type="button"
                onClick={() => {
                  setSource('local');
                  setConfig((prev) => ({ ...prev, source: 'local' }));
                }}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  source === 'local'
                    ? 'bg-background shadow-sm text-foreground border'
                    : 'text-muted-foreground hover:text-foreground border border-transparent'
                }`}
              >
                <Laptop className="h-3 w-3" />
                Local
              </button>
            </div>
          </div>
        )}
        {sections.map((s) => {
          if (s.id !== activeSection) return null;
          const Comp = s.component;
          return (
            <Comp
              key={s.id}
              config={(config as any)[s.id]}
              columns={columns}
              columnTypes={(config as any)?.columnTypes || {}}
              slug={slug}
              tableIcon={s.id === 'header' ? tableIcon : undefined}
              tenantId={tenantId ?? undefined}
              onChange={(v: any) => setConfig((prev) => ({ ...prev, [s.id]: v }))}
              items={items}
              itemsLoading={itemsLoading}
              categorizationColumn={s.id === 'filters' ? categorizationColumn : undefined}
              categorizationSecondaryColumn={s.id === 'filters' ? categorizationSecondaryColumn : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
