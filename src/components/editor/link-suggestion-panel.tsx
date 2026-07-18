'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2, Database, Package, FileText } from 'lucide-react';
import { getTableCatalog, getTableItems } from '@/lib/data-access';
import type { SuggestionState } from './extensions/smart-mention';

const SECTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  table: Database,
  item: Package,
  article: FileText,
};

interface SuggestionChip {
  label: string;
  slug: string;
  type: 'table' | 'item' | 'article';
  description?: string;
  tableName?: string;
}

interface LinkSuggestionPanelProps {
  tenantSlug: string;
  onInsert: (tag: string) => void;
  activeSuggestion: SuggestionState;
}

export default function LinkSuggestionPanel({ tenantSlug, onInsert, activeSuggestion }: LinkSuggestionPanelProps) {
  const [tables, setTables] = useState<SuggestionChip[]>([]);
  const [items, setItems] = useState<SuggestionChip[]>([]);
  const [articles, setArticles] = useState<SuggestionChip[]>([]);
  const [loading, setLoading] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!activeSuggestion.active) return;
    if (loadedRef.current) return;

    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const catalog = await getTableCatalog(tenantSlug, false);
        const tableChips: SuggestionChip[] = catalog.slice(0, 15).map((t) => ({
          label: t.display_label,
          slug: t.table_name,
          type: 'table' as const,
          description: `${t.columns_count || 0} colunas`,
        }));
        if (!cancelled) setTables(tableChips);

        const itemChips: SuggestionChip[] = [];
        for (const table of catalog.slice(0, 2)) {
          const { items: tableItems, labelCol } = await getTableItems(tenantSlug, table.table_name);
          for (const ti of tableItems.slice(0, 8)) {
            const label = String((ti as any)[labelCol] || ti.id || '');
            itemChips.push({
              label,
              slug: (ti as any).slug || label,
              type: 'item' as const,
              description: table.display_label,
              tableName: table.table_name,
            });
          }
          if (itemChips.length >= 15) break;
        }
        if (!cancelled) setItems(itemChips);

        const { supabase } = await import('@/supabase');
        const { data: tenant } = await supabase.from('tenants').select('id').eq('slug', tenantSlug).maybeSingle();
        if (tenant?.id) {
          const { data: articleRows } = await supabase
            .from('wiki_articles')
            .select('id, title, slug')
            .eq('tenant_id', tenant.id)
            .eq('status', 'published')
            .order('updated_at', { ascending: false })
            .limit(10);
          if (!cancelled) {
            setArticles((articleRows ?? []).map((a) => ({
              label: a.title,
              slug: a.slug,
              type: 'article' as const,
            })));
          }
        }
        if (!cancelled) loadedRef.current = true;
      } catch (err) {
        console.error('Erro ao carregar sugestões:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [activeSuggestion.active, tenantSlug]);

  const { type, search } = activeSuggestion;

  const sections = useMemo(() => {
    if (!activeSuggestion.active) return [];

    function filterChips(chips: SuggestionChip[]): SuggestionChip[] {
      const q = search.toLowerCase();
      if (!q) return chips;

      const startsWith: SuggestionChip[] = [];
      const includes: SuggestionChip[] = [];
      for (const chip of chips) {
        const label = chip.label.toLowerCase();
        if (label.startsWith(q)) {
          startsWith.push(chip);
        } else if (label.includes(q)) {
          includes.push(chip);
        }
      }
      const rest = chips.filter((c) => {
        const label = c.label.toLowerCase();
        return !label.startsWith(q) && !label.includes(q);
      }).sort((a, b) => a.label.localeCompare(b.label));

      return [...startsWith, ...includes, ...rest];
    }

    const sections: { label: string; iconType: 'table' | 'item' | 'article'; chips: SuggestionChip[] }[] = [];

    if (type === 'table' || (!type)) {
      const filtered = filterChips(tables);
      if (filtered.length > 0) sections.push({ label: 'Tabelas', iconType: 'table', chips: filtered });
    }
    if (type === 'item' || (!type)) {
      const filtered = filterChips(items);
      if (filtered.length > 0) sections.push({ label: 'Itens', iconType: 'item', chips: filtered });
    }
    if (type === 'article' || (!type)) {
      const filtered = filterChips(articles);
      if (filtered.length > 0) sections.push({ label: 'Artigos', iconType: 'article', chips: filtered });
    }

    return sections;
  }, [activeSuggestion.active, type, search, tables, items, articles]);

  if (!activeSuggestion.active) return null;

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Carregando sugestões...
      </div>
    );
  }

  if (sections.length === 0) return null;

  return (
    <div className="space-y-2">
       {sections.map((section) => (
         <SectionCarousel
           key={section.label}
           label={section.label}
           iconType={section.iconType}
           chips={section.chips}
           onInsert={onInsert}
         />
       ))}
    </div>
  );
}

