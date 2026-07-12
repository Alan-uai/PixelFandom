'use client';

import Image from 'next/image';
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  FileText, Database, ArrowLeft, ChevronDown, ChevronLeft, ChevronRight,
  Star, BarChart3,
  Search, X, Eye, Loader2,
} from 'lucide-react';
import { isCustomIcon } from '@/lib/table-icons';
import Link from 'next/link';
import { useWikiPath } from '@/hooks/use-wiki-path';
import { useTableItems } from '@/hooks/use-data-access';
import { ChipCarousel } from '@/components/ui/chip-carousel';
import InfiniteCarousel from '@/components/ui/infinite-carousel';
import { IconRenderer } from '@/components/ui/icon-renderer';
import CollectionItemView from '@/components/wiki/collection-item-view';
import ComparePopup from '@/components/wiki/compare-popup';
import {
  RARITY_GRAD, elIcon, COLL_ICON,
} from '@/lib/game-ui';
import type { ViewerConfig } from '@/lib/viewer-config';
import { resolveTableIcon } from '@/lib/table-icons';
import { isColorString, hexToStyle } from '@/lib/color';

const SYSTEM_COLS = new Set(['id', 'tenant_id', 'created_at', 'updated_at', 'slug', 'embedding']);
const LONG_TEXT_COLS = new Set([
  'description', 'effects', 'weakness', 'notes', 'strategy', 'tips',
  'content', 'details', 'items_dropped', 'notable_loot',
]);

const CATEGORY_LABELS: Record<string, string> = {
  world: 'Mundo',
  tier: 'Tier',
  rarity: 'Raridade',
  mark: 'Marca',
  weapon: 'Arma',
  enemy: 'Inimigo',
  boss: 'Chefe',
  element: 'Elemento',
  difficulty: 'Dificuldade',
  type: 'Tipo',
  category: 'Categoria',
};

function isTypeLike(col: string): boolean {
  return col === 'type' || col === 'category' || col.endsWith('_type');
}

function deriveLabel(col: string): string {
  const base = col.replace(/^(is_|has_)/, '').replace(/_type$/, '');
  return CATEGORY_LABELS[base] ?? CATEGORY_LABELS[col] ?? col.replace(/_/g, ' ');
}

function formatCategoryValue(col: string, val: unknown): string {
  if (typeof val === 'boolean') {
    const label = deriveLabel(col);
    return val ? label : `Não ${label[0].toLowerCase() + label.slice(1)}`;
  }
  if (typeof val === 'number') {
    return `${deriveLabel(col)} ${val}`;
  }
  return String(val);
}

function toSlug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const iconColumnNames = ['icon_url', 'icon_id', 'icon'];
const imageColumnNames = ['image_url', 'image', 'cover_url', 'logo_url'];

function getIcon(item: Record<string, any>) {
  for (const col of iconColumnNames) {
    const v = item[col];
    if (v) {
      if (typeof v === 'string' && v.includes(':')) return <IconRenderer icon={v} size="md" />;
      if (typeof v === 'string' && v.startsWith('http')) return <Image src={v} alt="" fill className="object-contain" />;
      if (typeof v === 'string') return <span className="text-lg">{v}</span>;
    }
  }
  for (const col of imageColumnNames) {
    const v = item[col];
    if (v && typeof v === 'string') return <Image src={v} alt="" fill className="object-cover" />;
  }
  return null;
}

type Props = {
  tenantSlug: string;
  tableName: string;
  tenantId?: string;
  displayFormat?: string;
  columnsCount?: number;
  viewerConfig?: ViewerConfig | null;
  icon?: string | null;
};

