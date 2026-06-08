'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText, Database, ArrowLeft, ChevronDown, ChevronRight,
  Sword, Shield, Zap, Gem, Crosshair, Pickaxe, Sparkles, Star, Skull,
  Search, X,
} from 'lucide-react';
import { useWikiPath } from '@/hooks/use-wiki-path';
import { useTableItems } from '@/hooks/use-data-access';
import { ChipCarousel } from '@/components/ui/chip-carousel';

const SYSTEM_COLS = new Set(['id', 'tenant_id', 'created_at', 'updated_at', 'slug', 'embedding']);
const LONG_TEXT_COLS = new Set([
  'description', 'effects', 'weakness', 'notes', 'strategy', 'tips',
  'content', 'details', 'items_dropped', 'notable_loot',
]);
const CATEGORY_PRIORITY = [
  'type', 'world', 'element', 'weapon_type', 'enemy_type', 'boss_type',
  'difficulty', 'rarity', 'tier', 'obtain_method', 'category',
];

function summaryFields(item: Record<string, any>): { icon: React.ReactNode; label: string; value: string }[] {
  const out: { icon: React.ReactNode; label: string; value: string }[] = [];
  if (item.rarity) out.push({ icon: <Star className="h-3 w-3" />, label: 'Raridade', value: item.rarity });
  if (item.tier) out.push({ icon: <Sparkles className="h-3 w-3" />, label: 'Tier', value: item.tier });
  if (item.element && item.element !== 'none') out.push({ icon: <Zap className="h-3 w-3" />, label: 'Elemento', value: item.element });
  if (item.weapon_type) out.push({ icon: <Sword className="h-3 w-3" />, label: 'Tipo', value: item.weapon_type });
  if (item.enemy_type) out.push({ icon: <Skull className="h-3 w-3" />, label: 'Tipo', value: item.enemy_type });
  if (item.boss_type) out.push({ icon: <Skull className="h-3 w-3" />, label: 'Tipo', value: item.boss_type });
  if (item.difficulty) out.push({ icon: <Crosshair className="h-3 w-3" />, label: 'Dificuldade', value: item.difficulty });
  if (item.obtain_method) out.push({ icon: <Pickaxe className="h-3 w-3" />, label: 'Obtenção', value: item.obtain_method });
  if (item.damage_min !== undefined) {
    const dmg = item.damage_max !== undefined ? `${item.damage_min}–${item.damage_max}` : String(item.damage_min);
    out.push({ icon: <Sword className="h-3 w-3" />, label: 'Dano', value: dmg });
  }
  if (item.health_bonus !== undefined) out.push({ icon: <Shield className="h-3 w-3" />, label: 'HP', value: `+${item.health_bonus}` });
  if (item.shop_price !== undefined) out.push({ icon: <Zap className="h-3 w-3" />, label: 'Preço', value: String(item.shop_price) });
  if (item.max_ranks !== undefined) out.push({ icon: <Gem className="h-3 w-3" />, label: 'Ranks', value: String(item.max_ranks) });
  return out.slice(0, 4);
}

function toSlug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function columnLabel(col: string): string {
  return col.replace(/_/g, ' ');
}

type Props = {
  tenantSlug: string;
  tableName: string;
  tenantId?: string;
};

