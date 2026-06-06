'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/supabase';
import { Database, Sword, Shield, CircleDot, Skull, Crown, FlaskConical, ArrowUp, Globe, Code, BookOpen, Package, Wrench } from 'lucide-react';
import type { GameDataCardsConfig } from '../types';

const ICON_MAP: Record<string, React.ElementType> = {
  Sword, Shield, CircleDot, Skull, Crown,
  FlaskConical, ArrowUp, Globe, Code, BookOpen, Package, Wrench,
};

const DEFAULT_ICON = Database;

type TableCard = {
  table_name: string;
  label: string;
  icon: React.ElementType;
  count: number;
};

export function GameDataCardsBlock({ config, tenantId, basePath }: { config: GameDataCardsConfig; tenantId?: string; basePath?: string }) {
  const cache = useRef<TableCard[] | null>(null);
  const [cards, setCards] = useState<TableCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) { setLoading(false); return; }
    if (cache.current) {
      setCards(cache.current);
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const { data: catalog } = await supabase
          .from('tenant_game_tables')
          .select('table_name, display_label')
          .eq('tenant_id', tenantId);

        if (cancelled || !catalog) return;

        const withCounts: TableCard[] = [];
        for (const entry of catalog) {
          const { count } = await supabase
            .from(entry.table_name)
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId);

          if (cancelled) return;

          const Icon = ICON_MAP[entry.table_name] ?? DEFAULT_ICON;
          withCounts.push({
            table_name: entry.table_name,
            label: entry.display_label,
            icon: Icon,
            count: count ?? 0,
          });
        }

        cache.current = withCounts;
        setCards(withCounts);
      } catch {
        if (!cancelled) setCards([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [tenantId]);

  if (loading) return null;
  if (cards.length === 0) return null;

  return (
    <section className="mb-12">
      <h2 className="text-xl font-semibold mb-5 flex items-center gap-2">
        <Database className="h-5 w-5 text-primary" />
        {config.title || 'Dados do Jogo'}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {cards.map((card) => {
          const Icon = card.icon;
          const href = basePath ? `${basePath}/${card.table_name}` : `/${card.table_name}`;
          return (
            <Link
              key={card.table_name}
              href={href}
              className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:border-primary/50 hover:bg-accent/50 transition-all group"
            >
              <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{card.label}</p>
                <p className="text-xs text-muted-foreground">{card.count} ite{card.count === 1 ? 'm' : 'ns'}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