export default function GameTableListing({ tenantSlug, tableName, tenantId, displayFormat, columnsCount, viewerConfig, icon }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data, loading } = useTableItems(tenantSlug, tableName);
  const items: any[] = useMemo(() => data?.items ?? [], [data?.items]);

  const { homePath } = useWikiPath(tenantSlug);

  const catConfig = (viewerConfig?.categorization || {}) as Record<string, any>;
  const spacingEnabled = catConfig.spacingEnabled !== false;
  const spacingStyle: string = spacingEnabled ? (catConfig.spacingStyle || 'none') : 'none';
  const spacingValue = spacingEnabled ? (catConfig.spacingValue ?? 16) : 0;

  const displayConfig = (viewerConfig?.display || {}) as Record<string, any>;
  const fmt = displayConfig.format || displayFormat || 'grid';
  const effectiveColumnsCount = displayConfig.columnsCount || columnsCount || 4;
  const itemsPerPage = displayConfig.itemsPerPage || 50;
  const pagination = displayConfig.pagination === true;
  const paginationStyle = displayConfig.paginationStyle || 'arrows';
  const gap = displayConfig.gap ?? 12;
  const cardConfig: Record<string, any> = viewerConfig?.card || {};
  const detailConfig: Record<string, any> = viewerConfig?.card || {};

  let cols: number;
  if (fmt === 'list') {
    cols = Math.max(1, Math.min(2, effectiveColumnsCount));
  } else {
    cols = Math.max(2, Math.min(5, effectiveColumnsCount));
  }
  const scaleFactor = Math.max(0.5, 1 - (cols - 1) * 0.125);
  const gridColsClass = ({
    1: 'grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1',
    2: 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2',
    3: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3',
    4: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4',
    5: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
  } as Record<number, string>)[cols] || 'grid grid-cols-2';

  const searchDebounceMs = viewerConfig?.search?.debounceMs ?? 300;
  const searchMinChars = viewerConfig?.search?.minChars ?? 1;
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), searchDebounceMs);
    return () => clearTimeout(timer);
  }, [searchQuery, searchDebounceMs]);

  const effectiveQuery = debouncedQuery.length >= searchMinChars ? debouncedQuery : '';

  const [compareStat, setCompareStat] = useState<string | null>(null);
  const [compareItemId, setCompareItemId] = useState<string | null>(null);
  const [useSuffix, setUseSuffix] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [expandedAccordion, setExpandedAccordion] = useState<Set<string>>(new Set());

  const urlItem = searchParams?.get('item') || null;
  const [selectedSlug, setSelectedSlug] = useState<string | null>(urlItem);
  const [activeFilters, setActiveFilters] = useState<Record<string, Set<string>>>({});
  const cardRefs = useRef<Map<string, HTMLElement>>(new Map());
  
  useEffect(() => {
    setSelectedSlug(urlItem);
  }, [urlItem]);

  useEffect(() => {
    if (selectedSlug && cardRefs.current.get(selectedSlug)) {
      setTimeout(() => {
        cardRefs.current.get(selectedSlug)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [selectedSlug]);

  const selectItem = useCallback((slug: string | null) => {
    const newSlug = slug === selectedSlug ? null : slug;
    setSelectedSlug(newSlug);
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (newSlug) {
      params.set('item', newSlug);
    } else {
      params.delete('item');
    }
    const qs = params.toString();
    router.replace(`${qs ? '?' + qs : ''}`, { scroll: false });
  }, [selectedSlug, searchParams, router]);

  const columnAnalysis: {
    categoryColumn: string | null;
    secondaryColumn: string | null;
    filterColumns: { column: string; values: string[]; label: string; mode: string }[];
  } = useMemo(() => {
    if (items.length === 0) return { categoryColumn: null, secondaryColumn: null, filterColumns: [] };

    const allKeys = new Set<string>();
    items.forEach(item => Object.keys(item).forEach(k => allKeys.add(k)));

    const columnValues: Record<string, string[]> = {};
    for (const key of allKeys) {
      if (SYSTEM_COLS.has(key)) continue;
      if (LONG_TEXT_COLS.has(key)) continue;
      if (key.endsWith('_id') || key.endsWith('_url')) continue;

      const values = new Set<string>();
      let allHaveValue = true;
      for (const item of items) {
        const v = item[key];
        if (v != null && v !== '' && v !== 'none') {
          values.add(String(v));
        } else {
          allHaveValue = false;
        }
      }
      if (allHaveValue && values.size >= 2) {
        columnValues[key] = Array.from(values).sort();
      }
    }

    const candidates = Object.keys(columnValues);

    // Priority tiers for auto-detection
    const tier1: string[] = []; // type, category, *_type
    const tier2: string[] = []; // rarity, *_rarity
    const tier3: string[] = []; // element, *_element
    const tier4: string[] = []; // everything else

    for (const col of candidates) {
      const lower = col.toLowerCase();
      if (lower === 'type' || lower === 'category' || lower.endsWith('_type')) {
        tier1.push(col);
      } else if (lower === 'rarity' || lower.endsWith('_rarity')) {
        tier2.push(col);
      } else if (lower === 'element' || lower.endsWith('_element')) {
        tier3.push(col);
      } else if (lower === 'tier' || lower.endsWith('_tier') || lower === 'class' || lower.endsWith('_class')) {
        tier3.push(col);
      } else {
        tier4.push(col);
      }
    }

    // Use viewerConfig categorization column if set — no data check needed for explicit choice
    let categoryColumn: string | null = null;
    const catConfig = viewerConfig?.categorization;
    if (catConfig?.enabled !== false && catConfig?.column && catConfig.column !== 'none') {
      categoryColumn = catConfig.column;
    }

    // Auto-detect category column (priority order)
    if (!categoryColumn) {
      for (const col of tier1) {
        if (isTypeLike(col)) { categoryColumn = col; break; }
      }
      if (!categoryColumn) {
        for (const col of tier2) { categoryColumn = col; break; }
      }
      if (!categoryColumn) {
        for (const col of tier3) { categoryColumn = col; break; }
      }
      if (!categoryColumn && candidates.length > 0) {
        categoryColumn = candidates[0];
      }
    }

    // Determine active filter columns
    const allFilterCandidates = [...tier1, ...tier2, ...tier3, ...tier4]
      .filter(col => col !== categoryColumn);

    // Always auto-detect filter columns, apply column overrides
    const filterConfig = viewerConfig?.filters;
    const columnOverrides = new Map(
      ((filterConfig?.columns || []) as Array<{ column: string; label?: string; mode?: string; enabled?: boolean }>)
        .map(fc => [fc.column, fc]),
    );

    const filterColumns: { column: string; values: string[]; label: string; mode: string }[] = allFilterCandidates
      .map(col => {
        const override = columnOverrides.get(col);
        const enabled = override ? override.enabled !== false : true;
        if (!enabled) return null;
        const values = columnValues[col] || [];
        return {
          column: col,
          values,
          label: override?.label || deriveLabel(col),
          mode: override?.mode || (values.length > 2 ? 'multiple' : 'single'),
        };
      })
      .filter((fc): fc is { column: string; values: string[]; label: string; mode: string } => fc !== null && fc.values.length > 0);

    // Secondary categorization
    const secondaryColumn: string | null = catConfig?.secondaryColumn || null;

    return { categoryColumn, secondaryColumn, filterColumns };
  }, [items, viewerConfig]);

  useEffect(() => {
    setCurrentPage(1);
  }, [effectiveQuery, activeFilters]);

  const filteredItems = useMemo(() => {
    let result = items;

    if (effectiveQuery.trim()) {
      const q = effectiveQuery.toLowerCase();
      const searchConfig = viewerConfig?.search;
      const searchableCols = searchConfig?.searchableColumns?.length
        ? new Set(searchConfig.searchableColumns)
        : null;

      result = result.filter(item =>
        Object.entries(item).some(([key, val]) => {
          if (SYSTEM_COLS.has(key) || key === 'embedding') return false;
          if (val == null) return false;
          if (searchableCols && !searchableCols.has(key)) return false;
          return String(val).toLowerCase().includes(q);
        })
      );
    }

    for (const [col, selected] of Object.entries(activeFilters)) {
      if (selected.size > 0) {
        result = result.filter(item => selected.has(String(item[col] ?? '')));
      }
    }

    const sortCol = viewerConfig?.display?.sortColumn;
    const sortDir = viewerConfig?.display?.sortDirection || 'asc';
    if (sortCol && result.length > 0 && sortCol in result[0]) {
      result = [...result].sort((a, b) => {
        const va = a[sortCol], vb = b[sortCol];
        if (va == null && vb == null) return 0;
        if (va == null) return 1;
        if (vb == null) return -1;
        const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb));
        return sortDir === 'desc' ? -cmp : cmp;
      });
    }

    return result;
  }, [items, effectiveQuery, activeFilters, viewerConfig]);

  const groupedItems = useMemo(() => {
    if (!columnAnalysis.categoryColumn) return null;


    const groups: Record<string, typeof items> = {};
    const catCol = columnAnalysis.categoryColumn!;
    const manualGroups = viewerConfig?.categorization?.manualGroups || [];

    for (const item of filteredItems) {
      const raw = item[catCol];
      let cat = raw != null && raw !== '' ? formatCategoryValue(catCol, raw) : 'Outros';

      // Apply manual group mapping
      if (manualGroups.length > 0) {
        const matched = manualGroups.find(mg => mg.values.includes(String(raw ?? '')));
        if (matched) cat = matched.label;
      }

      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }

    let entries = Object.entries(groups);

    // Apply custom order if set
    const customOrder = viewerConfig?.categorization?.order;
    const sortDir = viewerConfig?.categorization?.categorySortDirection || 'asc';
    if (customOrder && customOrder.length > 0) {
      const orderMap = new Map(customOrder.map((k, i) => [k, i]));
      entries.sort(([a], [b]) => {
        const ai = orderMap.get(a);
        const bi = orderMap.get(b);
        if (ai != null && bi != null) return sortDir === 'desc' ? bi - ai : ai - bi;
        if (ai != null) return -1;
        if (bi != null) return 1;
        return sortDir === 'desc' ? b.localeCompare(a) : a.localeCompare(b);
      });
    } else {
      entries.sort(([a], [b]) => sortDir === 'desc' ? b.localeCompare(a) : a.localeCompare(b));
    }

    // Filter empty categories if configured
    if (!viewerConfig?.categorization?.showEmptyCategories) {
      entries = entries.filter(([, cats]) => cats.length > 0);
    }

    return entries;
  }, [filteredItems, columnAnalysis.categoryColumn, viewerConfig]);

  useEffect(() => {
    if (!activeTab && groupedItems && groupedItems.length > 0) {
      setActiveTab(groupedItems[0][0]);
    }
  }, [activeTab, groupedItems]);

  const toggleFilter = (col: string, value: string) => {
    setActiveFilters(prev => {
      const next = { ...prev };

      // Check if this column uses single-select mode — use config first, then auto-detect
      const filterCol = viewerConfig?.filters?.columns?.find(fc => fc.column === col);
      const filterInfo = columnAnalysis.filterColumns.find(fc => fc.column === col);
      const mode = filterCol?.mode || filterInfo?.mode || 'multiple';
      if (mode === 'single') {
        if (prev[col]?.has(value)) {
          delete next[col];
        } else {
          next[col] = new Set([value]);
        }
        return next;
      }

      const set = new Set(next[col] || []);
      if (set.has(value)) set.delete(value); else set.add(value);
      if (set.size === 0) delete next[col]; else next[col] = set;
      return next;
    });
  };

  const hasActiveFilters = Object.values(activeFilters).some(s => s.size > 0);

  function renderItems(items: any[], _groupKey: string) {
    const baseItemCardProps = {
      tableName,
      tenantSlug,
      tenantId,
      cardRefs,
      useSuffix,
      scaleFactor,
      cardConfig,
      detailConfig,
    };

    const rowSelectionProps = {
      selectedSlug,
      onSelect: selectItem,
    };

    const effectiveLayout = cardConfig?.layout || 'card';

    const renderItemByLayout = (item: any, statKey: string) => {
      if (effectiveLayout === 'list') {
        return (
          <ItemListRow
            key={item.id}
            item={item}
            {...baseItemCardProps}
            {...rowSelectionProps}
            onCompareStatClick={() => { setCompareStat(statKey); setCompareItemId(item.id); }}
          />
        );
      }
      if (effectiveLayout === 'table') {
        return (
          <ItemTableRow
            key={item.id}
            item={item}
            {...baseItemCardProps}
            {...rowSelectionProps}
            onCompareStatClick={() => { setCompareStat(statKey); setCompareItemId(item.id); }}
          />
        );
      }
      if (effectiveLayout === 'accordion') {
        return (
          <ItemAccordionBox
            key={item.id}
            item={item}
            {...baseItemCardProps}
            {...rowSelectionProps}
            onCompareStatClick={(sk: string) => { setCompareStat(sk); setCompareItemId(item.id); }}
          />
        );
      }
      return (
        <ItemCard
          key={item.id}
          item={item}
          {...baseItemCardProps}
          onCompareStatClick={(sk: string) => { setCompareStat(sk); setCompareItemId(item.id); }}
        />
      );
    };

    if (fmt === 'list') {
      if (cols > 1) {
        const gridGap = typeof gap === 'number' ? gap : 12;
        return (
          <div className="grid grid-cols-2 sm:grid-cols-2" style={{ gap: gridGap }}>
            {items.map((item) => renderItemByLayout(item, ''))}
          </div>
        );
      }
      return (
        <div className="space-y-3">
          {items.map((item) => renderItemByLayout(item, ''))}
        </div>
      );
    }

    if (fmt === 'carousel_infinite') {
      return (
        <InfiniteCarousel
          items={items}
          columnsCount={cols}
          gap={12}
          renderItem={(item: any) => (
            renderItemByLayout(item, '')
          )}
        />
      );
    }

    if (fmt === 'carousel') {
      return (
        <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-none snap-x snap-mandatory">
          {items.map((item) => (
            <div
              key={item.id}
              className="snap-start shrink-0"
              style={{ flex: `0 0 calc((100% - ${(cols - 1) * 12}px) / ${cols})` }}
            >
              {renderItemByLayout(item, '')}
            </div>
          ))}
        </div>
      );
    }

    const gridGap = typeof gap === 'number' ? gap : 12;
    return (
      <div className={`${gridColsClass}`} style={{ gap: gridGap }}>
        {items.map((item) => renderItemByLayout(item, ''))}
      </div>
    );
  }

  const renderCategory = (
    category: string,
    catItems: any[],
    vc: typeof viewerConfig,
    pg: boolean,
    ipp: number,
    style: string,
    expanded: Set<string>,
    setExpanded: React.Dispatch<React.SetStateAction<Set<string>>>,
  ) => {
    const catIcon = vc?.categorization?.categoryIcons?.[category];
    const secondaryColumn = vc?.categorization?.secondaryColumn;
    const isExpanded = expanded.has(category) || (vc?.categorization?.defaultExpanded !== false && expanded.size === 0);

    // Compute secondary groups
    let secondaryGroups: [string, any[]][] = [];
    if (secondaryColumn) {
      const sgMap: Record<string, any[]> = {};
      for (const item of catItems) {
        const sub = String(item[secondaryColumn] ?? 'Outros');
        if (!sgMap[sub]) sgMap[sub] = [];
        sgMap[sub].push(item);
      }
      const subOrder = (vc?.categorization?.subOrder as string[]) ?? [];
      const catDirection = vc?.categorization?.categorySortDirection || 'asc';
      secondaryGroups = Object.entries(sgMap).sort(([a], [b]) => {
        const ai = subOrder.indexOf(`${category}::${a}`);
        const bi = subOrder.indexOf(`${category}::${b}`);
        if (ai >= 0 && bi >= 0) return ai - bi;
        if (ai >= 0) return -1;
        if (bi >= 0) return 1;
        return catDirection === 'desc' ? b.localeCompare(a) : a.localeCompare(b);
      });
    }

    const heading = (
      <div className="flex items-center gap-3 mb-3">
        {catIcon ? (
          catIcon.startsWith('http://') || catIcon.startsWith('https://') || catIcon.startsWith('data:') ? (
            <div className="relative w-4 h-4 shrink-0"><Image src={catIcon} alt="" fill className="object-contain" /></div>
          ) : (
            <IconRenderer icon={catIcon} size="sm" />
          )
        ) : (
          <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
        )}
        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider capitalize">{category}</span>
        <span className="text-xs text-muted-foreground/60 font-normal">{catItems.length}</span>
      </div>
    );

    const itemsContent = secondaryGroups.length > 0 ? (
      <div className="space-y-4">
        {secondaryGroups.map(([sub, subItems]) => {
          const subIcon = vc?.categorization?.secondaryIcons?.[category]?.[sub];
          return (
            <div key={sub}>
              <div className="flex items-center gap-2 mb-2">
                {subIcon ? (
                  subIcon.startsWith('http://') || subIcon.startsWith('https://') || subIcon.startsWith('data:') ? (
                    <div className="relative w-3 h-3 shrink-0"><Image src={subIcon} alt="" fill className="object-contain" /></div>
                  ) : (
                    <IconRenderer icon={subIcon} size="sm" />
                  )
                ) : (
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                )}
                <span className="text-xs font-medium text-muted-foreground/70 capitalize">{sub}</span>
                <span className="text-[10px] text-muted-foreground/40">{subItems.length}</span>
              </div>
              {renderItems(pg ? subItems.slice(0, ipp) : subItems, `${category}::${sub}`)}
            </div>
          );
        })}
      </div>
    ) : (
      renderItems(pg ? catItems.slice(0, ipp) : catItems, category)
    );

    if (style === 'accordion') {
      return (
        <div key={category} className="border border-border/50 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => {
              const next = new Set(expanded);
              if (next.has(category)) next.delete(category); else next.add(category);
              setExpanded(next);
            }}
            className="w-full flex items-center justify-between px-4 py-3 bg-muted/20 hover:bg-muted/30 transition-colors"
          >
            {heading}
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
          <motion.div
            initial={false}
            animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2">{itemsContent}</div>
          </motion.div>
        </div>
      );
    }

    return (
      <div key={category}>
        {heading}
        {itemsContent}
      </div>
    );
  };

  const renderHeaderIcon = () => {
    const headerIcon = viewerConfig?.header?.icon || icon;
    if (headerIcon) {
      if (isCustomIcon(headerIcon)) {
        const isVideo = /\.(mp4|webm|gif)$/i.test(headerIcon);
        if (isVideo) {
          return (
            <div className="relative h-10 w-10">
              <video src={headerIcon} autoPlay loop muted playsInline className="object-contain rounded w-full h-full" />
            </div>
          );
        }
        return (
          <div className="relative h-10 w-10">
            <Image src={headerIcon} alt="" fill className="object-contain rounded" />
          </div>
        );
      }
      const Icon = resolveTableIcon(headerIcon);
      return <Icon className="h-5 w-5" />;
    }
    return <Database className="h-5 w-5" />;
  };

  const renderHeaderTitle = () => {
    const headerTitle = viewerConfig?.header?.title;
    if (headerTitle) return headerTitle;
    return tableName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <article className={`max-w-3xl mx-auto ${viewerConfig?.header?.backgroundImage ? 'relative' : ''}`}>
      {viewerConfig?.header?.backgroundImage && (
        <div className="absolute inset-0 -z-10 rounded-2xl overflow-hidden">
          <Image src={viewerConfig.header.backgroundImage} alt="" fill className="object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        </div>
      )}
      {compareStat && compareItemId && tenantId && (
        <ComparePopup
          table={tableName}
          tenantId={tenantId}
          tenantSlug={tenantSlug}
          currentItemId={compareItemId}
          initialStat={compareStat}
          onClose={() => { setCompareStat(null); setCompareItemId(null); }}
        />
      )}
      {(viewerConfig?.header?.showBreadcrumb ?? true) && (
        <Link
          href={homePath}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Voltar para home
        </Link>
      )}

      <div className="mb-8">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              {renderHeaderIcon()}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{renderHeaderTitle()}</h1>
              {viewerConfig?.header?.subtitle && (
                <p className="text-sm text-muted-foreground/70">{viewerConfig.header.subtitle}</p>
              )}
              <p className="text-sm text-muted-foreground">
                {filteredItems.length} de {items.length} ite{items.length === 1 ? 'm' : 'ns'}
              </p>
            </div>
          </div>
          <div className="relative z-20 shrink-0">
            <button
              type="button"
              onClick={() => setUseSuffix(!useSuffix)}
              className="flex items-center justify-center h-5 w-5 rounded-full border-2 bg-background text-[9px] font-mono font-bold leading-none text-muted-foreground hover:text-foreground transition-colors shadow-sm inset-shadow"
              aria-label={useSuffix ? 'Alternar para notação científica' : 'Alternar para sufixo numérico'}
              title={useSuffix ? 'Sufixo numérico: ativado' : 'Notação científica: ativada'}
            >
              {useSuffix ? '1e' : '123'}
            </button>
          </div>
        </div>
      </div>

      {(viewerConfig?.search?.enabled ?? true) && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={viewerConfig?.search?.placeholder || 'Buscar...'}
            className="w-full rounded-xl border bg-card pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {(viewerConfig?.filters?.enabled ?? true) && columnAnalysis.filterColumns.length > 0 && (
        <div className="space-y-2 mb-6">
          {columnAnalysis.filterColumns.map((fc) => (
            <div key={fc.column} className="flex items-start gap-2">
              <span className="text-xs font-medium text-muted-foreground shrink-0 mt-1.5 capitalize min-w-[5rem]">
                {fc.label}:
              </span>
              <ChipCarousel className="flex-1">
                {fc.values.map((v) => {
                  const active = activeFilters[fc.column]?.has(v);
                  return (
                    <button
                      key={v}
                      onClick={() => toggleFilter(fc.column, v)}
                      className={`shrink-0 max-w-[200px] truncate inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs border transition-colors ${
                        active
                          ? 'bg-primary/10 border-primary/30 text-primary'
                          : 'bg-card border-border/50 text-muted-foreground hover:border-muted-foreground/30'
                      }`}
                    >
                      <span className="whitespace-nowrap">{v}</span>
                      {active && <X className="h-3 w-3 shrink-0" />}
                    </button>
                  );
                })}
              </ChipCarousel>
            </div>
          ))}
          {(viewerConfig?.filters?.showClearButton ?? true) && hasActiveFilters && (
            <button
              onClick={() => setActiveFilters({})}
              className="text-xs text-muted-foreground hover:text-foreground underline ml-[5.5rem]"
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className={`space-y-3 ${viewerConfig?.loading?.skeleton === 'pulse' ? 'animate-pulse' : viewerConfig?.loading?.skeleton === 'shimmer' ? 'animate-shimmer' : ''}`}>
          <div className="h-5 w-32 bg-muted rounded mb-6" />
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3`}>
            {Array.from({ length: viewerConfig?.loading?.skeletonCount || 6 }).map((_, i) => (
              <div key={i} className={`h-20 rounded-xl ${viewerConfig?.loading?.skeleton === 'spinner' ? 'flex items-center justify-center' : viewerConfig?.loading?.skeleton === 'shimmer' ? 'bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%]' : 'bg-muted'}`}>
                {viewerConfig?.loading?.skeleton === 'spinner' && (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20 rounded-xl border bg-card">
          {viewerConfig?.emptyState?.imageUrl ? (
            <Image src={viewerConfig.emptyState.imageUrl} alt="" width={96} height={96} className="mx-auto mb-4 object-contain opacity-60" />
          ) : (
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          )}
          <h2 className="text-xl font-semibold mb-2">{viewerConfig?.emptyState?.message || 'Nenhum item encontrado'}</h2>
          <p className="text-muted-foreground">
            {searchQuery || hasActiveFilters
              ? 'Tente ajustar a busca ou os filtros.'
              : 'Esta tabela ainda não possui dados.'}
          </p>
          {viewerConfig?.emptyState?.ctaText && viewerConfig?.emptyState?.ctaUrl && (
            <a href={viewerConfig.emptyState.ctaUrl}
              className="inline-flex items-center gap-2 mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {viewerConfig.emptyState.ctaText}
            </a>
          )}
        </div>
      ) : groupedItems ? (
        <div className="space-y-8">
          {(() => {
            const catStyle = viewerConfig?.categorization?.style || 'headings';

            // Tabs style: render tab buttons then filter
            if (catStyle === 'tabs') {
              const currentTab = activeTab || groupedItems[0]?.[0] || '';
              return (
                <>
                  <div className="flex gap-1 border-b pb-1 overflow-x-auto mb-4">
                    {groupedItems.map(([category]) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setActiveTab(category)}
                        className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                          currentTab === category
                            ? 'bg-primary/10 text-primary border border-primary/30'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent'
                        }`}
                      >
                        <span className="capitalize">{category}</span>
                      </button>
                    ))}
                  </div>
                  {groupedItems
                    .filter(([category]) => category === currentTab)
                    .map(([category, catItems]) => renderCategory(category, catItems, viewerConfig, pagination, itemsPerPage, 'headings', expandedAccordion, setExpandedAccordion))}
                </>
              );
            }

            const separatorClass = spacingStyle === 'single-line' ? 'border-t border-border/50' :
              spacingStyle === 'double-line' ? 'border-t-2 border-double border-border/40' :
              spacingStyle === 'dashed' ? 'border-t border-dashed border-border/40' : '';

            return groupedItems.map(([category, catItems], idx) => (
              <div key={category}>
                {idx > 0 && separatorClass && (
                  <div className={separatorClass} style={{ marginBottom: spacingValue }} />
                )}
                {idx > 0 && !separatorClass && (
                  <div style={{ height: spacingValue }} />
                )}
                {renderCategory(category, catItems, viewerConfig, pagination, itemsPerPage, catStyle, expandedAccordion, setExpandedAccordion)}
              </div>
            ));
          })()}
        </div>
      ) : (
        <>
          {renderItems(
            pagination
              ? filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              : filteredItems,
            '_all',
          )}
          {pagination && filteredItems.length > itemsPerPage && (
            <PaginationControls
              currentPage={currentPage}
              totalItems={filteredItems.length}
              itemsPerPage={itemsPerPage}
              paginationStyle={paginationStyle}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}
    </article>
  );
}

