'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useWikiPath } from '@/hooks/use-wiki-path';
import { useTableCatalog } from '@/hooks/use-data-access';
import type { CatalogEntry } from '@/lib/data-access';
import {
  Database, Sword, Shield, CircleDot, Skull, Crown,
  FlaskConical, ArrowUp, Globe, Code, BookOpen, Package, Wrench,
  Search, X, ChevronLeft, ChevronRight,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  Sword, Shield, CircleDot, Skull, Crown,
  FlaskConical, ArrowUp, Globe, Code, BookOpen, Package, Wrench,
};

const DEFAULT_ICON = Database;

const TABLE_CATEGORY: Record<string, string> = {
  weapons: 'Armas',
  armors: 'Armaduras',
  rings: 'Anéis',
  enemies: 'Inimigos',
  bosses: 'Chefes',
  potions: 'Poções',
  upgrades: 'Upgrades',
  worlds: 'Mundos',
  codes: 'Códigos',
  crafting_recipes: 'Receitas',
  resources: 'Materiais',
  build_presets: 'Builds',
};

function getCategory(tableName: string): string | null {
  return TABLE_CATEGORY[tableName] ?? null;
}

type Props = {
  slug: string;
  tenantId: string;
  displayFormat?: string;
  columnsCount?: number;
  title?: string;
};

function CatalogCard({ entry, href }: { entry: CatalogEntry; href: string }) {
  const Icon = ICON_MAP[entry.table_name] ?? DEFAULT_ICON;
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:border-primary/50 hover:bg-accent/50 transition-all group"
    >
      <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{entry.display_label}</p>
        <p className="text-xs text-muted-foreground">{entry.count} ite{entry.count === 1 ? 'm' : 'ns'}</p>
      </div>
    </Link>
  );
}

export default function GameDataCards({ slug, tenantId, displayFormat = 'grid', columnsCount = 4, title }: Props) {
  const { data: catalog = [], loading } = useTableCatalog(slug, true);
  const { homePath } = useWikiPath(slug);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const fmt = displayFormat;
  const cols = Math.max(2, Math.min(5, columnsCount));
  const gridColsClass = ({
    2: 'grid-cols-2 sm:grid-cols-2 md:grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5',
  } as Record<number, string>)[cols];

  const allEntries = useMemo(() => (catalog ?? []).filter(e => e.count > 0), [catalog]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    allEntries.forEach(e => {
      const c = getCategory(e.table_name);
      if (c) cats.add(c);
    });
    return Array.from(cats).sort();
  }, [allEntries]);

  const filteredEntries = useMemo(() => {
    let entries = allEntries;

    if (activeCategory) {
      entries = entries.filter(e => getCategory(e.table_name) === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      entries = entries.filter(e =>
        e.display_label.toLowerCase().includes(q) ||
        e.table_name.toLowerCase().includes(q)
      );
    }

    return entries;
  }, [allEntries, searchQuery, activeCategory]);

  const maxCarouselIndex = Math.max(0, filteredEntries.length - cols);

  const goNext = () => {
    if (fmt === 'carousel_infinite') {
      setCarouselIndex(prev => (prev + 1) % filteredEntries.length);
    } else {
      setCarouselIndex(prev => Math.min(prev + 1, maxCarouselIndex));
    }
  };

  const goPrev = () => {
    if (fmt === 'carousel_infinite') {
      setCarouselIndex(prev => (prev - 1 + filteredEntries.length) % filteredEntries.length);
    } else {
      setCarouselIndex(prev => Math.max(prev - 1, 0));
    }
  };

  const visibleEntries = fmt.startsWith('carousel')
    ? filteredEntries.slice(carouselIndex, carouselIndex + cols)
    : filteredEntries;

  if (loading) return null;
  if (allEntries.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          {title || 'Dados do Jogo'}
        </h2>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setCarouselIndex(0); }}
          placeholder="Buscar tabelas..."
          className="w-full rounded-xl border bg-card pl-9 pr-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
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

      {/* Category chips */}
      {categories.length > 1 && !searchQuery && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          <button
            onClick={() => setActiveCategory(null)}
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs border transition-colors ${
              !activeCategory
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-card border-border/50 text-muted-foreground hover:border-muted-foreground/30'
            }`}
          >
            Todas
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setCarouselIndex(0); }}
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs border transition-colors ${
                activeCategory === cat
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-card border-border/50 text-muted-foreground hover:border-muted-foreground/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {filteredEntries.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhuma tabela encontrada.
        </p>
      ) : fmt === 'list' ? (
        /* ── List ── */
        <div className="space-y-2">
          {filteredEntries.map(entry => (
            <CatalogCard
              key={entry.table_name}
              entry={entry}
              href={`${homePath}${entry.table_name}`}
            />
          ))}
        </div>
      ) : fmt.startsWith('carousel') ? (
        /* ── Carousel / Carousel Infinite ── */
        <div>
          <div className="relative">
            <div className={`${gridColsClass} gap-3`}>
              {visibleEntries.map(entry => (
                <CatalogCard
                  key={`${entry.table_name}-${carouselIndex}`}
                  entry={entry}
                  href={`${homePath}${entry.table_name}`}
                />
              ))}
            </div>
          </div>

          {filteredEntries.length > cols && (
            <div className="flex items-center justify-center gap-4 mt-4">
              <button
                onClick={goPrev}
                className="p-2 rounded-full border bg-card hover:bg-accent transition-colors"
                aria-label="Anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-muted-foreground">
                {fmt === 'carousel_infinite'
                  ? `${carouselIndex + 1}–${carouselIndex + cols}`
                  : `${carouselIndex + 1}–${Math.min(carouselIndex + cols, filteredEntries.length)} de ${filteredEntries.length}`
                }
              </span>
              <button
                onClick={goNext}
                className="p-2 rounded-full border bg-card hover:bg-accent transition-colors"
                aria-label="Próximo"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ── Grid (default) ── */
        <div className={`${gridColsClass} gap-3`}>
          {filteredEntries.map(entry => (
            <CatalogCard
              key={entry.table_name}
              entry={entry}
              href={`${homePath}${entry.table_name}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