function SectionCarousel({
  label,
  iconType,
  chips,
  onInsert,
}: {
  label: string;
  iconType: 'table' | 'item' | 'article';
  chips: SuggestionChip[];
  onInsert: (tag: string) => void;
}) {
  const scrollRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      node.scrollLeft = 0;
    }
  }, []);

  const scroll = useCallback((dir: 'left' | 'right') => {
    const el = document.getElementById(`carousel-${label}`);
    if (!el) return;
    const amount = 200;
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  }, [label]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        {(() => {
          const Icon = SECTION_ICONS[iconType];
          const colorClass =
            iconType === 'table' ? 'text-primary'
            : iconType === 'item' ? 'text-secondary'
            : 'text-accent';
          return Icon ? <Icon className={`h-3.5 w-3.5 ${colorClass}`} /> : null;
        })()}
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
        <span className="text-xs text-muted-foreground">({chips.length})</span>
      </div>
      <div className="relative group">
        {chips.length > 5 && (
          <>
            <button
              type="button"
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 hidden group-hover:flex items-center justify-center w-5 h-5 rounded-full bg-background/80 border shadow-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden group-hover:flex items-center justify-center w-5 h-5 rounded-full bg-background/80 border shadow-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="h-3 w-3" />
            </button>
          </>
        )}
        <div
          id={`carousel-${label}`}
          ref={scrollRef}
          className="flex gap-1.5 overflow-x-auto scrollbar-none scroll-smooth pb-1"
        >
          {chips.map((chip, idx) => {
            const colors: Record<string, string> = {
              table: 'text-primary border-primary/30 bg-primary/10 hover:bg-primary/20',
              item: 'text-secondary border-secondary/30 bg-secondary/10 hover:bg-secondary/20',
              article: 'text-accent border-accent/30 bg-accent/10 hover:bg-accent/20',
            };
            const tag =
              chip.type === 'item' && chip.tableName
                ? `$i<${chip.tableName}:${chip.slug}>`
                : `$${chip.type === 'table' ? 't' : chip.type === 'item' ? 'i' : 'a'}<${chip.slug}>`;
            return (
              <motion.button
                key={`${chip.type}:${chip.slug}`}
                type="button"
                title={chip.description}
                onClick={() => onInsert(tag)}
                initial={{ rotateY: 90, opacity: 0, z: -60 }}
                animate={{ rotateY: 0, opacity: 1, z: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 180,
                  damping: 18,
                  delay: idx * 0.035,
                }}
                style={{ transformStyle: 'preserve-3d' }}
                whileHover={{ scale: 1.08, z: 20 }}
                whileTap={{ scale: 0.95 }}
                className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition-colors ${colors[chip.type] || ''}`}
              >
                {(() => {
                  const Icon = SECTION_ICONS[chip.type];
                  return Icon ? <Icon className="h-3 w-3" /> : null;
                })()}
                <span className="max-w-[120px] truncate">{chip.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
