'use client';

import { FileText, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface WikiListIslandProps {
  config: Record<string, unknown>;
  basePath?: string;
}

interface WikiListItem {
  label?: string;
  slug?: string;
}

export function WikiListIsland({ config, basePath = '' }: WikiListIslandProps) {
  const items = (config.items as WikiListItem[]) || [];

  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground">Nenhum link adicionado.</p>;
  }

  return (
    <div className="space-y-1">
      {items.map((item, index) => (
        <Link
          key={index}
          href={item.slug ? `${basePath}/${item.slug}` : '#'}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted/50 hover:text-primary transition-colors group"
        >
          <FileText className="h-3 w-3 shrink-0 text-muted-foreground group-hover:text-primary" />
          <span className="flex-1 truncate">{item.label || item.slug}</span>
          <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
      ))}
    </div>
  );
}
