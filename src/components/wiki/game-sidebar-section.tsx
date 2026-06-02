'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWikiPath } from '@/hooks/use-wiki-path';
import { supabase } from '@/supabase';
import { getGameSchema } from '@/lib/game-schema';
import { GAME_TABLE_META } from '@/lib/game-table-labels';
import {
  ChevronDown, ChevronRight, Database, Loader2,
  Sword, Shield, CircleDot, Skull, Crown,
  FlaskConical, ArrowUp, Globe, Code, BookOpen, Package, Wrench,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  Sword, Shield, CircleDot, Skull, Crown,
  FlaskConical, ArrowUp, Globe, Code, BookOpen, Package, Wrench,
};

type TableEntry = {
  table_name: string;
  label: string;
  icon: React.ElementType;
  count: number;
};

export default function GameSidebarSection({ tenantSlug, tenantId }: { tenantSlug: string; tenantId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [entries, setEntries] = useState<TableEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const cache = useRef<TableEntry[] | null>(null);
  const pathname = usePathname();
  const { homePath } = useWikiPath(tenantSlug);

  useEffect(() => {
    if (!expanded || cache.current) return;

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const schema = await getGameSchema();
        if (cancelled) return;

        const result: TableEntry[] = [];
        for (const t of schema.tables) {
          const { count } = await supabase
            .from(t.table_name)
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId);

          if (cancelled) return;

          const meta = GAME_TABLE_META[t.table_name];
          const Icon = ICON_MAP[meta?.icon ?? ''] ?? Database;
          result.push({
            table_name: t.table_name,
            label: meta?.label ?? t.table_name,
            icon: Icon,
            count: count ?? 0,
          });
        }

        cache.current = result;
        setEntries(result);
      } catch {
        if (!cancelled) setEntries([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [expanded, tenantId]);

  if (entries.length === 0 && !loading) return null;

  return (
    <div className="border-t">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 w-full px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground"
      >
        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        <Database className="h-3 w-3" />
        Game
      </button>

      {expanded && (
        <nav className="space-y-0.5 px-2 pb-2">
          {loading ? (
            <div className="flex justify-center py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            entries.map((entry) => {
              const Icon = entry.icon;
              const href = `${homePath}${entry.table_name}`;
              const isActive = pathname === href;
              return (
                <Link
                  key={entry.table_name}
                  href={href}
                  className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate flex-1">{entry.label}</span>
                  <span className="text-[10px] text-muted-foreground/60">{entry.count}</span>
                </Link>
              );
            })
          )}
        </nav>
      )}
    </div>
  );
}
