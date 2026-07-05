'use client';

import Image from 'next/image';
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  FileText, Database, ArrowLeft, ChevronDown,
  Star,
  Search, X, Eye, Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { useWikiPath } from '@/hooks/use-wiki-path';
import { useTableItems } from '@/hooks/use-data-access';
import { ChipCarousel } from '@/components/ui/chip-carousel';
import InfiniteCarousel from '@/components/ui/infinite-carousel';
import { IconRenderer } from '@/components/ui/icon-renderer';
import CollectionItemView from '@/components/wiki/collection-item-view';
import ComparePopup from '@/components/wiki/compare-popup';
import {
  RARITY_COLORS, RARITY_GRAD, TIER_LABEL, TIER_COL,
  elementClass, elIcon, COLL_ICON,
} from '@/lib/game-ui';
import type { ViewerConfig } from '@/lib/viewer-config';
import { resolveTableIcon } from '@/lib/table-icons';

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
};

export default function GameTableListing({ tenantSlug, tableName, tenantId, displayFormat, columnsCount, viewerConfig }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data, loading } = useTableItems(tenantSlug, tableName);
  const items: any[] = useMemo(() => data?.items ?? [], [data?.items]);

  const { homePath } = useWikiPath(tenantSlug);

  const [searchQuery, setSearchQuery] = useState('');
  const [compareStat, setCompareStat] = useState<string | null>(null);
  const [compareItemId, setCompareItemId] = useState<string | null>(null);
  const [scientificNotation, setScientificNotation] = useState(false);

  const urlItem = searchParams?.get('item') || null;
  const [selectedSlug, setSelectedSlug] = useState<string | null>(urlItem);
  const [activeFilters, setActiveFilters] = useState<Record<string, Set<string>>>({});
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const fmt = displayFormat || 'grid';
  const cols = Math.max(2, Math.min(5, columnsCount || 2));
  const gridColsClass = ({
    2: 'grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
  } as Record<number, string>)[cols] || 'grid-cols-2';
  
  useEffect(() => {
    setSelectedSlug(urlItem);
  }, [urlItem]);

  useEffect(() => {
    if (selectedSlug && cardRefs.current[selectedSlug]) {
      setTimeout(() => {
        cardRefs.current[selectedSlug]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

  const columnAnalysis = useMemo(() => {
    if (items.length === 0) return { categoryColumn: null as string | null, filterColumns: [] as { column: string; values: string[]; label: string }[] };

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

    // Use viewerConfig categorization column if set
    let categoryColumn: string | null = null;
    const catConfig = viewerConfig?.categorization;
    if (catConfig?.enabled !== false && catConfig?.column && catConfig.column !== 'none') {
      if (columnValues[catConfig.column]) {
        categoryColumn = catConfig.column;
      }
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

    // Use viewerConfig filter columns if set
    const filterConfig = viewerConfig?.filters;
    const hasConfiguredFilters = filterConfig?.columns && filterConfig.columns.length > 0 && filterConfig.autoDetect !== false;

    let filterColumns: { column: string; values: string[]; label: string }[];
    if (hasConfiguredFilters) {
      filterColumns = filterConfig!.columns
        .map(fc => ({
          column: fc.column,
          values: columnValues[fc.column] || [],
          label: fc.label || deriveLabel(fc.column),
        }))
        .filter(fc => fc.values.length > 0);
    } else {
      filterColumns = allFilterCandidates
        .map(col => ({
          column: col,
          values: columnValues[col],
          label: deriveLabel(col),
        }))
        .filter(fc => fc.values.length > 0);
    }

    return { categoryColumn, filterColumns };
  }, [items, viewerConfig]);

  const filteredItems = useMemo(() => {
    let result = items;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
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

    return result;
  }, [items, searchQuery, activeFilters, viewerConfig]);

  const groupedItems = useMemo(() => {
    if (!columnAnalysis.categoryColumn) return null;
    const catStyle = viewerConfig?.categorization?.style;
    if (catStyle === 'none') return null;

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
    if (customOrder && customOrder.length > 0) {
      const orderMap = new Map(customOrder.map((k, i) => [k, i]));
      entries.sort(([a], [b]) => {
        const ai = orderMap.get(a);
        const bi = orderMap.get(b);
        if (ai != null && bi != null) return ai - bi;
        if (ai != null) return -1;
        if (bi != null) return 1;
        return a.localeCompare(b);
      });
    } else {
      entries.sort(([a], [b]) => a.localeCompare(b));
    }

    // Filter empty categories if configured
    if (!viewerConfig?.categorization?.showEmptyCategories) {
      entries = entries.filter(([, cats]) => cats.length > 0);
    }

    return entries;
  }, [filteredItems, columnAnalysis.categoryColumn, viewerConfig]);

  const toggleFilter = (col: string, value: string) => {
    setActiveFilters(prev => {
      const next = { ...prev };

      // Check if this column uses single-select mode
      const filterCol = viewerConfig?.filters?.columns?.find(fc => fc.column === col);
      if (filterCol?.mode === 'single') {
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
    if (fmt === 'list') {
      return (
        <div className="space-y-3">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              tableName={tableName}
              tenantSlug={tenantSlug}
              tenantId={tenantId}
              selectedSlug={selectedSlug}
              onSelect={selectItem}
              cardRefs={cardRefs}
              scientificNotation={scientificNotation}
              onCompareStatClick={(statKey: string) => { setCompareStat(statKey); setCompareItemId(item.id); }}
            />
          ))}
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
            <ItemCard
              item={item}
              tableName={tableName}
              tenantSlug={tenantSlug}
              tenantId={tenantId}
              selectedSlug={selectedSlug}
              onSelect={selectItem}
              cardRefs={cardRefs}
              scientificNotation={scientificNotation}
              onCompareStatClick={(statKey: string) => { setCompareStat(statKey); setCompareItemId(item.id); }}
            />
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
              <ItemCard
                item={item}
                tableName={tableName}
                tenantSlug={tenantSlug}
                tenantId={tenantId}
                selectedSlug={selectedSlug}
                onSelect={selectItem}
                cardRefs={cardRefs}
                scientificNotation={scientificNotation}
                onCompareStatClick={(statKey: string) => { setCompareStat(statKey); setCompareItemId(item.id); }}
              />
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className={`${gridColsClass} gap-3`}>
        {items.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            tableName={tableName}
            tenantSlug={tenantSlug}
            tenantId={tenantId}
            selectedSlug={selectedSlug}
            onSelect={selectItem}
            cardRefs={cardRefs}
            scientificNotation={scientificNotation}
            onCompareStatClick={(statKey: string) => { setCompareStat(statKey); setCompareItemId(item.id); }}
          />
        ))}
      </div>
    );
  }

  const renderHeaderIcon = () => {
    const headerIcon = viewerConfig?.header?.icon;
    if (headerIcon) {
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
      <Link
        href={homePath}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Voltar para home
      </Link>

      <div className="mb-8">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              {renderHeaderIcon()}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{renderHeaderTitle()}</h1>
              <p className="text-sm text-muted-foreground">
                {filteredItems.length} de {items.length} ite{items.length === 1 ? 'm' : 'ns'}
              </p>
            </div>
          </div>
          <div className="relative z-20 shrink-0">
            <button
              type="button"
              onClick={() => setScientificNotation(!scientificNotation)}
              className="flex items-center justify-center h-5 w-5 rounded-full border-2 bg-background text-[9px] font-mono font-bold leading-none text-muted-foreground hover:text-foreground transition-colors shadow-sm inset-shadow"
              aria-label={scientificNotation ? 'Alternar para notação normal' : 'Alternar para notação científica'}
              title={scientificNotation ? 'Notação científica: ativada' : 'Notação científica: desativada'}
            >
              {scientificNotation ? '123' : '1e'}
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
          {hasActiveFilters && (
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
        <div className={`space-y-3 ${viewerConfig?.loading?.skeleton === 'pulse' ? 'animate-pulse' : viewerConfig?.loading?.skeleton === 'shimmer' ? 'animate-pulse' : ''}`}>
          <div className="h-5 w-32 bg-muted rounded mb-6" />
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3`}>
            {Array.from({ length: viewerConfig?.loading?.skeletonCount || 6 }).map((_, i) => (
              <div key={i} className={`h-20 rounded-xl ${viewerConfig?.loading?.skeleton === 'spinner' ? 'flex items-center justify-center' : 'bg-muted'}`}>
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
          {groupedItems.map(([category, catItems]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                {category}
                <span className="text-xs text-muted-foreground/60 font-normal">{catItems.length}</span>
              </h3>
              {renderItems(catItems, category)}
            </div>
          ))}
        </div>
      ) : (
        renderItems(filteredItems, '_all')
      )}
    </article>
  );
}

function ItemCard({
  item,
  tableName,
  tenantSlug,
  tenantId,
  selectedSlug,
  onSelect,
  cardRefs,
  onCompareStatClick,
  scientificNotation,
}: {
  item: any;
  tableName: string;
  tenantSlug: string;
  tenantId?: string;
  selectedSlug: string | null;
  onSelect: (slug: string | null) => void;
  cardRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  onCompareStatClick?: (statKey: string) => void;
  scientificNotation?: boolean;
}) {
  const label = item.name || item.title || item.item_name || item.code || '';
  const itemSlug = toSlug(String(label));
  const isOpen = selectedSlug === itemSlug;
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, [isOpen, item]);

  const icon = getIcon(item);
  const collIcon = COLL_ICON[tableName] || <Eye className="h-5 w-5" />;
  const imageUrl = item.image_url || item.image || item.icon_url || item.icon;

  const rarity = item.rarity != null ? String(item.rarity) : undefined;
  const tier = item.tier != null ? String(item.tier) : undefined;
  const element = item.element != null ? String(item.element) : undefined;
  const grad = rarity ? (RARITY_GRAD[rarity.toLowerCase()] || 'from-black/60 to-black/40') : 'from-black/60 to-black/40';

  return (
    <div
      ref={(el) => { cardRefs.current[itemSlug] = el; }}
      className="rounded-xl border bg-card overflow-hidden"
    >
      <motion.button
        onClick={() => onSelect(itemSlug)}
        className="w-full text-left cursor-pointer"
        whileTap={{ scale: 0.995 }}
        style={{ perspective: 1000, transformStyle: 'preserve-3d' }}
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
          <div className="relative p-4 flex items-start gap-3">
            <div className="relative h-12 w-12 rounded-xl bg-background/20 backdrop-blur-sm flex items-center justify-center shrink-0 overflow-hidden">
              {icon || collIcon}
            </div>
            <div className="flex-1 min-w-0 self-center">
              <motion.h3
                className="font-semibold leading-tight relative"
                animate={{ x: isOpen ? 4 : 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <motion.span
                  className="block text-white"
                  animate={{ opacity: isOpen ? 0 : 1 }}
                  transition={{ duration: 0.25 }}
                >
                  {label}
                </motion.span>
                <motion.span
                  className="absolute inset-0 bg-gradient-to-r from-primary via-primary/70 to-primary/40 bg-clip-text text-transparent"
                  animate={{ opacity: isOpen ? 1 : 0 }}
                  transition={{ duration: 0.25 }}
                  aria-hidden
                >
                  {label}
                </motion.span>
              </motion.h3>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap shrink-0 max-w-[180px] self-center">
              {rarity && (
                <span className={`inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${RARITY_COLORS[rarity.toLowerCase()] || RARITY_COLORS.common} bg-background/80 backdrop-blur-sm`}>
                  <Star className="h-2.5 w-2.5" />
                  {rarity}
                </span>
              )}
              {tier && (
                <span className={`inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-bold ${TIER_COL[tier.toLowerCase()] || TIER_COL.d} bg-background/80 backdrop-blur-sm`}>
                  {TIER_LABEL[tier.toLowerCase()] || tier}
                </span>
              )}
              {element && element !== 'none' && (
                <span className={`inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${elementClass(element)} bg-background/80 backdrop-blur-sm`}>
                  {elIcon(element)}
                  {element}
                </span>
              )}
            </div>
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0, scale: isOpen ? 1.2 : 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 12, mass: 0.8 }}
              style={{ transformStyle: 'preserve-3d' }}
              className="shrink-0 self-center mt-0.5"
            >
              <ChevronDown className="h-4 w-4 text-white/70" />
            </motion.div>
          </div>
        </div>
      </motion.button>

      <motion.div
        initial={false}
        animate={{
          height: isOpen ? height : 0,
          opacity: isOpen ? 1 : 0,
          rotateX: isOpen ? 0 : -15,
          scaleY: isOpen ? 1 : 0.92,
          filter: isOpen ? 'blur(0px)' : 'blur(6px)',
        }}
        transition={{
          duration: 0.5,
          ease: [0.22, 1, 0.36, 1],
          height: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
          opacity: { duration: 0.3, delay: isOpen ? 0.08 : 0 },
          rotateX: { duration: 0.45 },
          scaleY: { duration: 0.4 },
          filter: { duration: 0.35, delay: isOpen ? 0.05 : 0 },
        }}
        style={{
          transformOrigin: 'top center',
          perspective: 1200,
          transformStyle: 'preserve-3d',
          overflow: 'hidden',
        }}
      >
        <div ref={contentRef}>
          <div className="px-4 pb-4 pt-3 border-t border-border/50">
            {tenantId ? (
              <CollectionItemView
                data={item}
                tenantId={tenantId}
                tenantSlug={tenantSlug}
                sourceTable={tableName}
                comparisonMode="modal"
                hideHeader
                scientificNotation={scientificNotation}
                onCompareStatClick={onCompareStatClick}
              />
            ) : (
              <p className="text-sm text-muted-foreground">{item.description || ''}</p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
