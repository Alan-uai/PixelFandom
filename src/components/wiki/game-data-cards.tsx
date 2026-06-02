'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { useWikiPath } from '@/hooks/use-wiki-path';
import { supabase } from '@/supabase';
import { getGameSchema } from '@/lib/game-schema';
import { GAME_TABLE_META } from '@/lib/game-table-labels';
import {
  Database, Sword, Shield, CircleDot, Skull, Crown,
  FlaskConical, ArrowUp, Globe, Code, BookOpen, Package, Wrench,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  Sword, Shield, CircleDot, Skull, Crown,
  FlaskConical, ArrowUp, Globe, Code, BookOpen, Package, Wrench,
};

type TableCard = {
  table_name: string;
  label: string;
  icon: React.ElementType;
  count: number;
};

export default function GameDataCards({ slug, tenantId }: { slug: string; tenantId: string }) {
  const cache = useRef<TableCard[] | null>(null);
  const [cards, setCards] = useState<TableCard[]>([]);
  const [loading, setLoading] = useState(true);
  const { homePath } = useWikiPath(slug);

  useEffect(() => {
    if (cache.current) {
      setCards(cache.current);
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const schema = await getGameSchema();
        if (cancelled) return;

        const withCounts: TableCard[] = [];
        for (const t of schema.tables) {
          const { count } = await supabase
            .from(t.table_name)
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId);

          if (cancelled) return;

          const meta = GAME_TABLE_META[t.table_name];
          const Icon = ICON_MAP[meta?.icon ?? ''] ?? Database;
          withCounts.push({
            table_name: t.table_name,
            label: meta?.label ?? t.table_name,
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
        Dados do Jogo
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.table_name}
              href={`${homePath}${card.table_name}`}
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