function ItemCard({
  item, labelCol, tableName, homePath,
}: {
  item: any; labelCol: string; tableName: string; homePath: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const label = item[labelCol] || item.name || '';
  const itemSlug = toSlug(String(label));
  const image = item.image_url || item.image || item.icon || item.icon_url;
  const subtitle = item.rarity || item.type || item.weapon_type || item.obtain || item.description || '';
  const desc = typeof item.description === 'string' ? item.description : '';
  const fields = summaryFields(item);

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <Link
          href={`${homePath}${tableName}/${itemSlug}`}
          className="flex items-center gap-3 flex-1 min-w-0 group"
        >
          {image ? (
            <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-muted">
              <img src={image} alt="" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary">
              <FileText className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium group-hover:text-primary transition-colors truncate">
              {label}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {typeof subtitle === 'string' ? subtitle : ''}
              </p>
            )}
          </div>
        </Link>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 rounded-md hover:bg-muted transition-colors shrink-0"
        >
          {expanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </button>
      </div>
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-border/50">
          {desc && (
            <p className="text-xs text-muted-foreground leading-relaxed mt-3">{desc}</p>
          )}
          {fields.length > 0 && (
            <div className="mt-2">
              <ChipCarousel>
                {fields.map((f, i) => (
                  <span key={i} className="shrink-0 inline-flex items-center gap-1 rounded-md bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground">
                    {f.icon}{f.label}: <span className="font-medium text-foreground">{f.value}</span>
                  </span>
                ))}
              </ChipCarousel>
            </div>
          )}
          {(() => {
            const extras: string[] = [];
            if (item.effects) extras.push(typeof item.effects === 'string' ? item.effects : Array.isArray(item.effects) ? item.effects.join(', ') : String(item.effects));
            if (item.weakness) extras.push(typeof item.weakness === 'string' ? item.weakness : Array.isArray(item.weakness) ? item.weakness.join(', ') : String(item.weakness));
            if (item.items_dropped) extras.push(typeof item.items_dropped === 'string' ? item.items_dropped : Array.isArray(item.items_dropped) ? item.items_dropped.join(', ') : String(item.items_dropped));
            if (extras.length === 0) return null;
            return <p className="text-xs text-muted-foreground mt-1.5 truncate">{extras.join(' · ')}</p>;
          })()}
        </div>
      )}
    </div>
  );
}

export default function GameTableListing({ tenantSlug, tableName }: Props) {
  const { data, loading } = useTableItems(tenantSlug, tableName);
  const items: any[] = data?.items ?? [];
  const labelCol = data?.labelCol ?? 'name';
  const { homePath } = useWikiPath(tenantSlug);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, Set<string>>>({});

  const columnAnalysis = useMemo(() => {
    if (items.length === 0) return { categoryColumn: null as string | null, filterColumns: [] as { column: string; values: string[]; label: string }[] };

    const allKeys = new Set<string>();
    items.forEach(item => Object.keys(item).forEach(k => allKeys.add(k)));

    const valueCounts: Record<string, string[]> = {};
    for (const key of allKeys) {
      if (SYSTEM_COLS.has(key)) continue;
      if (LONG_TEXT_COLS.has(key)) continue;
      if (key.endsWith('_id') || key.endsWith('_url')) continue;

      const valSet = new Set<string>();
      items.forEach(item => {
        const v = item[key];
        if (v != null && v !== '' && v !== 'none') valSet.add(String(v));
      });
      if (valSet.size >= 2 && valSet.size <= 10) {
        valueCounts[key] = Array.from(valSet).sort();
      }
    }

    let categoryColumn: string | null = null;
    for (const col of CATEGORY_PRIORITY) {
      if (valueCounts[col]) { categoryColumn = col; break; }
    }
    if (!categoryColumn) {
      for (const [col, vals] of Object.entries(valueCounts)) {
        if (vals.length >= 3 && vals.length <= 6) { categoryColumn = col; break; }
      }
    }

    const filterColumns = Object.entries(valueCounts)
      .filter(([col]) => col !== categoryColumn)
      .map(([col, vals]) => ({ column: col, values: vals, label: columnLabel(col) }));

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
    for (const item of filteredItems) {
      const cat = String(item[columnAnalysis.categoryColumn!] ?? 'Outros');
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

  return (
    <article className="max-w-3xl mx-auto">
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
                      className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs border transition-colors ${
                        active
                          ? 'bg-primary/10 border-primary/30 text-primary'
                          : 'bg-card border-border/50 text-muted-foreground hover:border-muted-foreground/30'
                      }`}
                    >
                      {v}
                      {active && <X className="h-3 w-3" />}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {catItems.map((item) => (
                  <ItemCard key={item.id} item={item} labelCol={labelCol} tableName={tableName} homePath={homePath} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredItems.map((item) => (
            <ItemCard key={item.id} item={item} labelCol={labelCol} tableName={tableName} homePath={homePath} />
          ))}
        </div>
      )}
    </article>
  );
}
