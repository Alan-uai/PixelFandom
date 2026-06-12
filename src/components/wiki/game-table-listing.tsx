'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  FileText, Database, ArrowLeft, ChevronDown,
  Sword, Shield, Zap, Gem, Crosshair, Pickaxe, Sparkles, Star, Skull,
  Search, X, Eye,
} from 'lucide-react';
import Link from 'next/link';
import { useWikiPath } from '@/hooks/use-wiki-path';
import { useTableItems } from '@/hooks/use-data-access';
import { ChipCarousel } from '@/components/ui/chip-carousel';
import { IconRenderer } from '@/components/ui/icon-renderer';
import CollectionItemView from '@/components/wiki/collection-item-view';
import ComparePopup from '@/components/wiki/compare-popup';
import {
  RARITY_COLORS, RARITY_GRAD, TIER_LABEL, TIER_COL,
  elementClass, elIcon, COLL_ICON,
} from '@/lib/game-ui';

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
      if (typeof v === 'string' && v.startsWith('http')) return <img src={v} alt="" className="w-full h-full object-contain" />;
      if (typeof v === 'string') return <span className="text-lg">{v}</span>;
    }
  }
  for (const col of imageColumnNames) {
    const v = item[col];
    if (v && typeof v === 'string') return <img src={v} alt="" className="w-full h-full object-cover" />;
  }
  return null;
}

type Props = {
  tenantSlug: string;
  tableName: string;
  tenantId?: string;
  displayFormat?: string;
  columnsCount?: number;
};

export default function GameTableListing({ tenantSlug, tableName, tenantId, displayFormat, columnsCount }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data, loading } = useTableItems(tenantSlug, tableName);
  const items: any[] = data?.items ?? [];
  const labelCol = data?.labelCol ?? 'name';
  const { homePath } = useWikiPath(tenantSlug);

  const [searchQuery, setSearchQuery] = useState('');
  const [compareStat, setCompareStat] = useState<string | null>(null);
  const [compareItemId, setCompareItemId] = useState<string | null>(null);

  const urlItem = searchParams?.get('item') || null;
  const [selectedSlug, setSelectedSlug] = useState<string | null>(urlItem);
  const [activeFilters, setActiveFilters] = useState<Record<string, Set<string>>>({});
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const fmt = displayFormat || 'grid';
  const cols = Math.max(1, Math.min(5, columnsCount || 2));
  const gridColsClass = ({
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
  } as Record<number, string>)[cols] || 'grid-cols-2';
  const carouselRef = useRef<HTMLDivElement>(null);

  const handleInfiniteScroll = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    const half = el.scrollWidth / 2;
    if (el.scrollLeft >= half) {
      el.scrollLeft -= half;
    } else if (el.scrollLeft <= 0) {
      el.scrollLeft += half;
    }
  }, []);

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
      items.forEach(item => {
        const v = item[key];
        if (v != null && v !== '' && v !== 'none') values.add(String(v));
      });
      if (values.size >= 2) {
        columnValues[key] = Array.from(values).sort();
      }
    }

    const candidates = Object.keys(columnValues);
    let categoryColumn: string | null = null;

    for (const col of candidates) {
      if (isTypeLike(col)) { categoryColumn = col; break; }
    }
    if (!categoryColumn && candidates.length > 0) {
      categoryColumn = candidates[0];
    }

    const filterColumns = candidates
      .filter(col => col !== categoryColumn)
      .map(col => ({
        column: col,
        values: columnValues[col],
        label: deriveLabel(col),
      }));

    return { categoryColumn, filterColumns };
  }, [items]);

  const filteredItems = useMemo(() => {
    let result = items;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item =>
        Object.entries(item).some(([key, val]) => {
          if (SYSTEM_COLS.has(key) || key === 'embedding') return false;
          if (val == null) return false;
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
  }, [items, searchQuery, activeFilters]);

  const groupedItems = useMemo(() => {
    if (!columnAnalysis.categoryColumn) return null;
    const groups: Record<string, typeof items> = {};
    const catCol = columnAnalysis.categoryColumn!;
    for (const item of filteredItems) {
      const raw = item[catCol];
      const cat = raw != null && raw !== '' ? formatCategoryValue(catCol, raw) : 'Outros';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredItems, columnAnalysis.categoryColumn]);

  const toggleFilter = (col: string, value: string) => {
    setActiveFilters(prev => {
      const next = { ...prev };
      const set = new Set(next[col] || []);
      if (set.has(value)) set.delete(value); else set.add(value);
      if (set.size === 0) delete next[col]; else next[col] = set;
      return next;
    });
  };

  const hasActiveFilters = Object.values(activeFilters).some(s => s.size > 0);

  function renderItems(items: any[], groupKey: string) {
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
              onCompareStatClick={(statKey: string) => { setCompareStat(statKey); setCompareItemId(item.id); }}
            />
          ))}
        </div>
      );
    }

    if (fmt.startsWith('carousel')) {
      const isInfinite = fmt === 'carousel_infinite';
      const displayItems = isInfinite ? [...items, ...items] : items;

      return (
        <div
          ref={isInfinite ? carouselRef : undefined}
          className={`flex overflow-x-auto gap-3 pb-2 scrollbar-none ${isInfinite ? '' : 'snap-x snap-mandatory'}`}
          onScroll={isInfinite ? handleInfiniteScroll : undefined}
        >
          {displayItems.map((item, i) => (
            <div
              key={isInfinite ? `${item.id}-i${i}` : item.id}
              className={isInfinite ? 'shrink-0' : 'snap-start shrink-0'}
              style={{ flex: `0 0 calc((100% - ${cols - 1} * 0.75rem) / ${cols})` }}
            >
              <ItemCard
                item={item}
                tableName={tableName}
                tenantSlug={tenantSlug}
                tenantId={tenantId}
                selectedSlug={selectedSlug}
                onSelect={selectItem}
                cardRefs={cardRefs}
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
            onCompareStatClick={(statKey: string) => { setCompareStat(statKey); setCompareItemId(item.id); }}
          />
        ))}
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto">
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
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold capitalize">{tableName.replace(/_/g, ' ')}</h1>
            <p className="text-sm text-muted-foreground">
              {filteredItems.length} de {items.length} ite{items.length === 1 ? 'm' : 'ns'}
            </p>
          </div>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar..."
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

      {columnAnalysis.filterColumns.length > 0 && (
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
        <div className="space-y-3 animate-pulse">
          <div className="h-5 w-32 bg-muted rounded mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-muted" />
            ))}
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20 rounded-xl border bg-card">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Nenhum item encontrado</h2>
          <p className="text-muted-foreground">
            {searchQuery || hasActiveFilters
              ? 'Tente ajustar a busca ou os filtros.'
              : 'Esta tabela ainda não possui dados.'}
          </p>
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
}: {
  item: any;
  tableName: string;
  tenantSlug: string;
  tenantId?: string;
  selectedSlug: string | null;
  onSelect: (slug: string | null) => void;
  cardRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  onCompareStatClick?: (statKey: string) => void;
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
            <div className="h-12 w-12 rounded-xl bg-background/20 backdrop-blur-sm flex items-center justify-center shrink-0 overflow-hidden">
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
                <span className={`inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${RARITY_COLORS[rarity.toLowerCase()] || RARITY_COLORS.common} bg-background/80 backdrop-blur-sm uppercase`}>
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
