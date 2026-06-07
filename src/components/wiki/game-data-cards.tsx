'use client';

import Link from 'next/link';
import { useWikiPath } from '@/hooks/use-wiki-path';
import { useTableCatalog } from '@/hooks/use-data-access';
import {
  Database, Sword, Shield, CircleDot, Skull, Crown,
  FlaskConical, ArrowUp, Globe, Code, BookOpen, Package, Wrench,
} from 'lucide-react';

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

export default function GameDataCards({ slug, tenantId }: { slug: string; tenantId: string }) {
  const { data: catalog = [], loading } = useTableCatalog(slug, true);
  const { homePath } = useWikiPath(slug);

  const cards: TableCard[] = (catalog ?? [])
    .filter((entry) => entry.count > 0)
    .map((entry) => ({
      table_name: entry.table_name,
      label: entry.display_label,
      icon: ICON_MAP[entry.table_name] ?? DEFAULT_ICON,
      count: entry.count,
    }));

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