function PaginationControls({
  currentPage, totalItems, itemsPerPage, paginationStyle, onPageChange,
}: {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  paginationStyle: string;
  onPageChange: React.Dispatch<React.SetStateAction<number>>;
}) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (paginationStyle === 'emoji') {
    return (
      <div className="flex items-center justify-center gap-3 mt-8">
        <button
          onClick={() => onPageChange(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="text-lg disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110 transition-transform"
          aria-label="Previous page"
        >
          ⬅️
        </button>
        <span className="text-sm text-muted-foreground">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(p => p + 1)}
          disabled={currentPage >= totalPages}
          className="text-lg disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110 transition-transform"
          aria-label="Next page"
        >
          ➡️
        </button>
      </div>
    );
  }

  if (paginationStyle === 'numbers') {
    const pages: number[] = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    for (let i = start; i <= end; i++) pages.push(i);

    return (
      <div className="flex items-center justify-center gap-1.5 mt-8">
        <button
          onClick={() => onPageChange(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border bg-card hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {start > 1 && <span className="text-xs text-muted-foreground px-1">...</span>}
        {pages.map(p => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`min-w-[2rem] h-8 rounded-lg text-xs font-medium border transition-colors ${
              p === currentPage
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'bg-card hover:bg-muted text-muted-foreground border-border/50'
            }`}
          >
            {p}
          </button>
        ))}
        {end < totalPages && <span className="text-xs text-muted-foreground px-1">...</span>}
        <button
          onClick={() => onPageChange(p => p + 1)}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-lg border bg-card hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // arrows (default)
  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(p => Math.max(1, p - 1))}
        disabled={currentPage === 1}
        className="p-1.5 rounded-lg border bg-card hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-sm text-muted-foreground px-3">
        {currentPage} de {totalPages}
      </span>
      <button
        onClick={() => onPageChange(p => p + 1)}
        disabled={currentPage >= totalPages}
        className="p-1.5 rounded-lg border bg-card hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function ItemListRow({
  item,
  _tableName,
  _tenantSlug,
  _tenantId,
  selectedSlug,
  onSelect,
  cardRefs,
  _useSuffix,
  _scaleFactor,
  cardConfig,
  _detailConfig,
  onCompareStatClick,
}: {
  item: any;
  _tableName?: string;
  _tenantSlug?: string;
  _tenantId?: string;
  selectedSlug?: string | null;
  onSelect?: (slug: string | null) => void;
  cardRefs?: React.MutableRefObject<Map<string, HTMLElement>>;
  _useSuffix?: boolean;
  _scaleFactor?: number;
  cardConfig?: Record<string, any>;
  _detailConfig?: Record<string, any>;
  onCompareStatClick: () => void;
}) {
  const name = item.name || item.title || item.slug || 'Item';
  const slug = item.slug || '';
  const isSelected = selectedSlug === slug;
  const description = item.description || item.subtitle || '';

  return (
    <div
      id={slug ? `item-${slug}` : undefined}
      ref={(el) => { if (slug && el && cardRefs) cardRefs.current.set(slug, el); }}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg border bg-card cursor-pointer transition-colors ${
        isSelected ? 'border-primary/40 bg-primary/5' : 'hover:bg-muted/50 border-border/50'
      }`}
      onClick={() => onSelect?.(slug)}
    >
      {item.icon_url ? (
        <div className="relative w-7 h-7 shrink-0 rounded-md overflow-hidden bg-muted">
          <Image src={item.icon_url} alt="" fill className="object-contain" />
        </div>
      ) : item.icon ? (
        <div className="w-7 h-7 shrink-0 rounded-md bg-muted flex items-center justify-center text-xs">
          <IconRenderer icon={item.icon} size="sm" />
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{name}</p>
        {description && <p className="text-xs text-muted-foreground truncate">{description}</p>}
      </div>
      {cardConfig?.showComparison !== false && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onCompareStatClick(); }}
          className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          title="Compare"
        >
          <BarChart3 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function ItemTableRow({
  item,
  _tableName,
  _tenantSlug,
  _tenantId,
  selectedSlug,
  onSelect,
  cardRefs,
  _useSuffix,
  _scaleFactor,
  cardConfig,
  _detailConfig,
  onCompareStatClick,
}: {
  item: any;
  _tableName?: string;
  _tenantSlug?: string;
  _tenantId?: string;
  selectedSlug?: string | null;
  onSelect?: (slug: string | null) => void;
  cardRefs?: React.MutableRefObject<Map<string, HTMLElement>>;
  _useSuffix?: boolean;
  _scaleFactor?: number;
  cardConfig?: Record<string, any>;
  _detailConfig?: Record<string, any>;
  onCompareStatClick: () => void;
}) {
  const name = item.name || item.title || item.slug || 'Item';
  const slug = item.slug || '';
  const isSelected = selectedSlug === slug;
  const visibleColumns: string[] = cardConfig?.columnOrder?.length
    ? cardConfig.columnOrder
    : cardConfig?.visibleColumns || [];

  return (
    <tr
      id={slug ? `item-${slug}` : undefined}
      ref={(el) => { if (slug && el && cardRefs) cardRefs.current.set(slug, el); }}
      className={`border-b border-border/30 cursor-pointer transition-colors last:border-0 ${
        isSelected ? 'bg-primary/5' : 'hover:bg-muted/30'
      }`}
      onClick={() => onSelect?.(slug)}
    >
      <td className="py-2 px-3">
        <div className="flex items-center gap-2">
          {item.icon_url ? (
            <div className="relative w-6 h-6 shrink-0 rounded overflow-hidden bg-muted">
              <Image src={item.icon_url} alt="" fill className="object-contain" />
            </div>
          ) : item.icon ? (
            <div className="w-6 h-6 shrink-0 rounded bg-muted flex items-center justify-center text-xs">
              <IconRenderer icon={item.icon} size="sm" />
            </div>
          ) : null}
          <span className="text-sm font-medium truncate">{name}</span>
        </div>
      </td>
      {visibleColumns.map(col => (
        <td key={col} className="py-2 px-3 text-xs text-muted-foreground">
          {String(item[col] ?? '—')}
        </td>
      ))}
      <td className="py-2 px-3 text-right">
        {cardConfig?.showComparison !== false && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onCompareStatClick(); }}
            className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Compare"
          >
            <BarChart3 className="h-3.5 w-3.5" />
          </button>
        )}
      </td>
    </tr>
  );
}

function ItemAccordionBox({
  item,
  tableName,
  tenantSlug,
  tenantId,
  selectedSlug,
  onSelect,
  cardRefs,
  useSuffix,
  _scaleFactor,
  _cardConfig,
  detailConfig,
  onCompareStatClick,
}: {
  item: any;
  tableName?: string;
  tenantSlug?: string;
  tenantId?: string;
  selectedSlug?: string | null;
  onSelect?: (slug: string | null) => void;
  cardRefs?: React.MutableRefObject<Map<string, HTMLElement>>;
  useSuffix?: boolean;
  _scaleFactor?: number;
  _cardConfig?: Record<string, any>;
  detailConfig?: Record<string, any>;
  onCompareStatClick: (statKey: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const name = item.name || item.title || item.slug || 'Item';
  const slug = item.slug || '';
  const isSelected = selectedSlug === slug;

  return (
    <div
      id={slug ? `item-${slug}` : undefined}
      ref={(el) => { if (slug && el && cardRefs) cardRefs.current.set(slug, el); }}
      className={`rounded-xl border bg-card overflow-hidden transition-colors ${
        isSelected ? 'border-primary/40 bg-primary/5' : ''
      }`}
    >
      <button
        type="button"
        onClick={() => { setExpanded(!expanded); onSelect?.(slug); }}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
      >
        {item.icon_url ? (
          <div className="relative w-8 h-8 shrink-0 rounded-lg overflow-hidden bg-muted">
            <Image src={item.icon_url} alt="" fill className="object-contain" />
          </div>
        ) : item.icon ? (
          <div className="w-8 h-8 shrink-0 rounded-lg bg-muted flex items-center justify-center">
            <IconRenderer icon={item.icon} size="sm" />
          </div>
        ) : null}
        <span className="text-sm font-medium flex-1 text-left truncate">{name}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
      </button>
      <motion.div
        initial={false}
        animate={{ height: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="overflow-hidden"
      >
        <div className="px-4 pb-3 pt-1 border-t border-border/30">
          {item.description && (
            <p className="text-xs text-muted-foreground mb-2">{item.description}</p>
          )}
          {tenantId ? (
            <CollectionItemView
              data={item}
              tenantId={tenantId}
              tenantSlug={tenantSlug}
              sourceTable={tableName}
              comparisonMode="modal"
              hideHeader
              chipWrap
              useSuffix={useSuffix}
              onCompareStatClick={onCompareStatClick as any}
              detailConfig={detailConfig}
            />
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}

function ItemCard({
  item,
  tableName,
  tenantSlug,
  tenantId,
  cardRefs,
  onCompareStatClick,
  useSuffix,
  cardConfig,
  detailConfig,
}: {
  item: any;
  tableName: string;
  tenantSlug: string;
  tenantId?: string;
  cardRefs?: React.MutableRefObject<Map<string, HTMLElement>>;
  onCompareStatClick?: (statKey: string) => void;
  useSuffix?: boolean;
  cardConfig?: Record<string, any>;
  detailConfig?: Record<string, any>;
}) {
  const label = item.name || item.title || item.item_name || item.code || '';
  const itemSlug = toSlug(String(label));

  const showCardIcon = cardConfig?.showIcon !== false;
  const showCardImage = cardConfig?.showImage !== false;
  const showCardLabel = cardConfig?.showLabel !== false;
  const cardSize = cardConfig?.size || 'md';
  const activeBadges: string[] = (cardConfig?.badges as string[]) || [];
  const badgeConfig: Record<string, any> = (cardConfig?.badgeConfig as Record<string, any>) || {};
  const badgeColors: Record<string, string> = (cardConfig?.badgeColors as Record<string, string>) || {};
  const hoverEffect = cardConfig?.hoverEffect || 'scale';
  const hoverEffectClass = hoverEffect === 'none' ? '' :
    hoverEffect === 'scale' ? 'hover:scale-[1.02] hover:shadow-md hover:border-primary/20 transition-all duration-200' :
    hoverEffect === 'glow' ? 'hover:shadow-[0_0_15px_rgba(75,197,255,0.3)] hover:border-primary/30 transition-all duration-200' :
    'hover:shadow-md hover:border-primary/20 transition-all duration-200';

  const icon = getIcon(item);
  const collIcon = COLL_ICON[tableName] || <Eye className="h-5 w-5" />;
  const imageUrl = (showCardImage ? item.image_url || item.image || item.icon_url || item.icon : undefined);

  const rarity = item.rarity != null ? String(item.rarity) : undefined;
  const grad = rarity ? (RARITY_GRAD[rarity.toLowerCase()] || 'from-black/60 to-black/40') : 'from-black/60 to-black/40';

  const handleBadgeClick = (col: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const bc = badgeConfig[col] || {};
    const action = bc.clickAction || 'none';
    if (action === 'comparison') {
      onCompareStatClick?.(col);
    } else if (action === 'external-link') {
      const url = bc.clickUrl || '';
      if (url.startsWith('http://') || url.startsWith('https://')) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  function renderBadge(col: string): React.ReactNode {
    const val = item[col];
    if (val == null || val === '' || val === 'none') return null;
    const strVal = String(val);
    const bc = badgeConfig[col] || {};
    const rawColor = badgeColors[col] || '';
    const isColor = isColorString(rawColor);
    const hasHover = bc.hover === true;
    const hasAction = (bc.clickAction || 'none') !== 'none';
    const baseClass = 'inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-medium';
    const colorClass = isColor ? 'bg-background/80 backdrop-blur-sm border-border/50' : (rawColor || 'bg-background/80 backdrop-blur-sm border-border/50');
    const classes = `${baseClass} ${colorClass} ${hasHover ? 'hover:scale-110 transition-transform' : ''} ${hasAction ? 'cursor-pointer' : ''}`;
    const style = isColor ? (hexToStyle(rawColor) || undefined) : undefined;
    if (hasAction) {
      return (
        <button key={col} type="button" onClick={(e) => handleBadgeClick(col, e)} className={classes} style={style}>
          {col === 'element' && elIcon(strVal)}
          {col === 'rarity' && <Star className="h-2.5 w-2.5" />}
          {strVal}
        </button>
      );
    }
    return (
      <span key={col} className={classes} style={style}>
        {col === 'element' && elIcon(strVal)}
        {col === 'rarity' && <Star className="h-2.5 w-2.5" />}
        {strVal}
      </span>
    );
  }

  const cardPadding = 'p-3';
  const iconSize = cardSize === 'sm' ? 'h-8 w-8' : cardSize === 'lg' ? 'h-16 w-16' : 'h-12 w-12';
  const titleSize = cardSize === 'sm' ? 'text-sm' : cardSize === 'lg' ? 'text-lg' : 'font-semibold';

  return (
    <div
      ref={(el) => { if (itemSlug && el) cardRefs?.current.set(itemSlug, el); }}
      className={`rounded-xl border bg-card overflow-hidden ${hoverEffectClass}`}
    >
      <div
        className="relative overflow-hidden"
        style={imageUrl ? {
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : undefined}
      >
        <div className={`absolute inset-0 ${imageUrl ? 'bg-gradient-to-br from-black/80 via-black/60 to-black/80' : `bg-gradient-to-br ${grad}`}`} />
        {!imageUrl && <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)]" />}
        <div className={`relative ${cardPadding} flex items-start gap-3`}>
          {showCardIcon && (
          <div className={`relative ${iconSize} rounded-xl bg-background/20 backdrop-blur-sm flex items-center justify-center shrink-0 overflow-hidden`}>
            {icon || collIcon}
          </div>
          )}
          {showCardLabel && (
          <div className="flex-1 min-w-0 self-center">
            <h3 className={`${titleSize} leading-tight text-white`}>
              {label}
            </h3>
          </div>
          )}
          {activeBadges.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap shrink-0 max-w-[180px] self-center">
            {activeBadges.map(col => renderBadge(col))}
          </div>
          )}
        </div>
      </div>

      <div className="px-4 pb-4 pt-3 border-t border-border/50">
        {tenantId ? (
          <CollectionItemView
            data={item}
            tenantId={tenantId}
            tenantSlug={tenantSlug}
            sourceTable={tableName}
            comparisonMode="modal"
            hideHeader
            chipWrap
            useSuffix={useSuffix}
            onCompareStatClick={onCompareStatClick}
            detailConfig={detailConfig}
          />
        ) : (
          <p className="text-sm text-muted-foreground">{item.description || ''}</p>
        )}
      </div>
    </div>
  );
}
