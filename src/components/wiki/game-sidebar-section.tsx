'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWikiPath } from '@/hooks/use-wiki-path';
import { useTableCatalog } from '@/hooks/use-data-access';
import { ChevronDown, ChevronRight, Database } from 'lucide-react';
import { TableIconDisplay } from '@/lib/table-icons';

type TableEntry = {
  table_name: string;
  label: string;
  icon: string | null;
  count: number;
};

export default function GameSidebarSection({ tenantSlug }: { tenantSlug: string; tenantId?: string }) {
  const [expanded, setExpanded] = useState(false);
  const { data: catalog = [], loading } = useTableCatalog(expanded ? tenantSlug : null, true);
  const pathname = usePathname();
  const { homePath } = useWikiPath(tenantSlug);

  const entries: TableEntry[] = (catalog ?? [])
    .map((entry) => ({
      table_name: entry.table_name,
      label: entry.display_label,
      icon: entry.icon ?? null,
      count: entry.count,
    }));

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
            <div className="space-y-1.5 px-3 py-1 animate-pulse">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-7 rounded-md bg-muted" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">Nenhuma tabela encontrada.</p>
          ) : (
            entries.map((entry) => {
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
                  <TableIconDisplay icon={entry.icon} className="h-3.5 w-3.5 shrink-0" />
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
